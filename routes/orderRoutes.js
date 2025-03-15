import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import { placeOrder, verifyPayment } from '../controllers/orderController.js';

const orderRouter = express.Router();
orderRouter.post('/payment', authMiddleware, placeOrder);
orderRouter.get('/verify-payments', verifyPayment);

export default orderRouter;
