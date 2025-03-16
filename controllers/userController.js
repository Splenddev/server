// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';
// import validator from 'validator';
// import userModel from '../models/userModel.js';
// import mongoose from 'mongoose';

// const createToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '10s' });
// };

// //log in user
// const loginUser = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await userModel.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User doesnt exists. Please signup',
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'wrong password',
//       });
//     }

//     const token = createToken(user._id);

//     res.status(200).json({
//       success: true,
//       message: 'login successful',
//       token,
//       user: { id: user._id, name: user.name, email: user.email },
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal Server Error!',
//     });
//   }
// };

// //sign Up User
// const signUpUser = async (req, res) => {
//   const { name, password, email } = req.body;

//   try {
//     //User already exists
//     const exist = await userModel.findOne({ email });
//     if (exist) {
//       return res.status(409).json({
//         success: false,
//         message: 'Email already exists. Please Login',
//       });
//     }

//     //validating email and password
//     if (!validator.isEmail(email)) {
//       return res.status(404).json({
//         success: false,
//         message: 'Please enter a valid email address',
//       });
//     }
//     if (
//       !validator.isStrongPassword(password, {
//         minLength: 8,
//         minUppercase: 1,
//         minNumbers: 1,
//         minSymbols: 1,
//       })
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           'Password must be at least 8 characters long, include a symbol, an uppercase and a number',
//       });
//     }

//     // all conditions passed
//     // hashing user password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = new userModel({
//       name,
//       email,
//       password: hashedPassword,
//     });
//     const user = await newUser.save();

//     const token = createToken(user._id);
//     res.json({
//       success: true,
//       message: 'User created. Now you can proceed to Login.',
//       token,
//     });
//   } catch (error) {
//     console.log(error);
//     res.json({ success: false, message: 'Error!' });
//   }
// };
// const updateUserInfo = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
//       return res.status(400).json({
//         success: false,
//         message: ' user id not found.',
//         error: error.message,
//       });
//     }
//     let userData = await userModel.findOne({ _id: req.body.userId });
//     if (!mongoose.isValidObjectId(req.body.userId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid user ID format.',
//       });
//     }
//     const userDataUpdate = { ...req.body };
//     delete userDataUpdate._id;
//     delete userDataUpdate.email;

//     // let isSameData = true;
//     const isSamePassword = userDataUpdate.password
//       ? await bcrypt.compare(userDataUpdate.password, userData.password)
//       : true;
//     const isSameName = userDataUpdate.name
//       ? userDataUpdate.name === userData.name
//       : true;
//     const isSamePhoneNumber = userDataUpdate.phoneNumber
//       ? Number(userDataUpdate.phoneNumber) === userData.phoneNumber
//       : true;

//     if (isSameName && isSamePhoneNumber) {
//       return res.status(200).json({
//         success: false,
//         message:
//           'No changes detected. All provided data matches the existing data.',
//       });
//     }
//     // else {
//     if (isSameName || isSamePhoneNumber) {
//       return res.status(200).json({
//         success: false,
//         message: `No changes detected. One of the provided data matches the existing data.`,
//       });
//     }
//     if (isSamePassword) {
//       return res.status(200).json({
//         success: false,
//         message:
//           'No changes detected. The provided password matches the existing data.',
//       });
//     }

//     if (userDataUpdate.password) {
//       if (
//         !validator.isStrongPassword(userDataUpdate.password, {
//           minLength: 8,
//           minUppercase: 1,
//           minNumbers: 1,
//           minSymbols: 1,
//         })
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             'Password must be at least 8 characters long, include a symbol, an uppercase and a number',
//         });
//       }
//       const salt = await bcrypt.genSalt(10);
//       userDataUpdate.password = await bcrypt.hash(
//         userDataUpdate.password,
//         salt
//       );
//     }
//     if (userDataUpdate.phoneNumber) {
//       userDataUpdate.phoneNumber = Number(userDataUpdate.phoneNumber);
//     }
//     if (userDataUpdate.name) {
//       userDataUpdate.name = userDataUpdate.name;
//     }

//     const updatedUserInfo = await userModel
//       .findByIdAndUpdate(req.body.userId, userDataUpdate, { new: true })
//       .select('-password -__v');
//     return res.status(200).json({
//       success: true,
//       message: 'Changes saved successfully.',
//       data: updatedUserInfo,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update user details.',
//       error: error.message,
//     });
//   }
// };
// const deleteUser = async (req, res) => {
//   const userId = req.params.userId;
//   try {
//     const deletedUser = await userModel.findByIdAndDelete(userId);
//     if (!deletedUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found. No account deleted.',
//       });
//     }
//     return res.status(200).json({
//       success: true,
//       message: 'User account deleted successfully.',
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete user account.',
//       error: error.message,
//     });
//   }
// };
// export { loginUser, signUpUser, updateUserInfo, deleteUser };

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import userModel from '../models/userModel.js';

const createToken = (id, expiresIn) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// **Login User & Generate Refresh Token**
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found. Please sign up.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Incorrect password.' });
    }

    const accessToken = createToken(user._id, '1h');
    const refreshToken = createToken(user._id, '7d');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// **Sign Up User**
const signUpUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await userModel.findOne({ email })) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists. Please log in.',
      });
    }
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email format.' });
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
        message: 'Weak password. Use 8+ chars, uppercase, number, symbol.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
    const accessToken = createToken(user._id, '1h');
    const refreshToken = createToken(user._id, '7d');

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// **Refresh Access Token**
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: 'Refresh token required.' });
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: 'Invalid refresh token.' });
      }
      const accessToken = createToken(decoded.id, '1h');
      res.status(200).json({ success: true, accessToken });
    });
  } catch (error) {
    next(error);
  }
};

// **Update User Info (Protected)**
const updateUserInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }
    const updates = { ...req.body };
    delete updates.email;
    delete updates.password;

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, updates, { new: true })
      .select('-password');
    res
      .status(200)
      .json({ success: true, message: 'Profile updated.', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// **Delete User (Protected)**
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deletedUser = await userModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }
    res
      .status(200)
      .json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export {
  loginUser,
  signUpUser,
  refreshAccessToken,
  updateUserInfo,
  deleteUser,
};
