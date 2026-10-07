const express = require('express');
const staffController = require('../controllers/staffController');
const { requireStaff } = require('../middleware/authMiddleware'); // ADD THIS

const router = express.Router();

router.use(requireStaff); // Protect all staff routes

// Your staff routes here...