// backend/controllers/jobController.js
const Job = require('../models/Job');
const User = require('../models/User');

// Create a new job (buyer only)
exports.createJob = async (req, res) => {
  try {
    const { title, description, budget, deadline, category, skills } = req.body;

    // Validation
    if (!title || !description || !budget || !deadline) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can post jobs' });
    }

    const job = await Job.create({
      title,
      description,
      budget: Number(budget),
      deadline,
      category,
      skills: Array.isArray(skills) ? skills : [],
      postedBy: req.user.id
    });

    const populatedJob = await job.populate('postedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: populatedJob
    });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ message: err.message || 'Failed to create job' });
  }
};

// Get all jobs with filters
exports.getJobs = async (req, res) => {
  try {
    const { search, category, status } = req.query;
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

    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email profile')
      .populate('hiredFreelancer', 'name email profile')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get my jobs (buyer only)
exports.getMyJobs = async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can view their jobs' });
    }

    const jobs = await Job.find({ postedBy: req.user.id })
      .populate('hiredFreelancer', 'name email profile')
      .populate('interests.freelancer', 'name email profile rating stats')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Get my jobs error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get single job
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email profile')
      .populate('interests.freelancer', 'name email profile')
      .populate('hiredFreelancer', 'name email profile');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Show interest in a job (seller only)
// This creates an order with 'pending' status
// Client must accept/reject in their dashboard
exports.showInterest = async (req, res) => {
  try {
    const { message, proposedBudget, deliveryDays } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Proposal message is required' });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can apply to jobs' });
    }

    const alreadyApplied = job.interests.some(
      i => i.freelancer.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    job.interests.push({
      freelancer: req.user.id,
      message: message.trim(),
      status: 'pending'
    });

    await job.save();
    console.log('✓ Interest added to job:', job._id);

    // Create a Proposal record for this interest
    const Proposal = require('../models/Proposal');
    const Order = require('../models/Order');
    
    const proposal = await Proposal.create({
      job: job._id,
      seller: req.user.id,
      coverLetter: message.trim(),
      proposedPrice: proposedBudget || job.budget,
      deliveryDays: deliveryDays || 7
    });
    console.log('✓ Proposal created:', proposal._id);

    // Create Order with pending status
    const order = await Order.create({
      buyer: job.postedBy,
      seller: req.user.id,
      job: job._id,
      title: job.title,
      description: message.trim(),
      price: proposedBudget || job.budget,
      deliveryDays: deliveryDays || 7,
      status: 'pending'
    });
    console.log('✓ Order created with status PENDING:', order._id);
    console.log('  - Buyer:', order.buyer);
    console.log('  - Seller:', order.seller);
    console.log('  - Job:', order.job);
    console.log('  - Status:', order.status);

    const updatedJob = await job.populate('interests.freelancer', 'name email profile');

    res.json({
      success: true,
      message: 'Application submitted successfully',
      job: updatedJob,
      order
    });
  } catch (err) {
    console.error('✗ Error in showInterest:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ message: err.message });
  }
};

