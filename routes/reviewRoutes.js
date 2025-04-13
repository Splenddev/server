import { addReviewWebsite } from '../controllers/reviewController.js';
import authMiddleware from '../middlewares/auth.js';
import express from 'express';

const reviewRouter = express.Router();
reviewRouter.post('/add', authMiddleware, addReviewWebsite);
export default reviewRouter;
