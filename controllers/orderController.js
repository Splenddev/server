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
    const generateChars = () => {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    const payload = {
      tx_ref: `ORDER-${generateChars()}`,
      amount,
      currency: 'NGN',
      redirect_url: `https://kitchen-connect-com.onrender.com/verify-payment?orderId=${newOrder._id}`,
      // `https://kitchen-connect-com.onrender.com
      //http://localhost:5173
      customer: {
        email: address.email,
        name: `${address.firstName} ${address.lastName}`,
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
      message: 'Payment link generated. Redirecting...',
      newOrder,
      data: response.data,
      paymentUrl: response.data.data.link,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Payment failed.',
      error: error,
    });
  }
};
const verifyPayment = async (req, res) => {
  try {
    const { orderId, transactionId, tx_ref } = req.body;
    if (!orderId || !tx_ref) {
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
    let response;
    if (transactionId) {
      response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      );
    } else {
      response = await axios.get(
        `https://api.flutterwave.com/v3/transactions?tx_ref=${tx_ref}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      );
    }
    const paymentData = response.data;
    console.log(response);
    if (!paymentData || !paymentData.data) {
      return res.status(400).json({
        success: false,
        message: 'invalid data.',
        paymentData,
        datas: paymentData.data,
      });
    }
    const transaction = Array.isArray(paymentData.data)
      ? paymentData.data[0]
      : paymentData.data;

    if (!transaction || !transaction.status) {
      return res.status(400).json({
        success: false,
        message: 'invalid data.',
      });
    }
    if (transaction.status === 'successful') {
      order.payment.status = 'paid';
      order.payment.transactionId = transactionId || transaction.id || tx_ref;
      await order.save();
      return res.status(200).json({
        success: true,
        status: 'success',
        message: 'Payment verified.',
        orderId: order._id,
        order,
      });
    } else if (transaction.status === 'pending') {
      order.payment.status = 'pending';
      order.payment.transactionId = transactionId || transaction.id || tx_ref;
      await order.save();
      return res.status(200).json({
        success: true,
        status: 'pending',
        message: 'Payment pending.',
        orderId: order._id,
        order,
      });
    } else if (
      transaction.status === 'cancelled' ||
      transaction.status === 'failed'
    ) {
      order.payment.status = 'failed';
      order.payment.transactionId = transactionId || transaction.id || tx_ref;
      await order.save();
      return res.status(200).json({
        success: true,
        status: 'false',
        message: 'Payment failed.',
        orderId: order._id,
        order,
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: 'payment verification error.' });
  }
};
const createOrderPaystack = async (req, res) => {
  try {
    const { items, amount, address, userId, email } = req.body;

    const newOrder = new orderModel({
      userId,
      address,
      items,
      amount,
      email,
    });
    const generateChars = () => {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    const payload = {
      reference: `ORDER-${generateChars()}`,
      amount:amount*100,
      currency: 'NGN',
      // callback_url: `http://localhost:5173/verify-payment?orderId=${newOrder._id}`,
      callback_url: `https://kitchen-connect-com.onrender.com/verify-payment?orderId=${newOrder._id}`,
      email: email,
      channels: ['card', 'bank', 'ussd'],
      metadata: {
        orderId: newOrder._id,
      },
    };
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(200).json({
      success: true,
      message: 'Payment link generated. Redirecting...',
      newOrder,
      data: response.data,
      paymentUrl: response.data.data.authorization_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Payment failed.',
      error: error,
    });
  }
};
const verifyPaymentPaystack = async (req, res) => {
  try {
    const { orderId, reference } = req.body;
    if (!orderId || !reference) {
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
    let response;

    response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const paymentData = response.data;
    console.log(response);
    if (!paymentData || !paymentData.data) {
      return res.status(400).json({
        success: false,
        message: 'invalid data.',
        paymentData,
        datas: paymentData.data,
      });
    }
    const transaction = paymentData.data;

    if (!transaction || !transaction.status) {
      return res.status(400).json({
        success: false,
        message: 'invalid data.',
      });
    }
    let statusMessage;

    switch (response.data.data.status) {
      case 'success':
        order.payment.status = 'paid';
        statusMessage = 'Payment verified';
        break;

      case 'pending':
        order.payment.status = 'pending';
        statusMessage = 'Payment is still pending';

        break;

      case 'failed':
        order.payment.status = 'failed';
        statusMessage = 'Payment failed';
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: 'Unknown status' });
    }

    order.payment.transactionId = reference;
    await order.save();
    return res.status(200).json({
      success: true,
      status: order.payment.status,
      message: statusMessage,
      orderId: order._id,
      order,
    });
    // if (transaction.status === 'successful') {
    //   order.payment.status = 'paid';
    //   order.payment.transactionId = transactionId || transaction.id || reference;
    //   await order.save();
    //   return res.status(200).json({
    //     success: true,
    //     status: 'success',
    //     message: 'Payment verified.',
    //     orderId: order._id,
    //     order,
    //   });
    // } else if (transaction.status === 'pending') {
    //   order.payment.status = 'pending';
    //   order.payment.transactionId = transactionId || transaction.id || reference;
    //   await order.save();
    //   return res.status(200).json({
    //     success: true,
    //     status: 'pending',
    //     message: 'Payment pending.',
    //     orderId: order._id,
    //     order,
    //   });
    // } else if (
    //   transaction.status === 'cancelled' ||
    //   transaction.status === 'failed'
    // ) {
    //   order.payment.status = 'failed';
    //   order.payment.transactionId = transactionId || transaction.id || reference;
    //   await order.save();
    //   return res.status(200).json({
    //     success: true,
    //     status: 'false',
    //     message: 'Payment failed.',
    //     orderId: order._id,
    //     order,
    //   });
    // }
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
  verifyPaymentPaystack,
  createOrderPaystack,
};
