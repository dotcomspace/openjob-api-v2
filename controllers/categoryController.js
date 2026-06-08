const pool = require('../config/database');
const { validateCategory } = require('../validations/categoryValidation');

const addCategory = async (req, res, next) => {
  try {
    const { name } = validateCategory(req.body);
    const id = `category-${Date.now()}`;
    
    await pool.query('INSERT INTO categories(id, name) VALUES($1, $2)', [id, name]);
    res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
};

const getAllCategories = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.status(200).json({ status: 'success', data: { categories: result.rows } });
  } catch (error) { next(error); }
};

const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    
    if (!result.rowCount) {
      const err = new Error('Kategori tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) { next(error); }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = validateCategory(req.body);
    
    const result = await pool.query(
      'UPDATE categories SET name = $1, updated_at = current_timestamp WHERE id = $2 RETURNING id',
      [name, id]
    );

    if (!result.rowCount) {
      const err = new Error('Kategori tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', message: 'Kategori berhasil diperbarui' });
  } catch (error) { next(error); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    
    if (!result.rowCount) {
      const err = new Error('Kategori tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', message: 'Kategori berhasil dihapus' });
  } catch (error) { next(error); }
};

module.exports = { addCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };