const Course = require('../models/Course');

exports.list = async (req, res) => {
  const courses = await Course.find({}).populate('instructor', 'name');
  res.render('courses/list', { courses, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.detail = async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name');
  if (!course) { req.flash('error', 'Course not found'); return res.redirect('/courses'); }
  const isEnrolled = req.session.userId ? course.enrolledUsers.includes(req.session.userId) : false;
  res.render('courses/detail', { course, isEnrolled, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.enroll = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.redirect('/courses');
    if (!course.enrolledUsers.includes(req.session.userId)) {
      course.enrolledUsers.push(req.session.userId);
      await course.save();
    }
    req.flash('success', 'Successfully enrolled!');
    res.redirect('/courses/' + course._id);
  } catch (error) {
    req.flash('error', 'Enrollment failed');
    res.redirect('/courses/' + req.params.id);
  }
};

// Create routes (mocked out for organizer/admin)
exports.getCreate = (req, res) => res.render('courses/create', { session: req.session, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { title, description, level, duration, price } = req.body;
    // For simplicity, we just add one module from form
    const modules = [];
    if (req.body.moduleTitle) {
      modules.push({ title: req.body.moduleTitle, videoUrl: req.body.videoUrl, content: req.body.moduleContent });
    }
    const course = await Course.create({
      title, description, level, duration, price,
      instructor: req.session.userId,
      modules
    });
    req.flash('success', 'Course created!');
    res.redirect('/courses/' + course._id);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/courses/create');
  }
};
