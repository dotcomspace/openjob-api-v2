const express = require('express');
const { addJob, getAllJobs, getJobById, getJobsByCompanyId, getJobsByCategoryId, updateJob, deleteJob } = require('../controllers/jobController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// GET Publik (Pastikan rute dengan kata khusus seperti /company dan /category ada di atas /:id)
router.get('/', getAllJobs);
router.get('/company/:companyId', getJobsByCompanyId);
router.get('/category/:categoryId', getJobsByCategoryId);
router.get('/:id', getJobById);

// Endpoint dilindungi Token
router.post('/', verifyToken, addJob);
router.put('/:id', verifyToken, updateJob);
router.delete('/:id', verifyToken, deleteJob);

module.exports = router;