const express = require('express');
const studentController = require('../controllers/studentController');
const { requireAuth } = require('../middleware/authMiddleware'); // ADD THIS

const router = express.Router();

router.use(requireAuth); // Protect all student routes

// Your student routes here...