import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import {
  createOrder,
  getAllUsersOrders,
  createOrderPaystack,
  verifyPaymentPaystack,
  getOrders,
  deleteAllOrder,
  deleteOrder,
  verifyPayment,
  requery,
} from '../controllers/orderController.js';
import { generateTransactionId } from '../middlewares/genTxId.js';

const orderRouter = express.Router();
orderRouter.post(
  '/create/paystack',
  authMiddleware,
  generateTransactionId,
  createOrderPaystack
);
orderRouter.post('/verify-payments/paystack', verifyPaymentPaystack);
orderRouter.post('/create', authMiddleware, createOrder);
orderRouter.post('/verify-payments', verifyPayment);
orderRouter.post('/userorders', authMiddleware, getOrders);
orderRouter.get('/list', getAllUsersOrders);
orderRouter.post('/requery', requery);
orderRouter.post('/delete', authMiddleware, deleteOrder);
orderRouter.post('/delete/all', authMiddleware, deleteAllOrder);

export default orderRouter;
