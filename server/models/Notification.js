const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  user_role: { type: String, default: null, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  is_read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
