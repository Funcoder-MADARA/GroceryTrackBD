const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');
const connectDB = require('./config/db');

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Passport configuration
require('./config/passport');
app.use(passport.initialize());

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Define routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to GroceryTrackBD API' });
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});