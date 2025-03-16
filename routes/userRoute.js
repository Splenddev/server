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
  refreshAccessToken,
  loginUser,
  signUpUser,
  updateUserInfo,
  deleteUser,
  refreshAccessToken,
} from '../controllers/userController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

// Public Routes
router.post('/refresh', refreshAccessToken);
router.post('/signup', signUpUser);
router.post('/login', loginUser);

// Protected Routes (Requires Authentication)
router.put('/update', authMiddleware, updateUserInfo);
router.delete('/delete', authMiddleware, deleteUser);

export default router;
