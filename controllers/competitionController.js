const Competition = require('../models/Competition');
const Team = require('../models/Team');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.list = async (req, res) => {
  const { type, search, mode } = req.query;
  const filter = { status: 'active' };
  if (type) filter.type = type;
  if (mode) filter.mode = mode;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const competitions = await Competition.find(filter).populate('organizer', 'name').sort('-createdAt');
  res.render('competitions/list', { competitions, query: req.query, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.detail = async (req, res) => {
  const competition = await Competition.findById(req.params.id).populate('organizer', 'name email').populate('registrations');
  if (!competition) { req.flash('error', 'Competition not found'); return res.redirect('/competitions'); }
  let userTeam = null;
  if (req.session.userId) {
    userTeam = await Team.findOne({ competition: competition._id, $or: [{ leader: req.session.userId }, { 'members.user': req.session.userId }] }).populate('members.user', 'name email');
  }
  res.render('competitions/detail', { competition, userTeam, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.getCreate = (req, res) => res.render('competitions/create', { session: req.session, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { title, description, type, teamMin, teamMax, registrationDeadline, startDate, endDate, eligibility, mode, tags } = req.body;
    const prizes = [];
    if (req.body['prize_position']) {
      const positions = [].concat(req.body['prize_position']);
      const amounts = [].concat(req.body['prize_amount']);
      const descs = [].concat(req.body['prize_desc']);
      positions.forEach((p, i) => prizes.push({ position: p, amount: amounts[i], description: descs[i] }));
    }
    const stages = [];
    if (req.body['stage_title']) {
      const titles = [].concat(req.body['stage_title']);
      const descs = [].concat(req.body['stage_desc']);
      const starts = [].concat(req.body['stage_start']);
      const ends = [].concat(req.body['stage_end']);
      titles.forEach((t, i) => stages.push({ title: t, description: descs[i], startDate: starts[i], endDate: ends[i] }));
    }
    const comp = await Competition.create({
      title, description, type, eligibility, mode,
      teamSize: { min: teamMin || 1, max: teamMax || 4 },
      registrationDeadline, startDate, endDate,
      prizes, stages,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      organizer: req.session.userId,
      banner: req.file ? '/uploads/' + req.file.filename : ''
    });
    req.flash('success', 'Competition created successfully!');
    res.redirect('/competitions/' + comp._id);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/competitions/create');
  }
};

exports.register = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ error: 'Not found' });
    const { teamName, memberEmails } = req.body;
    const existing = await Team.findOne({ competition: competition._id, leader: req.session.userId });
    if (existing) { req.flash('error', 'You already registered'); return res.redirect('/competitions/' + competition._id); }
    const members = [];
    if (memberEmails) {
      const emails = memberEmails.split(',').map(e => e.trim()).filter(Boolean);
      for (const email of emails) {
        const token = uuidv4();
        members.push({ email, status: 'pending', inviteToken: token });
        const link = `${process.env.BASE_URL}/competitions/invite/${token}`;
        try {
          await transporter.sendMail({
            to: email, from: process.env.EMAIL_USER || 'no-reply@hackhub.local',
            subject: `You're invited to join team "${teamName}" for ${competition.title}`,
            html: `<h2>Team Invitation</h2><p>You've been invited to join <b>${teamName}</b> for <b>${competition.title}</b>.</p><p><a href="${link}">Accept Invitation</a></p>`
          });
        } catch (emailErr) {
          console.error('Failed to send invite email to', email, emailErr.message);
        }
      }
    }
    const team = await Team.create({ name: teamName, competition: competition._id, leader: req.session.userId, members });
    competition.registrations.push(team._id);
    await competition.save();
    req.flash('success', 'Registered successfully! Invites sent to team members.');
    res.redirect('/competitions/' + competition._id);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/competitions/' + req.params.id);
  }
};

exports.acceptInvite = async (req, res) => {
  const team = await Team.findOne({ 'members.inviteToken': req.params.token }).populate('competition');
  if (!team) { req.flash('error', 'Invalid invite link'); return res.redirect('/'); }
  const member = team.members.find(m => m.inviteToken === req.params.token);
  if (req.session.userId) {
    member.user = req.session.userId;
    member.status = 'accepted';
    member.inviteToken = undefined;
    await team.save();
    req.flash('success', 'You joined the team!');
    res.redirect('/competitions/' + team.competition._id);
  } else {
    res.render('competitions/invite', { token: req.params.token, team, session: req.session });
  }
};
