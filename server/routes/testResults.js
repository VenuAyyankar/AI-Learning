const express = require('express');
const router = express.Router();

// IMPORTANT: Match the exact file name in /models/
const TestResult = require('../models/TestResults'); 
const authMiddleware = require('../middleware/auth');
const User = require('../models/User'); // Match exact filename too

// Save test result and update progress
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { score, totalMarks, testName, answers } = req.body;

    if (typeof score === 'undefined' || typeof totalMarks === 'undefined' || !testName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newResult = new TestResult({
      userId: req.user.id,
      score: Number(score),
      totalMarks: Number(totalMarks),
      testName,
      answers: Array.isArray(answers) ? answers : [],
      date: new Date()
    });

    await newResult.save();

    // Update user's progress stage to dashboard after completing a test
    const user = await User.findById(req.user.id);
    if (user) {
      user.progressStage = 'dashboard';
      await user.save();
    }

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
