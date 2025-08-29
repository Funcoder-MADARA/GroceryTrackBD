const express = require('express');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validateDeliveryAssignment, validateDeliveryStatusUpdate, validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticateToken, authorizeDeliveryWorker, authorizeCompanyRep, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper function to send delivery notifications
const sendDeliveryNotifications = async (delivery, notificationType, additionalData = {}) => {
  try {
    const deliveryData = await Delivery.findById(delivery._id)
      .populate('shopkeeperId', 'name email')
      .populate('companyId', 'name email companyInfo.companyName')
      .populate('deliveryWorkerId', 'name')
      .populate('orderId', 'orderNumber');

    const notifications = [];

    switch (notificationType) {
      case 'delivered':
        // Notify shopkeeper
        notifications.push(new Notification({
          recipientId: deliveryData.shopkeeperId._id,
          type: 'delivery_delivered',
          title: 'Delivery Completed',
          message: `Your order ${deliveryData.orderId.orderNumber} has been successfully delivered by ${deliveryData.deliveryWorkerId.name}.`,
          relatedOrderId: deliveryData.orderId._id,
          relatedDeliveryId: deliveryData._id,
          priority: 'high',
          data: {
            deliveryNumber: deliveryData.deliveryNumber,
            deliveredAt: deliveryData.deliveredAt,
            deliveryWorker: deliveryData.deliveryWorkerId.name,
            ...additionalData
          }
        }));

        // Notify company
        notifications.push(new Notification({
          recipientId: deliveryData.companyId._id,
          type: 'delivery_delivered',
          title: 'Order Delivered',
          message: `Order ${deliveryData.orderId.orderNumber} has been delivered to ${deliveryData.shopkeeperId.name}.`,
          relatedOrderId: deliveryData.orderId._id,
          relatedDeliveryId: deliveryData._id,
          priority: 'medium',
          data: {
            deliveryNumber: deliveryData.deliveryNumber,
            shopkeeperName: deliveryData.shopkeeperId.name,
            deliveredAt: deliveryData.deliveredAt,
            deliveryWorker: deliveryData.deliveryWorkerId.name,
            ...additionalData
          }
        }));
        break;

      case 'issue_reported':
        // Notify shopkeeper about issue
        notifications.push(new Notification({
          recipientId: deliveryData.shopkeeperId._id,
          type: 'delivery_delivered', // Using existing type as closest match
          title: 'Delivery Issue Reported',
          message: `There was an issue with delivery ${deliveryData.deliveryNumber}. ${additionalData.issueDescription || 'Please contact support.'}`,
          relatedOrderId: deliveryData.orderId._id,
          relatedDeliveryId: deliveryData._id,
          priority: 'high',
          data: {
            deliveryNumber: deliveryData.deliveryNumber,
            issueType: additionalData.issueType,
            issueDescription: additionalData.issueDescription,
            reportedAt: new Date(),
            deliveryWorker: deliveryData.deliveryWorkerId.name,
            ...additionalData
          }
        }));

        // Notify company about issue
        notifications.push(new Notification({
          recipientId: deliveryData.companyId._id,
          type: 'system_alert',
          title: 'Delivery Issue Reported',
          message: `Delivery worker ${deliveryData.deliveryWorkerId.name} reported an issue with delivery ${deliveryData.deliveryNumber}.`,
          relatedOrderId: deliveryData.orderId._id,
          relatedDeliveryId: deliveryData._id,
          priority: 'high',
          data: {
            deliveryNumber: deliveryData.deliveryNumber,
            shopkeeperName: deliveryData.shopkeeperId.name,
            issueType: additionalData.issueType,
            issueDescription: additionalData.issueDescription,
            reportedAt: new Date(),
            deliveryWorker: deliveryData.deliveryWorkerId.name,
            ...additionalData
          }
        }));
        break;
    }

    // Save all notifications
    for (const notification of notifications) {
      await notification.save();
    }

    console.log(`Sent ${notifications.length} notifications for delivery ${notificationType}`);
  } catch (error) {
    console.error('Error sending delivery notifications:', error);
    // Don't throw error as notifications shouldn't block delivery operations
  }
};

