const express = require('express');
const formController = require('../controllers/formController');

const router = express.Router();

router.post('/submit', formController.submitForm);
router.get('/student-status', formController.checkStudentStatus);
// Add these routes to your formRoutes.js
router.get('/staff/students', async (req, res) => {
    try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbw-QxQX6by2Upb3wy7Dn7J3pHq6-dKHYpE9UEAWU5mIAV041YP7TRPA0iSPVA9TBuCV/exec?action=getStudents`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add similar routes for other staff actions

module.exports = router;