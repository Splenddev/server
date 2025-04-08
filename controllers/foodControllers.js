import { privateDecrypt } from 'crypto';
import foodModel from '../models/foodModel.js';
import fs from 'fs';

// add food

const addFood = async (req, res) => {
  let image_filename = `${req.file.filename}`;
  const food = new foodModel({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    image: image_filename,
    customerChoice: req.body.customerChoice,
    kitchen: {
      kitchen_name: req.body.kitchen_name,
      location: req.body.location,
      restaurantPriority: req.body.restaurantPriority,
    },
    foodInformation: {
      category: {
        ingredients: req.body.ingredients?.split(','),
        allergens: req.body.allergens?.split(',') || [],
      },
      nutrients: {
        calories: req.body.calories,
        others: req.body.others ? JSON.parse(req.body.others) : [],
      },
      healthImpacts: {
        benefits: req.body.benefits?.split(','),
        risks: req.body.risks?.split(','),
      },
      extras: req.body.extras ? JSON.parse(req.body.extras) : [],
    },
  });
  try {
    await food.save();
    res.json({ success: true, message: 'Food added successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Failed to add food' });
  }
};
//all food list
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error. Cant fetch foods' });
  }
};
const searchFood = async (req, res) => {
  const searchQuery = req.query.search || '';
  try {
    const foods = await foodModel
      .find({
        name: { $regex: searchQuery, $options: 'i' },
      })
      .limit(10);
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error. Cant find this food' });
  }
};
// update Food
const updateFood = async (req, res) => {
  const { foodId, type } = req.body;
  const food = await foodModel.findById(foodId);
  if (!food) {
    return res
      .status(404)
      .json({ success: false, message: 'There is no food with this id' });
  }
  try {
    if (type === 'image' && req.file) {
      if (food.image) {
        const oldImagePath = `uploads/${food.image}`;
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      food.image = req.file.filename;
    }
    if (type === 'main') {
      const { name, price, description, category } = req.body;
      if (name) food.name = name;
      if (price) food.price = price;
      if (description) food.description = description;
      if (category) food.category = category;
    }
    if (type === 'kitchenInfo') {
      const { location, kitchen_name, restaurantPriority, customerChoice } =
        req.body;
      if (location) food.kitchen.location = location;
      if (kitchen_name) food.kitchen.kitchen_name = kitchen_name;
      if (restaurantPriority)
        food.kitchen.restaurantPriority = restaurantPriority;
      if (customerChoice) food.customerChoice = customerChoice;
    }
    await food.save();
    res.status(200).json({
      success: true,
      message: 'image updated successfully',
      data: food,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server Error!',
    });
  }
};
// remove food
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    fs.unlink(`uploads/${food.image}`, () => {});

    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: 'food removed' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error removing this food.' });
  }
};
const getOneFood = async (req, res) => {
  try {
    const foodId = req.body.id;
    const food = await foodModel.findById(foodId);
    // console.log(foodId);
    // console.log(food);

    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: 'There is no food with this id' });
    }
    res.status(200).json({
      success: true,
      message: 'Food found',
      data: food,
    });
  } catch (error) {
    console.log(error);
  }
};
const filterFood = async (req, res) => {
  const { filterData, search } = req.body;
  try {
    let filter = {};
    if (filterData.category !== '' && filterData.category !== undefined) {
      filter.category = { $in: filterData.category };
    }
    if (filterData.price !== '' && filterData.price !== undefined) {
      filter.price = { $in: filterData.price };
    }
    if (filterData.reput !== '' && filterData.reput !== undefined) {
      filter.customerChoice = {
        $in: filterData.reput,
      };
    }
    if (filterData.location !== '' && filterData.location !== undefined) {
      filter['kitchen.location'] = { $in: filterData.location };
    }
    if (filterData.kitchen !== '' && filterData.kitchen !== undefined) {
      filter['kitchen.kitchen_name'] = { $in: filterData.kitchen };
    }
    if (search && search.trim() !== '') {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }
    if (Object.keys(filter).length === 0)
      return res.status(400).json({
        success: false,
        message:
          'Cant proceed. Please choose at least one filter in Filter Option e.g category',
      });
    const food = await foodModel.find(Object.keys(filter).length ? filter : {});

    if (!food || food.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No food matched your filter (or/and) search. Try another.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Food found',
      data: food,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message:
        'An error occurred while filtering (and/or) searching this food.',
    });
  }
};

export {
  addFood,
  listFood,
  searchFood,
  getOneFood,
  removeFood,
  updateFood,
  filterFood,
};
