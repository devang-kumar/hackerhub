const User = require('../models/User');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.getRegister = (req, res) => res.render('auth/register', { error: req.flash('error'), success: req.flash('success') });

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) { req.flash('error', 'Email already registered'); return res.redirect('/auth/register'); }
    const token = uuidv4();
    const user = await User.create({ name, email, password, role: role || 'user', verifyToken: token });
    const link = `${process.env.BASE_URL}/auth/verify/${token}`;
    
    try {
      await transporter.sendMail({
        to: email, from: process.env.EMAIL_USER || 'no-reply@hackhub.local',
        subject: 'Verify your account',
        html: `<h2>Welcome ${name}!</h2><p>Click <a href="${link}">here</a> to verify your account.</p>`
      });
      req.flash('success', 'Registration successful! Check your email to verify.');
    } catch (emailErr) {
      console.error('Email failed, auto-verifying user for local dev:', emailErr.message);
      user.isVerified = true;
      user.verifyToken = undefined;
      await user.save();
      req.flash('success', 'Registration successful! (Email skipped in dev mode)');
    }
    
    res.redirect('/auth/login');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/auth/register');
  }
};

exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({ verifyToken: req.params.token });
  if (!user) { req.flash('error', 'Invalid token'); return res.redirect('/auth/login'); }
  user.isVerified = true;
  user.verifyToken = undefined;
  await user.save();
  req.flash('success', 'Email verified! You can now login.');
  res.redirect('/auth/login');
};

exports.getLogin = (req, res) => res.render('auth/login', { error: req.flash('error'), success: req.flash('success') });

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/auth/login');
    }
    if (!user.isVerified) { req.flash('error', 'Please verify your email first'); return res.redirect('/auth/login'); }
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.role = user.role;
    res.redirect('/');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/auth/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('auth/profile', { user, error: req.flash('error'), success: req.flash('success') });
};

exports.updateProfile = async (req, res) => {
  const { name, bio, skills, college } = req.body;
  const update = { name, bio, college, skills: skills ? skills.split(',').map(s => s.trim()) : [] };
  if (req.file) update.resume = '/uploads/' + req.file.filename;
  await User.findByIdAndUpdate(req.session.userId, update);
  req.session.userName = name;
  req.flash('success', 'Profile updated');
  res.redirect('/auth/profile');
};
