const Job = require('../models/Job');
const Proposal = require('../models/Proposal');

exports.postJob = async (req, res) => {
  const { title, description, budget, deadline, category } = req.body;
  const client = req.user.id;

  const job = await Job.create({ title, description, budget, deadline, category, client });
  res.status(201).json(job);
};

exports.getJobs = async (req, res) => {
  const jobs = await Job.find().populate('client', 'name email');
  res.json(jobs);
};

exports.applyToJob = async (req, res) => {
  const { jobId, gigId, coverLetter, proposedPrice } = req.body;
  const seller = req.user.id;

  const proposal = await Proposal.create({
    job: jobId, gig: gigId, seller, coverLetter, proposedPrice
  });

  await Job.findByIdAndUpdate(jobId, { $push: { proposals: proposal._id } });
  res.status(201).json(proposal);
};