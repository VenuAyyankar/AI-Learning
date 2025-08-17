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
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with progress tracking
    user = new User({
      name,
      email,
      phone,
      password,
      progress: {
        detailsCompleted: false,
        testCompleted: false,
        lastPage: 'details' // 👈 after signup, they must fill details
      }
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // optional but good practice
    );

    res.json({ token, message: 'User registered successfully', progress: user.progress });

  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ----------------- Login -----------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      message: 'Login successful',
      lastPage: user.progress?.lastPage || 'details', // 👈 send this
      skillLevel: user.skillLevel
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
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

    // ✅ update progress
    user.progress.detailsCompleted = true;

    let redirect = 'dashboard';
    if (user.skillLevel === 'Intermediate') {
      redirect = 'beginner-test';
    } else if (user.skillLevel === 'Advanced') {
      redirect = 'intermediate-test';
    }
    user.progress.lastPage = redirect;

    await user.save();

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
