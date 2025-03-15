import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: { type: String, required: true },
    phoneNumber: { type: Number, default: 0 },
    address: { type: String, default: '' },
    paymentOption: { type: String, default: 'Flutterwave' },
    profileImage: { type: String, required: false },
    notifications: { type: String, default: '' },
    cartData: { type: Object, default: {} },
    settings: { type: Object, default: {} },
    orderHistory: { type: Object, default: {} },
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
