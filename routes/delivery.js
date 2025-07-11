const express = require('express');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const { validateDeliveryAssignment, validateDeliveryStatusUpdate, validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeDeliveryWorker, authorizeCompanyRep, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Create delivery assignment (company or admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, deliveryWorkerId } = req.body;

    // Check if user has permission to assign deliveries
    if (!['company_rep', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to assign deliveries'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Order not found'
      });
    }

    // Check if order belongs to company (for company reps)
    if (req.user.role === 'company_rep' && order.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only assign deliveries for your company orders'
      });
    }

    // Check if order is ready for delivery
    if (!['approved', 'processing'].includes(order.status)) {
      return res.status(400).json({
        error: 'Order not ready',
        message: 'Order is not ready for delivery assignment'
      });
    }

    // Check if delivery worker exists and is available
    const deliveryWorker = await User.findById(deliveryWorkerId);
    if (!deliveryWorker || deliveryWorker.role !== 'delivery_worker' || deliveryWorker.status !== 'active') {
      return res.status(400).json({
        error: 'Invalid delivery worker',
        message: 'Selected delivery worker is not available'
      });
    }

    // Check if delivery already exists for this order
    const existingDelivery = await Delivery.findOne({ orderId });
    if (existingDelivery) {
      return res.status(400).json({
        error: 'Delivery already assigned',
        message: 'A delivery has already been assigned to this order'
      });
    }

    // Create delivery
    const delivery = new Delivery({
      orderId,
      deliveryWorkerId,
      shopkeeperId: order.shopkeeperId,
      companyId: order.companyId,
      items: order.items,
      pickupLocation: 'Company Warehouse', // This would be dynamic in real app
      deliveryLocation: order.deliveryAddress,
      deliveryArea: order.deliveryArea,
      paymentMethod: order.paymentMethod,
      amountToCollect: order.finalAmount,
      deliveryInstructions: order.deliveryInstructions
    });

    await delivery.save();

    // Update order with delivery worker
    await order.assignDeliveryWorker(deliveryWorkerId);

    res.status(201).json({
      message: 'Delivery assigned successfully',
      delivery: delivery.getDeliverySummary()
    });

  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({
      error: 'Delivery assignment failed',
      message: 'An error occurred while assigning delivery'
    });
  }
});

// Get deliveries for delivery worker
router.get('/worker', authenticateToken, authorizeDeliveryWorker, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { deliveryWorkerId: req.user._id };
    if (status) query.status = status;

    const deliveries = await Delivery.find(query)
      .populate('orderId', 'orderNumber status')
      .populate('shopkeeperId', 'name phone area')
      .populate('companyId', 'name companyInfo.companyName')
      .sort({ assignedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get worker deliveries error:', error);
    res.status(500).json({
      error: 'Failed to get deliveries',
      message: 'An error occurred while fetching deliveries'
    });
  }
});

// Get deliveries for company
router.get('/company', authenticateToken, authorizeCompanyRep, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, area } = req.query;
    
    const query = { companyId: req.user._id };
    if (status) query.status = status;
    if (area) query.deliveryArea = { $regex: area, $options: 'i' };

    const deliveries = await Delivery.find(query)
      .populate('orderId', 'orderNumber status')
      .populate('shopkeeperId', 'name phone area')
      .populate('deliveryWorkerId', 'name phone')
      .sort({ assignedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get company deliveries error:', error);
    res.status(500).json({
      error: 'Failed to get deliveries',
      message: 'An error occurred while fetching deliveries'
    });
  }
});

// Get delivery by ID
router.get('/:deliveryId', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.deliveryId)
      .populate('orderId', 'orderNumber status')
      .populate('shopkeeperId', 'name phone area address')
      .populate('companyId', 'name companyInfo.companyName')
      .populate('deliveryWorkerId', 'name phone');

    if (!delivery) {
      return res.status(404).json({
        error: 'Delivery not found',
        message: 'Delivery not found'
      });
    }

    // Check if user has access to this delivery
    const canAccess = 
      req.user.role === 'admin' ||
      delivery.deliveryWorkerId._id.toString() === req.user._id.toString() ||
      delivery.companyId._id.toString() === req.user._id.toString() ||
      delivery.shopkeeperId._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this delivery'
      });
    }

    res.json({
      delivery
    });

  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      error: 'Failed to get delivery',
      message: 'An error occurred while fetching delivery'
    });
  }
});

