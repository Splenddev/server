import reviewModel from '../models/reviewModel.js';
import userModel from '../models/userModel.js';

export const addReviewWebsite = async (req, res) => {
  const { rating, comment, userId, nameDisplay } = req.body;
  try {
    const user = await userModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found!' });
    const reviewData = {
      user: {
        id: userId,
        image: user.profileImage,
        name: nameDisplay ? 'Anonymous' : user.name,
      },
      rating,
      comment,
    };
    const review = new reviewModel(reviewData);
    await review.save();
    res.status(201).json({
      success: true,
      message: 'Review added!',
      review,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Server error!', error: error.message });
    console.log(error);
  }
};
export const getReview = async (req, res) => {
  try {
    const reviews = await reviewModel.find({});
    res
      .status(201)
      .json({ success: true, message: 'Reviews fetched!', data: reviews });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Server error!', error: error.message });
    console.log(error);
  }
};
