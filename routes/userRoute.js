import express from 'express';
import {
  createUsername,
  deleteUser,
  deleteUserByAdmin,
  loginUser,
  signUpUser,
  updatePassword,
  updateUserInfo,
} from '../controllers/userController.js';
import authMiddleware from '../middlewares/auth.js';
import adminMiddleware from '../middlewares/admin.js';

const userRouter = express.Router();

userRouter.post('/register', signUpUser);
userRouter.post('/login', loginUser);
userRouter.post('/create-username', createUsername);
userRouter.put('/update/profile', authMiddleware, updateUserInfo);
userRouter.put('/update/password', authMiddleware, updatePassword);
userRouter.delete('/delete', authMiddleware, deleteUser);
userRouter.delete(
  '/admin/delete/:id',
  authMiddleware,
  adminMiddleware,
  deleteUserByAdmin
);

export default userRouter;
