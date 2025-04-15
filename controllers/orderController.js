import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// placing orders from frontend
// const client_url = 'http://localhost:5173';
const client_url = 'https://kitchen-connect-com.onrender.com';
const generateChars = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
      tx_ref: `ORDER-${generateChars()}`,
      amount,
      currency: 'NGN',
      redirect_url: `${client_url}/verify-payment?orderId=${newOrder._id}`,
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
    const { items, amount, address, userId, email, transactionId } = req.body;
    const newOrder = new orderModel({
      userId,
      address,
      items,
      amount,
      email,
      payment: { transactionId, paymentMethod: 'Paystack' },
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    const payload = {
      reference: `${transactionId}`,
      amount: amount * 100,
      currency: 'NGN',
      email: email,
      callback_url: `${client_url}/verify?orderId=${newOrder._id}`,
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
    console.log(response.data);
    res.status(200).json({
      success: true,
      message: response.data.message,
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

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const paymentData = response.data;
    console.log(paymentData);
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
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: 'payment verification error.' });
  }
};
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_BASE_URL = 'https://sandbox.monnify.com/api/v1';
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const createOrderMonnify = async (req, res) => {
  try {
    const getMonnifyToken = async () => {
      const credentials = Buffer.from(
        `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`
      ).toString('base64');

      const res = await axios.post(
        `${MONNIFY_BASE_URL}/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      return res.data.responseBody.accessToken;
    };
    const accessToken = await getMonnifyToken();
    const { items, amount, address, userId, email, transactionId } = req.body;
    if (!items || !amount || !address || !email) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing credentials' });
    }
    const newOrder = new orderModel({
      userId,
      address,
      items,
      amount,
      email,
      payment: { status: 'pending', transactionId, paymentMethod: 'Monnify' },
    });

    await newOrder.save();

    const transactionReference = transactionId || `ORDER-${generateChars()}`;

    const payload = {
      amount,
      customerName: `${address?.firstName || 'User'} ${
        address?.lastName || ''
      }`,
      customerEmail: email,
      paymentReference: transactionReference,
      paymentDescription: 'Kitchen Connect - Order Payment',
      currencyCode: 'NGN',
      contractCode: MONNIFY_CONTRACT_CODE,
      redirectUrl: `${client_url}/verify?orderId=${newOrder._id}`,
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'],
    };

    const response = await axios.post(
      `${MONNIFY_BASE_URL}/merchant/transactions/init-transaction`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log(response.data);

    res.status(200).json({
      success: true,
      message: 'Payment initialized',
      paymentUrl: response.data.responseBody.checkoutUrl,
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Monnify payment init failed', error });
  }
};
const verifyMonnifyPayment = async (req, res) => {
  try {
    const getMonnifyToken = async () => {
      const credentials = Buffer.from(
        `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`
      ).toString('base64');

      const res = await axios.post(
        `${MONNIFY_BASE_URL}/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      return res.data.responseBody.accessToken;
    };
    const { orderId, reference } = req.body;
    const accessToken = await getMonnifyToken();

    const response = await axios.get(
      `${MONNIFY_BASE_URL}/merchant/transactions/query?paymentReference=${reference}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const transaction = response.data.responseBody;
    console.log(transaction);

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    switch (transaction.paymentStatus) {
      case 'PAID':
        order.payment.status = 'paid';
        break;
      case 'PENDING':
        order.payment.status = 'pending';
        break;
      default:
        order.payment.status = 'failed';
        break;
    }

    order.payment.transactionId = reference;
    await order.save();

    res.status(200).json({
      success: true,
      status: order.payment.status,
      orderId: order._id,
      order,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Verification failed', error });
  }
};
const getOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const skip = (page - 1) * limit;
  try {
    const userId = req.body.userId;
    const filter = { userId };
    if (status && status !== 'all') {
      filter['payment.status'] = status;
    }
    const orders = await orderModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalOrders = await orderModel.countDocuments(filter);
    const paidCounts = await orderModel.countDocuments({
      userId,
      'payment.status': 'paid',
    });
    const pendingCounts = await orderModel.countDocuments({
      userId,
      'payment.status': 'pending',
    });
    const failedCounts = await orderModel.countDocuments({
      userId,
      'payment.status': 'failed',
    });
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: 'No orders found.' });
    }
    res.status(200).json({
      success: true,
      data: orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      totalOrders,
      statusCounts: {
        all: totalOrders,
        paid: paidCounts,
        pending: pendingCounts,
        failed: failedCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'Server error!' });
  }
};
const requery = async (req, res) => {
  const { orderId, reference } = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) {
      order.payment.status = 'failed';
      await order.save();
      return res.json({
        message: 'Payment can not be found.',
        status: 'failed',
      });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    if (response.data.status === false) {
      order.payment.status = 'failed';
      await order.save();
      return res.json({ message: 'Payment failed', status: 'failed' });
    }
    console.log(response.data);
    if (response.data.data.status === 'success') {
      order.payment.status = 'paid';
      await order.save();
      return res.json({
        success: true,
        message: 'Payment successful',
        status: 'successful',
      });
    } else if (
      response.data.data.status === 'failed' ||
      response.data.data.status === 'abandoned'
    ) {
      order.payment.status = 'failed';
      await order.save();
      return res.json({
        success: true,
        message: 'Payment failed',
        status: 'failed',
      });
    } else {
      return res.json({
        success: true,
        message: 'Payment still pending',
        status: 'pending',
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error checking payment status', error: error.message });
    console.log(error.response.data);
  }
};
const requeryMonnify = async (req, res) => {
  const { orderId, reference } = req.body;

  try {
    const getMonnifyToken = async () => {
      const credentials = Buffer.from(
        `${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`
      ).toString('base64');

      const res = await axios.post(
        `${MONNIFY_BASE_URL}/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      return res.data.responseBody.accessToken;
    };
    const accessToken = await getMonnifyToken();

    const response = await axios.get(
      `${MONNIFY_BASE_URL}/merchant/transactions/query?paymentReference=${reference}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const order = await orderModel.findById(orderId);
    const transaction = response.data.responseBody;
    console.log(transaction);
    switch (transaction.paymentStatus) {
      case 'PAID':
        order.payment.status = 'paid';
        res.json({
          success: true,
          message: 'Payment successful',
          status: 'successful',
        });
        break;
      case 'PENDING':
        order.payment.status = 'pending';
        res.json({
          success: true,
          message: 'Payment still pending',
          status: 'pending',
        });
        break;
      default:
        order.payment.status = 'failed';
        res.json({
          success: true,
          message: 'Payment failed',
          status: 'failed',
        });
        break;
    }

    order.payment.transactionId = reference;
    await order.save();
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error checking payment status', error: error.message });
    console.log(error.response.data);
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
const deleteOrderAdmin = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
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
      message: 'Failed to delete order.',
      error,
    });
  }
};
const deleteOrderAdminMultiple = async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No Order Ids  found.',
      });
    }
    const result = await orderModel.deleteMany({ _id: { $in: orderIds } });
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} orders(s) deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error! Failed to delete order.',
      error,
    });
  }
};
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res
      .status(200)
      .json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.log(error);
  }
};
const trackOrder = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    res.json({
      success: true,
      status: order.status,
      message: 'Order status fetched.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error!',
      error,
    });
  }
};
const completeOrder = async (req, res) => {
  try {
    const order = await orderModel.findById(req.body.id);
    order.completeOrder = true;
    res.json({
      success: true,
      message: 'Order completed! Thank you for using our website.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error!',
      error,
    });
  }
};
export {
  completeOrder,
  createOrder,
  verifyPayment,
  getOrders,
  getAllUsersOrders,
  deleteOrder,
  deleteOrderAdmin,
  verifyPaymentPaystack,
  createOrderPaystack,
  requery,
  requeryMonnify,
  createOrderMonnify,
  verifyMonnifyPayment,
  deleteOrderAdminMultiple,
  updateStatus,
  trackOrder,
};
