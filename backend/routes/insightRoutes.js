const express = require('express');
const router = express.Router();
const { generateInsights } = require('../controllers/insightController');

router.post('/generate/:datasetId', generateInsights);

module.exports = router;
