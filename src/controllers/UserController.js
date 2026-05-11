const User = require('../models/User');

class UserController {
  /**
   * GET /users
   * List all users
   */
  static index(req, res) {
    try {
      const users = User.findAll();
      return res.status(200).json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  /**
   * GET /users/:id
   * Get a single user by ID
   */
  static show(req, res) {
    try {
      const user = User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  /**
   * POST /users
   * Create a new user
   */
  static store(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: {
            ...((!name) && { name: 'Name is required' }),
            ...((!email) && { email: 'Email is required' }),
            ...((!password) && { password: 'Password is required' }),
          },
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }

      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      const existing = User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }

      const user = User.create({ name, email, password });
      return res.status(201).json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  /**
   * PUT /users/:id
   * Update an existing user
   */
  static update(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name && !email && !password) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name, email, password) must be provided',
        });
      }

      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        const existing = User.findByEmail(email);
        if (existing && existing.id !== req.params.id) {
          return res.status(409).json({ success: false, message: 'Email already in use' });
        }
      }

      if (password && password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      const user = User.update(req.params.id, { name, email, password });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  /**
   * DELETE /users/:id
   * Delete a user
   */
  static destroy(req, res) {
    try {
      const deleted = User.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }
}

module.exports = UserController;
