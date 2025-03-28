import express from 'express';
import {
  createUsername,
  deleteUser,
  deleteUserByAdmin,
  loginUser,
  signUpUser,
  updatePassword,
  updateUserInfo,
  updateUserPic,
} from '../controllers/userController.js';
import authMiddleware from '../middlewares/auth.js';
import adminMiddleware from '../middlewares/admin.js';
import multer from 'multer';

const userRouter = express.Router();

const generateChars = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => {
    return cb(null, `USER-PIC-${generateChars()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

userRouter.post('/register', signUpUser);
userRouter.post('/login', loginUser);
userRouter.post('/create-username', createUsername);
userRouter.put('/update/profile', authMiddleware, updateUserInfo);
userRouter.put('/update/password', authMiddleware, updatePassword);
userRouter.put(
  '/update/profile/image',
  upload.single('image'),
  authMiddleware,
  updateUserPic
);
userRouter.delete('/delete', authMiddleware, deleteUser);
userRouter.delete(
  '/admin/delete/:id',
  authMiddleware,
  adminMiddleware,
  deleteUserByAdmin
);

export default userRouter;
