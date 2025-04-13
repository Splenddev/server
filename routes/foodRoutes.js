import express from 'express';
import {
  addFood,
  filterFood,
  getOneFood,
  listFood,
  removeFood,
  searchFood,
  updateFood,
  addReviewFood,
} from '../controllers/foodControllers.js';
import authMiddleware from '../middlewares/auth.js';
import multer from 'multer';

const foodRouter = express.Router();

// image storage engine

const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

foodRouter.post('/add', upload.single('image'), addFood);
foodRouter.get('/list', listFood);
foodRouter.post('/get/one', getOneFood);
foodRouter.get('/list/search', searchFood);
foodRouter.post('/remove', removeFood);
foodRouter.post('/filter', filterFood);
foodRouter.put('/review', authMiddleware, addReviewFood);
foodRouter.put('/update', upload.single('image'), updateFood);

export default foodRouter;
