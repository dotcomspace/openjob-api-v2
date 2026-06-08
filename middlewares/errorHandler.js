const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Tangani error Multer (ukuran file melebihi batas)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'failed', // Ubah 'fail' jadi 'failed'
      message: 'Ukuran file melebihi batas maksimal 5 MB',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server';

  res.status(statusCode).json({
    // Ubah logika di bawah ini agar selalu menghasilkan 'failed' 
    // jika itu adalah client error (400-499)
    status: statusCode >= 500 ? 'error' : 'failed', 
    message,
  });
};

module.exports = errorHandler;