import mongoose from 'mongoose';

export const connectDB = async () => {
  await mongoose
    .connect(
      'mongodb+srv://michaelnwode023:kitchen-connect@cluster0.btcaa.mongodb.net/food-del-app'
      // 'mongodb+srv://felixnwode255:0123456789@kc-app.3gfox.mongodb.net/food-del-database'
    )
    .then(() => console.log('Database connected'));
};