// Create delivery assignment (company or admin)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderId, deliveryWorkerId } = req.body;
    
    console.log('Delivery assignment request:', { orderId, deliveryWorkerId, userRole: req.user.role });

    // Check if user has permission to assign deliveries
    if (!['company_rep', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to assign deliveries'
      });
    }

    const order = await Order.findById(orderId);
    console.log('Found order:', order ? { id: order._id, status: order.status, companyId: order.companyId } : 'null');
    
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

    // Generate delivery number
    const deliveryCount = await Delivery.countDocuments();
    const deliveryNumber = `DEL-${(deliveryCount + 1).toString().padStart(4, '0')}`;

    // Get company and shopkeeper details
    const company = await User.findById(order.companyId);
    const shopkeeper = await User.findById(order.shopkeeperId);

    // Create delivery
    const delivery = new Delivery({
      deliveryNumber,
      orderId,
      deliveryWorkerId,
      shopkeeperId: order.shopkeeperId,
      companyId: order.companyId,
      items: order.items || [],
      pickupLocation: company ? `${company.address || 'N/A'}, ${company.area || 'N/A'}, ${company.city || 'N/A'}` : 'Company Warehouse',
      deliveryLocation: shopkeeper ? `${shopkeeper.address || 'N/A'}, ${shopkeeper.area || 'N/A'}, ${shopkeeper.city || 'N/A'}` : order.deliveryAddress || 'Delivery Address',
      deliveryArea: shopkeeper ? shopkeeper.area : order.deliveryArea || 'Unknown Area',
      shopkeeperPhone: shopkeeper ? shopkeeper.phone : order.shopkeeperPhone || 'N/A',
      shopkeeperName: shopkeeper ? shopkeeper.name : order.shopkeeperName || 'Unknown',
      deliveryInstructions: order.deliveryInstructions || '',
      paymentMethod: order.paymentMethod || 'cash_on_delivery',
      amountToCollect: order.finalAmount || 0,
      status: 'assigned',
      assignedAt: new Date()
    });
    
    console.log('Creating delivery with data:', {
      deliveryNumber,
      orderId,
      deliveryWorkerId,
      itemsCount: (order.items || []).length
    });

    await delivery.save();

    // Update order status and worker assignment
    order.deliveryWorkerId = deliveryWorkerId;
    order.status = 'shipped'; // Order is now ready for delivery
    await order.save();

    // Send notification to delivery worker
    try {
      const notification = new Notification({
        recipientId: deliveryWorkerId,
        type: 'delivery_assigned',
        title: 'New Delivery Assignment',
        message: `You have been assigned a new delivery ${deliveryNumber} from ${company?.companyInfo?.companyName || company?.name || 'Company'} to ${shopkeeper?.name || 'Customer'}.`,
        relatedOrderId: order._id,
        relatedDeliveryId: delivery._id,
        priority: 'high',
        data: {
          deliveryNumber,
          orderNumber: order.orderNumber,
          shopkeeperName: shopkeeper?.name || 'Unknown',
          shopkeeperPhone: shopkeeper?.phone || 'N/A',
          deliveryLocation: delivery.deliveryLocation,
          pickupLocation: delivery.pickupLocation,
          assignedAt: new Date()
        }
      });
      await notification.save();
    } catch (notificationError) {
      console.error('Failed to send assignment notification:', notificationError);
      // Don't block delivery creation for notification failures
    }

    res.status(201).json({
      message: 'Delivery assigned successfully',
      delivery: delivery.getDeliverySummary()
    });

  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({
      error: 'Delivery assignment failed',
      message: 'An error occurred while assigning delivery',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Send notifications to shopkeeper and company
    await sendDeliveryNotifications(delivery, 'delivered', {
      proof,
      completedBy: req.user.name
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

// Report delivery issue (delivery worker)
router.put('/:deliveryId/report-issue', authenticateToken, authorizeDeliveryWorker, async (req, res) => {
  try {
    const { issueType, description, canComplete, resolution } = req.body;

    // Validate required fields
    if (!issueType || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Issue type and description are required'
      });
    }

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
        message: 'You can only report issues for your own deliveries'
      });
    }

    // Add issue to delivery
    await delivery.addIssue(issueType, description);

    // Update delivery status based on whether it can be completed
    if (canComplete === false) {
      // If delivery cannot be completed, mark as failed
      delivery.status = 'failed';
      delivery.failureReason = description;
      await delivery.save();

      // Update order status
      await Order.findByIdAndUpdate(delivery.orderId, { 
        status: 'cancelled',
        cancellationReason: `Delivery failed: ${description}`
      });
    } else if (canComplete === true && resolution) {
      // If issue is resolved and delivery can be completed
      delivery.status = 'delivered';
      delivery.deliveredAt = new Date();
      delivery.actualDeliveryTime = new Date();
      await delivery.save();

      // Update order status
      await Order.findByIdAndUpdate(delivery.orderId, { 
        status: 'delivered',
        deliveredAt: new Date()
      });

      // Send delivery completion notifications
      await sendDeliveryNotifications(delivery, 'delivered', {
        hasIssue: true,
        issueType,
        issueDescription: description,
        resolution,
        completedBy: req.user.name
      });
    }

    // Send issue notifications regardless
    await sendDeliveryNotifications(delivery, 'issue_reported', {
      issueType,
      issueDescription: description,
      canComplete,
      resolution,
      reportedBy: req.user.name
    });

    res.json({
      message: 'Issue reported successfully',
      delivery: delivery.getDeliverySummary(),
      issueStatus: canComplete === false ? 'delivery_failed' : canComplete === true ? 'resolved_and_completed' : 'reported'
    });

  } catch (error) {
    console.error('Report delivery issue error:', error);
    res.status(500).json({
      error: 'Issue reporting failed',
      message: 'An error occurred while reporting the issue'
    });
  }
});

