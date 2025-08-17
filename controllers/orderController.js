const mongoose = require('mongoose');
const Order = require('../models/Order');
const { validateObjectId } = require('../middleware/validation');

const Product = require('../models/Product');
const User = require('../models/User');

// Safe items processor
const processOrderItems = (order) => {
  return Array.isArray(order.items) ? order.items.map(item => ({
    productName: item.productName || 'N/A',
    quantity: item.quantity || 0,
    unitPrice: item.unitPrice || 0,
    totalPrice: item.totalPrice || 0,
    unit: item.unit || 'piece'
  })) : []; // always fallback to empty array
};

exports.getOrders = async (req, res) => {
  try {
    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Filters
    const statusFilter = req.query.status ? req.query.status.split(',') : null;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const searchTerm = req.query.searchTerm || null;

    // Base query
    let query = {};

    // Role-based access
    if (req.user.role === 'shopkeeper') query.shopkeeperId = req.user._id;
    if (req.user.role === 'company_rep') query.companyId = req.user._id;
    if (req.user.role === 'delivery_worker') query.deliveryWorkerId = req.user._id;
    // Admin sees all → no filter

    // Status filter
    if (statusFilter) query.status = { $in: statusFilter };

    // Date filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Search filter (orderNumber or product names)
    if (searchTerm) {
      query.$or = [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { 'items.productName': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Fetch orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('shopkeeperId', 'name shopkeeperInfo.shopName')
      .populate('companyId', 'name companyInfo.companyName')
      .populate('deliveryWorkerId', 'name');

    // Pagination info
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Summary
    const summary = { totalOrders, statusCounts: {}, totalAmount: 0 };

    const processedOrders = orders.map(order => {
      summary.totalAmount += order.finalAmount || 0;
      summary.statusCounts[order.status] = (summary.statusCounts[order.status] || 0) + 1;

      return {
        id: order._id,
        orderNumber: order.orderNumber,
        companyName: order.companyId?.companyInfo?.companyName || 'N/A',
        shopName: order.shopkeeperId?.shopkeeperInfo?.shopName || 'N/A',
        totalAmount: order.finalAmount || 0,
        status: order.status || 'Unknown',
        createdAt: order.createdAt || null,
        deliveredAt: order.deliveredAt || null,
        items: processOrderItems(order),
      };
    });

    res.json({
      orders: processedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      summary
    });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
// Single order
exports.getOrderByIdOrNumber = async (req, res) => {
  try {
    const param = req.params.orderId;
    let order;

    if (/^[0-9a-fA-F]{24}$/.test(param)) order = await Order.findById(param);
    else order = await Order.findOne({ orderNumber: param });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    await order.populate('shopkeeperId', 'name phone area address');
    await order.populate('companyId', 'name companyInfo.companyName');
    await order.populate('deliveryWorkerId', 'name phone');
    await order.populate('approvedBy', 'name');

    const canAccess =
      req.user.role === 'admin' ||
      order.shopkeeperId?._id?.toString() === req.user._id.toString() ||
      order.companyId?._id?.toString() === req.user._id.toString() ||
      order.deliveryWorkerId?._id?.toString() === req.user._id.toString();

    if (!canAccess) return res.status(403).json({ error: 'Access denied' });

    res.json({
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status || 'pending',
        items: processOrderItems(order), // always array
        totalAmount: order.totalAmount || 0,
        taxAmount: order.taxAmount || 0,
        deliveryCharge: order.deliveryCharge || 0,
        finalAmount: order.finalAmount || 0,
        deliveryArea: order.deliveryArea || 'N/A',
        deliveryAddress: order.deliveryAddress || 'N/A',
        deliveryCity: order.deliveryCity || 'N/A',
        paymentMethod: order.paymentMethod || 'cash_on_delivery',
        preferredDeliveryDate: order.preferredDeliveryDate || order.createdAt,
        deliveryInstructions: order.deliveryInstructions || '',
        notes: order.notes || '',
        timeline: order.timeline || [{
          status: order.status || 'pending',
          timestamp: order.createdAt || new Date(),
          note: 'Order created',
          actor: {
            name: order.shopkeeperId?.name || 'System',
            role: 'shopkeeper'
          }
        }],
        shopkeeper: {
          name: order.shopkeeperId?.name || 'N/A',
          shopName: order.shopkeeperId?.shopkeeperInfo?.shopName || 'N/A',
          phone: order.shopkeeperId?.phone || 'N/A'
        },
        company: {
          name: order.companyId?.name || 'N/A',
          companyName: order.companyId?.companyInfo?.companyName || 'N/A',
          phone: order.companyId?.phone || 'N/A'
        },
        deliveryWorker: order.deliveryWorkerId ? {
          name: order.deliveryWorkerId?.name || 'N/A',
          phone: order.deliveryWorkerId?.phone || 'N/A'
        } : null,
        createdAt: order.createdAt || new Date(),
        deliveredAt: order.deliveredAt || null
      },
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to get order' });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    // Only shopkeepers can create orders
    if (req.user.role !== 'shopkeeper') {
      return res.status(403).json({ error: 'Only shopkeepers can create orders' });
    }

    const {
      companyId,
      items,
      deliveryAddress,
      deliveryArea,
      deliveryCity,
      paymentMethod,
      preferredDeliveryDate,
      deliveryInstructions,
      notes
    } = req.body;

    // Validate required fields
    if (!companyId || !items || !items.length || !deliveryAddress || !deliveryArea || !deliveryCity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate that all items have required fields
    const invalidItems = items.filter(item => !item.productId || !item.productName || !item.unitPrice || !item.quantity);
    if (invalidItems.length > 0) {
      return res.status(400).json({ error: 'All items must have productId, productName, unitPrice, and quantity' });
    }

    // Validate company exists and is active
    const company = await User.findById(companyId);
    if (!company || company.role !== 'company_rep' || company.status !== 'active') {
      return res.status(400).json({ error: 'Invalid or inactive company' });
    }

    // Calculate totals
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const itemTotal = (item.unitPrice || 0) * (item.quantity || 0);
      totalAmount += itemTotal;
      return {
        productId: item.productId, // Include productId
        productName: item.productName || 'N/A',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        totalPrice: itemTotal,
        unit: item.unit || 'piece'
      };
    });

    const taxAmount = totalAmount * 0.05; // 5% tax
    const deliveryCharge = 50; // Fixed delivery charge
    const finalAmount = totalAmount + taxAmount + deliveryCharge;

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${(orderCount + 1).toString().padStart(4, '0')}`;

    // Create order
    const order = new Order({
      orderNumber,
      shopkeeperId: req.user._id,
      companyId,
      items: processedItems,
      totalAmount,
      taxAmount,
      deliveryCharge,
      finalAmount,
      deliveryAddress,
      deliveryArea,
      deliveryCity,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      preferredDeliveryDate: preferredDeliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      deliveryInstructions: deliveryInstructions || '',
      notes: notes || '',
      status: 'pending',
      timeline: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order created by shopkeeper',
        actor: {
          name: req.user.name || 'Shopkeeper',
          role: 'shopkeeper'
        }
      }]
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        finalAmount: order.finalAmount,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status: requestedStatus, rejectionReason, assignedDeliveryWorkerId } = req.body;

    const status = typeof requestedStatus === 'string' ? requestedStatus : requestedStatus?.status;

    let order;
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) order = await Order.findById(orderId);
    else order = await Order.findOne({ orderNumber: orderId });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Role-based permissions with status check
    const canUpdate =
      req.user.role === 'admin' ||
      (req.user.role === 'company_rep' && order.companyId.toString() === req.user._id.toString()) ||
      (req.user.role === 'shopkeeper' &&
        order.shopkeeperId.toString() === req.user._id.toString() &&
        status === 'cancelled' &&
        order.status === 'pending') || // <-- shopkeepers can cancel **only if pending**
      (req.user.role === 'delivery_worker' &&
        order.deliveryWorkerId &&
        order.deliveryWorkerId.toString() === req.user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    // Status transitions
    const validTransitions = {
      pending: ['approved', 'rejected', 'cancelled'],
      approved: ['assigned', 'cancelled'],
      assigned: ['accepted', 'rejected_by_worker', 'cancelled'],
      accepted: ['picked_up', 'cancelled'],
      picked_up: ['delivered', 'cancelled'],
      rejected: [],
      cancelled: [],
      delivered: []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ error: `Cannot change status from ${order.status} to ${status}` });
    }

    // Assign delivery worker if needed
    if (status === 'assigned' && assignedDeliveryWorkerId) {
      const worker = await User.findById(assignedDeliveryWorkerId);
      if (!worker || worker.role !== 'delivery_worker') {
        return res.status(400).json({ error: 'Invalid delivery worker' });
      }
      order.deliveryWorkerId = assignedDeliveryWorkerId;
    }

    order.status = status;

    if (status === 'rejected' || status === 'cancelled') {
      order.rejectionReason = rejectionReason || '';
    }

    if (status === 'delivered') order.deliveredAt = new Date();

    // Ensure timeline array exists
    if (!Array.isArray(order.timeline)) order.timeline = [];

    order.timeline.push({
      status,
      timestamp: new Date(),
      note: getStatusNote(status, rejectionReason),
      actor: {
        name: req.user.name || 'System',
        role: req.user.role
      }
    });

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Assign delivery worker to order
exports.assignDeliveryWorker = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryWorkerId } = req.body;

    // Only company reps and admins can assign delivery workers
    if (!['admin', 'company_rep'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to assign delivery workers' });
    }

    let order;
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) order = await Order.findById(orderId);
    else order = await Order.findOne({ orderNumber: orderId });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if user can assign to this order
    if (req.user.role === 'company_rep' && order.companyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Can only assign to your company orders' });
    }

    // Validate delivery worker
    const worker = await User.findById(deliveryWorkerId);
    if (!worker || worker.role !== 'delivery_worker' || worker.status !== 'active') {
      return res.status(400).json({ error: 'Invalid or inactive delivery worker' });
    }

    // Check if worker is available for the delivery area
    if (worker.deliveryWorkerInfo?.assignedAreas && !worker.deliveryWorkerInfo.assignedAreas.includes(order.deliveryArea)) {
      return res.status(400).json({ error: 'Worker not available for this delivery area' });
    }

    // Update order
    order.deliveryWorkerId = deliveryWorkerId;
    order.status = 'assigned';
    
    order.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      note: `Order assigned to delivery worker ${worker.name}`,
      actor: {
        name: req.user.name || 'System',
        role: req.user.role
      }
    });

    await order.save();

    res.json({
      message: 'Delivery worker assigned successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        deliveryWorker: {
          id: worker._id,
          name: worker.name
        }
      }
    });
  } catch (err) {
    console.error('Assign delivery worker error:', err);
    res.status(500).json({ error: 'Failed to assign delivery worker' });
  }
};

// Helper function to get status note
function getStatusNote(status, rejectionReason) {
  const statusNotes = {
    approved: 'Order approved by company',
    rejected: `Order rejected: ${rejectionReason || 'No reason provided'}`,
    assigned: 'Order assigned to delivery worker',
    accepted: 'Order accepted by delivery worker',
    rejected_by_worker: 'Order rejected by delivery worker',
    picked_up: 'Order picked up by delivery worker',
    delivered: 'Order delivered successfully',
    cancelled: `Order cancelled: ${rejectionReason || 'No reason provided'}`
  };
  return statusNotes[status] || `Status changed to ${status}`;
}
