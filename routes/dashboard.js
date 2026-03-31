const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { isLoggedIn, isOrganizer } = require('../middleware/auth');

router.get('/', isLoggedIn, (req, res, next) => {
  if (req.session.role === 'organizer' || req.session.role === 'admin') {
    return ctrl.organizerDashboard(req, res, next);
  }
  return ctrl.userDashboard(req, res, next);
});

module.exports = router;
