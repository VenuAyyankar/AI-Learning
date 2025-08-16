// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/user');
const authMiddleware = require('../middleware/jwtauth');

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ----------------- Signup -----------------
router.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, phone, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed' });
  }
});

// ----------------- Login -----------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    const detailsFilled = !!(
      user.dob &&
      user.gender &&
      user.address &&
      user.city &&
      user.state &&
      user.photo &&
      user.skillLevel
    );

    res.json({ token, detailsFilled });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// --------------- Submit details ---------------
router.post('/submit-details', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.dob = req.body.dob;
    user.gender = req.body.gender;
    user.address = req.body.address;
    user.city = req.body.city;
    user.state = req.body.state;
    if (req.body.skillLevel) user.skillLevel = req.body.skillLevel;
    if (req.file) {
      user.photo = '/uploads/' + req.file.filename;
    }
    user.detailsFilled = true;
    await user.save();

    let redirect = 'dashboard';
    if (user.skillLevel === 'Intermediate') redirect = 'beginner-test';
    else if (user.skillLevel === 'Advanced') redirect = 'intermediate-test';

    res.json({ success: true, redirect });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit details' });
  }
});

// ----------------- Submit Exam (new route) -----------------
router.post('/submit-exam', authMiddleware, async (req, res) => {
  try {
    const { testName, score, totalQuestions } = req.body;
    if (!testName || typeof score === 'undefined' || typeof totalQuestions === 'undefined') {
      return res.status(400).json({ message: 'Missing testName, score, or totalQuestions' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.scores = user.scores || [];
    user.scores.push({
      testName,
      score: Number(score),
      totalQuestions: Number(totalQuestions),
      date: new Date()
    });
    await user.save();

    // Don't redirect — let frontend handle 1-minute review + "Take me to dashboard"
    res.json({ success: true, message: 'Exam submitted successfully. Review time started.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit exam' });
  }
});

// ----------------- Save test score -----------------
router.post('/save-score', authMiddleware, async (req, res) => {
  try {
    const { testName, score, totalQuestions } = req.body;
    if (typeof score === 'undefined' || typeof totalQuestions === 'undefined') {
      return res.status(400).json({ message: 'Missing score or totalQuestions' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.scores = user.scores || [];
    user.scores.push({
      testName,
      score: Number(score),
      totalQuestions: Number(totalQuestions),
      date: new Date()
    });
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save score' });
  }
});

// ----------------- Get test history -----------------
router.get('/test-history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('scores');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.scores || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch test history' });
  }
});

// ----------------- Get user details -----------------
router.get('/user-details', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

module.exports = router;
