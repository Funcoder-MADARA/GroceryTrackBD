const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Products');
const User = require('../models/User');
const { validateOrderCreation, validateOrderStatusUpdate, validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeShopkeeper, authorizeCompanyRep, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get order history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Get status filter
        const statusFilter = req.query.status ? req.query.status.split(',') : null;
        
        // Get date range
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        
        // Build query
        let query = {};
        
        // Add user role specific filters
        if (req.user.role === 'shopkeeper') {
            query.shopkeeperId = req.user.id;
        } else if (req.user.role === 'company_rep') {
            query.companyId = req.user.id;
        } else if (req.user.role === 'delivery_worker') {
            query.deliveryWorkerId = req.user.id;
        }
        
        // Add status filter if provided
        if (statusFilter) {
            query.status = { $in: statusFilter };
        }
        
        // Add date range if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = startDate;
            if (endDate) query.createdAt.$lte = endDate;
        }
        
        // Get orders with pagination
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('shopkeeperId', 'name shopkeeperInfo.shopName')
            .populate('companyId', 'name companyInfo.companyName')
            .populate('deliveryWorkerId', 'name');

        // Get total count for pagination
        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);
        
        // Calculate summary
        const summary = {
            totalOrders,
            statusCounts: {},
            totalAmount: 0
        };
        
        // Process orders and calculate summary
        const processedOrders = orders.map(order => {
            summary.totalAmount += order.finalAmount;
            summary.statusCounts[order.status] = (summary.statusCounts[order.status] || 0) + 1;
            
            return {
                id: order._id,
                orderNumber: order.orderNumber,
                companyName: order.companyId?.companyInfo?.companyName || 'N/A',
                shopName: order.shopkeeperId?.shopkeeperInfo?.shopName || 'N/A',
                totalAmount: order.finalAmount,
                status: order.status,
                createdAt: order.createdAt,
                deliveredAt: order.deliveredAt,
                items: order.items.map(item => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice
                }))
            };
        });

        res.json({
            orders: processedOrders,
            pagination: {
                currentPage: page,
                totalPages,
                totalOrders,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            summary
        });

    } catch (error) {
        console.error('Get order history error:', error);
        res.status(500).json({
            error: 'Failed to fetch order history',
            message: 'An error occurred while fetching order history'
        });
    }
});

// Create new order
router.post(
  '/',
  authenticateToken,
  authorizeShopkeeper,
  validateOrderCreation,
  async (req, res) => {
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

      // Validate company
      const company = await User.findById(companyId);
      if (!company || company.role !== 'company_rep' || company.status !== 'active') {
        return res.status(400).json({
          error: 'Invalid company',
          message: 'Selected company is not available'
        });
      }

      // Process items
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

      // Tax, delivery, final
      const taxAmount = totalAmount * 0.05;
      const deliveryCharge = 50;
      const finalAmount = totalAmount + taxAmount + deliveryCharge;

      // Generate order number
      const latestOrder = await Order.findOne().sort({ createdAt: -1 });
      let newOrderNumber;
      if (latestOrder && latestOrder.orderNumber) {
        const lastNum = parseInt(latestOrder.orderNumber.split('-')[1]);
        newOrderNumber = `ORD-${lastNum + 1}`;
      } else {
        newOrderNumber = 'ORD-1001';
      }

      // Create order
      const newOrder = new Order({
        orderNumber: newOrderNumber,
        companyId,
        shopkeeperId: req.user.id,
        items: processedItems,
        deliveryArea,
        deliveryAddress,
        deliveryCity,
        paymentMethod,
        preferredDeliveryDate,
        deliveryInstructions,
        notes,
        taxAmount,
        deliveryCharge,
        totalAmount: finalAmount,
        finalAmount: finalAmount,
        status: 'pending',
        createdBy: req.user.id
      });

      await newOrder.save();

      // Update product stock AFTER saving order
      for (const item of processedItems) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: -item.quantity, totalOrders: 1 }
        });
      }

      // Send success response
      return res.status(201).json({
        message: 'Order placed successfully',
        order: newOrder
      });

    } catch (error) {
      console.error('Create order error:', error);

      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Server error',
          details: error.message
        });
      }
    }
  }
);

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

// Get products by company (for flags feature)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({
        error: 'Company ID required',
        message: 'Please provide a company ID'
      });
    }

    const products = await Product.find({ 
      companyId: companyId,
      isActive: true,
      isAvailable: true
    })
    .select('_id name description category price unit stockQuantity')
    .sort({ name: 1 });

    res.json(products);

  } catch (error) {
    console.error('Get products by company error:', error);
    res.status(500).json({
      error: 'Failed to get products',
      message: 'An error occurred while fetching products'
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
