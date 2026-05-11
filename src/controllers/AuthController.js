const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const env = require('../config/env');

class AuthController {
  /**
   * POST /auth/login
   * Body already validated by Zod middleware.
   */
  static login(req, res) {
    try {
      const { email, password } = req.body;

      const user = User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const passwordMatch = bcrypt.compareSync(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      return res.status(200).json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }
}

module.exports = AuthController;
