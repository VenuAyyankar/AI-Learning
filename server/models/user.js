// server/models/user.js
const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  password: String,
  dob: String,
  gender: String,
  address: String,
  city: String,
  state: String,
  photo: String,
  skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  detailsFilled: { type: Boolean, default: false },
  scores: [scoreSchema]
});

module.exports = mongoose.model('User', userSchema);
