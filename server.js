import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import foodRouter from './routes/foodRoutes.js';
import userRouter from './routes/userRoute.js';
import 'dotenv/config';
import cartRouter from './routes/cartRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import receiptRouter from './routes/receiptRoutes.js';
//app config
const app = express();
const port = process.env.PORT || 4000;

// const allowedOrigin = [
//   'http://localhost:5173/',
//   'https://kitchen-connect-com.onrender.com/',
// ];

// middleware
app.use(
  cors({
    origin: '*',

    methods: ['GET', 'PUT', 'POST', 'DELETE'],
  })
);
app.use(express.json());

// db connection
connectDB();

//api endpoints
app.use('/api/food', foodRouter);
app.use('/images', express.static('uploads'));
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/review', reviewRouter);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/receipt', receiptRouter);

app.get('/', (req, res) => {
  res.send('Hello World! API working');
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
