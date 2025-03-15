import mongoose from 'mongoose';

// food schema
const foodSchema = new mongoose.Schema(
  {
    all: { type: String, default: 'all', required: false },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    kitchen: {
      kitchen_name: { type: String, required: true },
      location: { type: String, required: true },
      restaurantPriority: { type: String, required: false },
    },
    customerChoice: { type: String, required: false },
    foodInformation: {
      category: {
        ingredients: { type: [String], required: true },
        allergens: { type: [String], default: [] },
      },
      nutrients: {
        calories: { type: Number, required: true },
        others: { type: Map, of: Number, default: {} },
      },
      healthImpacts: {
        benefits: { type: [String], required: true },
        risks: { type: [String], required: true },
      },
      extrasAndMods: {
        extras: { type: [String], default: [] },
        mods: { type: [String], default: [] },
      },
    },
  },
  { timestamps: true }
);

const foodModel = mongoose.models.food || mongoose.model('food', foodSchema);

export default foodModel;
