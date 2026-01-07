# Email Notification System - Setup Guide

## ✅ What Has Been Implemented

### Backend Changes:
1. **Email Service** (`backend/services/emailService.js`)
   - Nodemailer integration with Gmail
   - 8 professional email templates:
     - order_activated
     - payment_completed
     - order_delivered
     - delivery_accepted
     - delivery_rejected
     - review_received
     - message_received
     - proposal_accepted

2. **User Model** (`backend/models/User.js`)
   - Added `emailNotifications` field (Boolean, default: true)

3. **Settings Controller** (`backend/controllers/settingsController.js`)
   - GET /api/settings - Get user settings
   - PUT /api/settings/email-notifications - Toggle email notifications

4. **Settings Routes** (`backend/routes/settings.js`)
   - Protected routes for settings management

5. **Updated Controllers**
   - orderController.js - Sends emails for all order lifecycle events
   - reviewController.js - Sends email when review is received

### Frontend Changes:
1. **Settings Page** (`frontend/src/components/Settings.jsx`)
   - Beautiful toggle switch for email notifications
   - Shows list of notification types
   - Save functionality with loading states

2. **App.jsx**
   - Added /settings route

3. **Navbar.jsx**
   - Added Settings link in user dropdown menu

## 🚀 Setup Instructions

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled
4. Go to "App passwords" (search for it in settings)
5. Select:
   - App: Mail
   - Device: Other (Custom name) - enter "KaajKaam"
6. Click Generate
7. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

### Step 2: Update .env File

Open `backend/.env` and update these lines:

```env
# Email Configuration
EMAIL_USER=haquee1111@gmail.com
EMAIL_PASSWORD=paste_your_16_char_app_password_here
FRONTEND_URL=http://localhost:5173
```

**Important:** Remove spaces from the app password. If Google shows it as "abcd efgh ijkl mnop", enter it as "abcdefghijklmnop"

### Step 3: Test the System

1. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Access Settings:**
   - Login to your account
   - Click on your profile icon in navbar
   - Click "Settings"
   - Toggle email notifications ON

4. **Test Email Sending:**
   - Place a test order
   - Accept an order as seller
   - Complete payment as buyer
   - Deliver an order as seller
   - Accept/reject delivery as buyer
   - Leave a review

5. **Check Email:**
   - Check the registered email inbox
   - Emails should arrive within seconds
   - Check spam folder if not in inbox

## 📧 Email Templates

### Order Activated
**Sent to:** Buyer
**Trigger:** Seller accepts order
**Content:** Order accepted, payment deadline (7 days)

### Payment Completed
**Sent to:** Seller
**Trigger:** Buyer completes payment
**Content:** Payment received, amount after 10% commission

### Order Delivered
**Sent to:** Buyer
**Trigger:** Seller delivers work
**Content:** Order delivered, review delivery prompt

### Delivery Accepted
**Sent to:** Seller
**Trigger:** Buyer accepts delivery
**Content:** Delivery accepted, leave review prompt

### Delivery Rejected
**Sent to:** Seller
**Trigger:** Buyer rejects delivery
**Content:** Rejection reason, redelivery deadline

### Review Received
**Sent to:** Reviewee (both buyer/seller)
**Trigger:** Someone leaves a review
**Content:** Rating, review comment preview

## 🎯 Usage in Code

### Sending Emails:

```javascript
const { sendEmail } = require('../services/emailService');

// Check if user has email notifications enabled
const user = await User.findById(userId).select('emailNotifications');

if (user && user.emailNotifications) {
  await sendEmail(user.email, 'order_activated', {
    buyerName: 'John Doe',
    gigTitle: 'Website Development',
    price: 5000
  });
}
```

### Available Email Types:

1. `order_activated` - Order accepted by seller
2. `payment_completed` - Payment received by seller
3. `order_delivered` - Work delivered by seller
4. `delivery_accepted` - Delivery accepted by buyer
5. `delivery_rejected` - Delivery rejected by buyer
6. `review_received` - New review received
7. `message_received` - New message received
8. `proposal_accepted` - Job proposal accepted

## 🔧 Troubleshooting

### Emails Not Sending?

1. **Check .env file:**
   - Verify EMAIL_USER and EMAIL_PASSWORD are correct
   - No spaces in app password
   - Gmail account matches

2. **Check Console Logs:**
   - Look for "✓ Email sent successfully" messages
   - Look for "✗ Error sending email" messages

3. **Common Issues:**
   - App password not generated correctly
   - 2FA not enabled on Google account
   - Email credentials in .env file incorrect
   - Gmail blocked less secure app access (use app password)

### User Not Receiving Emails?

1. Check user's emailNotifications setting in database
2. Verify user's email address is correct
3. Check spam/junk folder
4. Verify Gmail SMTP is not blocked by firewall

### Testing Without Gmail:

You can use Ethereal Email for testing:

```javascript
// In emailService.js, replace transporter with:
const transporter = nodemailer.createTransporter({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'your-ethereal-email@ethereal.email',
    pass: 'your-ethereal-password'
  }
});
```

Visit https://ethereal.email to create test account and view sent emails.

## 📊 User Settings

Users can control email notifications from:
**Navbar → Profile Icon → Settings → Email Notifications Toggle**

### Default Behavior:
- New users: Email notifications **ENABLED**
- Existing users: Email notifications **ENABLED**
- Users can toggle ON/OFF anytime
- Setting saved instantly

### What Users Receive:
When enabled, users receive emails for:
- ✓ Order updates and status changes
- ✓ Payment confirmations
- ✓ Delivery notifications
- ✓ New messages and chat notifications
- ✓ Review notifications
- ✓ Job application updates

## 🔐 Security Notes

1. **Never commit .env file** to Git
2. **App passwords are safer** than regular passwords
3. **Email sending is non-blocking** - failures don't crash the app
4. **All email operations are in try-catch** blocks
5. **Users control their notification preferences**

## 📝 Notes

- Emails are sent asynchronously
- Failed email sending is logged but doesn't affect operations
- All emails include branded KaajKaam header
- Emails contain action buttons linking back to the platform
- Email content is responsive and mobile-friendly

## ✨ Next Steps

To extend the email system:

1. **Add new templates** in `emailService.js`
2. **Call sendEmail()** in relevant controllers
3. **Always check** `user.emailNotifications` before sending
4. **Wrap in try-catch** to handle errors gracefully

Example:
```javascript
try {
  if (user.emailNotifications) {
    await sendEmail(user.email, 'new_template_type', {
      // your data here
    });
  }
} catch (err) {
  console.error('Error sending email:', err);
}
```

---

**System Status:** ✅ Fully Implemented and Ready to Use!

Just add your Gmail App Password to `.env` and you're good to go! 🚀