// Accept job application (buyer/client only)
// This changes order status from 'pending' to 'activated'
// After this, client must pay (same flow as gig payment)
exports.acceptApplication = async (req, res) => {
  try {
    const { freelancerId } = req.body;
    const { id: jobId } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(jobId).populate('postedBy', 'name email');
    if (!job || job.postedBy._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job is no longer open' });
    }

    // Check if application exists
    const application = job.interests.find(
      i => i.freelancer.toString() === freelancerId
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const Proposal = require('../models/Proposal');
    const Order = require('../models/Order');
    const Notification = require('../models/Notification');
    const User = require('../models/User');
    const { sendEmail } = require('../services/emailService');
    
    // Update proposal if it exists
    const proposal = await Proposal.findOne({ job: jobId, seller: freelancerId });
    if (proposal) {
      proposal.status = 'accepted';
      await proposal.save();
    }

    // Mark this application as accepted in the job
    const interestIndex = job.interests.findIndex(
      i => i.freelancer.toString() === freelancerId
    );
    if (interestIndex !== -1) {
      job.interests[interestIndex].status = 'accepted';
      await job.save();
    }

    // Find and update the pending order to activated (matching gig flow)
    const order = await Order.findOneAndUpdate(
      { job: jobId, seller: freelancerId, status: 'pending' },
      { 
        status: 'activated',
        paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days to pay
      },
      { new: true }
    ).populate('seller', 'name email');

    if (!order) {
      // Fallback: create order if it doesn't exist
      const newOrder = await Order.create({
        buyer: userId,
        seller: freelancerId,
        job: jobId,
        title: job.title,
        description: job.description,
        price: proposal?.proposedPrice || job.budget,
        deliveryDays: proposal?.deliveryDays || 7,
        status: 'activated',
        paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // Create notification
      try {
        await Notification.create({
          recipient: freelancerId,
          type: 'proposal_accepted',
          title: 'Application Accepted!',
          message: `${job.postedBy.name} accepted your application for "${job.title}". Waiting for payment.`,
          relatedId: newOrder._id,
          relatedModel: 'Order'
        });

        // Send email notification
        const freelancer = await User.findById(freelancerId).select('name email emailNotifications');
        if (freelancer && freelancer.emailNotifications) {
          await sendEmail(freelancer.email, 'order_activated', {
            freelancerName: freelancer.name,
            clientName: job.postedBy.name,
            jobTitle: job.title
          });
        }
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
      }

      return res.json({
        success: true,
        message: 'Application accepted! Waiting for payment to start work.',
        order: newOrder
      });
    }

    // Create notification for accepted application
    try {
      await Notification.create({
        recipient: freelancerId,
        type: 'proposal_accepted',
        title: 'Application Accepted!',
        message: `${job.postedBy.name} accepted your application for "${job.title}". Waiting for payment.`,
        relatedId: order._id,
        relatedModel: 'Order'
      });

      // Send email notification
      if (order.seller.emailNotifications !== false) {
        await sendEmail(order.seller.email, 'order_activated', {
          freelancerName: order.seller.name,
          clientName: job.postedBy.name,
          jobTitle: job.title
        });
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.json({
      success: true,
      message: 'Application accepted! Waiting for payment to start work.',
      order
    });
  } catch (err) {
    console.error('Hire freelancer error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Reject job application (buyer/client only)
// Legacy hire function - redirects to acceptApplication
exports.hireFreelancer = async (req, res) => {
  return exports.acceptApplication(req, res);
};

exports.rejectApplication = async (req, res) => {
  try {
    const { freelancerId } = req.body;
    const { id: jobId } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(jobId).populate('postedBy', 'name email');
    if (!job || job.postedBy._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Remove from interests
    const interestIndex = job.interests.findIndex(
      i => i.freelancer.toString() === freelancerId
    );
    
    if (interestIndex !== -1) {
      // Mark as rejected instead of removing
      job.interests[interestIndex].status = 'rejected';
      await job.save();
    }

    const Proposal = require('../models/Proposal');
    const Order = require('../models/Order');
    const Notification = require('../models/Notification');
    
    // Update proposal if it exists
    const proposal = await Proposal.findOne({ job: jobId, seller: freelancerId });
    if (proposal) {
      proposal.status = 'rejected';
      await proposal.save();
    }

    // Cancel the pending order
    await Order.findOneAndUpdate(
      { job: jobId, seller: freelancerId, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );

    // Create notification
    try {
      await Notification.create({
        recipient: freelancerId,
        type: 'proposal_rejected',
        title: 'Application Not Selected',
        message: `Your application for "${job.title}" was not selected this time.`,
        relatedId: jobId,
        relatedModel: 'Job'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.json({
      success: true,
      message: 'Application rejected'
    });
  } catch (err) {
    console.error('Error rejecting application:', err);
    res.status(500).json({ message: err.message });
  }
};

// Unhire a freelancer (buyer only)
exports.unhireFreelancer = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job || job.postedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const freelancerId = job.hiredFreelancer;
    if (!freelancerId) {
      return res.status(400).json({ message: 'No freelancer is hired for this job' });
    }

    // Find and cancel the order
    const Order = require('../models/Order');
    const order = await Order.findOne({ job: jobId, status: { $ne: 'completed' } });
    if (order) {
      order.status = 'cancelled';
      await order.save();
    }

    // Re-open the job
    job.hiredFreelancer = null;
    job.status = 'open';
    await job.save();

    // Re-open the proposal
    const Proposal = require('../models/Proposal');
    await Proposal.findOneAndUpdate(
      { job: jobId, seller: freelancerId },
      { status: 'pending' }
    );

    res.json({
      success: true,
      message: 'Freelancer unhired and job re-opened',
      job
    });
  } catch (err) {
    console.error('Unhire freelancer error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Complete a job (buyer only)
exports.completeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the job poster can complete' });
    }

    job.status = 'completed';
    await job.save();

    res.json({
      success: true,
      message: 'Job marked as completed',
      job
    });
  } catch (err) {
    console.error('Complete job error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update a job (buyer only, with edit restriction)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if user can edit (once per week restriction)
    if (job.lastEditedAt) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (job.lastEditedAt > oneWeekAgo) {
        const nextEditDate = new Date(job.lastEditedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        return res.status(403).json({ 
          message: 'You can only edit your job once per week',
          nextEditDate: nextEditDate.toISOString()
        });
      }
    }

    const { title, description, budget, deadline, category, skills } = req.body;

    // Title cannot be edited
    if (title && title !== job.title) {
      return res.status(400).json({ message: 'Title cannot be edited' });
    }

    // Update allowed fields
    if (description) job.description = description;
    if (budget) job.budget = Number(budget);
    if (deadline) job.deadline = deadline;
    if (category) job.category = category;
    if (skills) job.skills = Array.isArray(skills) ? skills : [];

    // Update last edited timestamp
    job.lastEditedAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: 'Job updated successfully',
      job
    });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a job (buyer only)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Don't allow deletion if job has a hired freelancer
    if (job.hiredFreelancer) {
      return res.status(400).json({ 
        message: 'Cannot delete a job with a hired freelancer. Please unhire first.' 
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ message: err.message });
  }
};
