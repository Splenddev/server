import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import {
  createOrder,
  getAllUsersOrders,
  getOrders,
  placeOrder,
  verifyPayment,
} from '../controllers/orderController.js';

const orderRouter = express.Router();
orderRouter.post('/create', authMiddleware, createOrder);
orderRouter.post('/payment', authMiddleware, placeOrder);
orderRouter.post('/verify-payments', verifyPayment);
orderRouter.post('/userorders', authMiddleware, getOrders);
orderRouter.get('/list', getAllUsersOrders);

export default orderRouter;
