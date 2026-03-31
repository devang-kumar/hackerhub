const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/practiceController');
const { isLoggedIn, isOrganizer } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/create', isLoggedIn, isOrganizer, ctrl.getCreate);
router.post('/create', isLoggedIn, isOrganizer, ctrl.postCreate);
router.get('/:id', ctrl.detail);
router.post('/:id/submit', isLoggedIn, ctrl.submitSolution);

module.exports = router;
