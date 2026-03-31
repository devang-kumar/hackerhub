const Competition = require('../models/Competition');
const Team = require('../models/Team');
const { v4: uuidv4 } = require('uuid');
const mailer = require('../utils/mailer');

exports.list = async (req, res) => {
  try {
    const { type, search, mode } = req.query;
    const filter = { status: 'active' };
    if (type) filter.type = type;
    if (mode) filter.mode = mode;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const competitions = await Competition.find(filter).populate('organizer', 'name').sort('-createdAt');
    res.render('competitions/list', { competitions, query: req.query, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

exports.detail = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id).populate('organizer', 'name email _id').populate('registrations');
    if (!competition) { req.flash('error', 'Competition not found'); return res.redirect('/competitions'); }
    let userTeam = null;
    if (req.session.userId) {
      userTeam = await Team.findOne({ competition: competition._id, $or: [{ leader: req.session.userId }, { 'members.user': req.session.userId }] }).populate('members.user', 'name email');
    }
    res.render('competitions/detail', { competition, userTeam, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/competitions'); }
};

exports.getCreate = (req, res) => res.render('competitions/create', { competition: null, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { title, description, type, teamMin, teamMax, registrationDeadline, startDate, endDate, eligibility, mode, tags } = req.body;
    if (!title || !description) { req.flash('error', 'Title and description are required'); return res.redirect('/competitions/create'); }
    const prizes = parsePrizes(req.body);
    const stages = parseStages(req.body);
    const comp = await Competition.create({
      title, description, type, eligibility, mode,
      teamSize: { min: parseInt(teamMin) || 1, max: parseInt(teamMax) || 4 },
      registrationDeadline: registrationDeadline || null,
      startDate: startDate || null,
      endDate: endDate || null,
      prizes, stages,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
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

exports.getEdit = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) { req.flash('error', 'Not found'); return res.redirect('/competitions'); }
    if (competition.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/competitions'); }
    res.render('competitions/create', { competition, messages: { error: req.flash('error') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/competitions'); }
};

exports.postEdit = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) { req.flash('error', 'Not found'); return res.redirect('/competitions'); }
    if (competition.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/competitions'); }
    const { title, description, type, teamMin, teamMax, registrationDeadline, startDate, endDate, eligibility, mode, tags } = req.body;
    competition.title = title;
    competition.description = description;
    competition.type = type;
    competition.eligibility = eligibility;
    competition.mode = mode;
    competition.teamSize = { min: parseInt(teamMin) || 1, max: parseInt(teamMax) || 4 };
    competition.registrationDeadline = registrationDeadline || null;
    competition.startDate = startDate || null;
    competition.endDate = endDate || null;
    competition.prizes = parsePrizes(req.body);
    competition.stages = parseStages(req.body);
    competition.tags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (req.file) competition.banner = '/uploads/' + req.file.filename;
    await competition.save();
    req.flash('success', 'Competition updated!');
    res.redirect('/competitions/' + competition._id);
  } catch (err) { req.flash('error', err.message); res.redirect('/competitions/' + req.params.id); }
};

exports.deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) { req.flash('error', 'Not found'); return res.redirect('/competitions'); }
    if (competition.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/competitions'); }
    await Team.deleteMany({ competition: competition._id });
    await Competition.findByIdAndDelete(req.params.id);
    req.flash('success', 'Competition deleted');
    res.redirect('/competitions');
  } catch (err) { req.flash('error', err.message); res.redirect('/competitions'); }
};

exports.register = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) { req.flash('error', 'Not found'); return res.redirect('/competitions'); }
    if (competition.registrationDeadline && new Date() > new Date(competition.registrationDeadline)) {
      req.flash('error', 'Registration deadline has passed'); return res.redirect('/competitions/' + competition._id);
    }
    const { teamName, memberEmails } = req.body;
    if (!teamName) { req.flash('error', 'Team name is required'); return res.redirect('/competitions/' + competition._id); }
    const existing = await Team.findOne({ competition: competition._id, leader: req.session.userId });
    if (existing) { req.flash('error', 'You already registered for this competition'); return res.redirect('/competitions/' + competition._id); }
    const members = [];
    if (memberEmails) {
      const emails = memberEmails.split(',').map(e => e.trim()).filter(Boolean);
      const maxMembers = competition.teamSize.max - 1;
      const toInvite = emails.slice(0, maxMembers);
      for (const email of toInvite) {
        const token = uuidv4();
        // Check if user already exists on platform
        const existingUser = await require('../models/User').findOne({ email });
        const memberEntry = { email, status: 'pending', inviteToken: token };
        if (existingUser) memberEntry.user = existingUser._id;
        members.push(memberEntry);
        await mailer.sendTeamInvite(email, teamName, competition.title, token);
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
  try {
    const team = await Team.findOne({ 'members.inviteToken': req.params.token }).populate('competition');
    if (!team) { req.flash('error', 'Invalid or expired invite link'); return res.redirect('/'); }
    if (!req.session.userId) {
      return res.render('competitions/invite', { token: req.params.token, team, session: req.session });
    }
    const member = team.members.find(m => m.inviteToken === req.params.token);
    member.user = req.session.userId;
    member.status = 'accepted';
    member.inviteToken = undefined;
    await team.save();
    req.flash('success', 'You joined the team!');
    res.redirect('/competitions/' + team.competition._id);
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

exports.myCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find({ organizer: req.session.userId }).sort('-createdAt');
    res.render('competitions/my', { competitions, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

// Helpers
function parsePrizes(body) {
  if (!body['prize_position']) return [];
  const positions = [].concat(body['prize_position']);
  const amounts = [].concat(body['prize_amount'] || []);
  const descs = [].concat(body['prize_desc'] || []);
  return positions.filter(p => p).map((p, i) => ({ position: p, amount: amounts[i] || '', description: descs[i] || '' }));
}

function parseStages(body) {
  if (!body['stage_title']) return [];
  const titles = [].concat(body['stage_title']);
  const descs = [].concat(body['stage_desc'] || []);
  const starts = [].concat(body['stage_start'] || []);
  const ends = [].concat(body['stage_end'] || []);
  return titles.filter(t => t).map((t, i) => ({ title: t, description: descs[i] || '', startDate: starts[i] || null, endDate: ends[i] || null }));
}
