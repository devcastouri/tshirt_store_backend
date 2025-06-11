const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// List all users (admin only)
router.get('/users', authController.listUsers);

// Login route
router.post('/login', authController.login);

// Logout route
router.post('/logout', authController.logout);

// Get current user route
router.get('/me', authController.getCurrentUser);

module.exports = router; 