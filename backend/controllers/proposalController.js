// backend/controllers/proposalController.js
const Proposal = require('../models/Proposal');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ────── Create Proposal ──────
const createProposal = async (req, res) => {
  try {
    const { jobId, coverLetter, proposedPrice, deliveryDays } = req.body;
    const sellerId = req.user.id;

    // Validate job exists
    const job = await Job.findById(jobId).populate('postedBy');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if seller already applied
    const existing = await Proposal.findOne({ job: jobId, seller: sellerId });
    if (existing) {
      return res.status(400).json({ message: 'You already applied to this job' });
    }

    // Cannot apply to own job
    if (job.postedBy._id.toString() === sellerId) {
      return res.status(400).json({ message: 'Cannot apply to your own job' });
    }

    // Create proposal
    const proposal = await Proposal.create({
      job: jobId,
      seller: sellerId,
      coverLetter,
      proposedPrice,
      deliveryDays
    });

    // Update job proposals count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { 'stats.proposals': 1 },
      $push: { proposals: proposal._id }
    });

    // Create notification for buyer
    const seller = await User.findById(sellerId);
    await Notification.create({
      recipient: job.postedBy._id,
      type: 'new_proposal',
      title: 'New proposal received',
      message: `${seller.name} submitted a proposal for "${job.title}"`,
      relatedId: proposal._id,
      relatedModel: 'Proposal'
    });

    await proposal.populate('seller', 'name profile.avatar rating');

    res.status(201).json(proposal);
  } catch (err) {
    console.error('Error in createProposal:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Proposals for Job ──────
const getJobProposals = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only job poster can view proposals
    if (job.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const proposals = await Proposal.find({ job: jobId })
      .populate('seller', 'name email profile.avatar rating stats')
      .sort({ appliedAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error('Error in getJobProposals:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Seller's Proposals ──────
const getSellerProposals = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { status, limit = 20, skip = 0 } = req.query;

    const query = { seller: sellerId };
    if (status) query.status = status;

    const proposals = await Proposal.find(query)
      .populate('job', 'title budget deadline')
      .populate('seller', 'name profile.avatar')
      .sort({ appliedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Proposal.countDocuments(query);

    res.json({
      proposals,
      total,
      hasMore: skip + limit < total
    });
  } catch (err) {
    console.error('Error in getSellerProposals:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Accept Proposal ──────
const acceptProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.user.id;

    const proposal = await Proposal.findById(proposalId)
      .populate('job')
      .populate('seller');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Only job poster can accept
    if (proposal.job.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update proposal status
    proposal.status = 'accepted';
    proposal.respondedAt = new Date();
    await proposal.save();

    // Update job status
    await Job.findByIdAndUpdate(proposal.job._id, {
      status: 'in-progress',
      hiredSeller: proposal.seller._id
    });

    // Reject other proposals
    await Proposal.updateMany(
      { job: proposal.job._id, _id: { $ne: proposalId } },
      { status: 'rejected', respondedAt: new Date() }
    );

    // Create notifications
    await Notification.create({
      recipient: proposal.seller._id,
      type: 'proposal_accepted',
      title: 'Proposal accepted!',
      message: `Your proposal for "${proposal.job.title}" has been accepted`,
      relatedId: proposal._id,
      relatedModel: 'Proposal'
    });

    res.json(proposal);
  } catch (err) {
    console.error('Error in acceptProposal:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Reject Proposal ──────
const rejectProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.user.id;

    const proposal = await Proposal.findById(proposalId)
      .populate('job')
      .populate('seller');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Only job poster can reject
    if (proposal.job.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    proposal.status = 'rejected';
    proposal.respondedAt = new Date();
    await proposal.save();

    // Create notification
    await Notification.create({
      recipient: proposal.seller._id,
      type: 'proposal_rejected',
      title: 'Proposal rejected',
      message: `Your proposal for "${proposal.job.title}" was not selected`,
      relatedId: proposal._id,
      relatedModel: 'Proposal'
    });

    res.json(proposal);
  } catch (err) {
    console.error('Error in rejectProposal:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Withdraw Proposal ──────
const withdrawProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const sellerId = req.user.id;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.seller.toString() !== sellerId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (proposal.status === 'accepted') {
      return res.status(400).json({ message: 'Cannot withdraw accepted proposal' });
    }

    proposal.status = 'withdrawn';
    await proposal.save();

    res.json(proposal);
  } catch (err) {
    console.error('Error in withdrawProposal:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProposal,
  getJobProposals,
  getSellerProposals,
  acceptProposal,
  rejectProposal,
  withdrawProposal
};
