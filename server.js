require('dotenv').config();
const express = require('express');
const path = require('path');

const { connectRedis } = require('./config/redis');
const { connectRabbitMQ } = require('./config/rabbitmq');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const documentRoutes = require('./routes/documentRoutes');

const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

// === ROUTES ===
app.use('/users', userRoutes);
app.use('/authentications', authRoutes);
app.use('/companies', companyRoutes);
app.use('/categories', categoryRoutes);
app.use('/jobs', jobRoutes);
app.use('/applications', applicationRoutes);
app.use('/', bookmarkRoutes);
app.use('/documents', documentRoutes);

app.get('/', (req, res) => {
  res.send('Selamat datang di OpenJob API v2! 🚀');
});

app.use(errorHandler);

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

// === START SERVER + KONEKSI LAYANAN EKSTERNAL ===
const startServer = async () => {
  try {
    // Koneksi Redis
    await connectRedis();
    console.log('✅ Redis terhubung');

    // Koneksi RabbitMQ (non-fatal jika gagal)
    try {
      await connectRabbitMQ();
      console.log('✅ RabbitMQ terhubung');
    } catch (mqErr) {
      console.warn('⚠️  RabbitMQ tidak dapat terhubung:', mqErr.message);
      console.warn('   Server tetap berjalan, fitur message queue dinonaktifkan sementara.');
    }

    app.listen(port, host, () => {
      console.log(`\n🚀 Server OpenJob API v2 berjalan pada http://${host}:${port}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (err) {
    console.error('❌ Gagal menjalankan server:', err);
    process.exit(1);
  }
};

startServer();
