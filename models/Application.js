const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: String, required: true },
  coverLetter: { type: String, default: '' },
  answers: [{ question: String, answer: String }],
  assessmentScore: { type: Number, default: null },
  assessmentCompleted: { type: Boolean, default: false },
  status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'hired'], default: 'applied' },
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', applicationSchema);
