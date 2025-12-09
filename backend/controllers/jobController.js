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
exports.showInterest = async (req, res) => {
  try {
    const { message } = req.body;

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
      message: message.trim()
    });

    await job.save();
    const updatedJob = await job.populate('interests.freelancer', 'name email profile');

    res.json({
      success: true,
      message: 'Application submitted successfully',
      job: updatedJob
    });
  } catch (err) {
    console.error('Show interest error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Hire a freelancer (buyer only)
exports.hireFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.body;

    if (!freelancerId) {
      return res.status(400).json({ message: 'Freelancer ID is required' });
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the job poster can hire' });
    }

    const interest = job.interests.find(
      i => i.freelancer.toString() === freelancerId
    );

    if (!interest) {
      return res.status(400).json({ message: 'This freelancer has not applied' });
    }

    job.hiredFreelancer = freelancerId;
    job.status = 'in-progress';
    await job.save();

    const updatedJob = await job.populate('hiredFreelancer', 'name email profile');

    res.json({
      success: true,
      message: 'Freelancer hired successfully',
      job: updatedJob
    });
  } catch (err) {
    console.error('Hire freelancer error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Unhire a freelancer (buyer only)
exports.unhireFreelancer = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the job poster can unhire' });
    }

    job.hiredFreelancer = null;
    job.status = 'open';
    await job.save();

    res.json({
      success: true,
      message: 'Freelancer removed successfully',
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