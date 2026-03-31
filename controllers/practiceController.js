const Practice = require('../models/Practice');

exports.list = async (req, res) => {
  const { difficulty, search } = req.query;
  const filter = {};
  if (difficulty) filter.difficulty = difficulty;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const problems = await Practice.find(filter).sort('-createdAt');
  res.render('practice/list', { problems, query: req.query, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.detail = async (req, res) => {
  const problem = await Practice.findById(req.params.id);
  if (!problem) { req.flash('error', 'Problem not found'); return res.redirect('/practice'); }
  const isSolved = req.session.userId ? problem.solvers.includes(req.session.userId) : false;
  res.render('practice/detail', { problem, isSolved, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.submitSolution = async (req, res) => {
  try {
    const problem = await Practice.findById(req.params.id);
    if (!problem) return res.redirect('/practice');

    // In a real app, this would execute code against test cases.
    // For this clone, we simulate a successful submission if code is provided.
    const { code } = req.body;
    if (!code || code.trim().length === 0) {
      req.flash('error', 'Code cannot be empty');
      return res.redirect('/practice/' + problem._id);
    }

    if (!problem.solvers.includes(req.session.userId)) {
      problem.solvers.push(req.session.userId);
      await problem.save();
    }
    
    req.flash('success', 'Solution Accepted! Passed all test cases.');
    res.redirect('/practice/' + problem._id);
  } catch (error) {
    req.flash('error', 'Submission error: ' + error.message);
    res.redirect('/practice/' + req.params.id);
  }
};

exports.getCreate = (req, res) => res.render('practice/create', { session: req.session, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { title, description, difficulty, tags, problemStatement, inputFormat, outputFormat, sampleInput, sampleOutput, score } = req.body;
    
    const problem = await Practice.create({
      title, description, difficulty, 
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      problemStatement, inputFormat, outputFormat, sampleInput, sampleOutput,
      score: score || 10,
      author: req.session.userId
    });
    
    req.flash('success', 'Practice problem created!');
    res.redirect('/practice/' + problem._id);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/practice/create');
  }
};
