const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'text', 'code'], default: 'mcq' },
  options: [String],
  correctAnswer: String,
  marks: { type: Number, default: 1 }
});

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [questionSchema],
  duration: { type: Number, default: 60 }, // minutes
  proctored: { type: Boolean, default: true },
  linkedTo: { type: String, enum: ['job', 'competition'], default: 'job' },
  linkedId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', assessmentSchema);
