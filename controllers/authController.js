const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validateLogin, validateToken } = require('../validations/authValidation');

const login = async (req, res, next) => {
  try {
    const { email, password } = validateLogin(req.body);

    // 1. Cek apakah email ada di database
    const userResult = await pool.query('SELECT id, password FROM users WHERE email = $1', [email]);
    if (!userResult.rowCount) {
      const err = new Error('Kredensial yang Anda berikan salah');
      err.statusCode = 401; // Unauthorized
      throw err;
    }
    const user = userResult.rows[0];

    // 2. Cek apakah password cocok
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Kredensial yang Anda berikan salah');
      err.statusCode = 401;
      throw err;
    }

    // 3. Buat Access Token (Kedaluwarsa 3 jam) dan Refresh Token
    const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '3h' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_KEY);

    // 4. Simpan Refresh Token ke database
    await pool.query('INSERT INTO authentications (token) VALUES ($1)', [refreshToken]);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refreshAuth = async (req, res, next) => {
  try {
    const { refreshToken } = validateToken(req.body);

    // 1. Cek apakah token ada di database
    const checkToken = await pool.query('SELECT token FROM authentications WHERE token = $1', [refreshToken]);
    if (!checkToken.rowCount) {
      const err = new Error('Refresh token tidak ditemukan di database');
      err.statusCode = 400; 
      throw err;
    }

    // 2. Verifikasi signature (keaslian) dari Refresh Token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
    } catch (err) {
      const verifyErr = new Error('Refresh token tidak valid');
      verifyErr.statusCode = 400;
      throw verifyErr;
    }

    // 3. Generate Access Token baru
    const accessToken = jwt.sign({ id: decoded.id }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '3h' });

    res.status(200).json({
      status: 'success',
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = validateToken(req.body);

    // 1. Cek apakah token ada di database
    const checkToken = await pool.query('SELECT token FROM authentications WHERE token = $1', [refreshToken]);
    if (!checkToken.rowCount) {
      const err = new Error('Refresh token tidak ditemukan di database');
      err.statusCode = 400;
      throw err;
    }

    // 2. Hapus token dari database
    await pool.query('DELETE FROM authentications WHERE token = $1', [refreshToken]);

    res.status(200).json({
      status: 'success',
      message: 'Refresh token berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refreshAuth, logout };