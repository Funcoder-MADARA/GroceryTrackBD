const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

// Admin dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Check if user is admin before proceeding
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // This route will be implemented to fetch admin dashboard data
    res.json({ message: 'Admin dashboard route working' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;