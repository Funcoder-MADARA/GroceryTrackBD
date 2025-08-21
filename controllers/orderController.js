// controllers/OrderController.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const { validateObjectId } = require('../middleware/validation');

// --- Helper: process order items safely ---
const processOrderItems = (order) => {
  return Array.isArray(order.items)
    ? order.items.map(item => ({
        productName: item.productName || 'N/A',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        unit: item.unit || 'piece'
      }))
    : [];
};

// --- Get all orders with pagination, filters, summary ---
exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status ? req.query.status.split(',') : null;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const searchTerm = req.query.searchTerm || null;

    let query = {};

    // Role-based access
    if (req.user.role === 'shopkeeper') query.shopkeeperId = req.user._id;
    if (req.user.role === 'company_rep') query.companyId = req.user._id;
    if (req.user.role === 'delivery_worker') query.deliveryWorkerId = req.user._id;

    if (statusFilter) query.status = { $in: statusFilter };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    if (searchTerm) {
      query.$or = [
        { orderNumber: { $regex: searchTerm, $options: 'i' } },
        { 'items.productName': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('shopkeeperId', 'name phone shopName')
      .populate('companyId', 'name phone companyName')
      .populate('deliveryWorkerId', 'name phone');

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const summary = { totalOrders, statusCounts: {}, totalAmount: 0, overdueOrders: 0 };

    const processedOrders = orders.map(order => {
      summary.totalAmount += order.finalAmount || 0;
      summary.statusCounts[order.status] = (summary.statusCounts[order.status] || 0) + 1;

      // Overdue detection (creative feature)
      if (order.status !== 'delivered' && ((new Date()) - order.createdAt) > 7 * 24 * 60 * 60 * 1000) {
        summary.overdueOrders += 1;
      }

      return {
        id: order._id,
        orderNumber: order.orderNumber,
        companyName: order.companySnapshot?.companyName || order.companyId?.companyName || 'N/A',
        shopName: order.shopkeeperSnapshot?.shopName || order.shopkeeperId?.shopName || 'N/A',
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

// --- Get single order by ID or orderNumber ---
exports.getOrderByIdOrNumber = async (req, res) => {
  try {
    const param = req.params.orderId;
    let order = /^[0-9a-fA-F]{24}$/.test(param)
      ? await Order.findById(param)
      : await Order.findOne({ orderNumber: param });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    await order.populate('shopkeeperId', 'name phone shopName');
    await order.populate('companyId', 'name companyName phone');
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
        items: processOrderItems(order),
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
        timeline: order.timeline.length ? order.timeline : [{
          status: order.status || 'pending',
          timestamp: order.createdAt || new Date(),
          note: 'Order created',
          actor: { name: order.shopkeeperId?.name || 'System', role: 'shopkeeper' }
        }],
        shopkeeper: {
          name: order.shopkeeperSnapshot?.name || order.shopkeeperId?.name || 'N/A',
          shopName: order.shopkeeperSnapshot?.shopName || order.shopkeeperId?.shopName || 'N/A',
          phone: order.shopkeeperSnapshot?.phone || order.shopkeeperId?.phone || 'N/A'
        },
        company: {
          name: order.companySnapshot?.name || order.companyId?.name || 'N/A',
          companyName: order.companySnapshot?.companyName || order.companyId?.companyName || 'N/A',
          phone: order.companySnapshot?.phone || order.companyId?.phone || 'N/A'
        },
        deliveryWorker: order.deliveryWorkerId ? {
          name: order.deliveryWorkerId?.name || 'N/A',
          phone: order.deliveryWorkerId?.phone || 'N/A'
        } : null,
        createdAt: order.createdAt || new Date(),
        deliveredAt: order.deliveredAt || null
      }
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to get order' });
  }
};
const Product = require('../models/Product'); // import Product model

exports.createOrder = async (req, res) => {
  try {
    if (req.user.role !== 'shopkeeper') 
      return res.status(403).json({ error: 'Only shopkeepers can create orders' });

    const { companyId, items, deliveryAddress, deliveryArea, deliveryCity, paymentMethod, preferredDeliveryDate, deliveryInstructions, notes } = req.body;

    if (!companyId || !items?.length || !deliveryAddress || !deliveryArea || !deliveryCity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate company
    const company = await User.findById(companyId);
    if (!company || company.role !== 'company_rep' || company.status !== 'active') {
      return res.status(400).json({ error: 'Invalid or inactive company' });
    }

    // --- Validate stock for each item ---
    const processedItems = [];
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ error: 'Each item must have productId and quantity' });
      }

      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.productName}` });
      if (!product.canOrder(item.quantity)) {
        return res.status(400).json({ 
          error: `Cannot order ${item.quantity} of ${product.name}. Available: ${product.stockQuantity}` 
        });
      }

      // Reduce stock immediately
      await product.reduceStock(item.quantity);

      const totalPrice = item.quantity * (item.unitPrice || product.unitPrice || 0);
      processedItems.push({
        ...item,
        unitPrice: item.unitPrice || product.unitPrice || 0,
        totalPrice,
        unit: product.unit
      });
    }

    // Totals
    const totalAmount = processedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const taxAmount = totalAmount * 0.05;
    const deliveryCharge = 50;
    const finalAmount = totalAmount + taxAmount + deliveryCharge;

    const orderNumber = `ORD-${(await Order.countDocuments() + 1).toString().padStart(4, '0')}`;

    const order = new Order({
      orderNumber,
      shopkeeperId: req.user._id,
      shopkeeperSnapshot: { name: req.user.name, shopName: req.user.shopName || 'N/A', phone: req.user.phone || 'N/A' },
      companyId,
      companySnapshot: { name: company.name, companyName: company.companyName || 'N/A', phone: company.phone || 'N/A' },
      items: processedItems,
      totalAmount,
      taxAmount,
      deliveryCharge,
      finalAmount,
      deliveryAddress,
      deliveryArea,
      deliveryCity,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      preferredDeliveryDate: preferredDeliveryDate || new Date(Date.now() + 24*60*60*1000),
      deliveryInstructions: deliveryInstructions || '',
      notes: notes || '',
      status: 'pending',
      timeline: [{ status: 'pending', timestamp: new Date(), note: 'Order created', actor: { name: req.user.name, role: 'shopkeeper' } }]
    });

    await order.save();

    res.status(201).json({ 
      message: 'Order created successfully', 
      order: { id: order._id, orderNumber: order.orderNumber, status: order.status, finalAmount: order.finalAmount } 
    });

  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};


// --- Update order status ---
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status: requestedStatus, rejectionReason, assignedDeliveryWorkerId } = req.body;
    const status = typeof requestedStatus === 'string' ? requestedStatus : requestedStatus?.status;

    let order = /^[0-9a-fA-F]{24}$/.test(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderNumber: orderId });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const canUpdate =
      req.user.role === 'admin' ||
      (req.user.role === 'company_rep' && order.companyId.toString() === req.user._id.toString()) ||
      (req.user.role === 'shopkeeper' && order.shopkeeperId.toString() === req.user._id.toString() && status === 'cancelled' && order.status === 'pending') ||
      (req.user.role === 'delivery_worker' && order.deliveryWorkerId && order.deliveryWorkerId.toString() === req.user._id.toString());

    if (!canUpdate) return res.status(403).json({ error: 'Not authorized to update this order' });

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

    if (status === 'assigned' && assignedDeliveryWorkerId) {
      const worker = await User.findById(assignedDeliveryWorkerId);
      if (!worker || worker.role !== 'delivery_worker') return res.status(400).json({ error: 'Invalid delivery worker' });
      order.deliveryWorkerId = assignedDeliveryWorkerId;
    }

    order.status = status;
    if (status === 'rejected' || status === 'cancelled') order.rejectionReason = rejectionReason || '';
    if (status === 'delivered') order.deliveredAt = new Date();

    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({ status, timestamp: new Date(), note: getStatusNote(status, rejectionReason), actor: { name: req.user.name || 'System', role: req.user.role } });

    await order.save();
    res.json({ message: 'Order status updated successfully', order: { id: order._id, orderNumber: order.orderNumber, status: order.status, updatedAt: new Date() } });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// --- Assign delivery worker ---
exports.assignDeliveryWorker = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryWorkerId } = req.body;

    if (!['admin', 'company_rep'].includes(req.user.role)) return res.status(403).json({ error: 'Not authorized' });

    let order = /^[0-9a-fA-F]{24}$/.test(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderNumber: orderId });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'company_rep' && order.companyId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Can only assign your company orders' });

    const worker = await User.findById(deliveryWorkerId);
    if (!worker || worker.role !== 'delivery_worker' || worker.status !== 'active') return res.status(400).json({ error: 'Invalid or inactive worker' });

    const orderArea = order.deliveryArea && order.deliveryArea !== 'N/A' ? order.deliveryArea : null;
    if (orderArea && worker.deliveryWorkerInfo?.assignedAreas?.length && !worker.deliveryWorkerInfo.assignedAreas.includes(orderArea)) {
      return res.status(400).json({ error: 'Worker not available for this area', orderArea, workerAreas: worker.deliveryWorkerInfo.assignedAreas });
    }

    if (order.deliveryWorkerId?.toString() === worker._id.toString()) return res.status(400).json({ error: 'Worker already assigned' });

    order.deliveryWorkerId = deliveryWorkerId;
    order.status = 'assigned';
    order.timeline.push({ status: 'assigned', timestamp: new Date(), note: `Assigned to ${worker.name}`, actor: { name: req.user.name || 'System', role: req.user.role } });

    await order.save();

    res.json({ message: 'Delivery worker assigned', order: { id: order._id, orderNumber: order.orderNumber, deliveryArea: orderArea || 'Not Specified', deliveryWorker: { id: worker._id, name: worker.name, areas: worker.deliveryWorkerInfo?.assignedAreas || [] } } });
  } catch (err) {
    console.error('Assign delivery worker error:', err);
    res.status(500).json({ error: 'Failed to assign delivery worker', details: err.message });
  }
};

// --- Status note helper ---
function getStatusNote(status, rejectionReason) {
  const notes = {
    approved: 'Order approved by company',
    rejected: `Order rejected: ${rejectionReason || 'No reason'}`,
    assigned: 'Order assigned to delivery worker',
    accepted: 'Order accepted by delivery worker',
    rejected_by_worker: 'Order rejected by delivery worker',
    picked_up: 'Order picked up by delivery worker',
    delivered: 'Order delivered successfully',
    cancelled: `Order cancelled: ${rejectionReason || 'No reason'}`
  };
  return notes[status] || `Status changed to ${status}`;
}
