import counterModel from '../models/counterModel.js';

export const generateTransactionId = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const counterId = `orderId=${year}`;
    const counter = await counterModel.findByIdAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const formattedSeq = String(counter.seq).padStart(4, '0');
    req.body.transactionId = `ORDER-${formattedSeq}`;
    next();
  } catch (error) {
    console.error('Error generating TransactionId:', error);
    return res.status(500).json({ message: 'Failed to proceed' });
  }
};
