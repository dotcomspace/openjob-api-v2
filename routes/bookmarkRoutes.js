const express = require('express');
const router = express.Router();
const { addBookmark, getAllBookmarks, getBookmarkById, deleteBookmark } = require('../controllers/bookmarkController');
const verifyToken = require('../middlewares/authMiddleware');
const { redisClient } = require('../config/redis');
const CACHE_TTL = 3600;

// Cache middleware untuk GET /bookmarks (list per user)
const cacheBookmarks = async (req, res, next) => {
  const cacheKey = `bookmarks:${req.user.id}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.setHeader('X-Data-Source', 'cache');
      return res.status(200).json(JSON.parse(cached));
    }
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (res.statusCode === 200) await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(data));
      return originalJson(data);
    };
    next();
  } catch (e) { next(); }
};

router.post('/jobs/:jobId/bookmarks', verifyToken, addBookmark);
router.get('/bookmarks', verifyToken, cacheBookmarks, getAllBookmarks);
router.get('/bookmarks/:bookmarkId', verifyToken, getBookmarkById);
router.delete('/jobs/:jobId/bookmarks', verifyToken, deleteBookmark);

module.exports = router;
