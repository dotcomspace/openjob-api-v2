const pool = require('../config/database');
const { validateApplication, validateUpdateStatus } = require('../validations/applicationValidation');
const { invalidateCache } = require('../middlewares/cacheMiddleware');
const { publishMessage, QUEUE_NAME } = require('../config/rabbitmq');

const addApplication = async (req, res, next) => {
  try {
    const { user_id, job_id, status = 'pending' } = validateApplication(req.body);
    const id = `application-${Date.now()}`;

    await pool.query(
      'INSERT INTO applications(id, user_id, job_id, status) VALUES($1, $2, $3, $4)',
      [id, user_id, job_id, status]
    );

    // === Kriteria 3: Publish ke RabbitMQ ===
    try {
      await publishMessage(QUEUE_NAME, { application_id: id });
    } catch (mqErr) {
      console.error('RabbitMQ publish error (non-fatal):', mqErr.message);
    }

    // === Invalidate cache list lamaran ===
    await invalidateCache(
      `applications_user:${user_id}`,
      `applications_job:${job_id}`
    );

    res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
};

const getAllApplications = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM applications');
    res.status(200).json({ status: 'success', data: { applications: result.rows } });
  } catch (error) { next(error); }
};

const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);

    if (!result.rowCount) {
      const err = new Error('Lamaran tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) { next(error); }
};

const getApplicationsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM applications WHERE user_id = $1', [userId]);
    res.status(200).json({ status: 'success', data: { applications: result.rows } });
  } catch (error) { next(error); }
};

const getApplicationsByJobId = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const result = await pool.query('SELECT * FROM applications WHERE job_id = $1', [jobId]);
    res.status(200).json({ status: 'success', data: { applications: result.rows } });
  } catch (error) { next(error); }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = validateUpdateStatus(req.body);

    // Ambil data aplikasi dulu untuk invalidate cache
    const appData = await pool.query('SELECT user_id, job_id FROM applications WHERE id = $1', [id]);

    const result = await pool.query(
      'UPDATE applications SET status = $1, updated_at = current_timestamp WHERE id = $2 RETURNING id',
      [status, id]
    );

    if (!result.rowCount) {
      const err = new Error('Lamaran tidak ditemukan');
      err.statusCode = 404; throw err;
    }

    // Invalidate cache terkait
    if (appData.rowCount) {
      const { user_id, job_id } = appData.rows[0];
      await invalidateCache(
        `application:${id}`,
        `applications_user:${user_id}`,
        `applications_job:${job_id}`
      );
    }

    res.status(200).json({ status: 'success', message: 'Status lamaran berhasil diperbarui' });
  } catch (error) { next(error); }
};

const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM applications WHERE id = $1 RETURNING id', [id]);

    if (!result.rowCount) {
      const err = new Error('Lamaran tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', message: 'Lamaran berhasil dihapus' });
  } catch (error) { next(error); }
};

module.exports = {
  addApplication, getAllApplications, getApplicationById,
  getApplicationsByUserId, getApplicationsByJobId,
  updateApplicationStatus, deleteApplication
};
