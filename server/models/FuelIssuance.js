const mongoose = require('mongoose');

const FuelIssuanceSchema = new mongoose.Schema({
  fuel_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FuelRequest', default: null },
  requisition_no: { type: String, required: true },
  slip_no: { type: Number, required: true },
  vehicle_registration: { type: String, required: true },
  driver_name: { type: String, default: '' },
  fuel_supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FuelSupplier', default: null },
  supplier_name: { type: String, required: true },
  station_location: { type: String, default: '' },
  fuel_type: { type: String, required: true },
  approved_litres: { type: Number, required: true },
  issued_litres: { type: Number, required: true },
  unit_price: { type: Number, required: true },
  total_cost: { type: Number, required: true },
  quantity_variance: { type: Number, default: 0 },
  variance_reason: { type: String, default: '' },
  odometer_at_issuance: { type: Number, required: true },
  invoice_receipt_no: { type: String, required: true },
  issued_by: { type: String, required: true },
  issuance_date: { type: String, required: true },
  remarks: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('FuelIssuance', FuelIssuanceSchema);
