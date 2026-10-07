const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware'); // ADD THIS

const router = express.Router();

// PROTECT ALL ADMIN ROUTES
router.use(requireAdmin); // ← ADD THIS ONE LINE

router.get('/students', adminController.getStudents);
router.post('/update-status', adminController.updateStudentStatus);

module.exports = router;