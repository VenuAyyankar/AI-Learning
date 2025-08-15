const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/auth');
const testResultsRoutes = require('./routes/testResults'); // Correct import

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Serve static files =====
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ===== Frontend page routes =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/signup.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/details', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/details.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/beginner-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/beginner-test.html'));
});

app.get('/intermediate-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/intermediate-test.html'));
});

// ===== Backend API routes =====
app.use('/', authRoutes);
app.use('/test-results', testResultsRoutes); // testResults API route

// ===== MongoDB connection =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
