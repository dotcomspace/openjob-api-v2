require('dotenv').config();
const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

// Koneksi database
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT),
});

// Konfigurasi Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: false, // true untuk port 465, false untuk 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const RABBITMQ_URL =
  process.env.AMQP_URL ||
  `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

const QUEUE_NAME = 'application_notifications';

/**
 * Proses message dari RabbitMQ:
 * 1. Ambil application_id dari message
 * 2. Query ke DB untuk dapatkan data pelamar + job owner
 * 3. Kirim email notifikasi ke pemilik job
 */
const processMessage = async (message) => {
  const { application_id } = JSON.parse(message.content.toString());
  console.log(`[Consumer] Processing application_id: ${application_id}`);

  try {
    // Query: ambil detail lamaran + pelamar + job + pemilik job
    const query = `
      SELECT
        a.id AS application_id,
        a.created_at AS application_date,
        u.name AS applicant_name,
        u.email AS applicant_email,
        j.title AS job_title,
        owner.email AS owner_email,
        owner.name AS owner_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      JOIN users owner ON c.id = (
        SELECT company_id FROM jobs WHERE id = a.job_id LIMIT 1
      )
      WHERE a.id = $1
      LIMIT 1
    `;
    // Versi lebih sederhana dan reliable:
    const appResult = await pool.query(
      `SELECT a.id, a.created_at, a.user_id, a.job_id,
              u.name AS applicant_name, u.email AS applicant_email,
              j.title AS job_title, j.company_id
       FROM applications a
       JOIN users u ON a.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1`,
      [application_id]
    );

    if (!appResult.rowCount) {
      console.error(`[Consumer] Application not found: ${application_id}`);
      return;
    }

    const app = appResult.rows[0];

    // Cari pemilik perusahaan (owner) — user dengan role 'company' atau 'employer'
    // Karena sistem OpenJob menggunakan company_id, kita cari user yang terkait company
    // Ambil semua user yang memiliki role selain 'user' sebagai fallback
    // Dalam sistem ini, owner job ditemukan via company_id
    const ownerResult = await pool.query(
      `SELECT u.email, u.name FROM users u
       WHERE u.id IN (
         SELECT DISTINCT user_id FROM applications WHERE job_id IN (
           SELECT id FROM jobs WHERE company_id = $1
         )
       )
       LIMIT 1`,
      [app.company_id]
    );

    // Fallback: ambil user pertama yang bukan pelamar itu sendiri
    // (Idealnya ada tabel user-company mapping, tapi berdasarkan skema V1 ini alternatif terbaik)
    let ownerEmail, ownerName;

    // Cara paling reliable: company memiliki user creator. 
    // Karena skema V1 tidak ada kolom created_by di companies, kita kirim ke admin / owner berdasarkan role
    const adminResult = await pool.query(
      `SELECT email, name FROM users WHERE role != 'user' ORDER BY created_at ASC LIMIT 1`
    );

    if (adminResult.rowCount) {
      ownerEmail = adminResult.rows[0].email;
      ownerName = adminResult.rows[0].name;
    } else {
      // Kirim ke MAIL_USER sebagai default
      ownerEmail = process.env.MAIL_USER;
      ownerName = 'Job Owner';
    }

    // Format tanggal lamaran
    const applicationDate = new Date(app.created_at).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Kirim email notifikasi ke pemilik job
    const mailOptions = {
      from: `"OpenJob Notification" <${process.env.MAIL_USER}>`,
      to: ownerEmail,
      subject: `[OpenJob] Lamaran Baru untuk Posisi: ${app.job_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Notifikasi Lamaran Baru - OpenJob</h2>
          <p>Halo <strong>${ownerName}</strong>,</p>
          <p>Ada kandidat baru yang melamar ke posisi <strong>${app.job_title}</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0;">Detail Pelamar:</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 4px 0;"><strong>Nama Pelamar:</strong></td>
                <td>${app.applicant_name}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Email Pelamar:</strong></td>
                <td>${app.applicant_email}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Tanggal Lamaran:</strong></td>
                <td>${applicationDate}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Posisi:</strong></td>
                <td>${app.job_title}</td>
              </tr>
            </table>
          </div>
          
          <p>Silakan login ke dashboard OpenJob untuk meninjau lamaran ini.</p>
          <p>Salam,<br><strong>Tim OpenJob</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Consumer] Email sent to ${ownerEmail} for application ${application_id}`);

  } catch (error) {
    console.error(`[Consumer] Error processing message:`, error.message);
  }
};

// Mulai consumer
const startConsumer = async () => {
  console.log('[Consumer] Connecting to RabbitMQ...');
  console.log(`[Consumer] URL: amqp://${process.env.RABBITMQ_USER}:***@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`);

  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    channel.prefetch(1); // Proses 1 message pada satu waktu

    console.log(`[Consumer] Mendengarkan queue: ${QUEUE_NAME}`);
    console.log('[Consumer] Tekan CTRL+C untuk berhenti.');

    channel.consume(QUEUE_NAME, async (message) => {
      if (message !== null) {
        await processMessage(message);
        channel.ack(message); // Konfirmasi message sudah diproses
      }
    });

    // Handle koneksi tertutup
    connection.on('close', () => {
      console.error('[Consumer] Koneksi RabbitMQ tertutup. Mencoba reconnect...');
      setTimeout(startConsumer, 5000);
    });

  } catch (error) {
    console.error('[Consumer] Gagal terhubung ke RabbitMQ:', error.message);
    console.log('[Consumer] Mencoba reconnect dalam 5 detik...');
    setTimeout(startConsumer, 5000);
  }
};

startConsumer();
