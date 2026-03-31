const Assessment = require('../models/Assessment');
const Application = require('../models/Application');

exports.getCreate = (req, res) => res.render('assessment/create', { session: req.session, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { title, description, duration, linkedTo, linkedId } = req.body;
    const questions = [];
    if (req.body['q_text']) {
      const texts = [].concat(req.body['q_text']);
      const types = [].concat(req.body['q_type']);
      const marks = [].concat(req.body['q_marks']);
      const correct = [].concat(req.body['q_correct'] || []);
      texts.forEach((text, i) => {
        const q = { text, type: types[i], marks: marks[i] || 1 };
        if (types[i] === 'mcq') {
          q.options = [req.body[`q_opt_${i}_0`], req.body[`q_opt_${i}_1`], req.body[`q_opt_${i}_2`], req.body[`q_opt_${i}_3`]].filter(Boolean);
          q.correctAnswer = correct[i];
        }
        questions.push(q);
      });
    }
    const assessment = await Assessment.create({ title, description, duration, linkedTo, linkedId, questions, organizer: req.session.userId });
    req.flash('success', 'Assessment created!');
    res.redirect('/assessments/' + assessment._id);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/assessments/create');
  }
};

exports.detail = async (req, res) => {
  const assessment = await Assessment.findById(req.params.id).populate('organizer', 'name');
  if (!assessment) { req.flash('error', 'Not found'); return res.redirect('/'); }
  res.render('assessment/detail', { assessment, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.takeExam = async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.redirect('/');
  // Shuffle questions for anti-cheat
  const questions = [...assessment.questions].sort(() => Math.random() - 0.5);
  res.render('assessment/exam', { assessment: { ...assessment.toObject(), questions }, session: req.session });
};

exports.submitExam = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    let score = 0;
    assessment.questions.forEach(q => {
      if (q.type === 'mcq' && req.body['ans_' + q._id] === q.correctAnswer) {
        score += q.marks;
      }
    });
    // Update application score if linked to job
    if (assessment.linkedTo === 'job') {
      await Application.findOneAndUpdate(
        { job: assessment.linkedId, applicant: req.session.userId },
        { assessmentScore: score, assessmentCompleted: true }
      );
    }
    res.render('assessment/result', { score, total: assessment.questions.reduce((a, q) => a + q.marks, 0), session: req.session });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/');
  }
};

exports.myAssessments = async (req, res) => {
  const assessments = await Assessment.find({ organizer: req.session.userId });
  res.render('assessment/list', { assessments, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};
