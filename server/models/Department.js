const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  hod_name: { type: String, default: '' },
  hod_email: { type: String, default: '' },
  budget_allocated: { type: Number, default: 0 },
  budget_spent: { type: Number, default: 0 },
  description: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', DepartmentSchema);
