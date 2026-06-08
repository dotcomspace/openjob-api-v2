const pool = require('../config/database');
const { invalidateCache } = require('../middlewares/cacheMiddleware');

const addBookmark = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const id = `bookmark-${Date.now()}`;

    await pool.query(
      'INSERT INTO bookmarks(id, user_id, job_id) VALUES($1, $2, $3)',
      [id, userId, jobId]
    );

    // Invalidate cache list bookmark user
    await invalidateCache(`bookmarks:${userId}`);

    res.status(201).json({ status: 'success', data: { id } });
  } catch (error) { next(error); }
};

const getAllBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT * FROM bookmarks WHERE user_id = $1', [userId]);
    res.status(200).json({ status: 'success', data: { bookmarks: result.rows } });
  } catch (error) { next(error); }
};

const getBookmarkById = async (req, res, next) => {
  try {
    const { bookmarkId } = req.params;
    const result = await pool.query('SELECT * FROM bookmarks WHERE id = $1', [bookmarkId]);

    if (!result.rowCount) {
      const err = new Error('Bookmark tidak ditemukan');
      err.statusCode = 404; throw err;
    }
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) { next(error); }
};

const deleteBookmark = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM bookmarks WHERE job_id = $1 AND user_id = $2 RETURNING id',
      [jobId, userId]
    );

    if (!result.rowCount) {
      const err = new Error('Bookmark tidak ditemukan');
      err.statusCode = 404; throw err;
    }

    // Invalidate cache list bookmark user
    await invalidateCache(`bookmarks:${userId}`);

    res.status(200).json({ status: 'success', message: 'Bookmark berhasil dihapus' });
  } catch (error) { next(error); }
};

module.exports = { addBookmark, getAllBookmarks, getBookmarkById, deleteBookmark };
