const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// ===== Multer config for file upload =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ===== Save user details =====
router.post('/details', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const { dob, gender, address, city, state, skillLevel } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.dob = dob;
    user.gender = gender;
    user.address = address;
    user.city = city;
    user.state = state;
    user.skillLevel = skillLevel;
    if (req.file) {
      user.photo = `/uploads/${req.file.filename}`;
    }

    await user.save();
    res.json({ message: 'Details saved successfully', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
