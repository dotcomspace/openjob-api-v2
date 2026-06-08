const express = require('express');
const { login, refreshAuth, logout } = require('../controllers/authController');

const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', login);
router.put('/', refreshAuth);

router.delete('/', verifyToken, logout);

module.exports = router;