const { notifyNewMessage } = require('../services/shopNotifications');
const { ContactModel } = require('../models/contactModel'); 

exports.receiveContact = async (req, res) => {
  try {
    const { name, message } = req.body;
    const email = String(req.body.email || '').trim();
    const phone = String(req.body.phone || '').replace(/[^\d+\-\s]/g, '').trim().slice(0, 20);
    // Many customers have no email at hand: a phone number is enough
    if (!name || !message || (!email && !phone)) {
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }
    const contact = new ContactModel({ name, email, phone, message });
    await contact.save();

    // The shop owner gets an email alert when she set an address in the admin (in the background)
    notifyNewMessage({ name, email, phone, message });

    res.status(200).json({ ok: true, message: 'Sent' });
  } catch (err) {
    console.error('contact controller error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};
exports.getContacts = async (req, res) => {
  try {
    const contacts = await ContactModel.find({});
    res.json(contacts);
  } catch (err) {
    console.error('contact controller error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};
exports.deleteContact = async (req, res) => {
  try {
    const contact = await ContactModel.deleteOne({ _id: req.params.id });
    res.json(contact);
  } catch (err) {
    console.error('contact controller error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};
exports.updateContactStatus = async (req, res) => {
  try {
    const contact = await ContactModel.updateOne({ _id: req.params.id }, { $set: { status: req.body.status } });
    res.json(contact);
  } catch (err) {
    console.error('contact controller error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};