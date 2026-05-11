const { Router } = require('express');
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createUserSchema, updateUserSchema } = require('../schemas/userSchemas');

const router = Router();

// Public routes
router.get('/', UserController.index);
router.get('/:id', UserController.show);
router.post('/', validate(createUserSchema), UserController.store);
router.put('/:id', validate(updateUserSchema), UserController.update);

// Protected route — requires valid JWT
router.delete('/:id', authenticate, UserController.destroy);

module.exports = router;
