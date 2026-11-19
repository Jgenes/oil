const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole, logAudit, createNotification } = require('../middleware/auth');

// Get all maintenance records (with vehicle details, service reminders)
router.get('/', authenticateToken, (req, res) => {
  const { vehicle_id, status, search } = req.query;

  let query = `
    SELECT
      m.*,
      v.registration_number,
      v.make,
      v.model,
      v.current_odometer,
      d.name as department_name,
      CASE
        WHEN m.next_service_mileage IS NOT NULL AND (m.next_service_mileage - v.current_odometer) <= 500 THEN 'Service Due Soon (KM)'
        WHEN m.next_service_date IS NOT NULL AND date(m.next_service_date) <= date('now', '+14 days') THEN 'Service Due Soon (Date)'
        ELSE 'Normal'
      END as reminder_status
    FROM maintenance_records m
    JOIN vehicles v ON m.vehicle_id = v.id
    LEFT JOIN departments d ON v.assigned_department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (vehicle_id) {
    query += ' AND m.vehicle_id = ?';
    params.push(vehicle_id);
  }

  if (status) {
    query += ' AND m.status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (m.maintenance_number LIKE ? OR v.registration_number LIKE ? OR m.service_provider LIKE ? OR m.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY m.service_date DESC';

  const records = db.prepare(query).all(...params);

  // Upcoming maintenance reminders
  const reminders = db.prepare(`
    SELECT
      v.id as vehicle_id,
      v.registration_number,
      v.make,
      v.model,
      v.current_odometer,
      m.next_service_mileage,
      m.next_service_date,
      m.service_type,
      (m.next_service_mileage - v.current_odometer) as km_remaining,
      ROUND(julianday(m.next_service_date) - julianday('now')) as days_remaining
    FROM vehicles v
    JOIN (
      SELECT vehicle_id, MAX(service_date) as max_date, next_service_mileage, next_service_date, service_type
      FROM maintenance_records
      GROUP BY vehicle_id
    ) m ON v.id = m.vehicle_id
    WHERE (m.next_service_mileage IS NOT NULL AND (m.next_service_mileage - v.current_odometer) <= 1500)
       OR (m.next_service_date IS NOT NULL AND julianday(m.next_service_date) - julianday('now') <= 30)
    ORDER BY km_remaining ASC
  `).all();

  res.json({
    success: true,
    data: {
      records,
      reminders
    }
  });
});

// Record new maintenance service
router.post('/', authenticateToken, requireRole(['transport_officer', 'admin']), (req, res) => {
  const {
    vehicle_id, service_date = new Date().toISOString().substring(0, 10),
    service_mileage, service_type, description, spare_parts_used,
    service_provider, cost, invoice_number, next_service_date, next_service_mileage,
    set_vehicle_status = 'Under Maintenance'
  } = req.body;

  if (!vehicle_id || !service_type || !description || !service_provider || cost === undefined) {
    return res.status(400).json({ success: false, error: 'Vehicle, service type, description, provider, and cost are required' });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' });
  }

  const countRow = db.prepare('SELECT COUNT(*) as count FROM maintenance_records').get();
  const maintenanceNumber = `MNT-${new Date().getFullYear()}-${String(countRow.count + 1).padStart(4, '0')}`;

  const currentMileage = service_mileage !== undefined ? Number(service_mileage) : vehicle.current_odometer;

  let recordId;
  db.transaction(() => {
    const insert = db.prepare(`
      INSERT INTO maintenance_records (
        maintenance_number, vehicle_id, service_date, service_mileage, service_type,
        description, spare_parts_used, service_provider, cost, invoice_number,
        next_service_date, next_service_mileage, status, recorded_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Progress', ?)
    `);

    const result = insert.run(
      maintenanceNumber,
      vehicle_id,
      service_date,
      currentMileage,
      service_type,
      description,
      spare_parts_used || null,
      service_provider,
      Number(cost),
      invoice_number || null,
      next_service_date || null,
      next_service_mileage ? Number(next_service_mileage) : null,
      req.user.id
    );

    recordId = result.lastInsertRowid;

    // Update vehicle status
    if (set_vehicle_status) {
      db.prepare('UPDATE vehicles SET vehicle_status = ? WHERE id = ?').run(set_vehicle_status, vehicle_id);
    }

    logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'Maintenance',
      recordId: maintenanceNumber,
      newValues: { maintenanceNumber, vehicle: vehicle.registration_number, service_type, cost },
      reason: 'Maintenance record registered',
      ip: req.ip
    });
  })();

  res.status(201).json({
    success: true,
    message: 'Maintenance record logged successfully',
    data: { id: recordId, maintenance_number: maintenanceNumber }
  });
});

// Complete maintenance service
router.post('/:id/complete', authenticateToken, requireRole(['transport_officer', 'admin']), (req, res) => {
  const mntId = req.params.id;
  const { final_cost, completion_notes, return_vehicle_to_active = true } = req.body;

  const record = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(mntId);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Maintenance record not found' });
  }

  db.transaction(() => {
    db.prepare(`
      UPDATE maintenance_records SET
        status = 'Completed',
        cost = COALESCE(?, cost),
        description = description || COALESCE(?, '')
      WHERE id = ?
    `).run(
      final_cost !== undefined ? Number(final_cost) : null,
      completion_notes ? ` [Completion notes: ${completion_notes}]` : null,
      mntId
    );

    if (return_vehicle_to_active) {
      db.prepare("UPDATE vehicles SET vehicle_status = 'Active' WHERE id = ?").run(record.vehicle_id);
    }

    logAudit({
      user: req.user,
      action: 'COMPLETE_MAINTENANCE',
      module: 'Maintenance',
      recordId: record.maintenance_number,
      newValues: { status: 'Completed', final_cost },
      reason: 'Vehicle maintenance service completed and certified',
      ip: req.ip
    });
  })();

  res.json({ success: true, message: 'Maintenance service completed and vehicle returned to active service' });
});

module.exports = router;
