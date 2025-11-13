const Gig = require('../models/Gig');
const cloudinary = require('../config/cloudinary');

exports.createGig = async (req, res) => {
  try {
    const { title, description, category, price, deliveryTime } = req.body;
    const seller = req.user.id;

    let image = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'kaaj-kaam/gigs'
      });
      image = result.secure_url;
    }

    const gig = await Gig.create({
      title, description, category, price, deliveryTime, image, seller
    });

    res.status(201).json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyGigs = async (req, res) => {
  const gigs = await Gig.find({ seller: req.user.id });
  res.json(gigs);
};

exports.getAllGigs = async (req, res) => {
  const { search, category } = req.query;
  let query = {};

  if (search) query.title = { $regex: search, $options: 'i' };
  if (category && category !== 'all') query.category = category;

  const gigs = await Gig.find(query).populate('seller', 'name email');
  res.json(gigs);
};

// ADD THIS
exports.getGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate('seller', 'name email');
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    res.json(gig);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};