// Update delivery status (delivery worker)
router.put('/:deliveryId/status', authenticateToken, authorizeDeliveryWorker, validateDeliveryStatusUpdate, async (req, res) => {
  try {
    const { status, issues } = req.body;

    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({
        error: 'Delivery not found',
        message: 'Delivery not found'
      });
    }

    // Check if delivery worker owns this delivery
    if (delivery.deliveryWorkerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own deliveries'
      });
    }

    // Validate status transition
    const validTransitions = {
      assigned: ['picked_up'],
      picked_up: ['in_transit', 'delivered', 'failed'],
      in_transit: ['delivered', 'failed'],
      delivered: [],
      failed: ['assigned'],
      returned: ['assigned']
    };

    if (!validTransitions[delivery.status] || !validTransitions[delivery.status].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        message: `Cannot change status from ${delivery.status} to ${status}`
      });
    }

    await delivery.updateStatus(status);

    // Add issues if provided
    if (issues && Array.isArray(issues)) {
      for (const issue of issues) {
        await delivery.addIssue(issue.type, issue.description);
      }
    }

    // Update order status if delivery is completed
    if (status === 'delivered') {
      await Order.findByIdAndUpdate(delivery.orderId, { status: 'delivered' });
    }

    res.json({
      message: 'Delivery status updated successfully',
      delivery: delivery.getDeliverySummary()
    });

  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      error: 'Status update failed',
      message: 'An error occurred while updating delivery status'
    });
  }
});

// Complete delivery with proof
router.put('/:deliveryId/complete', authenticateToken, authorizeDeliveryWorker, async (req, res) => {
  try {
    const { signature, photo, notes } = req.body;

    const delivery = await Delivery.findById(req.params.deliveryId);

    if (!delivery) {
      return res.status(404).json({
        error: 'Delivery not found',
        message: 'Delivery not found'
      });
    }

    // Check if delivery worker owns this delivery
    if (delivery.deliveryWorkerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only complete your own deliveries'
      });
    }

    // Check if delivery is in correct status
    if (!['picked_up', 'in_transit'].includes(delivery.status)) {
      return res.status(400).json({
        error: 'Invalid delivery status',
        message: 'Delivery must be picked up or in transit to complete'
      });
    }

    const proof = { signature, photo, notes };
    await delivery.completeDelivery(proof);

    // Update order status
    await Order.findByIdAndUpdate(delivery.orderId, { 
      status: 'delivered',
      deliveredAt: new Date()
    });

    res.json({
      message: 'Delivery completed successfully',
      delivery: delivery.getDeliverySummary()
    });

  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json({
      error: 'Delivery completion failed',
      message: 'An error occurred while completing delivery'
    });
  }
});

// Get available delivery workers by area
router.get('/workers/available/:area', authenticateToken, async (req, res) => {
  try {
    const { area } = req.params;

    const deliveryWorkers = await User.find({
      role: 'delivery_worker',
      status: 'active',
      'deliveryWorkerInfo.assignedAreas': { $regex: area, $options: 'i' },
      'deliveryWorkerInfo.availability': { $in: ['available', 'busy'] }
    }).select('name phone deliveryWorkerInfo.availability deliveryWorkerInfo.assignedAreas');

    res.json({
      deliveryWorkers
    });

  } catch (error) {
    console.error('Get available workers error:', error);
    res.status(500).json({
      error: 'Failed to get available workers',
      message: 'An error occurred while fetching available workers'
    });
  }
});

// Get deliveries by area (for analytics)
router.get('/area/:area', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { area } = req.params;
    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;
    
    const query = { deliveryArea: { $regex: area, $options: 'i' } };
    
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.assignedAt = {};
      if (dateFrom) query.assignedAt.$gte = new Date(dateFrom);
      if (dateTo) query.assignedAt.$lte = new Date(dateTo);
    }

    const deliveries = await Delivery.find(query)
      .populate('orderId', 'orderNumber status')
      .populate('shopkeeperId', 'name area')
      .populate('companyId', 'name companyInfo.companyName')
      .populate('deliveryWorkerId', 'name')
      .sort({ assignedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get deliveries by area error:', error);
    res.status(500).json({
      error: 'Failed to get deliveries',
      message: 'An error occurred while fetching deliveries'
    });
  }
});

// Get all deliveries (admin)
router.get('/', authenticateToken, authorizeAdmin, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, area } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (area) query.deliveryArea = { $regex: area, $options: 'i' };

    const deliveries = await Delivery.find(query)
      .populate('orderId', 'orderNumber status')
      .populate('shopkeeperId', 'name role area')
      .populate('companyId', 'name role companyInfo.companyName')
      .populate('deliveryWorkerId', 'name role')
      .sort({ assignedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Delivery.countDocuments(query);

    res.json({
      deliveries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all deliveries error:', error);
    res.status(500).json({
      error: 'Failed to get deliveries',
      message: 'An error occurred while fetching deliveries'
    });
  }
});

module.exports = router;