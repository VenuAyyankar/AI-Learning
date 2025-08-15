// routes/testResults.js
const express = require('express');
const router = express.Router();
const TestResult = require('../models/TestResult');


// Save test result
router.post('/', async (req, res) => {
  try {
    const { userId, testName, score, totalQuestions, correctAnswers } = req.body;

    if (!userId || !testName || score == null || totalQuestions == null || correctAnswers == null) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newResult = new TestResult({ userId, testName, score, totalQuestions, correctAnswers });
    await newResult.save();

    res.status(201).json({ message: 'Test result saved successfully', result: newResult });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all results
router.get('/', async (req, res) => {
  try {
    const results = await TestResult.find();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
