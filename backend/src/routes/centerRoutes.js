const express = require('express');
const router = express.Router();
const centerController = require('../controllers/centerController');

// Public routes
router.get('/centers', centerController.getAllCenters);
router.get('/centers/:center/users', centerController.getCenterUsers);

module.exports = router;