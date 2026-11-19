const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole, logAudit, createNotification } = require('../middleware/auth');

// Get all vehicles (with filters: status, department, category, search)
router.get('/', authenticateToken, (req, res) => {
  const { status, department_id, category, search } = req.query;

  let query = `
    SELECT
      v.*,
      d.name as department_name,
      d.code as department_code,
      dr.full_name as driver_name,
      dr.phone_number as driver_phone,
      (SELECT COUNT(*) FROM trips WHERE vehicle_id = v.id AND status = 'Completed') as completed_trips_count,
      (SELECT COALESCE(SUM(total_distance_km), 0) FROM trips WHERE vehicle_id = v.id AND status = 'Completed') as total_km_driven,
      (SELECT COALESCE(SUM(quantity_issued), 0) FROM fuel_issuances WHERE vehicle_id = v.id) as total_fuel_received
    FROM vehicles v
    LEFT JOIN departments d ON v.assigned_department_id = d.id
    LEFT JOIN drivers dr ON v.assigned_driver_id = dr.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND v.vehicle_status = ?';
    params.push(status);
  }

  if (department_id) {
    query += ' AND v.assigned_department_id = ?';
    params.push(department_id);
  }

  if (category) {
    query += ' AND v.category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (v.registration_number LIKE ? OR v.make LIKE ? OR v.model LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY v.id ASC';

  const vehicles = db.prepare(query).all(...params);
  res.json({ success: true, data: vehicles });
});

// Get single vehicle details with complete history (trips, maintenance, fuel requests, odometer adjustments)
router.get('/:id', authenticateToken, (req, res) => {
  const vehicle = db.prepare(`
    SELECT
      v.*,
      d.name as department_name,
      d.code as department_code,
      dr.full_name as driver_name,
      dr.phone_number as driver_phone
    FROM vehicles v
    LEFT JOIN departments d ON v.assigned_department_id = d.id
    LEFT JOIN drivers dr ON v.assigned_driver_id = dr.id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' });
  }

  const trips = db.prepare(`
    SELECT t.*, dr.full_name as driver_name, d.name as department_name
    FROM trips t
    LEFT JOIN drivers dr ON t.driver_id = dr.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.vehicle_id = ?
    ORDER BY t.id DESC
    LIMIT 20
  `).all(req.params.id);

  const maintenance = db.prepare(`
    SELECT * FROM maintenance_records
    WHERE vehicle_id = ?
    ORDER BY service_date DESC
    LIMIT 20
  `).all(req.params.id);

  const fuelRequests = db.prepare(`
    SELECT fr.*, d.name as department_name
    FROM fuel_requests fr
    LEFT JOIN departments d ON fr.department_id = d.id
    WHERE fr.vehicle_id = ?
    ORDER BY fr.id DESC
    LIMIT 20
  `).all(req.params.id);

  const odometerAdjustments = db.prepare(`
    SELECT * FROM odometer_adjustments
    WHERE vehicle_id = ?
    ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({
    success: true,
    data: {
      ...vehicle,
      trips,
      maintenance,
      fuelRequests,
      odometerAdjustments
    }
  });
});

// Add new vehicle (admin or transport_officer)
router.post('/', authenticateToken, requireRole(['transport_officer']), (req, res) => {
  const {
    registration_number, make, model, category, fuel_type, engine_capacity,
    assigned_department_id, assigned_driver_id, vehicle_status = 'Active',
    current_odometer = 0, fuel_tank_capacity, image_url, insurance_expiry_date,
    inspection_expiry_date, chassis_number, year_of_manufacture, color,
    standard_efficiency_km_l = 8.0
  } = req.body;

  if (!registration_number || !make || !model || !fuel_type || !fuel_tank_capacity) {
    return res.status(400).json({ success: false, error: 'Missing required vehicle information' });
  }

  // Check unique registration
  const existing = db.prepare('SELECT id FROM vehicles WHERE registration_number = ?').get(registration_number.trim());
  if (existing) {
    return res.status(400).json({ success: false, error: `Vehicle with registration number ${registration_number} already exists` });
  }

  const insert = db.prepare(`
    INSERT INTO vehicles (
      registration_number, make, model, category, fuel_type, engine_capacity,
      assigned_department_id, assigned_driver_id, vehicle_status, current_odometer,
      initial_odometer, fuel_tank_capacity, image_url, insurance_expiry_date,
      inspection_expiry_date, chassis_number, year_of_manufacture, color, standard_efficiency_km_l
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    registration_number.trim().toUpperCase(),
    make.trim(),
    model.trim(),
    category || 'Operational / Pick-up',
    fuel_type,
    engine_capacity || 'N/A',
    assigned_department_id || null,
    assigned_driver_id || null,
    vehicle_status,
    Number(current_odometer),
    Number(current_odometer),
    Number(fuel_tank_capacity),
    image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    insurance_expiry_date || null,
    inspection_expiry_date || null,
    chassis_number || null,
    year_of_manufacture ? Number(year_of_manufacture) : null,
    color || null,
    standard_efficiency_km_l ? Number(standard_efficiency_km_l) : 8.0
  );

  logAudit({
    user: req.user,
    action: 'CREATE',
    module: 'Vehicles',
    recordId: result.lastInsertRowid,
    newValues: { registration_number, make, model },
    reason: 'Vehicle registered in MoCU Fleet',
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Vehicle registered successfully',
    id: result.lastInsertRowid
  });
});

