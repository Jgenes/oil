const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  registration_number: { type: String, required: true, unique: true, uppercase: true, index: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  category: {
    type: String,
    enum: ['Executive / SUV', 'Operational / Pick-up', 'Passenger / Bus', 'Utility / Van', 'Motorcycle'],
    default: 'Operational / Pick-up'
  },
  engine_capacity: { type: String, default: '' },
  fuel_type: { type: String, enum: ['Diesel', 'Petrol'], default: 'Diesel' },
  tank_capacity_litres: { type: Number, default: 80 },
  baseline_consumption_kml: { type: Number, required: true, default: 8.0 },
  assigned_department: { type: String, default: 'Transport Section' },
  assigned_driver: { type: String, default: 'Unassigned' },
  assigned_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  current_odometer: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['Active', 'On Trip', 'Maintenance', 'Grounded'], default: 'Active' },
  insurance_expiry: { type: String, default: '' },
  inspection_expiry: { type: String, default: '' },
  last_service_date: { type: String, default: '' },
  last_service_odometer: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
