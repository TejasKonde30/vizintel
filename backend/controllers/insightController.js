const Insight = require('../models/Insight');
const Dataset = require('../models/Dataset');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

exports.generateInsights = async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.datasetId);
    const filePath = path.join(__dirname, '..', 'uploads', dataset.fileName);

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await axios.post('http://localhost:8000/generate-insights/', form, {
      headers: form.getHeaders()
    });

    const insight = new Insight({
      datasetId: dataset._id,
      insightsData: response.data.insights
    });

    await insight.save();
    res.status(200).json(insight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Insight generation failed' });
  }
};
