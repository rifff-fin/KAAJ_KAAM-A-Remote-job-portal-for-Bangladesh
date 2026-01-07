// backend/controllers/settingsController.js
const User = require('../models/User');

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('emailNotifications');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      emailNotifications: user.emailNotifications !== undefined ? user.emailNotifications : true
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// Update email notification setting
exports.updateEmailNotifications = async (req, res) => {
  try {
    const { emailNotifications } = req.body;

    if (emailNotifications === undefined) {
      return res.status(400).json({ message: 'emailNotifications field is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { emailNotifications },
      { new: true }
    ).select('emailNotifications');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Email notification settings updated successfully',
      emailNotifications: user.emailNotifications
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};
