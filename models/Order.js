// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopkeeperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Snapshot fields to prevent dashboard N/A
  shopkeeperSnapshot: {
    name: String,
    shopName: String,
    phone: String
  },
  companySnapshot: {
    name: String,
    companyName: String,
    phone: String
  },
  deliveryWorkerSnapshot: {
    name: String,
    phone: String
  },

  items: {
    type: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      productName: { type: String, required: true },
      quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
      unitPrice: { type: Number, required: true, min: [0, 'Unit price cannot be negative'] },
      totalPrice: { type: Number, required: true, min: [0, 'Total price cannot be negative'] },
      unit: { type: String, required: true }
    }],
    default: []
  },

  totalAmount: { type: Number, required: true, default: 0 },
  taxAmount: { type: Number, required: true, default: 0 },
  deliveryCharge: { type: Number, required: true, default: 0 },
  finalAmount: { type: Number, required: true, default: 0 },

  deliveryAddress: { type: String, default: 'N/A' },
  deliveryArea: { type: String, default: 'N/A' },
  deliveryCity: { type: String, default: 'N/A' },
  preferredDeliveryDate: { type: Date },
  deliveryInstructions: { type: String, default: '' },
  notes: { type: String, default: '' },

  paymentMethod: { type: String, default: 'cash_on_delivery' },
  paymentLabel: { type: String, default: 'Cash On Delivery' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },

  status: { 
    type: String, 
    enum: ['pending','approved','processing','assigned','accepted','picked_up','shipped','delivered','cancelled','rejected'], 
    default: 'pending' 
  },

  timeline: {
    type: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
      actor: {
        name: String,
        role: String
      }
    }],
    default: []
  },

  createdAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
