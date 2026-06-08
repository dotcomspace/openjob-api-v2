const pool = require('../config/database');
const { validateJob } = require('../validations/jobValidation');

const addJob = async (req, res, next) => {
  try {
    const data = validateJob(req.body);
    const id = `job-${Date.now()}`;
    
    const query = `
      INSERT INTO jobs(id, title, description, company_id, category_id, job_type, experience_level, location_type, location_city, salary_min, salary_max, is_salary_visible, status) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id
    `;
    const values = [id, data.title, data.description, data.company_id, data.category_id, data.job_type, data.experience_level, data.location_type, data.location_city, data.salary_min, data.salary_max, data.is_salary_visible, data.status];
    
    await pool.query(query, values);
    res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
};

const getAllJobs = async (req, res, next) => {
  try {
    const { title, 'company-name': companyName } = req.query;
    
    // Join dengan tabel companies untuk mendapatkan nama perusahaan (syarat dari Postman)
    let query = `
      SELECT jobs.*, companies.name AS company_name, categories.name AS category_name
      FROM jobs
      LEFT JOIN companies ON jobs.company_id = companies.id
      LEFT JOIN categories ON jobs.category_id = categories.id
      WHERE 1=1
    `;
    const values = [];
    let valueIndex = 1;

    // Filter pencarian opsional
    if (title) {
      query += ` AND jobs.title ILIKE $${valueIndex}`; // ILIKE agar tidak peduli huruf besar/kecil
      values.push(`%${title}%`);
      valueIndex++;
    }
    if (companyName) {
      query += ` AND companies.name ILIKE $${valueIndex}`;
      values.push(`%${companyName}%`);
      valueIndex++;
    }

    const result = await pool.query(query, values);
    res.status(200).json({ status: 'success', data: { jobs: result.rows } });
  } catch (error) { next(error); }
};

const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    
    if (!result.rowCount) {
      const err = new Error('Pekerjaan tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) { next(error); }
};

const getJobsByCompanyId = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const result = await pool.query('SELECT * FROM jobs WHERE company_id = $1', [companyId]);
    res.status(200).json({ status: 'success', data: { jobs: result.rows } });
  } catch (error) { next(error); }
};

const getJobsByCategoryId = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const result = await pool.query('SELECT * FROM jobs WHERE category_id = $1', [categoryId]);
    res.status(200).json({ status: 'success', data: { jobs: result.rows } });
  } catch (error) { next(error); }
};

const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = validateJob(req.body);
    
    const query = `
      UPDATE jobs SET 
        title = $1, description = $2, company_id = $3, category_id = $4, job_type = $5, 
        experience_level = $6, location_type = $7, location_city = $8, salary_min = $9, 
        salary_max = $10, is_salary_visible = $11, status = $12, updated_at = current_timestamp 
      WHERE id = $13 RETURNING id
    `;
    const values = [data.title, data.description, data.company_id, data.category_id, data.job_type, data.experience_level, data.location_type, data.location_city, data.salary_min, data.salary_max, data.is_salary_visible, data.status, id];
    
    const result = await pool.query(query, values);
    if (!result.rowCount) {
      const err = new Error('Pekerjaan tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', message: 'Pekerjaan berhasil diperbarui' });
  } catch (error) { next(error); }
};

const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [id]);
    
    if (!result.rowCount) {
      const err = new Error('Pekerjaan tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', message: 'Pekerjaan berhasil dihapus' });
  } catch (error) { next(error); }
};

module.exports = { addJob, getAllJobs, getJobById, getJobsByCompanyId, getJobsByCategoryId, updateJob, deleteJob };