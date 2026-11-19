const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  event_timestamp: { type: Date, default: Date.now, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  username: { type: String, required: true },
  user_role: { type: String, required: true },
  action: { type: String, required: true, index: true },
  module: { type: String, required: true, index: true },
  record_id: { type: String, default: '' },
  description: { type: String, required: true },
  ip_address: { type: String, default: '127.0.0.1' },
  previous_state: { type: mongoose.Schema.Types.Mixed, default: null },
  new_state: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
