const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String, required: true },
  full_name: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: [
      'admin',
      'transport_officer',
      'hod',
      'approver_hpmu',
      'finance_officer',
      'driver',
      'auditor',
      'management'
    ]
  },
  department: { type: String, default: 'General' },
  phone: { type: String, default: '' },
  signature_title: { type: String, default: '' },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'suspended'] }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
