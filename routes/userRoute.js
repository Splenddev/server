import express from 'express';
import {
  deleteUser,
  loginUser,
  signUpUser,
  updateUserInfo,
} from '../controllers/userController.js';
import authMiddleware from '../middlewares/auth.js';

const userRouter = express.Router();

userRouter.post('/register', signUpUser);
userRouter.post('/login', loginUser);
userRouter.put('/update', authMiddleware, updateUserInfo);
userRouter.delete('/delete', authMiddleware, deleteUser);

export default userRouter;
