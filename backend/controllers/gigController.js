
const Gig = require('../models/Gig');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Create a new gig
exports.createGig = async (req, res) => {
  try {
    const { title, description, category, price, deliveryTime } = req.body;
    const seller = req.user.id;

    // Validation
    if (!title || !description || !category || !price || !deliveryTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    let image = '';
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'kaaj-kaam/gigs'
        });
        image = result.secure_url;
        // Clean up local file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    // Map frontend fields to backend model fields
    const gig = await Gig.create({
      title,
      description,
      category,
      basePrice: Number(price),
      deliveryDays: Number(deliveryTime),
      thumbnail: image,
      images: image ? [image] : [],
      seller
    });

    res.status(201).json({
      success: true,
      message: 'Gig created successfully',
      gig
    });
  } catch (err) {
    console.error('Create gig error:', err);
    res.status(500).json({ message: err.message || 'Failed to create gig' });
  }
};

// Get all gigs with filters
exports.getAllGigs = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const gigs = await Gig.find(query)
      .populate('seller', 'name email profile')
      .sort({ createdAt: -1 });

    res.json(gigs);
  } catch (err) {
    console.error('Get all gigs error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get my gigs (seller only)
exports.getMyGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ seller: req.user.id })
      .sort({ createdAt: -1 });
    res.json(gigs);
  } catch (err) {
    console.error('Get my gigs error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get single gig by ID
exports.getGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('seller', 'name email profile');

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    res.json(gig);
  } catch (err) {
    console.error('Get gig error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update gig (seller only)
exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this gig' });
    }

    const { title, description, category, price, deliveryTime } = req.body;

    if (title) gig.title = title;
    if (description) gig.description = description;
    if (category) gig.category = category;
    if (price) gig.basePrice = Number(price);
    if (deliveryTime) gig.deliveryDays = Number(deliveryTime);

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'kaaj-kaam/gigs'
        });
        gig.thumbnail = result.secure_url;
        gig.images = [result.secure_url];
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    await gig.save();

    res.json({
      success: true,
      message: 'Gig updated successfully',
      gig
    });
  } catch (err) {
    console.error('Update gig error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete gig (seller only)
exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this gig' });
    }

    await Gig.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Gig deleted successfully'
    });
  } catch (err) {
    console.error('Delete gig error:', err);
    res.status(500).json({ message: err.message });
  }
};