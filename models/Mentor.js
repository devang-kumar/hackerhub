const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true },
  expertise: [{ type: String }],
  bio: { type: String, required: true },
  pricePerHour: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  sessionsCompleted: { type: Number, default: 0 },
  availableSlots: [{
    date: { type: String },
    time: { type: String },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Mentor', mentorSchema);
