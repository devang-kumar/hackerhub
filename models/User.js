const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [String],
  college: { type: String, default: '' },
  resume: { type: String, default: '' },
  role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  verifyToken: String,
  resetToken: String,
  resetExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
