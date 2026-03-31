const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: String,
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  inviteToken: String
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  submissionLink: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', teamSchema);
