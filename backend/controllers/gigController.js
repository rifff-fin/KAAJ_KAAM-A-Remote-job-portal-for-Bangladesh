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
      .populate('seller', 'name email profile rating');

    // ✅ FILTER UNAVAILABLE SELLERS
    const filteredGigs = gigs.filter(gig =>
      gig.seller &&
      gig.seller.profile &&
      gig.seller.profile.availability === 'available'
    );

    // ✅ CALCULATE KK RATING AND SORT
    // KK Rating = orders + clicks + (seller rating * 10)
    const gigsWithRating = filteredGigs.map(gig => {
      const orders = gig.stats?.orders || 0;
      const clicks = gig.stats?.views || 0;
      const sellerRating = gig.seller?.rating?.average || 0;
      const kkRating = orders + clicks + (sellerRating * 10);
      
      return {
        ...gig.toObject(),
        kkRating
      };
    });

    // Sort by KK rating (highest first)
    gigsWithRating.sort((a, b) => b.kkRating - a.kkRating);

    res.json(gigsWithRating);
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

    // ✅ INCREMENT CLICK/VIEW COUNT
    await Gig.findByIdAndUpdate(req.params.id, {
      $inc: { 'stats.views': 1 }
    });

    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   UPDATE GIG (WITH EDIT RESTRICTION)
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

    // Check if user can edit (once per week restriction)
    if (gig.lastEditedAt) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (gig.lastEditedAt > oneWeekAgo) {
        const nextEditDate = new Date(gig.lastEditedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        return res.status(403).json({ 
          message: 'You can only edit your gig once per week',
          nextEditDate: nextEditDate.toISOString()
        });
      }
    }

    const { title, description, category, price, deliveryTime } = req.body;

    // Title cannot be edited
    if (title && title !== gig.title) {
      return res.status(400).json({ message: 'Title cannot be edited' });
    }

    // Category cannot be edited
    if (category && category !== gig.category) {
      return res.status(400).json({ message: 'Category cannot be edited' });
    }

    // Update allowed fields
    if (description) gig.description = description;
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

    // Update last edited timestamp
    gig.lastEditedAt = new Date();
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
