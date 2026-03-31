const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const mailer = require('../utils/mailer');

exports.getRegister = (req, res) => res.render('auth/register', { error: req.flash('error'), success: req.flash('success') });

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, role, organization, orgWebsite, orgDescription } = req.body;
    if (!name || !email || !password) { req.flash('error', 'All fields required'); return res.redirect('/auth/register'); }
    if (password.length < 6) { req.flash('error', 'Password must be at least 6 characters'); return res.redirect('/auth/register'); }
    if (role === 'organizer' && !organization) { req.flash('error', 'Organization name is required for organizer accounts'); return res.redirect('/auth/register'); }
    const existing = await User.findOne({ email });
    if (existing) { req.flash('error', 'Email already registered'); return res.redirect('/auth/register'); }
    const token = uuidv4();
    const userData = { name, email, password, role: role || 'user', verifyToken: token };
    if (role === 'organizer') { userData.organization = organization; userData.orgWebsite = orgWebsite || ''; userData.orgDescription = orgDescription || ''; }
    const user = await User.create(userData);
    const sent = await mailer.sendVerification(name, email, token);
    if (!sent) {
      user.isVerified = true; user.verifyToken = undefined; await user.save();
      req.flash('success', 'Registered! Email service unavailable — you can login directly.');
    } else {
      req.flash('success', 'Registered! Check your email to verify your account.');
    }
    res.redirect('/auth/login');
  } catch (err) { req.flash('error', err.message); res.redirect('/auth/register'); }
};

exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({ verifyToken: req.params.token });
  if (!user) { req.flash('error', 'Invalid or expired verification link'); return res.redirect('/auth/login'); }
  user.isVerified = true; user.verifyToken = undefined; await user.save();
  req.flash('success', 'Email verified! You can now login.');
  res.redirect('/auth/login');
};

exports.getLogin = (req, res) => res.render('auth/login', { error: req.flash('error'), success: req.flash('success') });

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { req.flash('error', 'All fields required'); return res.redirect('/auth/login'); }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) { req.flash('error', 'Invalid email or password'); return res.redirect('/auth/login'); }
    if (!user.isVerified) { req.flash('error', 'Please verify your email first'); return res.redirect('/auth/login'); }
    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.role = user.role;
    res.redirect('/dashboard');
  } catch (err) { req.flash('error', err.message); res.redirect('/auth/login'); }
};

exports.logout = (req, res) => { req.session.destroy(() => res.redirect('/')); };

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('auth/profile', { user, error: req.flash('error'), success: req.flash('success') });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, skills, college, organization, orgWebsite, orgDescription } = req.body;
    const update = { name, bio, college, skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [] };
    if (req.session.role === 'organizer') { update.organization = organization; update.orgWebsite = orgWebsite; update.orgDescription = orgDescription; }
    if (req.file) update.resume = '/uploads/' + req.file.filename;
    await User.findByIdAndUpdate(req.session.userId, update);
    req.session.userName = name;
    req.flash('success', 'Profile updated successfully');
    res.redirect('/auth/profile');
  } catch (err) { req.flash('error', err.message); res.redirect('/auth/profile'); }
};

exports.getForgotPassword = (req, res) => res.render('auth/forgot-password', { error: req.flash('error'), success: req.flash('success') });

exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) { req.flash('error', 'No account found with that email'); return res.redirect('/auth/forgot-password'); }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token; user.resetExpires = Date.now() + 3600000; await user.save();
    await mailer.sendPasswordReset(user.name, email, token);
    req.flash('success', 'Password reset link sent to your email');
    res.redirect('/auth/login');
  } catch (err) { req.flash('error', err.message); res.redirect('/auth/forgot-password'); }
};

exports.getResetPassword = async (req, res) => {
  const user = await User.findOne({ resetToken: req.params.token, resetExpires: { $gt: Date.now() } });
  if (!user) { req.flash('error', 'Reset link is invalid or expired'); return res.redirect('/auth/forgot-password'); }
  res.render('auth/reset-password', { token: req.params.token, error: req.flash('error') });
};

exports.postResetPassword = async (req, res) => {
  try {
    const { password, confirm } = req.body;
    if (password !== confirm) { req.flash('error', 'Passwords do not match'); return res.redirect('back'); }
    if (password.length < 6) { req.flash('error', 'Password must be at least 6 characters'); return res.redirect('back'); }
    const user = await User.findOne({ resetToken: req.params.token, resetExpires: { $gt: Date.now() } });
    if (!user) { req.flash('error', 'Reset link expired'); return res.redirect('/auth/forgot-password'); }
    user.password = password; user.resetToken = undefined; user.resetExpires = undefined; await user.save();
    req.flash('success', 'Password reset successfully! Please login.');
    res.redirect('/auth/login');
  } catch (err) { req.flash('error', err.message); res.redirect('back'); }
};
