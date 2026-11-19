const mongoose = require('mongoose');

const OdometerAdjustmentSchema = new mongoose.Schema({
  vehicle_registration: { type: String, required: true, uppercase: true, index: true },
  previous_odometer: { type: Number, required: true },
  new_odometer: { type: Number, required: true },
  reason: { type: String, required: true },
  authorized_by: { type: String, required: true },
  authorized_role: { type: String, required: true },
  adjustment_date: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('OdometerAdjustment', OdometerAdjustmentSchema);
