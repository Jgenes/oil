const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole, logAudit } = require('../middleware/auth');

// Get all drivers (with vehicle info, trip stats, licence status)
router.get('/', authenticateToken, (req, res) => {
  const { status, search } = req.query;

  let query = `
    SELECT
      dr.*,
      v.registration_number as assigned_vehicle_number,
      v.make as assigned_vehicle_make,
      v.model as assigned_vehicle_model,
      u.email as user_email,
      (SELECT COUNT(*) FROM trips WHERE driver_id = dr.id AND status = 'Completed') as completed_trips_count,
      (SELECT COALESCE(SUM(total_distance_km), 0) FROM trips WHERE driver_id = dr.id AND status = 'Completed') as total_km_driven,
      (SELECT COALESCE(SUM(fuel_consumed_litres), 0) FROM trips WHERE driver_id = dr.id AND status = 'Completed') as total_fuel_used,
      ROUND((SELECT COALESCE(AVG(fuel_efficiency_km_l), 0) FROM trips WHERE driver_id = dr.id AND status = 'Completed' AND fuel_efficiency_km_l > 0), 2) as avg_km_l,
      CASE
        WHEN date(dr.licence_expiry_date) < date('now') THEN 'Expired'
        WHEN date(dr.licence_expiry_date) <= date('now', '+30 days') THEN 'Expiring Soon'
        ELSE 'Valid'
      END as licence_status
    FROM drivers dr
    LEFT JOIN vehicles v ON dr.assigned_vehicle_id = v.id
    LEFT JOIN users u ON dr.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND dr.employment_status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (dr.full_name LIKE ? OR dr.employee_number LIKE ? OR dr.driving_licence_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY dr.id ASC';

  const drivers = db.prepare(query).all(...params);
  res.json({ success: true, data: drivers });
});

// Get single driver with complete trip history
router.get('/:id', authenticateToken, (req, res) => {
  const driver = db.prepare(`
    SELECT
      dr.*,
      v.registration_number as assigned_vehicle_number,
      v.make as assigned_vehicle_make,
      v.model as assigned_vehicle_model,
      CASE
        WHEN date(dr.licence_expiry_date) < date('now') THEN 'Expired'
        WHEN date(dr.licence_expiry_date) <= date('now', '+30 days') THEN 'Expiring Soon'
        ELSE 'Valid'
      END as licence_status
    FROM drivers dr
    LEFT JOIN vehicles v ON dr.assigned_vehicle_id = v.id
    WHERE dr.id = ?
  `).get(req.params.id);

  if (!driver) {
    return res.status(404).json({ success: false, error: 'Driver not found' });
  }

  const trips = db.prepare(`
    SELECT t.*, v.registration_number as vehicle_number, d.name as department_name
    FROM trips t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.driver_id = ?
    ORDER BY t.id DESC
  `).all(req.params.id);

  res.json({
    success: true,
    data: {
      ...driver,
      trips
    }
  });
});

// Add new driver
router.post('/', authenticateToken, requireRole(['transport_officer', 'admin']), (req, res) => {
  const {
    full_name, employee_number, phone_number, email,
    driving_licence_number, licence_classes = 'A, B, C, D, E',
    licence_expiry_date, assigned_vehicle_id, employment_status = 'Active', notes
  } = req.body;

  if (!full_name || !employee_number || !phone_number || !driving_licence_number || !licence_expiry_date) {
    return res.status(400).json({ success: false, error: 'Name, employee number, phone, licence number, and expiry date are required' });
  }

  const existing = db.prepare('SELECT id FROM drivers WHERE employee_number = ? OR driving_licence_number = ?').get(employee_number, driving_licence_number);
  if (existing) {
    return res.status(400).json({ success: false, error: 'A driver with this employee number or licence number already exists' });
  }

  const insert = db.prepare(`
    INSERT INTO drivers (
      full_name, employee_number, phone_number, email,
      driving_licence_number, licence_classes, licence_expiry_date,
      assigned_vehicle_id, employment_status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    full_name.trim(),
    employee_number.trim().toUpperCase(),
    phone_number.trim(),
    email || null,
    driving_licence_number.trim().toUpperCase(),
    licence_classes,
    licence_expiry_date,
    assigned_vehicle_id || null,
    employment_status,
    notes || null
  );

  logAudit({
    user: req.user,
    action: 'CREATE',
    module: 'Drivers',
    recordId: result.lastInsertRowid,
    newValues: { full_name, employee_number, licence: driving_licence_number },
    reason: 'New driver registered',
    ip: req.ip
  });

  res.status(201).json({ success: true, message: 'Driver registered successfully', id: result.lastInsertRowid });
});

// Update driver
router.put('/:id', authenticateToken, requireRole(['transport_officer', 'admin']), (req, res) => {
  const driverId = req.params.id;
  const existing = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Driver not found' });
  }

  const {
    full_name, phone_number, email, driving_licence_number,
    licence_classes, licence_expiry_date, assigned_vehicle_id, employment_status, notes
  } = req.body;

  db.prepare(`
    UPDATE drivers SET
      full_name = COALESCE(?, full_name),
      phone_number = COALESCE(?, phone_number),
      email = COALESCE(?, email),
      driving_licence_number = COALESCE(?, driving_licence_number),
      licence_classes = COALESCE(?, licence_classes),
      licence_expiry_date = COALESCE(?, licence_expiry_date),
      assigned_vehicle_id = ?,
      employment_status = COALESCE(?, employment_status),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(
    full_name,
    phone_number,
    email,
    driving_licence_number,
    licence_classes,
    licence_expiry_date,
    assigned_vehicle_id !== undefined ? assigned_vehicle_id : existing.assigned_vehicle_id,
    employment_status,
    notes,
    driverId
  );

  logAudit({
    user: req.user,
    action: 'UPDATE',
    module: 'Drivers',
    recordId: driverId,
    oldValues: existing,
    newValues: req.body,
    reason: 'Driver details updated',
    ip: req.ip
  });

  res.json({ success: true, message: 'Driver details updated successfully' });
});

module.exports = router;
