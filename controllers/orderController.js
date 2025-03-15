import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

//placing orders from frontend
const placeOrder = async (req, res) => {
  try {
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
      // payment: { status: 'pending' },
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    const transactionRef = `food_order_${Date.now()}`;
    // payment setup
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: transactionRef,
        amount: req.body.amount,
        currency: 'NGN',
        redirect_url: `http://localhost:5173/verify-payment`,
        customer: {
          email: req.body.email,
          name: req.body.name,
        },
        payment_option: 'card,banktransfer,ussd',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );
    return res.status(200).json({
      success: true,
      status: 'success',
      payment_url: response.data.data.link,
      orderId: newOrder._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      status: 'failure',
      error: 'payment processing failed',
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, transactionId } = req.query;
    if (!transactionId || !orderId) {
      return res.status(400).json({
        status: 'false',
        message: 'missing params',
      });
    }
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );
    console.log('flutterwave:', response.data);
    const paymentData = response.data;

    if (response.data.data.status === 'success') {
      const updatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        {
          status: 'success',
          'payment.status': 'paid',
          'payment.flutterwavId': transactionId,
        },
        { new: true }
      );

      return res.status(200).json({
        status: 'success',
        message: 'Payment verified',
        orderId: newOrder._id,
        order: updatedOrder,
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      return res.status(400).json({
        status: 'false',
        message: 'Payment failed',
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: 'payment verification failed' });
  }
};
export { placeOrder, verifyPayment };
