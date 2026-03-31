const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mentorController');
const { isLoggedIn } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/create', isLoggedIn, ctrl.getCreate);
router.post('/create', isLoggedIn, ctrl.postCreate);
router.get('/:id', ctrl.detail);
router.post('/:id/book', isLoggedIn, ctrl.bookSlot);

module.exports = router;
