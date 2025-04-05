import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  kitchenName: { type: String, required: true },
  kitchenLocation: { type: String, required: true },
  deliveryTime: { type: String, default: '30 minutes', required: true },
  date: { type: Date, default: Date.now(), required: true },
  price: { type: Number, required: true },
  foodId: { type: String, required: true },
  image: { type: String, required: true },
});
const favoriteModel =
  mongoose.models.favorite || mongoose.model('favorite', favoriteSchema);
export default favoriteModel;
