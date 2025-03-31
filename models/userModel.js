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
    username: { type: String, default: '', unique: true },
    address: { type: String, default: '' },
    paymentOption: { type: String, default: 'Flutterwave' },
    profileImage: { type: String, required: false },
    notifications: { type: String, default: '' },
    cartData: { type: Object, default: {} },
    settings: { type: Object, default: {} },
    session: { type: Object, default: 0 },
    previousCredentials: [
      {
        username: String,
        changeDate: { type: Date, default: Date.now() },
      },
    ],
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
