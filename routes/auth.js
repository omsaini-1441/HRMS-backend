const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile } = require('../controller/auth');
const authMiddleware = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;