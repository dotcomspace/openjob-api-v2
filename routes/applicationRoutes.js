const express = require('express');
const router = express.Router();
const {
  addApplication, getAllApplications, getApplicationById,
  getApplicationsByUserId, getApplicationsByJobId,
  updateApplicationStatus, deleteApplication
} = require('../controllers/applicationController');
const { cacheResponse } = require('../middlewares/cacheMiddleware');

// Cache middleware khusus dengan key custom
const { redisClient } = require('../config/redis');
const CACHE_TTL = 3600;

// Middleware cache untuk list lamaran berdasarkan userId
const cacheUserApplications = async (req, res, next) => {
  const cacheKey = `applications_user:${req.params.userId}`;
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

// Middleware cache untuk list lamaran berdasarkan jobId
const cacheJobApplications = async (req, res, next) => {
  const cacheKey = `applications_job:${req.params.jobId}`;
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

router.post('/', addApplication);
router.get('/', getAllApplications);
router.get('/user/:userId', cacheUserApplications, getApplicationsByUserId);
router.get('/job/:jobId', cacheJobApplications, getApplicationsByJobId);
router.get('/:id', cacheResponse('application'), getApplicationById);  // Cache GET /applications/:id
router.put('/:id', updateApplicationStatus);
router.delete('/:id', deleteApplication);

module.exports = router;
