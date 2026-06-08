const { Pool } = require('pg');

// Pool akan otomatis membaca konfigurasi PGDATABASE, PGUSER, dll dari file .env
const pool = new Pool();

pool.on('connect', () => {
  console.log('Koneksi ke database PostgreSQL berhasil!');
});

module.exports = pool;