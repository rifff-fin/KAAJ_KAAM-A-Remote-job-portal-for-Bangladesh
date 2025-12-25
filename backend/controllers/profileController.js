const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId || req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive information
    const userProfile = user.toObject();
    delete userProfile.password;
    delete userProfile.verificationToken;
    delete userProfile.verificationTokenExpiry;

    res.status(200).json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name,
      bio,
      skills,
      location,
      phone,
      website,
      hourlyRate,
      availability
    } = req.body;

    // Update basic profile fields
    if (name) user.profile.name = name;
    if (bio) user.profile.bio = bio;
    if (location) user.profile.location = location;
    if (phone) user.profile.phone = phone;
    if (website) user.profile.website = website;

    // Seller-specific fields
    if (user.role === 'seller') {
      if (skills && Array.isArray(skills)) {
        user.profile.skills = skills;
      }
      if (hourlyRate !== undefined) {
        if (hourlyRate < 0) {
          return res.status(400).json({ message: 'Hourly rate must be positive' });
        }
        user.profile.hourlyRate = hourlyRate;
      }
      if (availability && ['available', 'unavailable', 'part-time'].includes(availability)) {
        user.profile.availability = availability;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        rating: user.rating,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Update profile avatar
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Delete old avatar from cloudinary if it exists
    if (user.profile.avatar) {
      try {
        const publicId = user.profile.avatar.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`avatars/${publicId}`);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }

    // Upload new avatar to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto'
    });

    user.profile.avatar = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: user.profile.avatar
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Error updating avatar', error: error.message });
  }
};

// Update seller-specific profile fields
const updateSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can update seller profile' });
    }

    const {
      name,
      bio,
      skills,
      location,
      phone,
      website,
      hourlyRate,
      availability,
      languages,
      experience,
      education,
      responseTime
    } = req.body;

    // Update top-level name field
    if (name !== undefined) {
      user.name = name;
      user.profile.name = name; // Keep profile.name in sync
    }

    // Update common profile fields
    if (bio !== undefined) user.profile.bio = bio;
    if (location !== undefined) user.profile.location = location;
    if (phone !== undefined) user.profile.phone = phone;
    if (website !== undefined) user.profile.website = website;
    
    // Update seller-specific fields
    if (skills && Array.isArray(skills)) {
      if (skills.length > 15) {
        return res.status(400).json({ message: 'Maximum 15 skills allowed' });
      }
      user.profile.skills = skills;
    }

    if (hourlyRate !== undefined) {
      const rate = parseFloat(hourlyRate);
      if (rate < 0 || rate > 10000) {
        return res.status(400).json({ message: 'Hourly rate must be between 0 and 10000' });
      }
      user.profile.hourlyRate = rate;
    }

    if (availability && ['available', 'unavailable', 'part-time'].includes(availability)) {
      user.profile.availability = availability;
    }

    // Update new fields
    if (languages) user.profile.languages = languages;
    if (experience) user.profile.experience = experience;
    if (education) user.profile.education = education;
    if (responseTime) user.profile.responseTime = responseTime;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Seller profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        rating: user.rating,
        stats: user.stats,
        badges: user.badges,
        wallet: user.wallet,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({ message: 'Error updating seller profile', error: error.message });
  }
};

// Update buyer-specific profile fields
const updateBuyerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can update buyer profile' });
    }

    const {
      name,
      bio,
      location,
      phone,
      website,
      companyName,
      industry,
      projectPreferences
    } = req.body;

    // Update top-level name field
    if (name !== undefined) {
      user.name = name;
      user.profile.name = name; // Keep profile.name in sync
    }

    // Update buyer profile fields
    if (bio !== undefined) user.profile.bio = bio;
    if (location !== undefined) user.profile.location = location;
    if (phone !== undefined) user.profile.phone = phone;
    if (website !== undefined) user.profile.website = website;
    if (companyName !== undefined) user.profile.companyName = companyName;
    if (industry !== undefined) user.profile.industry = industry;
    if (projectPreferences) user.profile.projectPreferences = projectPreferences;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Buyer profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        rating: user.rating,
        stats: user.stats,
        badges: user.badges,
        wallet: user.wallet,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update buyer profile error:', error);
    res.status(500).json({ message: 'Error updating buyer profile', error: error.message });
  }
};

