const User = require('../models/User');
const { cache, KEYS, invalidateAll, invalidateUser } = require('../cache/cache');

class UserController {
  /**
   * GET /users?page=1&limit=20
   * List all active users with pagination — served from cache when available.
   */
  static index(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const cacheKey = `${KEYS.allUsers}:p${page}:l${limit}`;

      const cached = cache.get(cacheKey);
      if (cached !== undefined) {
        return res.status(200).json({ success: true, ...cached, fromCache: true });
      }

      const result = User.findAll({ page, limit });
      cache.set(cacheKey, result);

      return res.status(200).json({ success: true, ...result, fromCache: false });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  /**
   * GET /users/:id
   * Get a single active user by ID — served from cache when available.
   */
  static show(req, res) {
    try {
      const { id } = req.params;
      const cached = cache.get(KEYS.user(id));
      if (cached !== undefined) {
        return res.status(200).json({ success: true, data: cached, fromCache: true });
      }

      const user = User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      cache.set(KEYS.user(id), user);
      return res.status(200).json({ success: true, data: user, fromCache: false });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  /**
   * POST /users
   * Create a new user — body already validated by Zod middleware.
   */
  static store(req, res) {
    try {
      const { name, email, password } = req.body;

      const existing = User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }

      const user = User.create({ name, email, password });
      invalidateAll();

      return res.status(201).json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  /**
   * PUT /users/:id
   * Update an existing user — body already validated by Zod middleware.
   */
  static update(req, res) {
    try {
      const { name, email, password } = req.body;

      if (email) {
        const existing = User.findByEmail(email);
        if (existing && existing.id !== req.params.id) {
          return res.status(409).json({ success: false, message: 'Email already in use' });
        }
      }

      const user = User.update(req.params.id, { name, email, password });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      invalidateUser(req.params.id);
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  /**
   * DELETE /users/:id
   * Soft-delete a user — sets deleted_at, does not remove the row.
   */
  static destroy(req, res) {
    try {
      const deleted = User.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      invalidateUser(req.params.id);
      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }
}

module.exports = UserController;
