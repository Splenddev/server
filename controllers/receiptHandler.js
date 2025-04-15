import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import getStream from 'get-stream';
import { sendReceiptEmail } from '../utils/sendEmail.js';
import Order from '../models/orderModel.js';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendReceiptEmail = async ({ to, subject, html, attachment }) => {
  const mailOptions = {
    from: `"Kitchen connect" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: 'receipt.pdf',
        content: attachment,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (err) {
    console.error('Email error:', err);
    throw new Error('Email failed');
  }
};
export const generateReceipt = async (req, res) => {
  const { orderId, userEmail, send } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const doc = new PDFDocument();
    doc.fontSize(20).text('Kitchen Connect Food Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Order Ref.: ${order._id}`);
    doc.text(`Date: ${new Date(order.date).toLocaleString()}`);
    doc.text(
      `Customer: ${order.address.firstName + ' ' + order.address.lastName}`
    );
    doc.text(`Items: `);
    order.items.forEach((item) => {
      doc.text(`- ${item.name} x${item.quantity} — ₦${item.price}`);
    });
    doc.text(`Total: ₦${order.amount}`);
    doc.end();

    const pdfBuffer = await getStream.buffer(doc);

    res.status(200).json({ message: 'Receipt generated' });
    if (send && userEmail) {
      await sendReceiptEmail({
        to: userEmail,
        subject: 'Your Kitchen Connect Receipt',
        html: '<p>Thank you for ordering from Kitchen Connect!</p><p>Your receipt is attached.</p>',
        attachment: pdfBuffer,
      });

      res.status(200).json({ message: 'Receipt sent to email' });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadReceipt = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt_${order._id}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(20).text('Kitchen Connect Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.date).toLocaleString()}`);
    doc.text(
      `Customer: ${order.address.firstName + ' ' + order.address.lastName}`
    );
    doc.text(`Items:`);
    order.items.forEach((item) => {
      doc.text(`- ${item.name} x${item.quantity} — ₦${item.price}`);
    });
    doc.text(`Total: ₦${order.amount}`);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating receipt' });
  }
};
