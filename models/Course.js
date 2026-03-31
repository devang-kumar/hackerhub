const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  duration: { type: String },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  modules: [{
    title: { type: String, required: true },
    videoUrl: { type: String },
    content: { type: String }
  }],
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  banner: { type: String },
  price: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
