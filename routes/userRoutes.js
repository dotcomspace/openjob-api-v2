const express = require('express');
const router = express.Router();
const { registerUser, getUserById, updateUser } = require('../controllers/userController');
const { cacheResponse } = require('../middlewares/cacheMiddleware');
const verifyToken = require('../middlewares/authMiddleware');

router.post('/', registerUser);
router.get('/:id', cacheResponse('user'), getUserById);  // Cache GET /users/:id
router.put('/:id', verifyToken, updateUser);

module.exports = router;
