import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import {
  addToCart,
  getCart,
  removeAllFromCart,
  removeFromCart,
  setCartToZero,
} from '../controllers/cartControllers.js';

const cartRouter = express.Router();

cartRouter.post('/add', authMiddleware, addToCart);
cartRouter.post('/remove', authMiddleware, removeFromCart);
cartRouter.post('/remove/all', authMiddleware, removeAllFromCart);
cartRouter.post('/get', authMiddleware, getCart);
cartRouter.put('/empty-cart', authMiddleware, setCartToZero);

export default cartRouter;
