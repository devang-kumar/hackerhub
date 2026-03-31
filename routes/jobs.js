const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/jobController');
const { isLoggedIn, isOrganizer } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.list);
router.get('/my-applications', isLoggedIn, ctrl.myApplications);
router.get('/my-jobs', isLoggedIn, isOrganizer, ctrl.myJobs);
router.get('/create', isLoggedIn, isOrganizer, ctrl.getCreate);
router.post('/create', isLoggedIn, isOrganizer, upload.single('banner'), ctrl.postCreate);
router.post('/applications/:appId/status', isLoggedIn, isOrganizer, ctrl.updateStatus);
router.get('/:id', ctrl.detail);
router.post('/:id/apply', isLoggedIn, upload.single('resume'), ctrl.apply);
router.get('/:id/edit', isLoggedIn, isOrganizer, ctrl.getEdit);
router.post('/:id/edit', isLoggedIn, isOrganizer, upload.single('banner'), ctrl.postEdit);
router.post('/:id/delete', isLoggedIn, isOrganizer, ctrl.deleteJob);
router.post('/:id/toggle-status', isLoggedIn, isOrganizer, ctrl.toggleStatus);
router.get('/:id/manage', isLoggedIn, isOrganizer, ctrl.manageApplications);

module.exports = router;
