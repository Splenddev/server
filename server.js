import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { connectDB } from './config/db.js';
import foodRouter from './routes/foodRoutes.js';
import userRouter from './routes/userRoute.js';
import 'dotenv/config';
import cartRouter from './routes/cartRoutes.js';
import orderRouter from './routes/orderRoutes.js';
//app config
const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: 'SESSION_SECRET_KEY',
    resave: false,
    saveUninitialized: false,
  })
);
// db connection
connectDB();

//api endpoints
app.use('/api/food', foodRouter);
app.use('/images', express.static('uploads'));
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

app.get('/', (req, res) => {
  res.send('Hello World! API working');
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
