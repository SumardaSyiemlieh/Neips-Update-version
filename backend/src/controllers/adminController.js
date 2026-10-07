const googleSheetsService = require('../services/googleSheetsService');
const { generateUniqueID } = require('../utils/helpers');

class AdminController {
    async getStudents(req, res) {
        try {
            const result = await googleSheetsService.getStudents();
            res.json(result);
        } catch (error) {
            console.error('Error fetching students:', error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch students: " + error.message
            });
        }
    }

    async updateStudentStatus(req, res) {
        try {
            const { row, status, project, reason } = req.body;

            const updateData = {
                row,
                status,
                project: project || '',
                reason: reason || ''
            };

            // Generate ID card number if approved
            if (status === 'Approved') {
                updateData.idCardNumber = generateUniqueID();
                updateData.approvalDate = new Date().toISOString();
            }

            const result = await googleSheetsService.updateStudentStatus(updateData);
            res.json(result);

        } catch (error) {
            console.error('Error updating student status:', error);
            res.status(500).json({
                success: false,
                message: "Failed to update student: " + error.message
            });
        }
    }
}

module.exports = new AdminController();