const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const payload = {
      user: {
        id: req.user.id,
        role: req.user.role
      }
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production';
    
    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        res.redirect(`${clientUrl}/auth-success?token=${token}`);
      }
    );
  }
);

// Traditional registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      // Default role is 'user'
      role: 'user'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production';

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production';

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;