import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { placeOrderSchema } from '../validators/orderValidators.js';

export const placeOrder = asyncHandler(async (req, res) => {
  const { error, value } = placeOrderSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ message: 'Validation failed', details: error.details.map((d) => d.message) });
  }

  const { userId, companyName, items } = value;

  // Fetch product prices
  const productIds = items.map((it) => it.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const orderItems = items.map((it) => {
    const product = productMap.get(it.productId);
    if (!product) {
      throw Object.assign(new Error(`Product not found: ${it.productId}`), { status: 404 });
    }
    const unitPrice = product.unitPrice;
    const lineTotal = unitPrice * it.quantity;
    return { product: product._id, quantity: it.quantity, unitPrice, lineTotal };
  });

  const totalAmount = orderItems.reduce((sum, it) => sum + it.lineTotal, 0);

  const order = await Order.create({
    user: new mongoose.Types.ObjectId(userId),
    companyName,
    items: orderItems,
    totalAmount,
  });

  const populated = await order.populate({ path: 'items.product', select: 'name companyName imageUrl unitPrice' });
  res.status(201).json(populated);
});

export const getOrderHistory = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: 'userId query param is required' });
  }
  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate({ path: 'items.product', select: 'name companyName imageUrl unitPrice' });
  res.json(orders);
});

export const reorder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const prev = await Order.findById(orderId);
  if (!prev) {
    return res.status(404).json({ message: 'Previous order not found' });
  }
  const newOrder = await Order.create({
    user: prev.user,
    companyName: prev.companyName,
    items: prev.items.map((i) => ({ product: i.product, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
    totalAmount: prev.totalAmount,
  });
  const populated = await newOrder.populate({ path: 'items.product', select: 'name companyName imageUrl unitPrice' });
  res.status(201).json(populated);
});