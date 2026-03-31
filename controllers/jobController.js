const Job = require('../models/Job');
const Application = require('../models/Application');

exports.list = async (req, res) => {
  const { type, search, location } = req.query;
  const filter = { status: 'active' };
  if (type) filter.type = type;
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { company: { $regex: search, $options: 'i' } }];
  const jobs = await Job.find(filter).populate('organizer', 'name').sort('-createdAt');
  res.render('jobs/list', { jobs, query: req.query, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.detail = async (req, res) => {
  const job = await Job.findById(req.params.id).populate('organizer', 'name email');
  if (!job) { req.flash('error', 'Job not found'); return res.redirect('/jobs'); }
  let applied = false;
  if (req.session.userId) {
    applied = await Application.exists({ job: job._id, applicant: req.session.userId });
  }
  res.render('jobs/detail', { job, applied, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.getCreate = (req, res) => res.render('jobs/create', { session: req.session, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { title, company, description, location, type, salary, skills, eligibility, applyDeadline } = req.body;
    const job = await Job.create({
      title, company, description, location, type, salary, eligibility, applyDeadline,
      skills: skills ? skills.split(',').map(s => s.trim()) : [],
      organizer: req.session.userId,
      banner: req.file ? '/uploads/' + req.file.filename : ''
    });
    req.flash('success', 'Job posted successfully!');
    res.redirect('/jobs/' + job._id);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/jobs/create');
  }
};

exports.apply = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.redirect('/jobs');
    const existing = await Application.findOne({ job: job._id, applicant: req.session.userId });
    if (existing) { req.flash('error', 'Already applied'); return res.redirect('/jobs/' + job._id); }
    const { coverLetter } = req.body;
    const resumePath = req.file ? '/uploads/' + req.file.filename : '';
    if (!resumePath) { req.flash('error', 'Resume is required'); return res.redirect('/jobs/' + job._id); }
    const app = await Application.create({ job: job._id, applicant: req.session.userId, resume: resumePath, coverLetter });
    job.applications.push(app._id);
    await job.save();
    req.flash('success', 'Application submitted!');
    if (job.assessmentId) return res.redirect('/assessments/' + job.assessmentId + '/take');
    res.redirect('/jobs/' + job._id);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/jobs/' + req.params.id);
  }
};

exports.myApplications = async (req, res) => {
  const applications = await Application.find({ applicant: req.session.userId }).populate('job');
  res.render('jobs/my-applications', { applications, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.manageApplications = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job || job.organizer.toString() !== req.session.userId.toString()) {
    req.flash('error', 'Unauthorized'); return res.redirect('/jobs');
  }
  const applications = await Application.find({ job: job._id }).populate('applicant', 'name email skills');
  res.render('jobs/manage', { job, applications, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.updateStatus = async (req, res) => {
  await Application.findByIdAndUpdate(req.params.appId, { status: req.body.status });
  req.flash('success', 'Status updated');
  res.redirect('back');
};
