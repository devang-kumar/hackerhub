const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }
});

const prizeSchema = new mongoose.Schema({
  position: String,
  amount: String,
  description: String
});

const competitionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['hackathon', 'quiz', 'case-study', 'coding', 'other'], default: 'hackathon' },
  banner: { type: String, default: '' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamSize: { min: { type: Number, default: 1 }, max: { type: Number, default: 4 } },
  registrationDeadline: Date,
  startDate: Date,
  endDate: Date,
  prizes: [prizeSchema],
  stages: [stageSchema],
  tags: [String],
  eligibility: { type: String, default: 'Open for all' },
  mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  status: { type: String, enum: ['draft', 'active', 'closed'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Competition', competitionSchema);
