const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { isLoggedIn, isOrganizer } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/create', isLoggedIn, isOrganizer, ctrl.getCreate);
router.post('/create', isLoggedIn, isOrganizer, ctrl.postCreate);
router.get('/:id', ctrl.detail);
router.post('/:id/enroll', isLoggedIn, ctrl.enroll);

module.exports = router;
