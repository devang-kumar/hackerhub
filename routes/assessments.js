const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assessmentController');
const { isLoggedIn, isOrganizer } = require('../middleware/auth');

router.get('/my', isLoggedIn, isOrganizer, ctrl.myAssessments);
router.get('/create', isLoggedIn, isOrganizer, ctrl.getCreate);
router.post('/create', isLoggedIn, isOrganizer, ctrl.postCreate);
router.get('/:id/edit', isLoggedIn, isOrganizer, ctrl.getEdit);
router.post('/:id/edit', isLoggedIn, isOrganizer, ctrl.postEdit);
router.post('/:id/delete', isLoggedIn, isOrganizer, ctrl.deleteAssessment);
router.get('/:id', isLoggedIn, ctrl.detail);
router.get('/:id/take', isLoggedIn, ctrl.takeExam);
router.post('/:id/submit', isLoggedIn, ctrl.submitExam);

module.exports = router;
