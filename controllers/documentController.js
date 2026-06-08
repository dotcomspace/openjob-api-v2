const pool = require('../config/database');
const path = require('path');

// POST /documents - Upload PDF
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('File PDF wajib diunggah');
      err.statusCode = 400;
      throw err;
    }

    const userId = req.user.id;
    const filename = req.file.filename;
    const fileUrl = `/documents/files/${filename}`;
    const id = `document-${Date.now()}`;

    await pool.query(
      'INSERT INTO documents(id, user_id, filename, file_url) VALUES($1, $2, $3, $4)',
      [id, userId, filename, fileUrl]
    );

    res.status(201).json({
      status: 'success',
      data: {
        id,
        filename,
        fileUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /documents - Ambil semua dokumen milik user yang login
const getMyDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json({ status: 'success', data: { documents: result.rows } });
  } catch (error) {
    next(error);
  }
};

// GET /documents/:id - Detail dokumen
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);

    if (!result.rowCount) {
      const err = new Error('Dokumen tidak ditemukan');
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// DELETE /documents/:id - Hapus dokumen
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (!result.rowCount) {
      const err = new Error('Dokumen tidak ditemukan atau Anda tidak berhak menghapusnya');
      err.statusCode = 404;
      throw err;
    }

    // Hapus file fisik
    const fs = require('fs');
    const filePath = require('path').join(__dirname, '..', 'uploads', result.rows[0].filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ status: 'success', message: 'Dokumen berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadDocument, getMyDocuments, getDocumentById, deleteDocument };
