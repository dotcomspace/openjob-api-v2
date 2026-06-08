const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { validateUserRegistration } = require('../validations/userValidation');
const { invalidateCache } = require('../middlewares/cacheMiddleware');

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = validateUserRegistration(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = `user-${Date.now()}`;

    const query = {
      text: 'INSERT INTO users(id, name, email, password, role) VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, email, hashedPassword, role],
    };
    const result = await pool.query(query);

    res.status(201).json({ status: 'success', data: { id: result.rows[0].id } });
  } catch (error) {
    if (error.code === '23505') {
      const uniqueError = new Error('Email sudah digunakan');
      uniqueError.statusCode = 400;
      return next(uniqueError);
    }
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [id]
    );

    if (!result.rowCount) {
      const err = new Error('User tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, updated_at = current_timestamp WHERE id = $3 RETURNING id',
      [name, email, id]
    );

    if (!result.rowCount) {
      const err = new Error('User tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }

    // Invalidate cache user
    await invalidateCache(`user:${id}`);

    res.status(200).json({ status: 'success', message: 'User berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, getUserById, updateUser };
