const express = require('express');
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const Product = require('../models/Products');
const User = require('../models/User');
const { validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeShopkeeper, authorizeCompanyRep, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get shopkeeper analytics
router.get('/shopkeeper', authenticateToken, authorizeShopkeeper, async (req, res) => {
  try {
    const { area, dateFrom, dateTo } = req.query;
    const shopkeeperArea = area || req.user.area;

    // Get shopkeeper's order statistics
    const orderQuery = { shopkeeperId: req.user._id };
    if (dateFrom || dateTo) {
      orderQuery.createdAt = {};
      if (dateFrom) orderQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) orderQuery.createdAt.$lte = new Date(dateTo);
    }

    const shopkeeperOrders = await Order.find(orderQuery);
    const totalOrders = shopkeeperOrders.length;
    const totalSpent = shopkeeperOrders.reduce((sum, order) => sum + order.finalAmount, 0);
    const completedOrders = shopkeeperOrders.filter(order => order.status === 'delivered').length;

    // Get area trends (top products in shopkeeper's area)
    const areaOrders = await Order.find({
      deliveryArea: { $regex: shopkeeperArea, $options: 'i' },
      status: 'delivered'
    }).populate('items.productId');

    const productTrends = {};
    areaOrders.forEach(order => {
      order.items.forEach(item => {
        const productName = item.productName;
        if (!productTrends[productName]) {
          productTrends[productName] = {
            name: productName,
            totalOrders: 0,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productTrends[productName].totalOrders++;
        productTrends[productName].totalQuantity += item.quantity;
        productTrends[productName].totalRevenue += item.totalPrice;
      });
    });

    const trendingProducts = Object.values(productTrends)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10);

    // Get monthly spending trend
    const monthlySpending = {};
    shopkeeperOrders.forEach(order => {
      const month = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlySpending[month] = (monthlySpending[month] || 0) + order.finalAmount;
    });

    res.json({
      shopkeeperStats: {
        totalOrders,
        totalSpent,
        completedOrders,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      },
      trendingProducts,
      monthlySpending,
      area: shopkeeperArea
    });

  } catch (error) {
    console.error('Shopkeeper analytics error:', error);
    res.status(500).json({
      error: 'Analytics failed',
      message: 'An error occurred while generating analytics'
    });
  }
});

// Get company analytics
router.get('/company', authenticateToken, authorizeCompanyRep, async (req, res) => {
  try {
    const { area, dateFrom, dateTo } = req.query;

    // Get company's order statistics
    const orderQuery = { companyId: req.user._id };
    if (dateFrom || dateTo) {
      orderQuery.createdAt = {};
      if (dateFrom) orderQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) orderQuery.createdAt.$lte = new Date(dateTo);
    }

    const companyOrders = await Order.find(orderQuery);
    const totalOrders = companyOrders.length;
    const totalRevenue = companyOrders.reduce((sum, order) => sum + order.finalAmount, 0);
    const completedOrders = companyOrders.filter(order => order.status === 'delivered').length;

    // Get area-wise demand
    const areaDemand = {};
    companyOrders.forEach(order => {
      const orderArea = order.deliveryArea;
      if (!areaDemand[orderArea]) {
        areaDemand[orderArea] = {
          area: orderArea,
          totalOrders: 0,
          totalRevenue: 0,
          completedOrders: 0
        };
      }
      areaDemand[orderArea].totalOrders++;
      areaDemand[orderArea].totalRevenue += order.finalAmount;
      if (order.status === 'delivered') {
        areaDemand[orderArea].completedOrders++;
      }
    });

    // Get product performance
    const productPerformance = {};
    companyOrders.forEach(order => {
      order.items.forEach(item => {
        const productName = item.productName;
        if (!productPerformance[productName]) {
          productPerformance[productName] = {
            name: productName,
            totalOrders: 0,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productPerformance[productName].totalOrders++;
        productPerformance[productName].totalQuantity += item.quantity;
        productPerformance[productName].totalRevenue += item.totalPrice;
      });
    });

    // Get delivery performance
    const deliveryQuery = { companyId: req.user._id };
    if (dateFrom || dateTo) {
      deliveryQuery.assignedAt = {};
      if (dateFrom) deliveryQuery.assignedAt.$gte = new Date(dateFrom);
      if (dateTo) deliveryQuery.assignedAt.$lte = new Date(dateTo);
    }

    const companyDeliveries = await Delivery.find(deliveryQuery);
    const totalDeliveries = companyDeliveries.length;
    const completedDeliveries = companyDeliveries.filter(delivery => delivery.status === 'delivered').length;
    const failedDeliveries = companyDeliveries.filter(delivery => delivery.status === 'failed').length;

    res.json({
      companyStats: {
        totalOrders,
        totalRevenue,
        completedOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalDeliveries,
        completedDeliveries,
        failedDeliveries,
        deliverySuccessRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0
      },
      areaDemand: Object.values(areaDemand),
      productPerformance: Object.values(productPerformance).sort((a, b) => b.totalRevenue - a.totalRevenue),
      topPerformingAreas: Object.values(areaDemand).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5)
    });

  } catch (error) {
    console.error('Company analytics error:', error);
    res.status(500).json({
      error: 'Analytics failed',
      message: 'An error occurred while generating analytics'
    });
  }
});

// Get area-based analytics
router.get('/area/:area', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { area } = req.params;
    const { dateFrom, dateTo } = req.query;

    const query = { deliveryArea: { $regex: area, $options: 'i' } };
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Get orders in area
    const areaOrders = await Order.find(query);
    const totalOrders = areaOrders.length;
    const totalRevenue = areaOrders.reduce((sum, order) => sum + order.finalAmount, 0);
    const completedOrders = areaOrders.filter(order => order.status === 'delivered').length;

    // Get product trends in area
    const productTrends = {};
    areaOrders.forEach(order => {
      order.items.forEach(item => {
        const productName = item.productName;
        if (!productTrends[productName]) {
          productTrends[productName] = {
            name: productName,
            totalOrders: 0,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productTrends[productName].totalOrders++;
        productTrends[productName].totalQuantity += item.quantity;
        productTrends[productName].totalRevenue += item.totalPrice;
      });
    });

    // Get delivery performance in area
    const deliveryQuery = { deliveryArea: { $regex: area, $options: 'i' } };
    if (dateFrom || dateTo) {
      deliveryQuery.assignedAt = {};
      if (dateFrom) deliveryQuery.assignedAt.$gte = new Date(dateFrom);
      if (dateTo) deliveryQuery.assignedAt.$lte = new Date(dateTo);
    }

    const areaDeliveries = await Delivery.find(deliveryQuery);
    const totalDeliveries = areaDeliveries.length;
    const completedDeliveries = areaDeliveries.filter(delivery => delivery.status === 'delivered').length;

    // Get company performance in area
    const companyPerformance = {};
    areaOrders.forEach(order => {
      const companyId = order.companyId.toString();
      if (!companyPerformance[companyId]) {
        companyPerformance[companyId] = {
          companyId,
          totalOrders: 0,
          totalRevenue: 0
        };
      }
      companyPerformance[companyId].totalOrders++;
      companyPerformance[companyId].totalRevenue += order.finalAmount;
    });

    res.json({
      areaStats: {
        area,
        totalOrders,
        totalRevenue,
        completedOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        totalDeliveries,
        completedDeliveries,
        deliverySuccessRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0
      },
      trendingProducts: Object.values(productTrends).sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 10),
      companyPerformance: Object.values(companyPerformance).sort((a, b) => b.totalRevenue - a.totalRevenue)
    });

  } catch (error) {
    console.error('Area analytics error:', error);
    res.status(500).json({
      error: 'Analytics failed',
      message: 'An error occurred while generating analytics'
    });
  }
});

