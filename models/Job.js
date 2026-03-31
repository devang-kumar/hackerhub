const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  type: { type: String, enum: ['full-time', 'part-time', 'internship', 'contract'], default: 'full-time' },
  salary: { type: String, default: 'Not disclosed' },
  skills: [String],
  eligibility: { type: String, default: '' },
  applyDeadline: Date,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  banner: { type: String, default: '' },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
