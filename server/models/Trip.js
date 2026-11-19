const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  trip_number: { type: String, required: true, unique: true, index: true },
  fuel_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FuelRequest', default: null },
  fuel_issuance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FuelIssuance', default: null },
  vehicle_registration: { type: String, required: true, index: true },
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  driver_name: { type: String, required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  department: { type: String, required: true },
  destination: { type: String, required: true },
  purpose: { type: String, required: true },
  start_date: { type: String, required: true },
  start_odometer: { type: Number, required: true },
  end_date: { type: String, default: null },
  end_odometer: { type: Number, default: null },
  distance_covered_km: { type: Number, default: 0 },
  fuel_allocated_litres: { type: Number, default: 0 },
  fuel_issued_litres: { type: Number, default: 0 },
  fuel_consumed_litres: { type: Number, default: 0 },
  fuel_remaining_litres: { type: Number, default: 0 },
  calculated_kml: { type: Number, default: 0 },
  baseline_kml: { type: Number, default: 8.0 },
  cost_per_km: { type: Number, default: 0 },
  total_trip_cost: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Cancelled'],
    default: 'In Progress',
    index: true
  },
  is_anomaly: { type: Boolean, default: false },
  anomaly_severity: { type: String, default: 'None', enum: ['None', 'Minor', 'Moderate', 'Severe'] },
  anomaly_reason: { type: String, default: null },
  anomaly_status: {
    type: String,
    enum: ['None', 'Flagged', 'Under Investigation', 'Justified', 'Cleared'],
    default: 'None'
  },
  odometer_override: { type: Boolean, default: false },
  odometer_override_reason: { type: String, default: null },
  driver_remarks: { type: String, default: '' },
  verified_by: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', TripSchema);
