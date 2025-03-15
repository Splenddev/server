import mongoose from 'mongoose';

export const connectDB = async () => {
  await mongoose
    .connect(
      'mongodb+srv://michaelnwode023:kitchen-connect@cluster0.btcaa.mongodb.net/food-del-app'
    )
    .then(() => console.log('Database connected'));
};
