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
        others: req.body.others ? JSON.parse(req.body.others) : {},
      },
      healthImpacts: {
        benefits: req.body.benefits?.split(','),
        risks: req.body.risks?.split(','),
      },
      extrasAndMods: {
        extras: req.body.extras?.split(',') || [],
        mods: req.body.mods?.split(',') || [],
      },
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
    const foods = await foodModel.find({});
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

export { addFood, listFood, searchFood, removeFood };
