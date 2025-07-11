const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { validateOrderCreation, validateOrderStatusUpdate, validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeShopkeeper, authorizeCompanyRep, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Create new order (shopkeeper)
router.post('/', authenticateToken, authorizeShopkeeper, validateOrderCreation, async (req, res) => {
  try {
    const {
      companyId,
      items,
      deliveryArea,
      deliveryAddress,
      deliveryCity,
      paymentMethod,
      preferredDeliveryDate,
      deliveryInstructions,
      notes
    } = req.body;

    // Verify company exists and is active
    const company = await User.findById(companyId);
    if (!company || company.role !== 'company_rep' || company.status !== 'active') {
      return res.status(400).json({
        error: 'Invalid company',
        message: 'Selected company is not available'
      });
    }

    // Validate and process items
    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(400).json({
          error: 'Product not found',
          message: `Product with ID ${item.productId} not found`
        });
      }

      if (!product.isActive || !product.isAvailable) {
        return res.status(400).json({
          error: 'Product not available',
          message: `Product ${product.name} is not available`
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Insufficient stock for product ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      processedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
        unit: product.unit
      });
    }

    // Calculate final amount (add tax and delivery charge)
    const taxAmount = totalAmount * 0.05; // 5% tax
    const deliveryCharge = 50; // Fixed delivery charge
    const finalAmount = totalAmount + taxAmount + deliveryCharge;

    // Create order
    const order = new Order({
      shopkeeperId: req.user._id,
      companyId,
      items: processedItems,
      totalAmount,
      taxAmount,
      deliveryCharge,
      finalAmount,
      deliveryArea,
      deliveryAddress,
      deliveryCity,
      paymentMethod,
      preferredDeliveryDate,
      deliveryInstructions,
      notes
    });

    await order.save();

    // Update product stock
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity, totalOrders: 1 }
      });
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: order.getOrderSummary()
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Order creation failed',
      message: 'An error occurred while placing order'
    });
  }
});

// Get orders for shopkeeper
router.get('/shopkeeper', authenticateToken, authorizeShopkeeper, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { shopkeeperId: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('companyId', 'name companyInfo.companyName')
      .populate('deliveryWorkerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get shopkeeper orders error:', error);
    res.status(500).json({
      error: 'Failed to get orders',
      message: 'An error occurred while fetching orders'
    });
  }
});

// Get orders for company
router.get('/company', authenticateToken, authorizeCompanyRep, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, area } = req.query;
    
    const query = { companyId: req.user._id };
    if (status) query.status = status;
    if (area) query.deliveryArea = { $regex: area, $options: 'i' };

    const orders = await Order.find(query)
      .populate('shopkeeperId', 'name phone area')
      .populate('deliveryWorkerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get company orders error:', error);
    res.status(500).json({
      error: 'Failed to get orders',
      message: 'An error occurred while fetching orders'
    });
  }
});

// Get order by ID
router.get('/:orderId', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('shopkeeperId', 'name phone area address')
      .populate('companyId', 'name companyInfo.companyName')
      .populate('deliveryWorkerId', 'name phone')
      .populate('approvedBy', 'name');

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    const canAccess = 
      req.user.role === 'admin' ||
      order.shopkeeperId._id.toString() === req.user._id.toString() ||
      order.companyId._id.toString() === req.user._id.toString() ||
      (order.deliveryWorkerId && order.deliveryWorkerId._id.toString() === req.user._id.toString());

    if (!canAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this order'
      });
    }

    res.json({
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: 'Failed to get order',
      message: 'An error occurred while fetching order'
    });
  }
});

// Update order status (company)
router.put('/:orderId/status', authenticateToken, authorizeCompanyRep, validateOrderStatusUpdate, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Order not found'
      });
    }

    // Check if company owns this order
    if (order.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update orders from your company'
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['processing', 'shipped'],
      processing: ['shipped'],
      shipped: ['delivered']
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    await order.updateStatus(status, req.user._id, rejectionReason);

    // If order is rejected, restore product stock
    if (status === 'rejected') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: item.quantity }
        });
      }
    }

    res.json({
      message: 'Order status updated successfully',
      order: order.getOrderSummary()
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Status update failed',
      message: 'An error occurred while updating order status'
    });
  }
});

// Cancel order (shopkeeper)
router.put('/:orderId/cancel', authenticateToken, authorizeShopkeeper, async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Order not found'
      });
    }

    // Check if shopkeeper owns this order
    if (order.shopkeeperId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only cancel your own orders'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'approved'].includes(order.status)) {
      return res.status(400).json({
        error: 'Cannot cancel order',
        message: 'Order cannot be cancelled in current status'
      });
    }

    await order.updateStatus('cancelled', req.user._id, cancellationReason);

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: item.quantity }
      });
    }

    res.json({
      message: 'Order cancelled successfully',
      order: order.getOrderSummary()
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      error: 'Order cancellation failed',
      message: 'An error occurred while cancelling order'
    });
  }
});

// Get orders by area (for analytics)
router.get('/area/:area', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { area } = req.params;
    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;
    
    const query = { deliveryArea: { $regex: area, $options: 'i' } };
    
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const orders = await Order.find(query)
      .populate('shopkeeperId', 'name area')
      .populate('companyId', 'name companyInfo.companyName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get orders by area error:', error);
    res.status(500).json({
      error: 'Failed to get orders',
      message: 'An error occurred while fetching orders'
    });
  }
});

// Get all orders (admin)
router.get('/', authenticateToken, authorizeAdmin, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role, area } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (area) query.deliveryArea = { $regex: area, $options: 'i' };

    let orders = await Order.find(query)
      .populate('shopkeeperId', 'name role area')
      .populate('companyId', 'name role companyInfo.companyName')
      .populate('deliveryWorkerId', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by role if specified
    if (role) {
      orders = orders.filter(order => {
        if (role === 'shopkeeper') return order.shopkeeperId.role === 'shopkeeper';
        if (role === 'company_rep') return order.companyId.role === 'company_rep';
        if (role === 'delivery_worker') return order.deliveryWorkerId && order.deliveryWorkerId.role === 'delivery_worker';
        return true;
      });
    }

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      error: 'Failed to get orders',
      message: 'An error occurred while fetching orders'
    });
  }
});

module.exports = router;
