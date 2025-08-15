const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const AnalyticsService = require('../services/analyticsService');
const { authenticateToken, authorizeShopkeeper } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Get company performance summary
router.get('/company/:companyId/summary', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period = 'monthly', months = 12 } = req.query;
    
    const summary = await AnalyticsService.getCompanyPerformanceSummary(
      companyId, 
      period, 
      parseInt(months)
    );
    
    if (!summary) {
      return res.status(404).json({ 
        error: 'No analytics data found',
        message: 'No performance data available for this company'
      });
    }
    
    res.json(summary);
    
  } catch (error) {
    console.error('Get company performance summary error:', error);
    res.status(500).json({
      error: 'Failed to get performance summary',
      message: 'An error occurred while fetching company performance data'
    });
  }
});

// Get product performance trends
router.get('/product/:productId/trends', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { months = 6 } = req.query;
    
    const trends = await AnalyticsService.getProductPerformanceTrends(
      productId, 
      parseInt(months)
    );
    
    res.json(trends);
    
  } catch (error) {
    console.error('Get product performance trends error:', error);
    res.status(500).json({
      error: 'Failed to get product trends',
      message: 'An error occurred while fetching product performance trends'
    });
  }
});

// Get company risk assessment
router.get('/company/:companyId/risk', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const riskData = await AnalyticsService.getCompanyRiskAssessment(companyId);
    
    res.json(riskData);
    
  } catch (error) {
    console.error('Get company risk assessment error:', error);
    res.status(500).json({
      error: 'Failed to get risk assessment',
      message: 'An error occurred while fetching company risk data'
    });
  }
});

// Get weekly analytics
router.get('/company/:companyId/weekly', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing date parameters',
        message: 'startDate and endDate are required'
      });
    }
    
    const weeklyData = await AnalyticsService.generateWeeklyAnalytics(
      companyId, 
      startDate, 
      endDate
    );
    
    res.json(weeklyData);
    
  } catch (error) {
    console.error('Get weekly analytics error:', error);
    res.status(500).json({
      error: 'Failed to get weekly analytics',
      message: 'An error occurred while generating weekly analytics'
    });
  }
});

// Get quarterly analytics
router.get('/company/:companyId/quarterly', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    const quarterlyData = await AnalyticsService.generateQuarterlyAnalytics(
      companyId, 
      parseInt(year)
    );
    
    res.json(quarterlyData);
    
  } catch (error) {
    console.error('Get quarterly analytics error:', error);
    res.status(500).json({
      error: 'Failed to get quarterly analytics',
      message: 'An error occurred while generating quarterly analytics'
    });
  }
});

// Get shopkeeper analytics (aggregated from all companies they flag)
router.get('/shopkeeper/:shopkeeperId', authenticateToken, authorizeShopkeeper, async (req, res) => {
  try {
    const { shopkeeperId } = req.params;
    const { period = 'monthly', months = 6 } = req.query;
    
    // Get all flags for this shopkeeper
    const Flag = require('../models/Flag');
    const flags = await Flag.find({ shopkeeperId })
      .populate('companyId', 'companyInfo.companyName')
      .populate('productId', 'name')
      .sort({ date: -1 });
    
    if (flags.length === 0) {
      return res.json({
        totalFlags: 0,
        companies: [],
        products: [],
        summary: {
          totalQuantityBought: 0,
          totalQuantitySold: 0,
          totalQuantityRemaining: 0,
          avgLossPercentage: 0
        }
      });
    }
    
    // Group by company
    const companyGroups = {};
    flags.forEach(flag => {
      const companyId = flag.companyId._id.toString();
      if (!companyGroups[companyId]) {
        companyGroups[companyId] = {
          company: flag.companyId.companyInfo?.companyName || 'Unknown Company',
          flags: [],
          totalQuantityBought: 0,
          totalQuantitySold: 0,
          totalQuantityRemaining: 0
        };
      }
      
      companyGroups[companyId].flags.push(flag);
      companyGroups[companyId].totalQuantityBought += flag.quantityBought;
      companyGroups[companyId].totalQuantitySold += flag.quantitySold;
      companyGroups[companyId].totalQuantityRemaining += (flag.quantityBought - flag.quantitySold);
    });
    
    // Calculate overall summary
    const summary = {
      totalFlags: flags.length,
      totalQuantityBought: flags.reduce((sum, flag) => sum + flag.quantityBought, 0),
      totalQuantitySold: flags.reduce((sum, flag) => sum + flag.quantitySold, 0),
      totalQuantityRemaining: flags.reduce((sum, flag) => sum + (flag.quantityBought - flag.quantitySold), 0)
    };
    
    summary.avgLossPercentage = summary.totalQuantityBought > 0 ? 
      ((summary.totalQuantityBought - summary.totalQuantitySold) / summary.totalQuantityBought) * 100 : 0;
    
    // Get unique products
    const products = [...new Set(flags.map(flag => flag.productId.name))];
    
    res.json({
      totalFlags: summary.totalFlags,
      companies: Object.values(companyGroups),
      products,
      summary
    });
    
  } catch (error) {
    console.error('Get shopkeeper analytics error:', error);
    res.status(500).json({
      error: 'Failed to get shopkeeper analytics',
      message: 'An error occurred while fetching shopkeeper analytics'
    });
  }
});

