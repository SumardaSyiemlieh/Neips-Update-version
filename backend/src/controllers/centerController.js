const GoogleSheetsService = require('../services/googleSheetsService');

class CenterController {
    async getAllCenters(req, res) {
        try {
            console.log('🏢 Fetching all centers...');

            const result = await GoogleSheetsService.getAllCenters();

            res.json(result);

        } catch (error) {
            console.error('❌ Error getting centers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get centers: ' + error.message
            });
        }
    }

    async getCenterUsers(req, res) {
        try {
            const { center } = req.params;

            console.log('👥 Fetching users for center:', center);

            const result = await GoogleSheetsService.getUsersByCenter(center);

            res.json(result);

        } catch (error) {
            console.error('❌ Error getting center users:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get center users: ' + error.message
            });
        }
    }
}

module.exports = new CenterController();