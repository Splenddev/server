import favoriteModel from '../models/favoriteModel.js';
import foodModel from '../models/foodModel.js';
import userModel from '../models/userModel.js';

const addToFavorite = async (req, res) => {
  try {
    const { userId, foodId } = req.body;
    const food = await foodModel.findById(foodId);
    const user = await userModel.findById(userId);
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: 'Food not found' });
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Food not found' });
    }
    const foodName = food.name;
    const existingFav = await favoriteModel.findOne({ foodName });
    if (existingFav) {
      return res
        .status(400)
        .json({ success: false, message: 'Already in database favorites' });
    }
    const inUserFav = user.favorites.filter((fav) => fav.foodId === foodId);

    if (inUserFav.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Already in user favorites' });
    }

    const newFav = new favoriteModel({
      name: food.name,
      kitchenName: food.kitchen.kitchen_name,
      kitchenLocation: food.kitchen.location,
      price: food.price,
      image: food.image,
      foodId,
    });
    await newFav.save();
    user.favorites.push(newFav);
    await user.save();
    res
      .status(200)
      .json({ success: true, message: 'Added to favorites', newFav });
  } catch (error) {
    console.log('Server error', error);
    res
      .status(500)
      .json({ success: false, message: 'failed to add to favorites' });
  }
};
const getFavorites = async (req, res) => {
  try {
    const favorites = await favoriteModel.find({});
    res.json({ success: true, message: 'Favorites fetched', favorites });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: true, message: 'Server error' });
  }
};
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);
    // const user = await userModel.findOne({ email });
    const userFavorites = user.favorites;
    res.json({
      success: true,
      message: 'Favorites fetched',
      favorites: userFavorites,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: true, message: 'Server error' });
  }
};
const removeFromFavorite = async (req, res) => {
  try {
    const { userId, favoriteId, foodId } = req.body;
    const favorite = await favoriteModel.findById(favoriteId);
    const user = await userModel.findById(userId);
    const food = await foodModel.findById(foodId);
    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Fav found' });
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'user not found' });
    }
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: 'Food not found' });
    }

    user.favorites = user.favorites.filter((fav) => fav.foodId != foodId);

    await user.save();

    await favoriteModel.findByIdAndDelete(favoriteId);
    res.status(200).json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.log('Server error', error);
    res.status(500).json({ success: false, message: 'Error!' });
  }
};
const removeFavoriteByFoodId = async (req, res) => {
  try {
    const { userId, foodId } = req.body;
    const user = await userModel.findById(userId);
    const food = await foodModel.findById(foodId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'user not found' });
    }
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: 'Food not found' });
    }

    user.favorites = user.favorites.filter((fav) => fav.foodId != foodId);

    await user.save();
    res.status(200).json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.log('Server error', error);
    res.status(500).json({ success: false, message: 'Error!' });
  }
};
export {
  addToFavorite,
  getFavorites,
  removeFavoriteByFoodId,
  removeFromFavorite,
  getUserFavorites,
};
