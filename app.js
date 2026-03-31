require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(flash());

// Globals for all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/competitions', require('./routes/competitions'));
app.use('/jobs', require('./routes/jobs'));
app.use('/assessments', require('./routes/assessments'));

// Home
app.get('/', async (req, res) => {
  try {
    const Competition = require('./models/Competition');
    const Job = require('./models/Job');
    const competitions = await Competition.find({ status: 'active' }).limit(6).sort('-createdAt');
    const jobs = await Job.find({ status: 'active' }).limit(6).sort('-createdAt');
    res.render('index', { competitions, jobs });
  } catch (err) {
    res.render('index', { competitions: [], jobs: [] });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  req.flash('error', 'Something went wrong');
  res.redirect('back');
});

// 404
app.use((req, res) => res.status(404).render('404', {}));

module.exports = app;
