exports.isLoggedIn = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  req.flash('error', 'Please login to continue');
  res.redirect('/auth/login');
};

exports.isOrganizer = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  req.flash('error', 'Please login to access this feature');
  res.redirect('/auth/login');
};
