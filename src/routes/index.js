import { Router } from 'express';
import { getProfile, updateProfile, listUsers, createUser } from '../controllers/userController.js';
import { getOrderHistory, placeOrder, reorder } from '../controllers/orderController.js';

const router = Router();

// User profile
router.get('/users', listUsers);
router.post('/users', createUser);
router.get('/users/:userId', getProfile);
router.put('/users/:userId', updateProfile);

// Orders
router.get('/orders', getOrderHistory); // ?userId=xxx
router.post('/orders', placeOrder);
router.post('/orders/:orderId/reorder', reorder);

export default router;