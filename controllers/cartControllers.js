import userModel from '../models/userModel.js';
//add items to cart
const addToCart = async (req, res) => {
  try {
    let userData = await userModel.findOne({ _id: req.body.userId });
    let cartData = await userData.cartData;

    if (!cartData[req.body.itemId]) {
      cartData[req.body.itemId] = 1;
    } else {
      cartData[req.body.itemId] += 1;
    }
    await userModel.findByIdAndUpdate(req.body.userId, { cartData });
    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to add to cart' });
  }
};

//remove items from cart
const removeFromCart = async (req, res) => {
  try {
    let userData = await userModel.findOne({ _id: req.body.userId });
    let cartData = await userData.cartData;
    if (cartData[req.body.itemId] > 0) {
      cartData[req.body.itemId] -= 1;
    }
    await userModel.findByIdAndUpdate(req.body.userId, { cartData });
    res.json({ success: true, message: 'Removed from cart' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: ' Failed to remove from cart' });
  }
};
// remove all items from cart
const removeAllFromCart = async (req, res) => {
  try {
    let userData = await userModel.findOne({ _id: req.body.userId });
    let cartData = await userData.cartData;
    if (cartData[req.body.itemId] > 0) {
      cartData[req.body.itemId] -= cartData[req.body.itemId];
    }
    await userModel.findByIdAndUpdate(req.body.userId, { cartData });
    res.json({ success: true, message: 'Removed from cart' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: ' Failed to remove from cart' });
  }
};
// set cart to zero
const setCartToZero = async (req, res) => {
  try {
    let userData = await userModel.findOne({ _id: req.body.userId });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: ' user not found' });
    }
    let cartData = {};
    await userModel.findByIdAndUpdate(
      req.body.userId,
      { $set: { cartData: cartData } },
      { new: true }
    );
    res.json({ success: true, message: ' cart reset successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: ' Failed to reset cart' });
  }
};

//get items from cart
const getCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    let cartData = await userData.cartData;
    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: ' Error!' });
  }
};

export { addToCart, removeFromCart, getCart, removeAllFromCart, setCartToZero };