// Get available delivery workers by area
router.get('/workers/available/:area', authenticateToken, async (req, res) => {
  try {
    const { area } = req.params;

    // Build query for workers
    const query = {
      role: 'delivery_worker',
      status: 'active'
    };

    // If area is provided, filter by area or assigned areas
    if (area && area !== 'all') {
      query.$or = [
        { area: { $regex: area, $options: 'i' } },
        { 'deliveryWorkerInfo.assignedAreas': { $regex: area, $options: 'i' } }
      ];
    }

    const deliveryWorkers = await User.find(query).select('name phone area deliveryWorkerInfo');

    // Format the response
    const formattedWorkers = deliveryWorkers.map(worker => ({
      _id: worker._id,
      name: worker.name,
      phone: worker.phone,
      area: worker.area,
      availability: worker.deliveryWorkerInfo?.availability || 'offline',
      assignedAreas: worker.deliveryWorkerInfo?.assignedAreas || [worker.area],
      vehicleType: worker.deliveryWorkerInfo?.vehicleType || 'N/A',
      vehicleNumber: worker.deliveryWorkerInfo?.vehicleNumber || 'N/A'
    }));

    res.json({
      workers: formattedWorkers,
      count: formattedWorkers.length,
      area: area
    });

  } catch (error) {
    console.error('Get available workers error:', error);
    res.status(500).json({
      error: 'Failed to get available workers',
      message: 'An error occurred while fetching available workers'
    });
  }
});

// Get all available delivery workers (for admin)
router.get('/workers/all', authenticateToken, async (req, res) => {
  try {
    // Only allow admins and company reps
    if (!['admin', 'company_rep'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only admins and company representatives can access this'
      });
    }

    const deliveryWorkers = await User.find({
      role: 'delivery_worker',
      status: 'active'
    }).select('name phone area deliveryWorkerInfo');

    const formattedWorkers = deliveryWorkers.map(worker => ({
      _id: worker._id,
      name: worker.name,
      phone: worker.phone,
      area: worker.area,
      availability: worker.deliveryWorkerInfo?.availability || 'offline',
      assignedAreas: worker.deliveryWorkerInfo?.assignedAreas || [worker.area],
      vehicleType: worker.deliveryWorkerInfo?.vehicleType || 'N/A',
      vehicleNumber: worker.deliveryWorkerInfo?.vehicleNumber || 'N/A'
    }));

    res.json({
      workers: formattedWorkers,
      count: formattedWorkers.length
    });

  } catch (error) {
    console.error('Get all workers error:', error);
    res.status(500).json({
      error: 'Failed to get workers',
      message: 'An error occurred while fetching workers'
    });
  }
});

