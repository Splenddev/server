import express from 'express';
import {
  addFood,
  listFood,
  removeFood,
  searchFood,
} from '../controllers/foodControllers.js';
import multer from 'multer';

const foodRouter = express.Router();

// image storage engine

const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

foodRouter.post('/add', upload.single('image'), addFood);
foodRouter.get('/list', listFood);
foodRouter.get('/list/search', searchFood);
foodRouter.post('/remove', removeFood);

export default foodRouter;
