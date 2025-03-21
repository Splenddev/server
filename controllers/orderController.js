import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

//placing orders from frontend

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
       // name: `${address.firstName} ${address.lastName}`,
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
    } else if (
      paymentData.status === 'pending' &&
      paymentData.data.status === 'pending'
    ) {
      order.payment.status = 'pending';
      order.payment.transactionId = transactionId;
      await order.save();
      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Payment pending.',
        orderId: order._id,
        order,
      });
    } else {
      order.payment.status = 'failed';
      order.payment.transactionId = transactionId;
      await order.save();
      return res
        .status(200)
        .json({ success: true, status: 'false', message: 'Payment failed.' });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: 'payment verification error.' });
  }
};

const getOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const userId = req.body.userId;
    const totalOrders = await orderModel.countDocuments({ userId });
    const orders = await orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: 'No orders found.' });
    }
    res.status(200).json({
      success: true,
      data: orders,
      totalPages: Math.ceil(totalOrders / limit),
    });
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
const deleteOrder = async (req, res) => {
  try {
    const { userId, orderId } = req.body;
    const user = await userModel.findById(userId);
    const order = await orderModel.findById(orderId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }
    if (order.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    await orderModel.findByIdAndDelete(orderId);
    res.status(200).json({
      success: true,
      message: 'Your order has been deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user order.',
      error,
    });
  }
};
const deleteAllOrder = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const result = await orderModel.deleteMany({ userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User orders not found.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Your orders has been deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user orders.',
      error,
    });
  }
};
export {
  createOrder,
  verifyPayment,
  getOrders,
  getAllUsersOrders,
  deleteOrder,
  deleteAllOrder,
};
