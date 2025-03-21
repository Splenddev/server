import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import {
  createOrder,
  getAllUsersOrders,
  getOrders,
  deleteAllOrder,
  deleteOrder,
  verifyPayment,
} from '../controllers/orderController.js';

const orderRouter = express.Router();
orderRouter.post('/create', authMiddleware, createOrder);
orderRouter.post('/verify-payments', verifyPayment);
orderRouter.post('/userorders', authMiddleware, getOrders);
orderRouter.get('/list', getAllUsersOrders);
orderRouter.post('/delete', authMiddleware, deleteOrder);
orderRouter.post('/delete/all', authMiddleware, deleteAllOrder);

export default orderRouter;
