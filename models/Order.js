const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Information
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Customer Information
  shopkeeperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shopkeeper ID is required']
  },
  
  // Company Information
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Company ID is required']
  },
  
  // Order Items
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative']
    },
    unit: {
      type: String,
      required: true
    }
  }],
  
  // Order Details
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: [0, 'Delivery charge cannot be negative']
  },
  finalAmount: {
    type: Number,
    required: true,
    min: [0, 'Final amount cannot be negative']
  },
  
  // Location Information
  deliveryArea: {
    type: String,
    required: [true, 'Delivery area is required']
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Delivery address is required']
  },
  deliveryCity: {
    type: String,
    required: [true, 'Delivery city is required']
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Approval Information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  
  // Delivery Information
  deliveryWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'bank_transfer', 'mobile_banking'],
    default: 'cash_on_delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  
  // Delivery Preferences
  preferredDeliveryDate: {
    type: Date
  },
  deliveryInstructions: {
    type: String
  },
  
  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now
  },
  
  // Notes and Comments
  notes: {
    type: String
  },
  
  // Cancellation
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ shopkeeperId: 1 });
orderSchema.index({ companyId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryArea: 1 });
orderSchema.index({ orderDate: 1 });

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `GTB${year}${month}${day}${random}`;
  }
  next();
});

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.finalAmount = this.totalAmount + this.taxAmount + this.deliveryCharge;
  return this;
};

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, userId = null, reason = null) {
  this.status = newStatus;
  
  if (newStatus === 'approved') {
    this.approvedBy = userId;
    this.approvedAt = new Date();
  } else if (newStatus === 'rejected') {
    this.rejectionReason = reason;
  } else if (newStatus === 'cancelled') {
    this.cancelledBy = userId;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
  }
  
  return this.save();
};

// Method to assign delivery worker
orderSchema.methods.assignDeliveryWorker = function(deliveryWorkerId) {
  this.deliveryWorkerId = deliveryWorkerId;
  this.assignedAt = new Date();
  this.status = 'processing';
  return this.save();
};

// Method to get order summary
orderSchema.methods.getOrderSummary = function() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    totalItems: this.items.length,
    finalAmount: this.finalAmount,
    orderDate: this.orderDate,
    deliveryArea: this.deliveryArea
  };
};

module.exports = mongoose.model('Order', orderSchema);