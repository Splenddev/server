import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import {
  createOrder,
  getAllUsersOrders,
  createOrderPaystack,
  verifyPaymentPaystack,
  getOrders,
  deleteOrderAdmin,
  deleteOrder,
  verifyPayment,
  requery,
  createOrderMonnify,
  verifyMonnifyPayment,
  requeryMonnify,
  deleteOrderAdminMultiple,
  updateStatus,
  trackOrder,
} from '../controllers/orderController.js';
import { generateTransactionId } from '../middlewares/genTxId.js';

const orderRouter = express.Router();
orderRouter.post(
  '/create/paystack',
  authMiddleware,
  generateTransactionId,
  createOrderPaystack
);
orderRouter.post(
  '/create/monnify',
  authMiddleware,
  generateTransactionId,
  createOrderMonnify
);
orderRouter.post('/verify-payments/paystack', verifyPaymentPaystack);
orderRouter.post('/verify-payments/monnify', verifyMonnifyPayment);
orderRouter.post('/create', authMiddleware, createOrder);
orderRouter.post('/verify-payments', verifyPayment);
orderRouter.post('/userorders', authMiddleware, getOrders);
orderRouter.get('/list', getAllUsersOrders);
orderRouter.post('/requery/paystack', requery);
orderRouter.post('/requery/monnify', requeryMonnify);
orderRouter.post('/delete', authMiddleware, deleteOrder);
orderRouter.post('/delete/admin', deleteOrderAdmin);
orderRouter.post('/delete/admin/multiple', deleteOrderAdminMultiple);
orderRouter.post('/status', updateStatus);
orderRouter.get('/track/:id', trackOrder);

export default orderRouter;
