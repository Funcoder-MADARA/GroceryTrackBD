const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new admin user
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, email, phone, and password are required'
      });
    }

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        error: 'Admin exists',
        message: 'An admin user already exists'
      });
    }
    
    // Supply default values for required fields not provided for admin
    const userData = {
      name,
      email,
      phone,
      password,
      role: 'admin',
      status: 'active',
      area: req.body.area || 'Admin Area',
      city: req.body.city || 'Admin City',
      address: req.body.address || 'Admin Address'
    };
    
    const user = new User(userData);
    await user.save();

    // Generate JWT token for admin
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during admin registration'
    });
  }
});

// =================== Regular User Auth Endpoints ===================

router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      area,
      city,
      address,
      shopkeeperInfo,
      companyInfo,
      deliveryWorkerInfo
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email or phone number already exists'
      });
    }

    // Create user object based on role
    const userData = {
      name,
      email,
      phone,
      password,
      role,
      area,
      city,
      address,
      // For regular users, default to inactive until approved
      status: 'inactive'
    };

    // Add role-specific information
    if (role === 'shopkeeper' && shopkeeperInfo) {
      userData.shopkeeperInfo = shopkeeperInfo;
    } else if (role === 'company_rep' && companyInfo) {
      userData.companyInfo = companyInfo;
    } else if (role === 'delivery_worker' && deliveryWorkerInfo) {
      userData.deliveryWorkerInfo = deliveryWorkerInfo;
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email including password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // For non-admin users check for active status;
    // allow admin login even if status isn't active.
    if (user.role !== 'admin' && user.status !== 'active') {
      return res.status(403).json({
        error: 'Account not active',
        message: 'Your account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update lastLogin for analytics, etc.
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'An error occurred while fetching profile'
    });
  }
});

router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || (user.role !== 'admin' && user.status !== 'active')) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or inactive'
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Token refreshed successfully',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be at least 6 characters long'
      });
    }
    const user = await User.findById(req.user._id).select('+password');
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'An error occurred while changing password'
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        message: 'Please provide your email address'
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: 'If an account with this email exists, a password reset link has been sent'
      });
    }
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    // TODO: Send email with resetToken as a link.
    res.json({
      message: 'Password reset instructions have been sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: 'An error occurred while processing password reset'
    });
  }
});

// Admin-only route: Get all pending users (waiting for approval)
router.get('/pending-users', authenticateToken, async (req, res) => {
  try {
    // Only allow access if logged in user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin can view pending users'
      });
    }

    // Find non-admin users with status "inactive"
    const pendingUsers = await User.find({ 
      status: 'inactive',
      role: { $ne: 'admin' }
    }).select('-password'); // omit password field

    res.json({
      message: 'Pending users retrieved successfully',
      pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({
      error: 'Could not fetch pending users',
      message: 'An error occurred while fetching pending users'
    });
  }
});
// Admin-only route: Approve a pending user (set status to 'active')
router.patch('/approve-user/:userId', authenticateToken, async (req, res) => {
  try {
    // Only allow admins to perform this action.
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admin can perform this action'
      });
    }
    
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user exists with this id'
      });
    }
    
    // Only change users that are currently inactive (pending)
    if (user.status === 'active') {
      return res.status(400).json({
        error: 'User already active',
        message: 'This user has already been approved'
      });
    }
    
    user.status = 'active';
    await user.save();
    
    res.json({
      message: 'User approved successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      error: 'Approval failed',
      message: 'An error occurred while approving the user'
    });
  }
});

module.exports = router;