// Get delivery worker analytics
router.get('/delivery-worker/:workerId', authenticateToken, async (req, res) => {
  try {
    const { workerId } = req.params;
    const { dateFrom, dateTo } = req.query;

    // Check if user has access to this data
    if (req.user.role !== 'admin' && req.user._id.toString() !== workerId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this data'
      });
    }

    const deliveryQuery = { deliveryWorkerId: workerId };
    if (dateFrom || dateTo) {
      deliveryQuery.assignedAt = {};
      if (dateFrom) deliveryQuery.assignedAt.$gte = new Date(dateFrom);
      if (dateTo) deliveryQuery.assignedAt.$lte = new Date(dateTo);
    }

    const workerDeliveries = await Delivery.find(deliveryQuery);
    const totalDeliveries = workerDeliveries.length;
    const completedDeliveries = workerDeliveries.filter(delivery => delivery.status === 'delivered').length;
    const failedDeliveries = workerDeliveries.filter(delivery => delivery.status === 'failed').length;

    // Get area performance
    const areaPerformance = {};
    workerDeliveries.forEach(delivery => {
      const area = delivery.deliveryArea;
      if (!areaPerformance[area]) {
        areaPerformance[area] = {
          area,
          totalDeliveries: 0,
          completedDeliveries: 0,
          failedDeliveries: 0
        };
      }
      areaPerformance[area].totalDeliveries++;
      if (delivery.status === 'delivered') {
        areaPerformance[area].completedDeliveries++;
      } else if (delivery.status === 'failed') {
        areaPerformance[area].failedDeliveries++;
      }
    });

    // Calculate average delivery time
    const completedDeliveriesWithTime = workerDeliveries.filter(delivery => 
      delivery.status === 'delivered' && delivery.deliveredAt && delivery.assignedAt
    );

    const averageDeliveryTime = completedDeliveriesWithTime.length > 0 
      ? completedDeliveriesWithTime.reduce((sum, delivery) => {
          return sum + (delivery.deliveredAt - delivery.assignedAt);
        }, 0) / completedDeliveriesWithTime.length
      : 0;

    res.json({
      workerStats: {
        totalDeliveries,
        completedDeliveries,
        failedDeliveries,
        successRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
        averageDeliveryTime: averageDeliveryTime / (1000 * 60 * 60) // Convert to hours
      },
      areaPerformance: Object.values(areaPerformance),
      recentDeliveries: workerDeliveries.slice(0, 10)
    });

  } catch (error) {
    console.error('Delivery worker analytics error:', error);
    res.status(500).json({
      error: 'Analytics failed',
      message: 'An error occurred while generating analytics'
    });
  }
});