// Update vehicle
router.put('/:id', authenticateToken, requireRole(['transport_officer']), (req, res) => {
  const vehicleId = req.params.id;
  const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' });
  }

  const {
    registration_number, make, model, category, fuel_type, engine_capacity,
    assigned_department_id, assigned_driver_id, vehicle_status,
    fuel_tank_capacity, image_url, insurance_expiry_date,
    inspection_expiry_date, chassis_number, year_of_manufacture, color,
    standard_efficiency_km_l
  } = req.body;

  const update = db.prepare(`
    UPDATE vehicles SET
      registration_number = COALESCE(?, registration_number),
      make = COALESCE(?, make),
      model = COALESCE(?, model),
      category = COALESCE(?, category),
      fuel_type = COALESCE(?, fuel_type),
      engine_capacity = COALESCE(?, engine_capacity),
      assigned_department_id = ?,
      assigned_driver_id = ?,
      vehicle_status = COALESCE(?, vehicle_status),
      fuel_tank_capacity = COALESCE(?, fuel_tank_capacity),
      image_url = COALESCE(?, image_url),
      insurance_expiry_date = COALESCE(?, insurance_expiry_date),
      inspection_expiry_date = COALESCE(?, inspection_expiry_date),
      chassis_number = COALESCE(?, chassis_number),
      year_of_manufacture = COALESCE(?, year_of_manufacture),
      color = COALESCE(?, color),
      standard_efficiency_km_l = COALESCE(?, standard_efficiency_km_l)
    WHERE id = ?
  `);

  update.run(
    registration_number ? registration_number.trim().toUpperCase() : null,
    make,
    model,
    category,
    fuel_type,
    engine_capacity,
    assigned_department_id !== undefined ? assigned_department_id : existing.assigned_department_id,
    assigned_driver_id !== undefined ? assigned_driver_id : existing.assigned_driver_id,
    vehicle_status,
    fuel_tank_capacity ? Number(fuel_tank_capacity) : null,
    image_url,
    insurance_expiry_date,
    inspection_expiry_date,
    chassis_number,
    year_of_manufacture ? Number(year_of_manufacture) : null,
    color,
    standard_efficiency_km_l ? Number(standard_efficiency_km_l) : null,
    vehicleId
  );

  logAudit({
    user: req.user,
    action: 'UPDATE',
    module: 'Vehicles',
    recordId: vehicleId,
    oldValues: existing,
    newValues: req.body,
    reason: 'Vehicle specifications updated',
    ip: req.ip
  });

  res.json({ success: true, message: 'Vehicle updated successfully' });
});

// Authorized Odometer Correction (Strictly logged with authorized officer and justification)
router.post('/:id/adjust-odometer', authenticateToken, requireRole(['transport_officer']), (req, res) => {
  const vehicleId = req.params.id;
  const { new_odometer, reason } = req.body;

  if (!new_odometer || !reason) {
    return res.status(400).json({ success: false, error: 'New odometer reading and authorized justification reason are required' });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' });
  }

  const prevOdometer = vehicle.current_odometer;

  db.transaction(() => {
    // Record in adjustment log table
    db.prepare(`
      INSERT INTO odometer_adjustments (vehicle_id, previous_odometer, new_odometer, reason, authorized_by_id, authorized_by_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(vehicleId, prevOdometer, Number(new_odometer), reason, req.user.id, req.user.name);

    // Update vehicle odometer
    db.prepare('UPDATE vehicles SET current_odometer = ? WHERE id = ?').run(Number(new_odometer), vehicleId);

    // Write audit trail
    logAudit({
      user: req.user,
      action: 'ODOMETER_ADJUSTMENT',
      module: 'Vehicles',
      recordId: vehicleId,
      oldValues: { odometer: prevOdometer },
      newValues: { odometer: Number(new_odometer) },
      reason: `Authorized odometer adjustment: ${reason}`,
      ip: req.ip
    });
  })();

  res.json({
    success: true,
    message: `Odometer reading updated from ${prevOdometer} KM to ${new_odometer} KM with recorded authorization audit.`
  });
});

// Deactivate / Change status
router.patch('/:id/status', authenticateToken, requireRole(['transport_officer']), (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Inactive', 'Under Maintenance', 'On Trip'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid vehicle status' });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' });
  }

  db.prepare('UPDATE vehicles SET vehicle_status = ? WHERE id = ?').run(status, req.params.id);

  logAudit({
    user: req.user,
    action: 'UPDATE',
    module: 'Vehicles',
    recordId: req.params.id,
    oldValues: { status: vehicle.vehicle_status },
    newValues: { status },
    reason: `Vehicle status changed to ${status}`,
    ip: req.ip
  });

  res.json({ success: true, message: `Vehicle status updated to ${status}` });
});

module.exports = router;
