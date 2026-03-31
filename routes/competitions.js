const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/competitionController');
const { isLoggedIn, isOrganizer } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', ctrl.list);
router.get('/my', isLoggedIn, isOrganizer, ctrl.myCompetitions);
router.get('/create', isLoggedIn, isOrganizer, ctrl.getCreate);
router.post('/create', isLoggedIn, isOrganizer, upload.single('banner'), ctrl.postCreate);
router.get('/invite/:token', ctrl.acceptInvite);
router.get('/:id', ctrl.detail);
router.post('/:id/register', isLoggedIn, ctrl.register);
router.get('/:id/edit', isLoggedIn, isOrganizer, ctrl.getEdit);
router.post('/:id/edit', isLoggedIn, isOrganizer, upload.single('banner'), ctrl.postEdit);
router.post('/:id/delete', isLoggedIn, isOrganizer, ctrl.deleteCompetition);

module.exports = router;
