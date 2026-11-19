const mongoose = require('mongoose');

const MaintenanceRecordSchema = new mongoose.Schema({
  vehicle_registration: { type: String, required: true, index: true },
  service_type: { type: String, required: true },
  service_date: { type: String, required: true },
  odometer_at_service: { type: Number, required: true },
  garage_supplier: { type: String, required: true },
  description_of_work: { type: String, default: '' },
  spare_parts_replaced: { type: String, default: '' },
  parts_cost: { type: Number, default: 0 },
  labor_cost: { type: Number, default: 0 },
  total_cost: { type: Number, default: 0 },
  invoice_number: { type: String, default: '' },
  next_service_odometer: { type: Number, default: 0 },
  next_service_date: { type: String, default: '' },
  service_status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed'], default: 'Completed' },
  approved_by: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('MaintenanceRecord', MaintenanceRecordSchema);
