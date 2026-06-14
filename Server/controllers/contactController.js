const { sendEmail } = require('../utils/sendEmail');
const { config } = require('../config/secret');
const { ContactModel } = require('../models/contactModel'); 

exports.receiveContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }
    const contact = new ContactModel({ name, email, message });
    await contact.save();

    if (config.USER && config.PASS) {
      const subject = `Contact form: ${name}`;
      const payload = { name, email, message };
      try {
        await sendEmail(config.USER, subject, payload, '../utils/template/contact.handlebars');
      } catch (emailErr) {
        console.error('contact email notification failed', emailErr);
      }
    }

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