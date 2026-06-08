const { redisClient } = require('../config/redis');

const CACHE_TTL = 3600; // 1 jam dalam detik

/**
 * Middleware untuk meng-cache response berdasarkan URL
 */
const cacheResponse = (keyPrefix) => async (req, res, next) => {
  try {
    const cacheKey = `${keyPrefix}:${req.params.id || req.params.userId || req.params.jobId || 'all'}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      // Data berasal dari cache — kirim header X-Data-Source: cache
      res.setHeader('X-Data-Source', 'cache');
      return res.status(200).json(JSON.parse(cached));
    }

    // Tidak ada cache — intercept res.json untuk menyimpan data ke cache
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      // Hanya cache jika response sukses
      if (res.statusCode === 200) {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(data));
      }
      return originalJson(data);
    };

    next();
  } catch (err) {
    // Jika Redis error, lanjutkan tanpa cache
    console.error('Cache middleware error:', err.message);
    next();
  }
};

/**
 * Helper untuk menghapus cache berdasarkan key
 */
const invalidateCache = async (...keys) => {
  try {
    for (const key of keys) {
      await redisClient.del(key);
      console.log(`Cache invalidated: ${key}`);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err.message);
  }
};

module.exports = { cacheResponse, invalidateCache, CACHE_TTL };