// Get delivery details grouped by area
router.get('/details-by-area', authenticateToken, async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    
    console.log('Delivery details request:', {
      userRole: req.user.role,
      userId: req.user._id,
      filters: { status, dateFrom, dateTo }
    });
    
    // Check permissions - allow admin, company_rep, and delivery_worker
    if (!['admin', 'company_rep', 'delivery_worker'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view delivery details'
      });
    }

    const query = {};
    
    // Role-based filtering
    if (req.user.role === 'company_rep') {
      query.companyId = req.user._id;
    } else if (req.user.role === 'delivery_worker') {
      query.deliveryWorkerId = req.user._id;
    }
    // Admin can see all deliveries
    
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.assignedAt = {};
      if (dateFrom) query.assignedAt.$gte = new Date(dateFrom);
      if (dateTo) query.assignedAt.$lte = new Date(dateTo);
    }

    console.log('Query to execute:', query);

    const deliveries = await Delivery.find(query)
      .populate('orderId', 'orderNumber status totalAmount')
      .populate('shopkeeperId', 'name phone area address')
      .populate('companyId', 'name companyInfo.companyName address area')
      .populate('deliveryWorkerId', 'name phone deliveryWorkerInfo.vehicleType deliveryWorkerInfo.vehicleNumber')
      .populate('items.productId', 'name category')
      .sort({ assignedAt: -1 });

    console.log(`Found ${deliveries.length} deliveries`);

    // If no deliveries found, return empty result
    if (deliveries.length === 0) {
      return res.json({
        success: true,
        data: [],
        statistics: {
          totalAreas: 0,
          totalDeliveries: 0,
          completedDeliveries: 0,
          pendingDeliveries: 0,
          failedDeliveries: 0
        },
        filters: {
          status,
          dateFrom,
          dateTo,
          userRole: req.user.role
        }
      });
    }

    // Group deliveries by area
    const deliveriesByArea = deliveries.reduce((acc, delivery) => {
      const area = delivery.deliveryArea || 'Unknown Area';
      
      if (!acc[area]) {
        acc[area] = {
          area,
          deliveries: [],
          totalDeliveries: 0,
          completedDeliveries: 0,
          pendingDeliveries: 0,
          failedDeliveries: 0
        };
      }
      
      const deliveryData = {
        _id: delivery._id,
        deliveryNumber: delivery.deliveryNumber,
        status: delivery.status,
        assignedAt: delivery.assignedAt,
        deliveredAt: delivery.deliveredAt,
        
        // Order information
        order: {
          _id: delivery.orderId._id,
          orderNumber: delivery.orderId.orderNumber,
          status: delivery.orderId.status,
          totalAmount: delivery.orderId.totalAmount
        },
        
        // Product information
        products: delivery.items.map(item => ({
          _id: item.productId?._id,
          name: item.productName || item.productId?.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.productId?.category
        })),
        
        // Address and route information
        addresses: {
          pickup: delivery.pickupLocation,
          delivery: delivery.deliveryLocation
        },
        
        // Route information (if available)
        route: delivery.routeOptimization ? {
          distance: delivery.routeOptimization.distance,
          estimatedTime: delivery.routeOptimization.estimatedTime,
          routePoints: delivery.routeOptimization.routePoints
        } : null,
        
        // Customer information
        customer: {
          _id: delivery.shopkeeperId._id,
          name: delivery.shopkeeperId.name,
          phone: delivery.shopkeeperId.phone,
          area: delivery.shopkeeperId.area,
          address: delivery.shopkeeperId.address
        },
        
        // Company information
        company: {
          _id: delivery.companyId._id,
          name: delivery.companyId.companyInfo?.companyName || delivery.companyId.name,
          address: delivery.companyId.address,
          area: delivery.companyId.area
        },
        
        // Delivery worker information
        deliveryWorker: {
          _id: delivery.deliveryWorkerId._id,
          name: delivery.deliveryWorkerId.name,
          phone: delivery.deliveryWorkerId.phone,
          vehicleType: delivery.deliveryWorkerId.deliveryWorkerInfo?.vehicleType,
          vehicleNumber: delivery.deliveryWorkerId.deliveryWorkerInfo?.vehicleNumber
        },
        
        // Payment and additional info
        paymentMethod: delivery.paymentMethod,
        amountToCollect: delivery.amountToCollect,
        deliveryInstructions: delivery.deliveryInstructions,
        issues: delivery.issues || []
      };
      
      acc[area].deliveries.push(deliveryData);
      acc[area].totalDeliveries++;
      
      switch (delivery.status) {
        case 'delivered':
          acc[area].completedDeliveries++;
          break;
        case 'failed':
        case 'returned':
          acc[area].failedDeliveries++;
          break;
        default:
          acc[area].pendingDeliveries++;
      }
      
      return acc;
    }, {});

    // Convert to array and sort by area name
    const groupedDeliveries = Object.values(deliveriesByArea).sort((a, b) => 
      a.area.localeCompare(b.area)
    );

    // Calculate overall statistics
    const totalStats = {
      totalAreas: groupedDeliveries.length,
      totalDeliveries: deliveries.length,
      completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
      pendingDeliveries: deliveries.filter(d => !['delivered', 'failed', 'returned'].includes(d.status)).length,
      failedDeliveries: deliveries.filter(d => ['failed', 'returned'].includes(d.status)).length
    };

    res.json({
      success: true,
      data: groupedDeliveries,
      statistics: totalStats,
      filters: {
        status,
        dateFrom,
        dateTo,
        userRole: req.user.role
      }
    });

  } catch (error) {
    console.error('Get delivery details by area error:', error);
    res.status(500).json({
      error: 'Failed to get delivery details',
      message: 'An error occurred while fetching delivery details by area',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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