// Get public profile (for viewing other users)
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive || user.isSuspended) {
      return res.status(403).json({ message: 'User profile is not available' });
    }

    // Return only public information
    const publicProfile = {
      id: user._id,
      name: user.name,
      role: user.role,
      profile: {
        name: user.profile.name,
        bio: user.profile.bio,
        avatar: user.profile.avatar,
        skills: user.profile.skills,
        level: user.profile.level,
        location: user.profile.location,
        website: user.profile.website,
        hourlyRate: user.profile.hourlyRate,
        availability: user.profile.availability,
        languages: user.profile.languages,
        experience: user.profile.experience,
        education: user.profile.education,
        responseTime: user.profile.responseTime,
        companyName: user.profile.companyName,
        industry: user.profile.industry,
        projectPreferences: user.profile.projectPreferences
      },
      rating: user.rating,
      stats: user.stats,
      badges: user.badges,
      isVerified: user.isVerified,
      lastActive: user.lastActive,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      user: publicProfile
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ message: 'Error fetching public profile', error: error.message });
  }
};

// Search sellers by skills or other criteria
const searchSellers = async (req, res) => {
  try {
    const { skills, minRating, maxHourlyRate, availability, page = 1, limit = 10 } = req.query;

    const query = {
      role: 'seller',
      isActive: true,
      isSuspended: false
    };

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query['profile.skills'] = { $in: skillsArray };
    }

    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    if (maxHourlyRate) {
      query['profile.hourlyRate'] = { $lte: parseFloat(maxHourlyRate) };
    }

    if (availability) {
      query['profile.availability'] = availability;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sellers = await User.find(query)
      .select('name profile rating stats createdAt')
      .sort({ 'rating.average': -1, 'stats.completedOrders': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      sellers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search sellers error:', error);
    res.status(500).json({ message: 'Error searching sellers', error: error.message });
  }
};

// Update user stats (internal use - should be called from other controllers)
const updateUserStats = async (userId, statsUpdate) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (statsUpdate.totalOrders !== undefined) {
      user.stats.totalOrders += statsUpdate.totalOrders;
    }
    if (statsUpdate.completedOrders !== undefined) {
      user.stats.completedOrders += statsUpdate.completedOrders;
    }
    if (statsUpdate.cancelledOrders !== undefined) {
      user.stats.cancelledOrders += statsUpdate.cancelledOrders;
    }
    if (statsUpdate.totalEarnings !== undefined) {
      user.stats.totalEarnings += statsUpdate.totalEarnings;
      user.profile.earnings += statsUpdate.totalEarnings;
    }
    if (statsUpdate.xp !== undefined) {
      user.stats.xp += statsUpdate.xp;
      // Level up logic (every 1000 XP = 1 level)
      user.profile.level = Math.floor(user.stats.xp / 1000) + 1;
    }

    await user.save();
    return user;
  } catch (error) {
    console.error('Update user stats error:', error);
    throw error;
  }
};

// Block a user
const blockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (userId === targetUserId) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    user.blockedUsers.push(targetUserId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Error blocking user', error: error.message });
  }
};

// Unblock a user
const unblockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Error unblocking user', error: error.message });
  }
};

// Report a user
const reportUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId, reason } = req.body;

    if (userId === targetUserId) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ message: 'Please provide a detailed reason (at least 10 characters)' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already reported by this user
    const alreadyReported = targetUser.reportedBy.some(
      report => report.user.toString() === userId
    );

    if (alreadyReported) {
      return res.status(400).json({ message: 'You have already reported this user' });
    }

    targetUser.reportedBy.push({
      user: userId,
      reason: reason.trim(),
      reportedAt: new Date()
    });

    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'User reported successfully. Our team will review this report.'
    });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ message: 'Error reporting user', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  updateSellerProfile,
  updateBuyerProfile,
  getPublicProfile,
  searchSellers,
  updateUserStats,
  blockUser,
  unblockUser,
  reportUser
};
