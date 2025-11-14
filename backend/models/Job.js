
// backend/models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  budget: Number,
  deadline: Date,
  category: String,
  skills: [String],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interests: [{
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    appliedAt: { type: Date, default: Date.now }
  }],
  hiredFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'in-progress', 'completed'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);