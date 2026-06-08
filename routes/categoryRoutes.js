const express = require('express');
const { addCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controllers/categoryController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', verifyToken, addCategory);
router.put('/:id', verifyToken, updateCategory);
router.delete('/:id', verifyToken, deleteCategory);

module.exports = router;