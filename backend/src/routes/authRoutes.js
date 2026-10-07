const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.get('/check', authController.checkAuth);

module.exports = router;