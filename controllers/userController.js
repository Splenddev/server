import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import userModel from '../models/userModel.js';

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
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error!',
    });
  }
};
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
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
//update user info
const updateUserInfo = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { name, email, username } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }
    if (user.name === name) {
      return res
        .status(404)
        .json({ success: false, message: 'Name matches the previous data.' });
    }
    if (user.email === email) {
      return res
        .status(404)
        .json({ success: false, message: 'Email matches the previous data.' });
    }
    const isUsernameUsed =
      user.previousCredentials.find((cred) => cred.username === username) !==
      undefined;
    if (isUsernameUsed) {
      return res.status(400).json({
        success: false,
        message:
          'This username was used before. Please choose a different one.',
      });
    }
    if (username !== user.username) {
      user.previousCredentials.push({
        username: user.username,
        changeDate: new Date(),
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (username) user.username = username;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error!' });
  }
};

//update user password
const updatePassword = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { oldPassword, newPassword } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    const isSame = await bcrypt.compare(newPassword, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: 'Incorrect old password.' });
    }
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: 'New password matches old password.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();
    return res
      .status(200)
      .json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ success: false, message: 'Server error.', error });
  }
};

//update profile pic
const updateUserPic = async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(404).json({ success: false, message: 'no image found' });
  }
  const profileImage = `${req.file.filename}`;

  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'user not found' });
    }
    user.profileImage = profileImage;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

//delete user account
const deleteUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await userModel.findByIdAndDelete(userId);
    res.status(200).json({
      success: true,
      message: 'Your account has been deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user account.',
      error,
    });
  }
};

//delete user account (admin)
const deleteUserByAdmin = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    await userModel.findByIdAndDelete(userId);
    res.status(200).json({
      success: true,
      message: 'User successfully deleted by admin.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error.',
      error,
    });
  }
};

//create username
const createUsername = async (req, res) => {
  try {
    const { firstName, lastName, type } = req.body;

    if (!req.session.usernameAttempts) {
      req.session.usernameAttempts = 0;
    }
    if (req.session.usernameAttempts > 0) {
      return res.status(400).json({
        success: false,
        message: 'Limit reached! You can only generate 5 usernames.',
      });
    }
    req.session.usernameAttempts++;

    if (type === 'useFirstName' && (!firstName || firstName.length < 3)) {
      return res.status(400).json({
        success: false,
        message: 'First name must be at least 3 characters long.',
      });
    }
    if (type === 'useLastName' && (!lastName || lastName.length < 3)) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be at least 3 characters long.',
      });
    }
    let random_num = Math.floor(Math.random() * 100);
    let newUserName = '';
    let formattedCount = String(random_num).padStart(3, '0');
    if (type === 'autoGen') {
      if (!firstName || !lastname) {
        const option = [
          'KC_USER',
          'KC_CUSTOMER',
          'KITCHEN_CONNECT_CUSTOMER',
          'KITCHEN_CONNECT_USER',
        ];
        newUserName =
          option[Math.floor(Math.random() * option.length)] + formattedCount;
      } else {
        const option = [fisrtName, lastName];
        newUserName =
          option[Math.floor(Math.random() * option.length)] + formattedCount;
      }
    } else {
      newUserName = type === 'useFirstName' ? firstName : lastName;
      const random_figures =
        Math.floor(Math.random() * 9).toString() +
        Math.floor(Math.random() * 999);
      newUserName += random_figures;
    }

    const isUserNameTaken = await userModel.findOne({ userName: newUserName });

    if (isUserNameTaken) {
      return res.status(400).json({
        success: false,
        message: 'Generated username already exists, try again.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Username is available, you can now proceed.',
      username: newUserName,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error!',
      error: error.message,
    });
  }
};
export {
  loginUser,
  signUpUser,
  updateUserInfo,
  deleteUser,
  updatePassword,
  deleteUserByAdmin,
  createUsername,
  updateUserPic,
};