// Get analytics by date range
router.get('/company/:companyId/range', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, period = 'daily' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing date parameters',
        message: 'startDate and endDate are required'
      });
    }
    
    const analytics = await Analytics.find({
      companyId,
      period,
      startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
    .populate('productId', 'name description')
    .sort({ startDate: 1 });
    
    res.json(analytics);
    
  } catch (error) {
    console.error('Get analytics by date range error:', error);
    res.status(500).json({
      error: 'Failed to get analytics by date range',
      message: 'An error occurred while fetching analytics data'
    });
  }
});

// Get top performing and underperforming products
router.get('/company/:companyId/performance', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { limit = 10, period = 'monthly' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Last 6 months
    
    const performance = await Analytics.aggregate([
      {
        $match: {
          companyId: new require('mongoose').Types.ObjectId(companyId),
          period,
          startDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$productId',
          totalQuantityBought: { $sum: '$totalQuantityBought' },
          totalQuantitySold: { $sum: '$totalQuantitySold' },
          totalQuantityRemaining: { $sum: '$totalQuantityRemaining' },
          avgLossPercentage: { $avg: '$totalLossPercentage' },
          avgSellThroughRate: { $avg: '$sellThroughRate' },
          riskLevel: { $first: '$riskLevel' },
          trendDirection: { $first: '$trendDirection' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productName: '$product.name',
          productDescription: '$product.description',
          totalQuantityBought: 1,
          totalQuantitySold: 1,
          totalQuantityRemaining: 1,
          avgLossPercentage: 1,
          avgSellThroughRate: 1,
          riskLevel: 1,
          trendDirection: 1
        }
      },
      {
        $sort: { avgLossPercentage: -1 } // Sort by highest loss first
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    res.json(performance);
    
  } catch (error) {
    console.error('Get company performance error:', error);
    res.status(500).json({
      error: 'Failed to get company performance',
      message: 'An error occurred while fetching company performance data'
    });
  }
});

// Get analytics dashboard data
router.get('/dashboard/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Get multiple analytics in parallel
    const [summary, riskData, performance] = await Promise.all([
      AnalyticsService.getCompanyPerformanceSummary(companyId, 'monthly', 12),
      AnalyticsService.getCompanyRiskAssessment(companyId),
      Analytics.aggregate([
        {
          $match: {
            companyId: new require('mongoose').Types.ObjectId(companyId),
            period: 'monthly'
          }
        },
        {
          $group: {
            _id: null,
            totalProducts: { $addToSet: '$productId' },
            avgLossPercentage: { $avg: '$totalLossPercentage' },
            avgSellThroughRate: { $avg: '$sellThroughRate' }
          }
        }
      ])
    ]);
    
    const dashboardData = {
      summary: summary || {
        totalProducts: 0,
        totalQuantityBought: 0,
        totalQuantitySold: 0,
        totalQuantityRemaining: 0,
        avgLossPercentage: 0,
        avgSellThroughRate: 0,
        highRiskProducts: 0,
        improvingProducts: 0,
        decliningProducts: 0
      },
      riskAssessment: riskData || [],
      performance: performance[0] || {
        totalProducts: 0,
        avgLossPercentage: 0,
        avgSellThroughRate: 0
      }
    };
    
    res.json(dashboardData);
    
  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    res.status(500).json({
      error: 'Failed to get analytics dashboard',
      message: 'An error occurred while fetching dashboard data'
    });
  }
});

module.exports = router;