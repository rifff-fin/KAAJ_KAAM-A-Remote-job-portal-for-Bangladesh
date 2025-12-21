const Notification = require('../models/Notification');

/**
 * Create and emit a notification
 */
const createNotification = async ({ recipient, type, title, message, relatedId, relatedModel }) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId,
      relatedModel
    });

    // Emit socket event if io is available
    if (global.io) {
      global.io.to(`user_${recipient}`).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification
};