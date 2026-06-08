const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Tangani error Multer (ukuran file melebihi batas)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status: 'fail',
      message: 'Ukuran file melebihi batas maksimal 5 MB',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server';

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
  });
};

module.exports = errorHandler;
