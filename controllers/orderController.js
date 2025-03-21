import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

//placing orders from frontend
const placeOrder = async (req, res) => {
  try {
    const { items, amount, address, userId } = req.body;
    if (!items.length || !amount || !address) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newOrder = new orderModel({
      userId,
      address,
      items,
      amount,
      // payment: { status: 'pending' },
    });
    await newOrder.save();
    // res.json({ success: true, orders: newOrder });
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const user = await userModel.findById(userId);

    const transactionRef = `food_order_${
      Math.floor(Math.random() * 9999) + Math.floor(Math.random * 9999)
    }`;
    const orderSummary = items
      .map((item) => `${item.name} x${item.quantity}`)
      .join(', ');
    // payment setup
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: transactionRef,
        amount,
        currency: 'NGN',
        redirect_url: `http://localhost:5173/verify-payment`,
        customer: {
          name: address.firstName + address.lastName,
        },
        payment_option: 'card,banktransfer,ussd',
        customizations: {
          title: 'Kitchen Connect',
          description: `Order: ${orderSummary}`,
          logo: '../assets/logo.png',
        },
        meta: { order_items: items },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );
    console.log(newOrder._id);

    res.status(200).json({
      success: true,
      payment_url: response.data.data.link,
      orderId: newOrder._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'payment processing failed',
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const { items, amount, address, userId } = req.body;

    const newOrder = new orderModel({
      userId,
      address,
      items,
      amount,
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    const payload = {
      tx_ref: `ORDER-${Date.now()}`,
      amount,
      currency: 'NGN',
      redirect_url: `http://localhost:5173/verify-payment?orderId=${newOrder._id}`,
      customer: {
        email: address.email,
      },
      payment_option: 'card,banktransfer,ussd',
      customizations: {
        title: 'Food Order Payment',
      },
    };
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(200).json({
      success: true,
      message: 'Payment link generated successfully.',
      newOrder,
      data: response.data,
      paymentUrl: response.data.data.link,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Payment failed.',
      error: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;
    if (!transactionId || !orderId) {
      return res.status(400).json({
        status: 'false',
        message: 'Missing parameters.',
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );
    const paymentData = response.data;

    if (
      paymentData.status === 'success' &&
      paymentData.data.status === 'successful'
    ) {
      order.payment.status = 'paid';
      order.payment.transactionId = transactionId;
      await order.save();
      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Payment verified.',
        orderId: order._id,
        order,
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      return res
        .status(400)
        .json({ success: false, status: 'false', message: 'Payment failed.' });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: 'payment verification error.' });
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.body.userId;
    const orders = await orderModel.find({ userId }).sort({ createdAt: -1 });
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: 'No orders found.' });
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'Server error!' });
  }
};
const getAllUsersOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    if (!orders)
      return res
        .status(404)
        .json({ success: false, message: 'No orders found' });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);

    res.json({ success: true, message: 'Server error!' });
  }
};
export { placeOrder, createOrder, verifyPayment, getOrders, getAllUsersOrders };
