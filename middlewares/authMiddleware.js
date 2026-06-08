const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Ambil header Authorization dari request
  const authHeader = req.headers.authorization;

  // 2. Cek apakah header ada dan formatnya "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Akses ditolak. Token tidak ditemukan atau format salah.');
    error.statusCode = 401; // 401 Unauthorized
    return next(error);
  }

  // 3. Pisahkan kata "Bearer" dan ambil tokennya saja
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verifikasi keaslian token menggunakan kunci rahasia
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    
    // 5. Simpan data user (ID) ke dalam object request agar bisa dipakai di controller
    req.user = decoded; 
    
    // 6. Silakan masuk (lanjut ke controller)
    next();
  } catch (err) {
    // Jika token kedaluwarsa atau palsu
    const error = new Error('Akses ditolak. Token tidak valid atau sudah kedaluwarsa.');
    error.statusCode = 401;
    next(error);
  }
};

module.exports = verifyToken;
