import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import Order from '../models/orderModel.js';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontPath = path.resolve(
  __dirname,
  '../assets/fonts/TsukimiRounded-Medium.ttf'
);
const logoPath = path.resolve(__dirname, '../assets/images/logo.png');
// Shared PDF generator function

const createStyledPDF = (doc, order) => {
  const getSubTotal = (items) => {
    let subTotal = 0;
    items.forEach((item) => {
      subTotal += item.price * item.quantity;
    });
    return subTotal;
  };
  // White background box with shadow imitation
  doc.rect(40, 40, 520, 700).fill('#ffffff').stroke('#dddddd');
  doc.registerFont('TsukimiRounded', fontPath);
  doc.font('TsukimiRounded');
  doc.image(logoPath, {
    fit: [100, 100],
    align: 'center',
    valign: 'top',
  });
  doc.moveDown(3);
  doc
    .fillColor('#e72525')
    .fontSize(20)
    .text('Kitchen Connect Order Receipt', 50, 60, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(15).fillColor('#e72525').text('Transaction Detail:', 60);
  doc.moveDown(0.5);
  doc
    .fontSize(13)
    .fillColor('#444444')
    .text(`Trx Ref.: ${order.payment.transactionId} `, 60);
  doc.moveDown(0.2);
  doc
    .fontSize(13)
    .fillColor('#444444')
    .text(`Payment Method: ${order.payment.paymentMethod} `, 60);
  doc.moveDown(0.2);
  doc.text(`Payment Status: ${order.payment.status.toUpperCase()} `, 60);
  doc.moveDown(1);

  doc.fontSize(15).fillColor('#e72525').text('Customer Details:', 60);
  doc.moveDown(0.5);

  doc.fontSize(13).fillColor('#444444').text(`Order Ref: ${order._id}`, 60);
  doc.moveDown(0.2);
  doc.text(`Date: ${new Date(order.date).toLocaleString()}`, 60);
  doc.moveDown(0.2);
  doc.text(
    `Customer: ${order.address.firstName} ${order.address.lastName}`,
    60
  );
  doc.moveDown(0.2);
  doc.text(
    `Address street: ${order.address.street} ${order.address.lastName}`,
    60
  );
  doc.moveDown(0.2);
  doc.text(`Address area: ${order.address.area} `, 60);
  doc.moveDown();

  doc.fontSize(15).fillColor('#e72525').text('Items:', 60);
  doc.moveDown(0.5);

  order.items.forEach((item) => {
    doc
      .fontSize(13)
      .fillColor('#444444')
      .text(`• ${item.name} x${item.quantity} — #${item.price}`, {
        indent: 20,
      });
  });

  doc.moveDown(2);
  doc.fontSize(15).fillColor('#555555').text(`Sub Total: #${order.amount}`, {
    align: 'right',
    width: 500,
  });
  doc.moveDown(0.3);
  doc.text(
    `Delivery Fee: #${
      parseInt(order.amount) - parseInt(getSubTotal(order.items))
    }`,
    {
      align: 'right',
      width: 500,
    }
  );
  doc.moveDown(0.3);
  doc.text(`Total Amount: #${order.amount}`, {
    align: 'right',
    width: 500,
  });

  doc.moveDown(2);
  doc
    .fontSize(13)
    .fillColor('#999999')
    .text('——— Thank you for choosing Kitchen Connect! ———', {
      align: 'center',
      valign: 'bottom',
    });
};
const sendReceiptEmail = async ({ to, subject, html, attachment }) => {
  const mailOptions = {
    from: `"Kitchen Connect" <${process.env.EMAIL_USER}>`,
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
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (send && order.receiptSent)
      return res.status(404).json({
        message: `Receipt has already been sent to ${userEmail}`,
      });

    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);

      if (send && userEmail) {
        await sendReceiptEmail({
          to: userEmail,
          subject: 'Your Kitchen Connect Receipt',
          html: '<p>Thank you for ordering from Kitchen Connect!</p><p>Your receipt is attached.</p>',
          attachment: pdfBuffer,
        });
        order.receiptSent = true;
        await order.save();
        return res.status(200).json({ message: 'Receipt sent to email' });
      }

      return res
        .status(200)
        .json({ message: 'Receipt generated successfully' });
    });

    // Generate styled PDF
    createStyledPDF(doc, order);
    doc.end();
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

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt_${order._id}.pdf`
    );

    doc.pipe(res);

    // Generate styled PDF
    createStyledPDF(doc, order);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating receipt' });
  }
};
