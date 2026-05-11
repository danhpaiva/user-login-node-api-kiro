const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { validate } = require('../middlewares/validate');
const { loginSchema } = require('../schemas/authSchemas');

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);

module.exports = router;
