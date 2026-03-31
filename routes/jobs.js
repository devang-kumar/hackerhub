const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jobController');
const { isLoggedIn, isOrganizer } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.list);
router.get('/my-applications', isLoggedIn, ctrl.myApplications);
router.get('/create', isLoggedIn, isOrganizer, ctrl.getCreate);
router.post('/create', isLoggedIn, isOrganizer, upload.single('banner'), ctrl.postCreate);
router.get('/:id', ctrl.detail);
router.post('/:id/apply', isLoggedIn, upload.single('resume'), ctrl.apply);
router.get('/:id/manage', isLoggedIn, isOrganizer, ctrl.manageApplications);
router.post('/applications/:appId/status', isLoggedIn, isOrganizer, ctrl.updateStatus);

module.exports = router;
