import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 10000 },
});
const counterModel =
  mongoose.models.counter || mongoose.model('counter', counterSchema);
export default counterModel;
