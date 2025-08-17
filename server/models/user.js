const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  dob: String,
  gender: String,
  address: String,
  city: String,
  state: String,
  photo: String,
  skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },

  // ✅ Progress tracking
  progress: {
    detailsCompleted: { type: Boolean, default: false },
    testCompleted: { type: Boolean, default: false },
    lastPage: { type: String, default: 'signup' } 
    // signup | details | beginner-test | advanced-test | dashboard
  }
});

module.exports = mongoose.model('User', userSchema);
