// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // ✅ change from 'Company' to 'User'
    required: true
  },
  shopkeeperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: {
    type: [{
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
    default: [] // ✅ prevents undefined errors
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
