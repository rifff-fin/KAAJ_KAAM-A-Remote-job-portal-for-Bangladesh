// backend/controllers/notificationController.js
const Notification = require('../models/Notification');

// ────── Get Notifications ──────
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.json({
      notifications,
      total,
      unreadCount,
      hasMore: skip + limit < total
    });
  } catch (err) {
    console.error('Error in getNotifications:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Mark as Read ──────
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error('Error in markAsRead:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Mark All as Read ──────
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error in markAllAsRead:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Delete Notification ──────
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error in deleteNotification:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Unread Count ──────
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error('Error in getUnreadCount:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
