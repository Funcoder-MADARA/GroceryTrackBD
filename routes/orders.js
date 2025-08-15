const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { validateOrderCreation, validateOrderStatusUpdate, validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeShopkeeper, authorizeCompanyRep, authorizeAdmin } = require('../middleware/auth');
const {
  getOrders,
  getOrderByIdOrNumber,
  createOrder,
  updateOrderStatus,
  assignDeliveryWorker
} = require('../controllers/orderController');

const router = express.Router();

// Fetch all orders for the logged-in user (current orders)
router.get('/', authenticateToken, getOrders);

// Fetch order history with enhanced pagination and filters
router.get('/history', authenticateToken, getOrders);

// Create new order (shopkeepers only)
router.post('/', authenticateToken, createOrder);

// Fetch order by ID or orderNumber
router.get('/:orderId', authenticateToken, getOrderByIdOrNumber);

// Update order status
router.put('/:orderId/status', authenticateToken, updateOrderStatus);

// Assign delivery worker to order
router.put('/:orderId/assign', authenticateToken, assignDeliveryWorker);

module.exports = router;
