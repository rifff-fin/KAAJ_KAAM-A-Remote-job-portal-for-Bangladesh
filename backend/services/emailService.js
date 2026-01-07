// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_PASSWORD !== 'paste_your_16_character_app_password_here_no_spaces' && process.env.EMAIL_PASSWORD !== 'your_gmail_app_password_here') {
  // Use Gmail
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('✓ Email service configured with Gmail');
} else {
  // Use test account (Ethereal for testing)
  console.log('⚠ Gmail credentials not configured. Creating test account...');
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error('✗ Failed to create test account:', err);
      return;
    }
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    
    console.log('✓ Test email account created:');
    console.log('  Email:', account.user);
    console.log('  View sent emails at: https://ethereal.email/messages');
  });
}

// Email templates
const emailTemplates = {
  order_placed: (data) => ({
    subject: `New Order Received - ${data.gigTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">New Order Received!</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.sellerName},</p>
          <p style="color: #4b5563; font-size: 16px;">You have received a new order for your gig: <strong>${data.gigTitle}</strong></p>
          <p style="color: #4b5563; font-size: 16px;">Order Amount: <strong>৳${data.price}</strong></p>
          <p style="color: #4b5563; font-size: 16px;">Please log in to KaajKaam to confirm the order.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Order</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  order_activated: (data) => ({
    subject: `Order Activated - Payment Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Order Activated!</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.buyerName},</p>
          <p style="color: #4b5563; font-size: 16px;">Your order for <strong>${data.gigTitle}</strong> has been accepted by the seller.</p>
          <p style="color: #4b5563; font-size: 16px;">Please complete the payment within 7 days to proceed.</p>
          <p style="color: #4b5563; font-size: 16px;">Order Amount: <strong>৳${data.price}</strong></p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Complete Payment</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  payment_completed: (data) => ({
    subject: `Payment Received - Start Working`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Payment Received! 💰</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.sellerName},</p>
          <p style="color: #4b5563; font-size: 16px;">The buyer has completed the payment for order: <strong>${data.gigTitle}</strong></p>
          <p style="color: #4b5563; font-size: 16px;">Amount: <strong>৳${data.sellerAmount}</strong> (After 10% commission)</p>
          <p style="color: #4b5563; font-size: 16px;">You can now start working on the order.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Order</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  order_delivered: (data) => ({
    subject: `Order Delivered - Review Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Order Delivered! 📦</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.buyerName},</p>
          <p style="color: #4b5563; font-size: 16px;">The seller has delivered your order: <strong>${data.gigTitle}</strong></p>
          <p style="color: #4b5563; font-size: 16px;">Please review the delivery and accept or request revisions.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Review Delivery</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  delivery_accepted: (data) => ({
    subject: `Delivery Accepted - Leave a Review`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Delivery Accepted! ✅</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.sellerName},</p>
          <p style="color: #4b5563; font-size: 16px;">The buyer has accepted your delivery for: <strong>${data.gigTitle}</strong></p>
          <p style="color: #4b5563; font-size: 16px;">Please leave a review for the buyer.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Leave Review</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  delivery_rejected: (data) => ({
    subject: `Delivery Rejected - Revision Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Delivery Rejected - Revision Required</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.sellerName},</p>
          <p style="color: #4b5563; font-size: 16px;">The buyer has requested revisions for: <strong>${data.gigTitle}</strong></p>
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
          </div>
          <p style="color: #4b5563; font-size: 16px;"><strong>Redelivery Deadline:</strong> ${data.redeliveryDeadline}</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Details</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  review_received: (data) => ({
    subject: `New Review Received - ${data.rating} Stars`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">New Review Received! ⭐</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.userName},</p>
          <p style="color: #4b5563; font-size: 16px;">You have received a new ${data.rating}-star review!</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1f2937; font-size: 14px; margin: 0;">"${data.comment}"</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile/${data.userId}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Profile</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  message_received: (data) => ({
    subject: `New Message from ${data.senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">New Message Received! 💬</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.recipientName},</p>
          <p style="color: #4b5563; font-size: 16px;">You have a new message from <strong>${data.senderName}</strong></p>
          <div style="background-color: #eff6ff; padding: 15px; border-left: 4px solid #4F46E5; border-radius: 4px; margin: 20px 0;">
            <p style="color: #1e40af; font-style: italic; margin: 0;">"${data.messagePreview}${data.messagePreview.length > 50 ? '...' : ''}"</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/messages" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Message</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  proposal_accepted: (data) => ({
    subject: `Your Proposal was Accepted! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Congratulations! 🎉</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.freelancerName},</p>
          <p style="color: #4b5563; font-size: 16px;">Your proposal for <strong>${data.jobTitle}</strong> has been accepted!</p>
          <p style="color: #4b5563; font-size: 16px;">Budget: <strong>৳${data.budget}</strong></p>
          <p style="color: #4b5563; font-size: 16px;">The order has been created. Please wait for the client to complete payment.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Order</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  withdrawal_otp: (data) => ({
    subject: `Withdrawal OTP - ${data.otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #4F46E5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Withdrawal OTP Verification</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.userName},</p>
          <p style="color: #4b5563; font-size: 16px;">You have requested to withdraw <strong>৳${data.amount}</strong> via <strong>${data.method}</strong>.</p>
          <p style="color: #4b5563; font-size: 16px;">Your One-Time Password (OTP) is:</p>
          <div style="background-color: #eff6ff; border: 2px dashed #4F46E5; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="font-size: 36px; font-weight: bold; color: #4F46E5; margin: 0; letter-spacing: 8px;">${data.otp}</p>
          </div>
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
            <strong>⚠️ Important:</strong> This OTP is valid for 10 minutes only. Do not share this OTP with anyone.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you did not request this withdrawal, please ignore this email and contact support immediately.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  deposit_otp: (data) => ({
    subject: `Add Money OTP - ${data.otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #10b981; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Add Money OTP Verification</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.userName},</p>
          <p style="color: #4b5563; font-size: 16px;">You have requested to add <strong>৳${data.amount}</strong> to your wallet via <strong>${data.method}</strong>.</p>
          <p style="color: #4b5563; font-size: 16px;">Your One-Time Password (OTP) is:</p>
          <div style="background-color: #d1fae5; border: 2px dashed #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="font-size: 36px; font-weight: bold; color: #10b981; margin: 0; letter-spacing: 8px;">${data.otp}</p>
          </div>
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
            <strong>⚠️ Important:</strong> This OTP is valid for 10 minutes only. Do not share this OTP with anyone.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you did not request this deposit, please ignore this email and contact support immediately.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  }),

  payment_otp: (data) => ({
    subject: `Order Payment OTP - ${data.otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #3b82f6; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">KaajKaam</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937;">Order Payment OTP Verification</h2>
          <p style="color: #4b5563; font-size: 16px;">Hi ${data.userName},</p>
          <p style="color: #4b5563; font-size: 16px;">You are making a payment of <strong>৳${data.amount}</strong> via <strong>${data.method}</strong> for order:</p>
          <p style="color: #1f2937; font-size: 18px; font-weight: bold; margin: 15px 0;">"${data.orderTitle}"</p>
          <p style="color: #4b5563; font-size: 16px;">Your One-Time Password (OTP) is:</p>
          <div style="background-color: #dbeafe; border: 2px dashed #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="font-size: 36px; font-weight: bold; color: #3b82f6; margin: 0; letter-spacing: 8px;">${data.otp}</p>
          </div>
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
            <strong>⚠️ Important:</strong> This OTP is valid for 10 minutes only. Do not share this OTP with anyone.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you did not request this payment, please ignore this email and contact support immediately.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 KaajKaam - Remote Job Portal for Bangladesh</p>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, type, data) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email credentials not configured, skipping email send');
      return;
    }

    const template = emailTemplates[type];
    if (!template) {
      console.error(`Email template '${type}' not found`);
      return;
    }

    const { subject, html } = template(data);

    const mailOptions = {
      from: `"KaajKaam" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent successfully to ${to} - Type: ${type}`);
  } catch (error) {
    console.error('✗ Error sending email:', error.message);
  }
};

module.exports = { sendEmail };
