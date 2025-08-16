const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  // Delivery Information
  deliveryNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Order Reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  
  // Delivery Worker
  deliveryWorkerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Delivery worker ID is required']
  },
  
  // Shop Information
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
  
  // Delivery Details
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
      required: true
    },
    unit: {
      type: String,
      required: true
    }
  }],
  
  // Location Information
  pickupLocation: {
    type: String,
    required: [true, 'Pickup location is required']
  },
  deliveryLocation: {
    type: String,
    required: [true, 'Delivery location is required']
  },
  deliveryArea: {
    type: String,
    required: [true, 'Delivery area is required']
  },
  
  // Delivery Status
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned'],
    default: 'assigned'
  },
  
  // Timestamps
  assignedAt: {
    type: Date,
    default: Date.now
  },
  pickedUpAt: {
    type: Date
  },
  inTransitAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  
  // Delivery Instructions
  deliveryInstructions: {
    type: String
  },
  
  // Contact Information
  shopkeeperPhone: {
    type: String,
    required: true
  },
  shopkeeperName: {
    type: String,
    required: true
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'prepaid'],
    required: true
  },
  amountToCollect: {
    type: Number,
    default: 0
  },
  
  // Delivery Notes
  deliveryNotes: {
    type: String
  },
  
  // Issues and Returns
  issues: [{
    type: {
      type: String,
      enum: ['damaged_goods', 'wrong_items', 'customer_unavailable', 'address_incorrect', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Proof of Delivery
  deliveryProof: {
    signature: String,
    photo: String,
    notes: String
  },
  
  // Performance Metrics
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  
  // Route Information
  routeOptimization: {
    distance: Number,
    estimatedTime: Number,
    routePoints: [{
      lat: Number,
      lng: Number,
      address: String
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
deliverySchema.index({ deliveryNumber: 1 });
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ deliveryWorkerId: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ deliveryArea: 1 });
deliverySchema.index({ assignedAt: 1 });

// Generate delivery number before saving
deliverySchema.pre('save', function(next) {
  if (this.isNew && !this.deliveryNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.deliveryNumber = `DEL${year}${month}${day}${random}`;
  }
  next();
});

// Method to update delivery status
deliverySchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  switch (newStatus) {
    case 'picked_up':
      this.pickedUpAt = new Date();
      break;
    case 'in_transit':
      this.inTransitAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      this.actualDeliveryTime = new Date();
      break;
  }
  
  return this.save();
};

// Method to add delivery issue
deliverySchema.methods.addIssue = function(issueType, description) {
  this.issues.push({
    type: issueType,
    description: description
  });
  return this.save();
};

// Method to complete delivery with proof
deliverySchema.methods.completeDelivery = function(proof) {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  this.actualDeliveryTime = new Date();
  this.deliveryProof = proof;
  return this.save();
};

// Method to get delivery summary
deliverySchema.methods.getDeliverySummary = function() {
  return {
    deliveryNumber: this.deliveryNumber,
    status: this.status,
    deliveryArea: this.deliveryArea,
    shopkeeperName: this.shopkeeperName,
    assignedAt: this.assignedAt,
    deliveredAt: this.deliveredAt
  };
};

module.exports = mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);
