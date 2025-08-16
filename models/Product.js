const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'dairy', 'meat', 'seafood', 'fruits', 'vegetables', 
      'grains', 'bakery', 'beverages', 'snacks', 
      'frozen', 'canned', 'condiments', 'other'
    ]
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['piece', 'kg', 'liter', 'box', 'pack', 'dozen'],
    default: 'piece'
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  maxOrderQuantity: {
    type: Number,
    default: null // null means no limit
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String // URLs to product images
  }],
  tags: [{
    type: String,
    trim: true
  }],
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  expiryDate: {
    type: Date
  },
  manufacturingDate: {
    type: Date
  },
  brand: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true // allows multiple null values
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ companyId: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.stockQuantity > 0;
});

// Virtual for checking if product is low stock (less than 10)
productSchema.virtual('lowStock').get(function() {
  return this.stockQuantity > 0 && this.stockQuantity < 10;
});

// Method to check if a quantity can be ordered
productSchema.methods.canOrder = function(quantity) {
  if (!this.isActive) return false;
  if (quantity < this.minOrderQuantity) return false;
  if (this.maxOrderQuantity && quantity > this.maxOrderQuantity) return false;
  if (quantity > this.stockQuantity) return false;
  return true;
};

// Method to reduce stock after order
productSchema.methods.reduceStock = function(quantity) {
  if (this.stockQuantity >= quantity) {
    this.stockQuantity -= quantity;
    return this.save();
  }
  throw new Error('Insufficient stock');
};

// Static method to find products by company
productSchema.statics.findByCompany = function(companyId) {
  return this.find({ companyId, isActive: true });
};

// Static method to search products
productSchema.statics.searchProducts = function(companyId, searchTerm) {
  return this.find({
    companyId,
    isActive: true,
    $text: { $search: searchTerm }
  });
};

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
