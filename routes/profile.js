const express = require('express');
const User = require('../models/User');
const { validateProfileUpdate, validateObjectId } = require('../middleware/validation');
const { authenticateToken, authorizeSelfOrAdmin, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user profile by ID (admin or self)
router.get('/:userId', authenticateToken, authorizeSelfOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
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
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: 'An error occurred while fetching user profile'
    });
  }
});

// Update user profile
router.put('/:userId', authenticateToken, authorizeSelfOrAdmin, validateProfileUpdate, async (req, res) => {
  try {
    const {
      name,
      phone,
      area,
      city,
      address,
      shopkeeperInfo,
      companyInfo,
      deliveryWorkerInfo
    } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Update basic information
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (area) user.area = area;
    if (city) user.city = city;
    if (address) user.address = address;

    // Update role-specific information
    if (user.role === 'shopkeeper' && shopkeeperInfo) {
      user.shopkeeperInfo = { ...user.shopkeeperInfo, ...shopkeeperInfo };
    } else if (user.role === 'company_rep' && companyInfo) {
      user.companyInfo = { ...user.companyInfo, ...companyInfo };
    } else if (user.role === 'delivery_worker' && deliveryWorkerInfo) {
      user.deliveryWorkerInfo = { ...user.deliveryWorkerInfo, ...deliveryWorkerInfo };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'An error occurred while updating profile'
    });
  }
});

// Update profile image
router.put('/:userId/image', authenticateToken, authorizeSelfOrAdmin, async (req, res) => {
  try {
    const { profileImage } = req.body;

    if (!profileImage) {
      return res.status(400).json({
        error: 'Profile image required',
        message: 'Please provide a profile image'
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    user.profileImage = profileImage;
    await user.save();

    res.json({
      message: 'Profile image updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({
      error: 'Profile image update failed',
      message: 'An error occurred while updating profile image'
    });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, area } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (area) query.area = { $regex: area, $options: 'i' };

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: 'An error occurred while fetching users'
    });
  }
});

// Update user status (admin only)
router.put('/:userId/status', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be pending, active, suspended, or inactive'
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    user.status = status;
    await user.save();

    res.json({
      message: 'User status updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      error: 'Status update failed',
      message: 'An error occurred while updating user status'
    });
  }
});

// Assign delivery areas to delivery worker (admin only)
router.put('/:userId/assign-areas', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { assignedAreas } = req.body;

    if (!Array.isArray(assignedAreas)) {
      return res.status(400).json({
        error: 'Invalid areas',
        message: 'Assigned areas must be an array'
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    if (user.role !== 'delivery_worker') {
      return res.status(400).json({
        error: 'Invalid user role',
        message: 'Can only assign areas to delivery workers'
      });
    }

    user.deliveryWorkerInfo.assignedAreas = assignedAreas;
    await user.save();

    res.json({
      message: 'Delivery areas assigned successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Assign areas error:', error);
    res.status(500).json({
      error: 'Area assignment failed',
      message: 'An error occurred while assigning areas'
    });
  }
});

// Update delivery worker availability
router.put('/:userId/availability', authenticateToken, async (req, res) => {
  try {
    const { availability } = req.body;

    if (!['available', 'busy', 'offline'].includes(availability)) {
      return res.status(400).json({
        error: 'Invalid availability',
        message: 'Availability must be available, busy, or offline'
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    if (user.role !== 'delivery_worker') {
      return res.status(400).json({
        error: 'Invalid user role',
        message: 'Can only update availability for delivery workers'
      });
    }

    // Check if user is updating their own availability
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own availability'
      });
    }

    user.deliveryWorkerInfo.availability = availability;
    await user.save();

    res.json({
      message: 'Availability updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      error: 'Availability update failed',
      message: 'An error occurred while updating availability'
    });
  }
});

// Get users by role
router.get('/role/:role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10, area } = req.query;

    if (!['shopkeeper', 'company_rep', 'delivery_worker'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be shopkeeper, company_rep, or delivery_worker'
      });
    }

    const query = { role, status: 'active' };
    if (area) query.area = { $regex: area, $options: 'i' };

    const users = await User.find(query)
      .select('-password')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: 'An error occurred while fetching users'
    });
  }
});

// Delete user (admin only)
router.delete('/:userId', authenticateToken, authorizeAdmin, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'User deletion failed',
      message: 'An error occurred while deleting user'
    });
  }
});

module.exports = router;