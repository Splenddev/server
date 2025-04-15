import express from 'express';
import {
  generateReceipt,
  downloadReceipt,
} from '../controllers/receiptHandler.js';

const receiptRouter = express.Router();

receiptRouter.post('/generate', generateReceipt);
receiptRouter.get('/download/:orderId', downloadReceipt);

export default receiptRouter;
