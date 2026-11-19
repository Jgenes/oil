const mongoose = require('mongoose');

const FuelSupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact_person: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  station_type: { type: String, default: 'Contracted Station' },
  diesel_price_per_litre: { type: Number, required: true, default: 3280 },
  petrol_price_per_litre: { type: Number, required: true, default: 3240 },
  contract_status: { type: String, enum: ['Active', 'Pending Renewal', 'Terminated'], default: 'Active' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('FuelSupplier', FuelSupplierSchema);
