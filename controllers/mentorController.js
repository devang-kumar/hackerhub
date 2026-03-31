const Mentor = require('../models/Mentor');

exports.list = async (req, res) => {
  const { domain } = req.query;
  const filter = {};
  if (domain) filter.domain = domain;
  
  const mentors = await Mentor.find(filter).populate('user', 'name email profilePic');
  res.render('mentors/list', { mentors, query: req.query, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.detail = async (req, res) => {
  const mentor = await Mentor.findById(req.params.id).populate('user', 'name email bio');
  if (!mentor) { req.flash('error', 'Mentor not found'); return res.redirect('/mentors'); }
  res.render('mentors/detail', { mentor, session: req.session, messages: { error: req.flash('error'), success: req.flash('success') } });
};

exports.bookSlot = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return res.redirect('/mentors');
    
    const slotId = req.body.slotId;
    const slot = mentor.availableSlots.id(slotId);
    if (!slot || slot.isBooked) {
      req.flash('error', 'Slot unavailable');
      return res.redirect('/mentors/' + mentor._id);
    }
    
    slot.isBooked = true;
    slot.bookedBy = req.session.userId;
    mentor.sessionsCompleted += 1;
    await mentor.save();
    
    req.flash('success', 'Mentorship session booked successfully!');
    res.redirect('/mentors/' + mentor._id);
  } catch (error) {
    req.flash('error', 'Booking failed');
    res.redirect('/mentors/' + req.params.id);
  }
};

exports.getCreate = (req, res) => res.render('mentors/create', { session: req.session, messages: { error: req.flash('error') } });

exports.postCreate = async (req, res) => {
  try {
    const { domain, expertise, bio, pricePerHour } = req.body;
    
    // Mocking some available slots for demonstration
    const availableSlots = [
      { date: 'Tomorrow', time: '10:00 AM' },
      { date: 'Tomorrow', time: '02:00 PM' },
      { date: 'Next Week', time: '11:00 AM' }
    ];

    const mentor = await Mentor.create({
      user: req.session.userId,
      domain, 
      expertise: expertise ? expertise.split(',').map(e => e.trim()) : [],
      bio, 
      pricePerHour: pricePerHour || 0,
      availableSlots
    });
    
    req.flash('success', 'You are now registered as a Mentor!');
    res.redirect('/mentors/' + mentor._id);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/mentors/create');
  }
};
