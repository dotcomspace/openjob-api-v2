const pool = require('../config/database');
const { validateCompany } = require('../validations/companyValidation');
const { invalidateCache } = require('../middlewares/cacheMiddleware');

const addCompany = async (req, res, next) => {
  try {
    const { name, location, description } = validateCompany(req.body);
    const id = `company-${Date.now()}`;

    await pool.query(
      'INSERT INTO companies(id, name, location, description) VALUES($1, $2, $3, $4)',
      [id, name, location, description]
    );

    res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
};

const getAllCompanies = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM companies');
    res.status(200).json({ status: 'success', data: { companies: result.rows } });
  } catch (error) { next(error); }
};

const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);

    if (!result.rowCount) {
      const err = new Error('Perusahaan tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) { next(error); }
};

const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, description } = validateCompany(req.body);

    const result = await pool.query(
      'UPDATE companies SET name = $1, location = $2, description = $3, updated_at = current_timestamp WHERE id = $4 RETURNING id',
      [name, location, description, id]
    );

    if (!result.rowCount) {
      const err = new Error('Perusahaan tidak ditemukan');
      err.statusCode = 404; throw err;
    }

    // Invalidate cache company yang diupdate
    await invalidateCache(`company:${id}`);

    res.status(200).json({ status: 'success', message: 'Perusahaan berhasil diperbarui' });
  } catch (error) { next(error); }
};

const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM companies WHERE id = $1 RETURNING id', [id]);

    if (!result.rowCount) {
      const err = new Error('Perusahaan tidak ditemukan');
      err.statusCode = 404; throw err;
    }

    // Invalidate cache company yang dihapus
    await invalidateCache(`company:${id}`);

    res.status(200).json({ status: 'success', message: 'Perusahaan berhasil dihapus' });
  } catch (error) { next(error); }
};

module.exports = { addCompany, getAllCompanies, getCompanyById, updateCompany, deleteCompany };
