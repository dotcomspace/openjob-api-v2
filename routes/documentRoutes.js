const express = require('express');
const router = express.Router();
const path = require('path');
const verifyToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { uploadDocument, getMyDocuments, getDocumentById, deleteDocument } = require('../controllers/documentController');

// POST /documents - Upload PDF (butuh login + multer)
router.post('/', verifyToken, upload.single('document'), uploadDocument);

// GET /documents - Daftar dokumen milik user yang login
router.get('/', verifyToken, getMyDocuments);

// GET /documents/files/:filename - Serve file PDF (Advanced: tampilkan file)
router.get('/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ status: 'failed', message: 'File tidak ditemukan' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.sendFile(filePath);
});

// GET /documents/:id - Detail dokumen
router.get('/:id', verifyToken, getDocumentById);

// DELETE /documents/:id - Hapus dokumen
router.delete('/:id', verifyToken, deleteDocument);

module.exports = router;
