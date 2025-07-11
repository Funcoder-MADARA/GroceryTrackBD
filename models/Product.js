const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  
  // Company Information
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Company ID is required']
  },
  
  // Category and Classification
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['groceries', 'beverages', 'snacks', 'household', 'personal_care', 'frozen_foods', 'dairy', 'bakery', 'others']
  },
  subCategory: {
    type: String,
    trim: true
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Product unit is required'],
    enum: ['kg', 'gram', 'liter', 'ml', 'piece', 'pack', 'dozen', 'bottle', 'can', 'box']
  },
  
  // Inventory
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative']
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  
  // Product Details
  brand: {
    type: String,
    trim: true
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'gram', 'liter', 'ml']
  },
  
  // Images
  images: [{
    type: String,
    required: [true, 'At least one product image is required']
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Popularity and Analytics
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSold: {
    type: Number,
    default: 0
  },
  
  // Special Features
  isFeatured: {
    type: Boolean,
    default: false
  },
  isSeasonal: {
    type: Boolean,
    default: false
  },
  
  // Expiry and Manufacturing
  expiryDate: {
    type: Date
  },
  manufacturingDate: {
    type: Date
  },
  
  // Tags for search
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ companyId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for price per unit
productSchema.virtual('pricePerUnit').get(function() {
  return this.price;
});

// Method to check if product is in stock
productSchema.methods.isInStock = function(quantity = 1) {
  return this.stockQuantity >= quantity && this.isAvailable && this.isActive;
};

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (operation === 'decrease') {
    this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
  } else if (operation === 'increase') {
    this.stockQuantity += quantity;
  }
  return this.save();
};

// Method to get public product info
productSchema.methods.getPublicInfo = function() {
  const productObject = this.toObject();
  return productObject;
};

module.exports = mongoose.model('Product', productSchema);
