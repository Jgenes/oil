const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  employee_number: { type: String, required: true, unique: true, index: true },
  full_name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, required: true },
  licence_number: { type: String, required: true },
  licence_classes: { type: String, default: 'A, B, C, D, E' },
  licence_expiry: { type: String, required: true },
  status: { type: String, enum: ['Active', 'On Leave', 'Suspended', 'Retired'], default: 'Active' },
  assigned_vehicle_reg: { type: String, default: 'Unassigned' },
  total_trips: { type: Number, default: 0 },
  total_km_driven: { type: Number, default: 0 },
  avg_kml: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', DriverSchema);
