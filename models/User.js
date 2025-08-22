const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+880|880|0)?1[3456789]\d{8}$/, 'Please enter a valid Bangladeshi phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  
  // User Role
  role: {
    type: String,
    enum: ['shopkeeper', 'company_rep', 'delivery_worker', 'admin'],
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  },
  
  // Suspension reason (for rejected users)
  suspensionReason: {
    type: String,
    default: null
  },
  
  // Location Information
  area: {
    type: String,
    required: [true, 'Area is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  
  // Role-specific Information
  shopkeeperInfo: {
    shopName: String,
    businessType: String,
    businessHours: String,
    shopSize: String
  },
  
  companyInfo: {
    companyName: String,
    companyType: String,
    businessLicense: String,
    taxId: String
  },
  
  deliveryWorkerInfo: {
    vehicleType: String,
    vehicleNumber: String,
    assignedAreas: [String],
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline'
    }
  },
  
  // Profile Image
  profileImage: {
    type: String,
    default: null
  },
  
  // Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ area: 1 });
userSchema.index({ status: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
