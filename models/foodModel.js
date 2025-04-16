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
    customerChoice: { type: String, required: false, default: 'Top Food' },
    foodInformation: {
      category: {
        ingredients: { type: [String], required: true },
        allergens: { type: [String], default: [] },
      },
      nutrients: {
        calories: { type: Number, required: true },
        others: [
          new mongoose.Schema(
            {
              name: { type: String },
              composition: { type: Number },
            },
            {
              _id: false,
            }
          ),
        ],
      },
      healthImpacts: {
        benefits: { type: [String], required: true },
        risks: { type: [String], required: true },
      },
      extras: [
        new mongoose.Schema(
          {
            name: { type: String },
            type: { type: String, enum: ['swap', 'add_on', 'choice'] },
            options: [
              { label: { type: String } },
              { price: { type: Number } },
              { max: { type: Number } },
            ],
          },
          {
            _id: false,
          }
        ),
      ],
    },
    reviews: {
      type: [
        new mongoose.Schema(
          {
            user: { type: Object, default: {} },
            comment: { type: String },
            date: { type: Date, default: Date.now },
            image: { type: String },
            rating: { type: Number, min: 1, max: 5, required: true },
          },
          {
            _id: false,
          }
        ),
      ],
      default: [],
    },
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const foodModel = mongoose.models.food || mongoose.model('food', foodSchema);

export default foodModel;
