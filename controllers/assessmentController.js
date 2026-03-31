const Assessment = require('../models/Assessment');
const Application = require('../models/Application');
const User = require('../models/User');
const mailer = require('../utils/mailer');

exports.getCreate = (req, res) => res.render('assessment/create', { assessment: null, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { title, description, duration, linkedTo, linkedId } = req.body;
    if (!title) { req.flash('error', 'Title is required'); return res.redirect('/assessments/create'); }
    const questions = parseQuestions(req.body);
    if (questions.length === 0) { req.flash('error', 'Add at least one question'); return res.redirect('/assessments/create'); }
    const assessment = await Assessment.create({
      title, description, duration: parseInt(duration) || 60,
      linkedTo, linkedId: linkedId || null,
      questions, organizer: req.session.userId
    });
    req.flash('success', 'Assessment created!');
    res.redirect('/assessments/' + assessment._id);
  } catch (err) { req.flash('error', err.message); res.redirect('/assessments/create'); }
};

exports.getEdit = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) { req.flash('error', 'Not found'); return res.redirect('/assessments/my'); }
    if (assessment.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/assessments/my'); }
    res.render('assessment/create', { assessment, messages: { error: req.flash('error') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/assessments/my'); }
};

exports.postEdit = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) { req.flash('error', 'Not found'); return res.redirect('/assessments/my'); }
    if (assessment.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/assessments/my'); }
    assessment.title = req.body.title;
    assessment.description = req.body.description;
    assessment.duration = parseInt(req.body.duration) || 60;
    assessment.linkedTo = req.body.linkedTo;
    assessment.linkedId = req.body.linkedId || null;
    assessment.questions = parseQuestions(req.body);
    await assessment.save();
    req.flash('success', 'Assessment updated!');
    res.redirect('/assessments/' + assessment._id);
  } catch (err) { req.flash('error', err.message); res.redirect('/assessments/' + req.params.id); }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) { req.flash('error', 'Not found'); return res.redirect('/assessments/my'); }
    if (assessment.organizer.toString() !== req.session.userId) { req.flash('error', 'Unauthorized'); return res.redirect('/assessments/my'); }
    await Assessment.findByIdAndDelete(req.params.id);
    req.flash('success', 'Assessment deleted');
    res.redirect('/assessments/my');
  } catch (err) { req.flash('error', err.message); res.redirect('/assessments/my'); }
};

exports.detail = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('organizer', 'name');
    if (!assessment) { req.flash('error', 'Not found'); return res.redirect('/'); }
    res.render('assessment/detail', { assessment, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

exports.takeExam = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) { req.flash('error', 'Assessment not found'); return res.redirect('/'); }
    const questions = [...assessment.questions].sort(() => Math.random() - 0.5);
    res.render('assessment/exam', { assessment: { ...assessment.toObject(), questions } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

exports.submitExam = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.redirect('/');
    let score = 0;
    const total = assessment.questions.reduce((a, q) => a + (q.marks || 1), 0);
    assessment.questions.forEach(q => {
      const ans = req.body['ans_' + q._id];
      if (q.type === 'mcq' && ans && ans.trim() === q.correctAnswer.trim()) {
        score += q.marks || 1;
      }
    });
    // Update application score if linked to job
    if (assessment.linkedTo === 'job' && assessment.linkedId) {
      await Application.findOneAndUpdate(
        { job: assessment.linkedId, applicant: req.session.userId },
        { assessmentScore: score, assessmentCompleted: true }
      );
    }
    // Send result email
    const user = await User.findById(req.session.userId);
    if (user) await mailer.sendAssessmentResult(user.name, user.email, assessment.title, score, total);
    res.render('assessment/result', { score, total });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

exports.myAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ organizer: req.session.userId }).sort('-createdAt');
    res.render('assessment/list', { assessments, messages: { error: req.flash('error'), success: req.flash('success') } });
  } catch (err) { req.flash('error', err.message); res.redirect('/'); }
};

// Helper
function parseQuestions(body) {
  if (!body['q_text']) return [];
  const texts = [].concat(body['q_text']);
  const types = [].concat(body['q_type'] || []);
  const marks = [].concat(body['q_marks'] || []);
  const corrects = [].concat(body['q_correct'] || []);
  return texts.filter(t => t).map((text, i) => {
    const q = { text, type: types[i] || 'mcq', marks: parseInt(marks[i]) || 1 };
    if (q.type === 'mcq') {
      q.options = [body[`q_opt_${i}_0`], body[`q_opt_${i}_1`], body[`q_opt_${i}_2`], body[`q_opt_${i}_3`]].filter(Boolean);
      q.correctAnswer = corrects[i] || '';
    }
    return q;
  });
}
