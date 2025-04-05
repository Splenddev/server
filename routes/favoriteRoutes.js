import express from 'express';
import {
  addToFavorite,
  getFavorites,
  removeFromFavorite,
  getUserFavorites,
  removeFavoriteByFoodId,
} from '../controllers/favoriteController.js';
import authMiddleware from '../middlewares/auth.js';
const favoriteRoutes = express.Router();
favoriteRoutes.post('/add', authMiddleware, addToFavorite);
favoriteRoutes.get('/list', getFavorites);
favoriteRoutes.post('/get', authMiddleware, getUserFavorites);
favoriteRoutes.post('/remove', authMiddleware, removeFromFavorite);
favoriteRoutes.post(
  '/remove/by/foodId',
  authMiddleware,
  removeFavoriteByFoodId
);
export default favoriteRoutes;
