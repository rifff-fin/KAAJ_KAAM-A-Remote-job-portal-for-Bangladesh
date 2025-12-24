const Gig = require('../models/Gig');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

/* ===============================
   CREATE A NEW GIG
================================ */
exports.createGig = async (req, res) => {
  try {
    const { title, description, category, price, deliveryTime } = req.body;
    const seller = req.user.id;

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
        fs.unlink(req.file.path, () => {});
      } catch (err) {
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

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
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET ALL GIGS (ONLY AVAILABLE SELLERS)
================================ */
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

    // ✅ FILTER UNAVAILABLE SELLERS
    const filteredGigs = gigs.filter(gig =>
      gig.seller &&
      gig.seller.profile &&
      gig.seller.profile.availability === 'available'
    );

    res.json(filteredGigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET MY GIGS (SELLER)
================================ */
exports.getMyGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ seller: req.user.id })
      .sort({ createdAt: -1 });

    res.json(gigs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET SINGLE GIG
================================ */
exports.getGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('seller', 'name email profile rating');

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // ❌ BLOCK IF SELLER IS UNAVAILABLE
    if (
      gig.seller?.profile?.availability &&
      gig.seller.profile.availability !== 'available'
    ) {
      return res.status(404).json({ message: 'Gig not available' });
    }

    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   UPDATE GIG
================================ */
exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, category, price, deliveryTime } = req.body;

    if (title) gig.title = title;
    if (description) gig.description = description;
    if (category) gig.category = category;
    if (price) gig.basePrice = Number(price);
    if (deliveryTime) gig.deliveryDays = Number(deliveryTime);

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'kaaj-kaam/gigs'
      });
      gig.thumbnail = result.secure_url;
      gig.images = [result.secure_url];
      fs.unlink(req.file.path, () => {});
    }

    await gig.save();

    res.json({
      success: true,
      message: 'Gig updated successfully',
      gig
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   DELETE GIG
================================ */
exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Gig.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Gig deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