// Get system-wide analytics (admin only)
router.get('/system', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const query = {};
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Get overall statistics
    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    const totalDeliveries = await Delivery.countDocuments(query);
    const completedDeliveries = await Delivery.countDocuments({
      ...query,
      status: 'delivered'
    });

    // Get user statistics
    const totalShopkeepers = await User.countDocuments({ role: 'shopkeeper', status: 'active' });
    const totalCompanies = await User.countDocuments({ role: 'company_rep', status: 'active' });
    const totalDeliveryWorkers = await User.countDocuments({ role: 'delivery_worker', status: 'active' });

    // Get top performing areas
    const areaStats = await Order.aggregate([
      { $match: query },
      { $group: {
        _id: '$deliveryArea',
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$finalAmount' }
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Get top products
    const productStats = await Order.aggregate([
      { $match: query },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productName',
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' }
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      systemStats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalDeliveries,
        completedDeliveries,
        deliverySuccessRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
        totalShopkeepers,
        totalCompanies,
        totalDeliveryWorkers
      },
      topAreas: areaStats,
      topProducts: productStats
    });

  } catch (error) {
    console.error('System analytics error:', error);
    res.status(500).json({
      error: 'Analytics failed',
      message: 'An error occurred while generating analytics'
    });
  }
});

module.exports = router;