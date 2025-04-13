import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: Object, default: {} },
  comment: { type: String },
  date: { type: Date, default: Date.now },
  image: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
});

const reviewModel =
  mongoose.models.review || mongoose.model('review', reviewSchema);

export default reviewModel;
