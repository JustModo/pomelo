const express = require('express');
const router = express.Router();
const { handleLogin, handleRegister } = require('../controllers/authCon');
const { authLimiter } = require('../middlewares/rateLimiter');

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Login / Verify Credentials
router.post('/login', handleLogin);

// Register
router.post('/register', handleRegister);

module.exports = router;
