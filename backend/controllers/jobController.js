// backend/controllers/jobController.js
const Job = require('../models/Job');
const User = require('../models/User');

exports.createJob = async (req, res) => {
  try {
    const { title, description, budget, deadline, category, skills } = req.body;
    if (req.user.role !== 'buyer') return res.status(403).json({ msg: 'Only buyers can post jobs' });

    const job = await Job.create({
      title, description, budget, deadline, category, skills,
      postedBy: req.user.id
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getJobs = async (req, res) => {
  const jobs = await Job.find().populate('postedBy', 'name');
  res.json(jobs);
};

exports.showInterest = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    if (req.user.role !== 'seller') return res.status(403).json({ msg: 'Only sellers can apply' });

    const alreadyApplied = job.interests.some(i => i.freelancer.toString() === req.user.id);
    if (alreadyApplied) return res.status(400).json({ msg: 'Already applied' });

    job.interests.push({ freelancer: req.user.id, message: req.body.message });
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.hireFreelancer = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job.postedBy.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

    const interest = job.interests.find(i => i.freelancer.toString() === req.body.freelancerId);
    if (!interest) return res.status(400).json({ msg: 'Freelancer did not apply' });

    job.hiredFreelancer = req.body.freelancerId;
    job.status = 'in-progress';
    await job.save();
    res.json({ msg: 'Hired', job });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.unhireFreelancer = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job.postedBy.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

    job.hiredFreelancer = null;
    job.status = 'open';
    await job.save();
    res.json({ msg: 'Unhired', job });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};