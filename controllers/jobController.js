const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const mailer = require('../utils/mailer');

exports.list = async (req, res) => {
  try {
    const { type, search, location } = req.query;
    const filter = { status: 'active' };
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { company: { $regex: search, $options: 'i' } }];
    const jobs = await Job.find(filter).populate('organizer', 'name').sort('-createdAt');
    res.render('jobs/list', { jobs, query: req.query, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

exports.detail = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('organizer', 'name email _id');
    if (!job) { req.flash('error', 'Job not found'); return res.redirect('/jobs'); }
    let applied = false;
    if (req.session.userId) applied = !!(await Application.exists({ job: job._id, applicant: req.session.userId }));
    res.render('jobs/detail', { job, applied, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/jobs'); }
};

exports.getCreate = (req, res) => res.render('jobs/create', { job: null, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { title, company, description, location, type, salary, skills, eligibility, applyDeadline } = req.body;
    if (!title || !company || !description) { req.flash('error', 'Title, company and description are required'); return res.redirect('/jobs/create'); }
    const job = await Job.create({
      title, company, description, location, type, salary, eligibility,
      applyDeadline: applyDeadline || null,
      skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      organizer: req.session.userId,
      banner: req.file ? '/uploads/' + req.file.filename : ''
    });
    req.flash('success', 'Job posted successfully!');
    res.redirect('/jobs/' + job._id);
  } catch (err) { req.flash('error', err.message); res.redirect('/jobs/create'); }
};

exports.getEdit = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) { req.flash('error', 'Not found'); return res.redirect('/jobs'); }
    if (job.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/jobs'); }
    res.render('jobs/create', { job, messages: { error: req.flash('error') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/jobs'); }
};

exports.postEdit = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) { req.flash('error', 'Not found'); return res.redirect('/jobs'); }
    if (job.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/jobs'); }
    const { title, company, description, location, type, salary, skills, eligibility, applyDeadline } = req.body;
    job.title = title; job.company = company; job.description = description;
    job.location = location; job.type = type; job.salary = salary;
    job.eligibility = eligibility; job.applyDeadline = applyDeadline || null;
    job.skills = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (req.file) job.banner = '/uploads/' + req.file.filename;
    await job.save();
    req.flash('success', 'Job updated!');
    res.redirect('/jobs/' + job._id);
  } catch (err) { req.flash('error', err.message); res.redirect('/jobs/' + req.params.id); }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) { req.flash('error', 'Not found'); return res.redirect('/jobs'); }
    if (job.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/jobs'); }
    await Application.deleteMany({ job: job._id });
    await Job.findByIdAndDelete(req.params.id);
    req.flash('success', 'Job deleted');
    res.redirect('/jobs');
  } catch (err) { req.flash('error', err.message); res.redirect('/jobs'); }
};

exports.apply = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) { req.flash('error', 'Job not found'); return res.redirect('/jobs'); }
    if (job.status === 'closed') { req.flash('error', 'This job is no longer accepting applications'); return res.redirect('/jobs/' + job._id); }
    if (job.applyDeadline && new Date() > new Date(job.applyDeadline)) {
      req.flash('error', 'Application deadline has passed'); return res.redirect('/jobs/' + job._id);
    }
    const existing = await Application.findOne({ job: job._id, applicant: req.session.userId });
    if (existing) { req.flash('error', 'You already applied for this job'); return res.redirect('/jobs/' + job._id); }
    const resumePath = req.file ? '/uploads/' + req.file.filename : '';
    if (!resumePath) { req.flash('error', 'Resume is required'); return res.redirect('/jobs/' + job._id); }
    const app = await Application.create({ job: job._id, applicant: req.session.userId, resume: resumePath, coverLetter: req.body.coverLetter || '' });
    job.applications.push(app._id);
    await job.save();
    const applicant = await User.findById(req.session.userId);
    if (applicant) await mailer.sendApplicationConfirmation(applicant.name, applicant.email, job.title, job.company);
    req.flash('success', 'Application submitted! Check your email for confirmation.');
    if (job.assessmentId) return res.redirect('/assessments/' + job.assessmentId + '/take');
    res.redirect('/jobs/' + job._id);
  } catch (err) { req.flash('error', err.message); res.redirect('/jobs/' + req.params.id); }
};

exports.myApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.session.userId }).populate('job').sort('-appliedAt');
    res.render('jobs/my-applications', { applications, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

exports.manageApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/jobs'); }
    const applications = await Application.find({ job: job._id }).populate('applicant', 'name email skills college').sort('-appliedAt');
    res.render('jobs/manage', { job, applications, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/jobs'); }
};

exports.updateStatus = async (req, res) => {
  try {
    const app = await Application.findById(req.params.appId).populate('applicant', 'name email').populate('job', 'title organizer');
    if (!app) { req.flash('error', 'Application not found'); return res.redirect('back'); }
    if (app.job.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('back'); }
    app.status = req.body.status;
    await app.save();
    await mailer.sendStatusUpdate(app.applicant.name, app.applicant.email, app.job.title, req.body.status);
    req.flash('success', 'Status updated and applicant notified');
    res.redirect('back');
  } catch (err) { req.flash('error', err.message); res.redirect('back'); }
};

exports.myJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ organizer: req.session.userId }).sort('-createdAt');
    res.render('jobs/my-jobs', { jobs, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

exports.toggleStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('back'); }
    job.status = job.status === 'active' ? 'closed' : 'active';
    await job.save();
    req.flash('success', `Job ${job.status === 'active' ? 'reopened' : 'closed'}`);
    res.redirect('back');
  } catch (err) { req.flash('error', err.message); res.redirect('back'); }
};
