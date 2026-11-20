const mongoose = require('mongoose');

const FuelRequestSchema = new mongoose.Schema({
  requisition_no: { type: String, required: true, unique: true, index: true },
  slip_no: { type: Number, required: true, index: true },
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  vehicle_registration: { type: String, required: true, uppercase: true },
  vehicle_model: { type: String, default: '' },
  department: { type: String, required: true },
  requisition_officer_name: { type: String, required: true },
  requisition_officer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  date_requested: { type: String, required: true },
  fuel_type: { type: String, enum: ['Diesel', 'Petrol'], required: true },
  litres_requested: { type: Number, required: true },
  current_odometer: { type: Number, required: true },
  last_request_odometer: { type: Number, default: 0 },
  purpose_of_journey: { type: String, required: true },
  destination: { type: String, required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  driver_name: { type: String, default: '' },
  status: {
    type: String,
    enum: [
      'submitted',
      'hod_recommended',
      'transport_verified',
      'hpmu_authorized',
      'finance_allocated',
      'issued',
      'rejected'
    ],
    default: 'submitted',
    index: true
  },
  unit_price_estimate: { type: Number, default: 3280 },
  total_estimated_cost: { type: Number, default: 0 },

  // HOD Stage
  hod_reviewed_by: { type: String, default: null },
  hod_review_date: { type: String, default: null },
  hod_comments: { type: String, default: null },

  // Transport Stage
  transport_verified_by: { type: String, default: null },
  transport_verify_date: { type: String, default: null },
  transport_comments: { type: String, default: null },
  transport_verified_odometer: { type: Number, default: null },

  // HPMU Stage
  hpmu_authorized_by: { type: String, default: null },
  hpmu_authorize_date: { type: String, default: null },
  hpmu_declaration: { type: String, default: null },
  hpmu_litres_authorized: { type: Number, default: null },
  hpmu_comments: { type: String, default: null },

  // Finance Stage
  finance_allocated_by: { type: String, default: null },
  finance_allocation_date: { type: String, default: null },
  finance_vote_code: { type: String, default: null },
  finance_amount_allocated: { type: Number, default: null },

  // Rejection
  rejection_reason: { type: String, default: null },
  rejected_by: { type: String, default: null },
  rejection_stage: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('FuelRequest', FuelRequestSchema);
