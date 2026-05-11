const { Router } = require('express');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
