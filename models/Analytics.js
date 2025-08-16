const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Company Information
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Product Information
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  // Time Period (for aggregation)
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true,
    index: true
  },
  
  // Date Range
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Inventory Metrics
  totalQuantityBought: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalQuantitySold: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalQuantityRemaining: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Loss Calculations
  baseLossPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  timeBasedLossPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  totalLossPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Financial Impact
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  netLoss: {
    type: Number,
    default: 0
  },
  
  // Performance Indicators
  sellThroughRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  inventoryTurnover: {
    type: Number,
    default: 0,
    min: 0
  },
  
  daysOfInventory: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Trend Analysis
  trendDirection: {
    type: String,
    enum: ['improving', 'stable', 'declining'],
    default: 'stable'
  },
  
  trendStrength: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  // Risk Assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  riskFactors: [{
    factor: String,
    impact: Number,
    description: String
  }],
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  updateFrequency: {
    type: String,
    enum: ['real-time', 'daily', 'weekly'],
    default: 'daily'
  },
  
  dataQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  
  // Flags and Alerts
  alerts: [{
    type: String,
    message: String,
    severity: String,
    createdAt: Date,
    resolved: Boolean,
    resolvedAt: Date
  }],
  
  // Historical Data
  historicalData: [{
    date: Date,
    quantityBought: Number,
    quantitySold: Number,
    lossPercentage: Number,
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for optimal query performance
analyticsSchema.index({ companyId: 1, productId: 1, period: 1, startDate: 1, endDate: 1 });
analyticsSchema.index({ companyId: 1, period: 1, startDate: 1 });
analyticsSchema.index({ productId: 1, period: 1, startDate: 1 });
analyticsSchema.index({ riskLevel: 1, companyId: 1 });
analyticsSchema.index({ trendDirection: 1, companyId: 1 });

// Virtual fields for calculated metrics
analyticsSchema.virtual('inventoryEfficiency').get(function() {
  if (this.totalQuantityBought === 0) return 0;
  return ((this.totalQuantitySold / this.totalQuantityBought) * 100).toFixed(2);
});

analyticsSchema.virtual('profitMargin').get(function() {
  if (this.totalCost === 0) return 0;
  return (((this.totalRevenue - this.totalCost) / this.totalCost) * 100).toFixed(2);
});

// Methods for data analysis
analyticsSchema.methods.calculateTrends = function() {
  if (this.historicalData.length < 2) return 'stable';
  
  const recent = this.historicalData.slice(-3);
  const older = this.historicalData.slice(-6, -3);
  
  if (recent.length === 0 || older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, item) => sum + item.lossPercentage, 0) / recent.length;
  const olderAvg = older.reduce((sum, item) => sum + item.lossPercentage, 0) / older.length;
  
  const change = recentAvg - olderAvg;
  
  if (change < -5) return 'improving';
  if (change > 5) return 'declining';
  return 'stable';
};

analyticsSchema.methods.assessRisk = function() {
  let riskScore = 0;
  let factors = [];
  
  // High loss percentage
  if (this.totalLossPercentage > 80) {
    riskScore += 3;
    factors.push({ factor: 'High Loss Rate', impact: 3, description: 'Loss rate exceeds 80%' });
  } else if (this.totalLossPercentage > 60) {
    riskScore += 2;
    factors.push({ factor: 'Moderate Loss Rate', impact: 2, description: 'Loss rate exceeds 60%' });
  }
  
  // Low sell-through rate
  if (this.sellThroughRate < 20) {
    riskScore += 3;
    factors.push({ factor: 'Low Sell-through', impact: 3, description: 'Sell-through rate below 20%' });
  } else if (this.sellThroughRate < 40) {
    riskScore += 2;
    factors.push({ factor: 'Moderate Sell-through', impact: 2, description: 'Sell-through rate below 40%' });
  }
  
  // High inventory days
  if (this.daysOfInventory > 180) {
    riskScore += 3;
    factors.push({ factor: 'High Inventory Days', impact: 3, description: 'Inventory older than 6 months' });
  } else if (this.daysOfInventory > 90) {
    riskScore += 2;
    factors.push({ factor: 'Moderate Inventory Days', impact: 2, description: 'Inventory older than 3 months' });
  }
  
  // Declining trend
  if (this.trendDirection === 'declining') {
    riskScore += 2;
    factors.push({ factor: 'Declining Trend', impact: 2, description: 'Performance trending downward' });
  }
  
  // Determine risk level
  let riskLevel = 'low';
  if (riskScore >= 8) riskLevel = 'critical';
  else if (riskScore >= 6) riskLevel = 'high';
  else if (riskScore >= 4) riskLevel = 'medium';
  
  this.riskLevel = riskLevel;
  this.riskFactors = factors;
  
  return { riskLevel, riskScore, factors };
};

// Static methods for aggregation
analyticsSchema.statics.aggregateByCompany = async function(companyId, period = 'monthly', startDate, endDate) {
  const matchStage = { companyId: new mongoose.Types.ObjectId(companyId) };
  
  if (startDate && endDate) {
    matchStage.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $group: {
      _id: {
        companyId: '$companyId',
        period: '$period',
        startDate: '$startDate'
      },
      totalQuantityBought: { $sum: '$totalQuantityBought' },
      totalQuantitySold: { $sum: '$totalQuantitySold' },
      totalQuantityRemaining: { $sum: '$totalQuantityRemaining' },
      avgLossPercentage: { $avg: '$totalLossPercentage' },
      totalCost: { $sum: '$totalCost' },
      totalRevenue: { $sum: '$totalRevenue' },
      netLoss: { $sum: '$netLoss' },
      avgSellThroughRate: { $avg: '$sellThroughRate' },
      riskLevels: { $addToSet: '$riskLevel' },
      trendDirections: { $addToSet: '$trendDirection' }
    }},
    { $sort: { '_id.startDate': -1 } }
  ]);
};

