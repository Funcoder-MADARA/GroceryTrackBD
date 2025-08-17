const Analytics = require('../models/Analytics');
const Flag = require('../models/Flag');
const Product = require('../models/Product');
const mongoose = require('mongoose');


class AnalyticsService {
  /**
   * Update analytics when a new flag is created
   */
  static async updateAnalyticsFromFlag(flagData) {
    try {
      const { companyId, productId, quantityBought, quantitySold, date } = flagData;
      
      // Calculate loss percentages
      const baseLossPercent = quantityBought > 0 ? ((quantityBought - quantitySold) / quantityBought) * 100 : 0;
      
      // Calculate time-based loss
      const orderDate = new Date(date);
      const currentDate = new Date();
      const monthsDifference = (currentDate.getFullYear() - orderDate.getFullYear()) * 12 + 
                             (currentDate.getMonth() - orderDate.getMonth());
      
      let timeBasedLoss = 0;
      if (monthsDifference > 6) {
        timeBasedLoss = (monthsDifference - 6) * 2;
      }
      
      const totalLossPercent = Math.min(100, baseLossPercent + timeBasedLoss);
      
      // Get or create monthly analytics record
      const startOfMonth = new Date(orderDate.getFullYear(), orderDate.getMonth(), 1);
      const endOfMonth = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0);
      
      let analytics = await Analytics.findOne({
        companyId,
        productId,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth
      });
      
      if (!analytics) {
        // Create new analytics record
        analytics = new Analytics({
          companyId,
          productId,
          period: 'monthly',
          startDate: startOfMonth,
          endDate: endOfMonth,
          historicalData: []
        });
      }
      
      // Update quantities
      analytics.totalQuantityBought += quantityBought;
      analytics.totalQuantitySold += quantitySold;
      analytics.totalQuantityRemaining = analytics.totalQuantityBought - analytics.totalQuantitySold;
      
      // Update loss percentages
      analytics.baseLossPercentage = analytics.totalQuantityBought > 0 ? 
        ((analytics.totalQuantityBought - analytics.totalQuantitySold) / analytics.totalQuantityBought) * 100 : 0;
      
      analytics.timeBasedLossPercentage = timeBasedLoss;
      analytics.totalLossPercentage = totalLossPercent;
      
      // Add to historical data
      analytics.historicalData.push({
        date: new Date(),
        quantityBought,
        quantitySold,
        lossPercentage: totalLossPercent,
        notes: 'Flag data update'
      });
      
      // Keep only last 12 months of historical data
      if (analytics.historicalData.length > 12) {
        analytics.historicalData = analytics.historicalData.slice(-12);
      }
      
      // Update metadata
      analytics.lastUpdated = new Date();
      
      await analytics.save();
      
      // Also update daily analytics for real-time tracking
      await this.updateDailyAnalytics(companyId, productId, date, {
        quantityBought,
        quantitySold,
        baseLossPercent,
        timeBasedLoss,
        totalLossPercent
      });
      
      return analytics;
      
    } catch (error) {
      console.error('Error updating analytics from flag:', error);
      throw error;
    }
  }
  
  /**
   * Update daily analytics for real-time tracking
   */
  static async updateDailyAnalytics(companyId, productId, date, metrics) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      let dailyAnalytics = await Analytics.findOne({
        companyId,
        productId,
        period: 'daily',
        startDate: startOfDay,
        endDate: endOfDay
      });
      
      if (!dailyAnalytics) {
        dailyAnalytics = new Analytics({
          companyId,
          productId,
          period: 'daily',
          startDate: startOfDay,
          endDate: endOfDay,
          historicalData: []
        });
      }
      
      // Update daily metrics
      dailyAnalytics.totalQuantityBought += metrics.quantityBought;
      dailyAnalytics.totalQuantitySold += metrics.quantitySold;
      dailyAnalytics.totalQuantityRemaining = dailyAnalytics.totalQuantityBought - dailyAnalytics.totalQuantitySold;
      dailyAnalytics.totalLossPercentage = metrics.totalLossPercent;
      
      // Add to historical data
      dailyAnalytics.historicalData.push({
        date: new Date(),
        quantityBought: metrics.quantityBought,
        quantitySold: metrics.quantitySold,
        lossPercentage: metrics.totalLossPercent,
        notes: 'Daily flag update'
      });
      
      dailyAnalytics.lastUpdated = new Date();
      dailyAnalytics.updateFrequency = 'real-time';
      
      await dailyAnalytics.save();
      
    } catch (error) {
      console.error('Error updating daily analytics:', error);
      throw error;
    }
  }
  
  /**
   * Generate weekly analytics from daily data
   */
  static async generateWeeklyAnalytics(companyId, startDate, endDate) {
    try {
      const weeklyData = await Analytics.aggregate([
        {
          $match: {
            companyId: new require('mongoose').Types.ObjectId(companyId),
            period: 'daily',
            startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$startDate' },
              week: { $week: '$startDate' }
            },
            totalQuantityBought: { $sum: '$totalQuantityBought' },
            totalQuantitySold: { $sum: '$totalQuantitySold' },
            totalQuantityRemaining: { $sum: '$totalQuantityRemaining' },
            avgLossPercentage: { $avg: '$totalLossPercentage' },
            riskLevels: { $addToSet: '$riskLevel' }
          }
        },
        { $sort: { '_id.year': -1, '_id.week': -1 } }
      ]);
      
      return weeklyData;
      
    } catch (error) {
      console.error('Error generating weekly analytics:', error);
      throw error;
    }
  }
  
  /**
   * Generate quarterly analytics
   */
  static async generateQuarterlyAnalytics(companyId, year) {
    try {
      const quarterlyData = await Analytics.aggregate([
        {
          $match: {
            companyId: new require('mongoose').Types.ObjectId(companyId),
            period: 'monthly',
            startDate: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$startDate' },
              quarter: {
                $ceil: { $divide: [{ $add: [{ $month: '$startDate' }, 1] }, 3] }
              }
            },
            totalQuantityBought: { $sum: '$totalQuantityBought' },
            totalQuantitySold: { $sum: '$totalQuantitySold' },
            totalQuantityRemaining: { $sum: '$totalQuantityRemaining' },
            avgLossPercentage: { $avg: '$totalLossPercentage' },
            avgSellThroughRate: { $avg: '$sellThroughRate' },
            riskLevels: { $addToSet: '$riskLevel' },
            trendDirections: { $addToSet: '$trendDirection' }
          }
        },
        { $sort: { '_id.year': -1, '_id.quarter': -1 } }
      ]);
      
      return quarterlyData;
      
    } catch (error) {
      console.error('Error generating quarterly analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get company performance summary
   */
  static async getCompanyPerformanceSummary(companyId, period = 'monthly', months = 12) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const summary = await Analytics.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            period,
            startDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalProducts: { $addToSet: '$productId' },
            totalQuantityBought: { $sum: '$totalQuantityBought' },
            totalQuantitySold: { $sum: '$totalQuantitySold' },
            totalQuantityRemaining: { $sum: '$totalQuantityRemaining' },
            avgLossPercentage: { $avg: '$totalLossPercentage' },
            avgSellThroughRate: { $avg: '$sellThroughRate' },
            highRiskProducts: {
              $sum: { $cond: [{ $in: ['$riskLevel', ['high', 'critical']] }, 1, 0] }
            },
            improvingProducts: {
              $sum: { $cond: [{ $eq: ['$trendDirection', 'improving'] }, 1, 0] }
            },
            decliningProducts: {
              $sum: { $cond: [{ $eq: ['$trendDirection', 'declining'] }, 1, 0] }
            }
          }
        }
      ]);
      
      if (summary.length > 0) {
        const result = summary[0];
        result.totalProducts = result.totalProducts.length;
        return result;
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting company performance summary:', error);
      throw error;
    }
  }
  
  /**
   * Get product performance trends
   */
  static async getProductPerformanceTrends(productId, months = 6) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const trends = await Analytics.aggregate([
        {
          $match: {
            productId: new require('mongoose').Types.ObjectId(productId),
            period: 'monthly',
            startDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $sort: { startDate: 1 }
        },
        {
          $project: {
            month: { $dateToString: { format: '%Y-%m', date: '$startDate' } },
            lossPercentage: '$totalLossPercentage',
            sellThroughRate: '$sellThroughRate',
            riskLevel: '$riskLevel',
            trendDirection: '$trendDirection'
          }
        }
      ]);
      
      return trends;
      
    } catch (error) {
      console.error('Error getting product performance trends:', error);
      throw error;
    }
  }
  
  /**
   * Get risk assessment for company
   */
  static async getCompanyRiskAssessment(companyId) {
    try {
      const riskData = await Analytics.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
            period: 'monthly'
          }
        },
        {
          $group: {
            _id: '$riskLevel',
            count: { $sum: 1 },
            products: { $addToSet: '$productId' },
            avgLossPercentage: { $avg: '$totalLossPercentage' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      return riskData;
      
    } catch (error) {
      console.error('Error getting company risk assessment:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService;
