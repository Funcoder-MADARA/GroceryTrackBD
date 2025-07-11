const express = require('express');
const Notification = require('../models/Notification');
const { validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeSelfOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    
    const query = { recipientId: req.user._id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: 'An error occurred while fetching notifications'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only mark your own notifications as read'
      });
    }

    await notification.markAsRead();

    res.json({
      message: 'Notification marked as read',
      notification: notification.getSummary()
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: 'An error occurred while updating notification'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: 'Failed to mark notifications as read',
      message: 'An error occurred while updating notifications'
    });
  }
});

// Delete notification
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own notifications'
      });
    }

    await Notification.findByIdAndDelete(req.params.notificationId);

    res.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: 'An error occurred while deleting notification'
    });
  }
});

// Get notification statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments({
      recipientId: req.user._id
    });

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      isRead: false
    });

    const notificationsByType = await Notification.aggregate([
      { $match: { recipientId: req.user._id } },
      { $group: {
        _id: '$type',
        count: { $sum: 1 }
      }}
    ]);

    const recentNotifications = await Notification.find({
      recipientId: req.user._id
    })
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      totalNotifications,
      unreadCount,
      notificationsByType,
      recentNotifications
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      error: 'Failed to get notification statistics',
      message: 'An error occurred while fetching notification statistics'
    });
  }
});

// Create notification (internal use)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      recipientId,
      type,
      title,
      message,
      relatedOrderId,
      relatedDeliveryId,
      relatedProductId,
      priority,
      data
    } = req.body;

    // Check if user has permission to create notifications
    if (!['admin', 'company_rep'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to create notifications'
      });
    }

    const notification = new Notification({
      recipientId,
      type,
      title,
      message,
      relatedOrderId,
      relatedDeliveryId,
      relatedProductId,
      priority: priority || 'medium',
      data: data || {}
    });

    await notification.save();

    res.status(201).json({
      message: 'Notification created successfully',
      notification: notification.getSummary()
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      message: 'An error occurred while creating notification'
    });
  }
});

// Get notifications by type
router.get('/type/:type', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({
      recipientId: req.user._id,
      type: type
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Notification.countDocuments({
      recipientId: req.user._id,
      type: type
    });

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get notifications by type error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: 'An error occurred while fetching notifications'
    });
  }
});

// Get all notifications (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins can view all notifications'
      });
    }

    const { page = 1, limit = 50, recipientId, type, isRead } = req.query;
    
    const query = {};
    if (recipientId) query.recipientId = recipientId;
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .populate('recipientId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: 'An error occurred while fetching notifications'
    });
  }
});

// Bulk delete notifications
router.delete('/bulk', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Notification IDs must be an array'
      });
    }

    // Check if user owns all notifications
    const notifications = await Notification.find({
      _id: { $in: notificationIds },
      recipientId: req.user._id
    });

    if (notifications.length !== notificationIds.length) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own notifications'
      });
    }

    await Notification.deleteMany({
      _id: { $in: notificationIds }
    });

    res.json({
      message: 'Notifications deleted successfully',
      deletedCount: notificationIds.length
    });

  } catch (error) {
    console.error('Bulk delete notifications error:', error);
    res.status(500).json({
      error: 'Failed to delete notifications',
      message: 'An error occurred while deleting notifications'
    });
  }
});

module.exports = router;
