const express = require('express');
const router = express.Router();
const { addCompany, getAllCompanies, getCompanyById, updateCompany, deleteCompany } = require('../controllers/companyController');
const { cacheResponse } = require('../middlewares/cacheMiddleware');

router.post('/', addCompany);
router.get('/', getAllCompanies);
router.get('/:id', cacheResponse('company'), getCompanyById);  // Cache GET /companies/:id
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

module.exports = router;