analyticsSchema.statics.aggregateByProduct = async function(productId, period = 'monthly', startDate, endDate) {
  const matchStage = { productId: new mongoose.Types.ObjectId(productId) };
  
  if (startDate && endDate) {
    matchStage.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $group: {
      _id: {
        productId: '$productId',
        period: '$period',
        startDate: '$startDate'
      },
      totalQuantityBought: { $sum: '$totalQuantityBought' },
      totalQuantitySold: { $sum: '$totalQuantitySold' },
      totalQuantityRemaining: { $sum: '$totalQuantityRemaining' },
      avgLossPercentage: { $avg: '$totalLossPercentage' },
      totalCost: { $sum: '$totalCost' },
      totalRevenue: { $sum: '$totalRevenue' },
      netLoss: { $sum: '$netLoss' },
      avgSellThroughRate: { $avg: '$sellThroughRate' },
      riskLevels: { $addToSet: '$riskLevel' },
      trendDirections: { $addToSet: '$trendDirection' }
    }},
    { $sort: { '_id.startDate': -1 } }
  ]);
};

// Pre-save middleware to update calculated fields
analyticsSchema.pre('save', function(next) {
  // Calculate sell-through rate
  if (this.totalQuantityBought > 0) {
    this.sellThroughRate = (this.totalQuantitySold / this.totalQuantityBought) * 100;
  }
  
  // Calculate inventory turnover (simplified)
  if (this.totalQuantityRemaining > 0) {
    this.inventoryTurnover = this.totalQuantitySold / this.totalQuantityRemaining;
  }
  
  // Calculate days of inventory (assuming 30 days per month)
  if (this.inventoryTurnover > 0) {
    this.daysOfInventory = 365 / this.inventoryTurnover;
  }
  
  // Update trends and risk assessment
  this.trendDirection = this.calculateTrends();
  this.assessRisk();
  
  next();
});

module.exports = mongoose.model('Analytics', analyticsSchema);
