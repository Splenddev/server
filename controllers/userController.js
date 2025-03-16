import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import userModel from '../models/userModel.js';
import mongoose from 'mongoose';

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

//log in user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User doesnt exists. Please signup',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'wrong password',
      });
    }

    const token = createToken(user._id);

    res.status(200).json({
      success: true,
      message: 'login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
    });
  }
};

//sign Up User
const signUpUser = async (req, res) => {
  const { name, password, email } = req.body;

  try {
    //User already exists
    const exist = await userModel.findOne({ email });
    if (exist) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists. Please Login',
      });
    }

    //validating email and password
    if (!validator.isEmail(email)) {
      return res.status(404).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long, include a symbol, an uppercase and a number',
      });
    }

    // all conditions passed
    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });
    const user = await newUser.save();

    const token = createToken(user._id);
    res.json({
      success: true,
      message: 'User created. Now you can proceed to Login.',
      token,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error!' });
  }
};
const updateUserInfo = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
      return res.status(400).json({
        success: false,
        message: ' user id not found.',
        error: error.message,
      });
    }
    let userData = await userModel.findOne({ _id: req.body.userId });
    if (!mongoose.isValidObjectId(req.body.userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.',
      });
    }
    const userDataUpdate = { ...req.body };
    delete userDataUpdate._id;
    delete userDataUpdate.email;

    // let isSameData = true;
    const isSamePassword = userDataUpdate.password
      ? await bcrypt.compare(userDataUpdate.password, userData.password)
      : true;
    const isSameName = userDataUpdate.name
      ? userDataUpdate.name === userData.name
      : true;
    const isSamePhoneNumber = userDataUpdate.phoneNumber
      ? Number(userDataUpdate.phoneNumber) === userData.phoneNumber
      : true;

    if (isSameName && isSamePhoneNumber) {
      return res.status(200).json({
        success: false,
        message:
          'No changes detected. All provided data matches the existing data.',
      });
    }
    // else {
    if (isSameName || isSamePhoneNumber) {
      return res.status(200).json({
        success: false,
        message: `No changes detected. One of the provided data matches the existing data.`,
      });
    }
    if (isSamePassword) {
      return res.status(200).json({
        success: false,
        message:
          'No changes detected. The provided password matches the existing data.',
      });
    }

    if (userDataUpdate.password) {
      if (
        !validator.isStrongPassword(userDataUpdate.password, {
          minLength: 8,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        })
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Password must be at least 8 characters long, include a symbol, an uppercase and a number',
        });
      }
      const salt = await bcrypt.genSalt(10);
      userDataUpdate.password = await bcrypt.hash(
        userDataUpdate.password,
        salt
      );
    }
    if (userDataUpdate.phoneNumber) {
      userDataUpdate.phoneNumber = Number(userDataUpdate.phoneNumber);
    }
    if (userDataUpdate.name) {
      userDataUpdate.name = userDataUpdate.name;
    }

    const updatedUserInfo = await userModel
      .findByIdAndUpdate(req.body.userId, userDataUpdate, { new: true })
      .select('-password -__v');
    return res.status(200).json({
      success: true,
      message: 'Changes saved successfully.',
      data: updatedUserInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user details.',
      error: error.message,
    });
  }
};
const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const deletedUser = await userModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found. No account deleted.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'User account deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user account.',
      error: error.message,
    });
  }
};
export { loginUser, signUpUser, updateUserInfo, deleteUser };
