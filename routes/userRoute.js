// import express from 'express';
// import {
//   deleteUser,
//   loginUser,
//   signUpUser,
//   updateUserInfo,
// } from '../controllers/userController.js';
// import authMiddleware from '../middlewares/auth.js';

// const userRouter = express.Router();

// userRouter.post('/register', signUpUser);
// userRouter.post('/login', loginUser);
// userRouter.put('/update', authMiddleware, updateUserInfo);
// userRouter.delete('/delete', authMiddleware, deleteUser);

// export default userRouter;

import express from 'express';
import {
  loginUser,
  signUpUser,
  refreshToken,
  updateUserInfo,
  deleteUser,
} from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/signup', signUpUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);

// Protected Routes (Requires Authentication)
router.put('/update', authMiddleware, updateUserInfo);
router.delete('/delete', authMiddleware, deleteUser);

export default router;
