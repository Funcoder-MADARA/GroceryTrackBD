const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'order_placed',
      'order_approved',
      'order_rejected',
      'order_shipped',
      'order_delivered',
      'delivery_assigned',
      'delivery_picked_up',
      'delivery_delivered',
      'payment_received',
      'payment_failed',
      'stock_low',
      'area_trend',
      'system_alert',
      'user_registration',
      'user_approved',
      'user_rejected'
    ],
    required: [true, 'Notification type is required']
  },
  
  // Title and Message
  title: {
    type: String,
    required: [true, 'Notification title is required']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required']
  },
  
  // Related Data
  relatedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedDeliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  relatedProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  // Notification Status
  isRead: {
    type: Boolean,
    default: false
  },
  isSent: {
    type: Boolean,
    default: false
  },
  
  // Delivery Methods
  emailSent: {
    type: Boolean,
    default: false
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  pushSent: {
    type: Boolean,
    default: false
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Additional Data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Expiry
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ priority: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function(method = 'all') {
  if (method === 'all' || method === 'email') {
    this.emailSent = true;
  }
  if (method === 'all' || method === 'sms') {
    this.smsSent = true;
  }
  if (method === 'all' || method === 'push') {
    this.pushSent = true;
  }
  this.isSent = true;
  return this.save();
};

// Method to get notification summary
notificationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    isRead: this.isRead,
    createdAt: this.createdAt,
    priority: this.priority
  };
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return new this(data);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(recipientId) {
  return this.countDocuments({
    recipientId: recipientId,
    isRead: false
  });
};

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
