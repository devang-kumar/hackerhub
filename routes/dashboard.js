const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { isLoggedIn, isOrganizer } = require('../middleware/auth');

router.get('/', isLoggedIn, async (req, res, next) => {
  try {
    // Always re-read role from DB to avoid stale session bugs
    const User = require('../models/User');
    const user = await User.findById(req.session.userId).select('role');
    if (!user) { req.session.destroy(); return res.redirect('/auth/login'); }
    // Sync session role with DB
    req.session.role = user.role;
    if (user.role === 'organizer' || user.role === 'admin') {
      return ctrl.organizerDashboard(req, res, next);
    }
    return ctrl.userDashboard(req, res, next);
  } catch (err) { next(err); }
});

module.exports = router;
