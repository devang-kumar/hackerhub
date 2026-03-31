const User = require('../models/User');
const Competition = require('../models/Competition');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Team = require('../models/Team');
const Assessment = require('../models/Assessment');

// USER DASHBOARD
exports.userDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Job applications with full job info
    const applications = await Application.find({ applicant: userId })
      .populate('job', 'title company type location status applyDeadline')
      .sort('-appliedAt');

    // Teams the user is part of (as leader or member)
    const teams = await Team.find({
      $or: [{ leader: userId }, { 'members.user': userId }]
    })
      .populate('competition', 'title type startDate endDate status banner prizes')
      .populate('leader', 'name email')
      .populate('members.user', 'name email');

    // Stats
    const stats = {
      totalApplications: applications.length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      hired: applications.filter(a => a.status === 'hired').length,
      competitions: teams.length
    };

    res.render('dashboard/user', { applications, teams, stats, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

// ORGANIZER DASHBOARD
exports.organizerDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;

    // All jobs by this organizer with application counts
    const jobs = await Job.find({ organizer: userId }).sort('-createdAt');
    const jobIds = jobs.map(j => j._id);

    // Recent applications across all jobs
    const recentApplications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title company')
      .populate('applicant', 'name email skills college')
      .sort('-appliedAt')
      .limit(10);

    // All competitions by this organizer
    const competitions = await Competition.find({ organizer: userId }).sort('-createdAt');
    const compIds = competitions.map(c => c._id);

    // Teams registered for organizer's competitions
    const teams = await Team.find({ competition: { $in: compIds } })
      .populate('competition', 'title')
      .populate('leader', 'name email')
      .populate('members.user', 'name email')
      .sort('-createdAt');

    // Assessments
    const assessments = await Assessment.find({ organizer: userId });

    // Stats
    const totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
    const stats = {
      jobs: jobs.length,
      competitions: competitions.length,
      totalApplications,
      teams: teams.length,
      assessments: assessments.length,
      activeJobs: jobs.filter(j => j.status === 'active').length
    };

    res.render('dashboard/organizer', {
      jobs, competitions, recentApplications, teams, assessments, stats,
      messages: { error: req.flash('error'), success: req.flash('success') }
    });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};
