const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole, logAudit } = require('../middleware/auth');

// Get all suppliers
router.get('/', authenticateToken, (req, res) => {
  const suppliers = db.prepare(`
    SELECT
      s.*,
      (SELECT COUNT(*) FROM fuel_issuances WHERE supplier_id = s.id) as total_transactions,
      (SELECT COALESCE(SUM(quantity_issued), 0) FROM fuel_issuances WHERE supplier_id = s.id) as total_litres_supplied,
      (SELECT COALESCE(SUM(total_cost), 0) FROM fuel_issuances WHERE supplier_id = s.id) as total_amount_paid
    FROM fuel_suppliers s
    ORDER BY s.id ASC
  `).all();

  res.json({ success: true, data: suppliers });
});

// Get single supplier with transaction history
router.get('/:id', authenticateToken, (req, res) => {
  const supplier = db.prepare('SELECT * FROM fuel_suppliers WHERE id = ?').get(req.params.id);
  if (!supplier) {
    return res.status(404).json({ success: false, error: 'Fuel supplier station not found' });
  }

  const transactions = db.prepare(`
    SELECT fi.*, v.registration_number, dr.full_name as driver_name, fr.request_number
    FROM fuel_issuances fi
    JOIN vehicles v ON fi.vehicle_id = v.id
    LEFT JOIN drivers dr ON fi.driver_id = dr.id
    LEFT JOIN fuel_requests fr ON fi.fuel_request_id = fr.id
    WHERE fi.supplier_id = ?
    ORDER BY fi.issuance_date DESC
  `).all(req.params.id);

  res.json({
    success: true,
    data: {
      ...supplier,
      transactions
    }
  });
});

// Add new supplier
router.post('/', authenticateToken, requireRole(['transport_officer', 'finance_officer', 'admin']), (req, res) => {
  const {
    supplier_name, station_name, location, contact_person, phone_number,
    email, diesel_price_per_litre, petrol_price_per_litre, contract_reference
  } = req.body;

  if (!supplier_name || !station_name || !location) {
    return res.status(400).json({ success: false, error: 'Supplier name, station name, and location are required' });
  }

  const insert = db.prepare(`
    INSERT INTO fuel_suppliers (
      supplier_name, station_name, location, contact_person, phone_number,
      email, diesel_price_per_litre, petrol_price_per_litre, contract_reference
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    supplier_name.trim(),
    station_name.trim(),
    location.trim(),
    contact_person || null,
    phone_number || null,
    email || null,
    diesel_price_per_litre ? Number(diesel_price_per_litre) : 3280,
    petrol_price_per_litre ? Number(petrol_price_per_litre) : 3240,
    contract_reference || null
  );

  logAudit({
    user: req.user,
    action: 'CREATE',
    module: 'Suppliers',
    recordId: result.lastInsertRowid,
    newValues: { supplier_name, station_name },
    reason: 'New fuel supplier registered',
    ip: req.ip
  });

  res.status(201).json({ success: true, message: 'Supplier registered successfully', id: result.lastInsertRowid });
});

// Update supplier prices / details
router.put('/:id', authenticateToken, requireRole(['transport_officer', 'finance_officer', 'admin']), (req, res) => {
  const supplierId = req.params.id;
  const existing = db.prepare('SELECT * FROM fuel_suppliers WHERE id = ?').get(supplierId);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Supplier not found' });
  }

  const {
    supplier_name, station_name, location, contact_person, phone_number,
    email, diesel_price_per_litre, petrol_price_per_litre, contract_reference
  } = req.body;

  db.prepare(`
    UPDATE fuel_suppliers SET
      supplier_name = COALESCE(?, supplier_name),
      station_name = COALESCE(?, station_name),
      location = COALESCE(?, location),
      contact_person = COALESCE(?, contact_person),
      phone_number = COALESCE(?, phone_number),
      email = COALESCE(?, email),
      diesel_price_per_litre = COALESCE(?, diesel_price_per_litre),
      petrol_price_per_litre = COALESCE(?, petrol_price_per_litre),
      contract_reference = COALESCE(?, contract_reference)
    WHERE id = ?
  `).run(
    supplier_name,
    station_name,
    location,
    contact_person,
    phone_number,
    email,
    diesel_price_per_litre !== undefined ? Number(diesel_price_per_litre) : null,
    petrol_price_per_litre !== undefined ? Number(petrol_price_per_litre) : null,
    contract_reference,
    supplierId
  );

  logAudit({
    user: req.user,
    action: 'UPDATE',
    module: 'Suppliers',
    recordId: supplierId,
    oldValues: existing,
    newValues: req.body,
    reason: 'Fuel supplier details / tariff updated',
    ip: req.ip
  });

  res.json({ success: true, message: 'Supplier updated successfully' });
});

module.exports = router;
