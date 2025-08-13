const express = require('express');
const router = express.Router();
const TestResult = require('../models/testresults');
const authMiddleware = require('../middleware/auth');

// Save test result
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { score, totalMarks, testName, answers } = req.body;

    if (!score || !totalMarks || !testName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newResult = new TestResult({
      userId: req.user.id,
      score,
      totalMarks,
      testName,
      answers: answers || [],
      date: new Date()
    });

    await newResult.save();
    res.status(201).json({ message: 'Test result saved successfully' });
  } catch (err) {
    console.error('Error saving test result:', err);
    res.status(500).json({ message: 'Failed to save test result' });
  }
});

// Fetch all results for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const results = await TestResult.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(results);
  } catch (err) {
    console.error('Error fetching test results:', err);
    res.status(500).json({ message: 'Failed to fetch test results' });
  }
});

module.exports = router;
