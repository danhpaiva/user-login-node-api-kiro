const { Router } = require('express');
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

// Public routes
router.get('/', UserController.index);
router.get('/:id', UserController.show);
router.post('/', UserController.store);
router.put('/:id', UserController.update);

// Protected route — requires valid JWT
router.delete('/:id', authenticate, UserController.destroy);

module.exports = router;
