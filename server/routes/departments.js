const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole, logAudit } = require('../middleware/auth');

// Get all departments (with assigned vehicles count, budget vs actual expenditure)
router.get('/', authenticateToken, (req, res) => {
  const departments = db.prepare(`
    SELECT
      d.*,
      (SELECT COUNT(*) FROM vehicles WHERE assigned_department_id = d.id) as vehicles_count,
      (SELECT COUNT(*) FROM fuel_requests WHERE department_id = d.id) as requests_count,
      (SELECT COUNT(*) FROM trips WHERE department_id = d.id AND status = 'Completed') as trips_count,
      (SELECT COALESCE(SUM(total_distance_km), 0) FROM trips WHERE department_id = d.id AND status = 'Completed') as total_km_driven,
      (
        SELECT COALESCE(SUM(fi.total_cost), 0)
        FROM fuel_issuances fi
        JOIN fuel_requests fr ON fi.fuel_request_id = fr.id
        WHERE fr.department_id = d.id
      ) as actual_fuel_expenditure,
      ROUND(
        (
          SELECT COALESCE(SUM(fi.total_cost), 0)
          FROM fuel_issuances fi
          JOIN fuel_requests fr ON fi.fuel_request_id = fr.id
          WHERE fr.department_id = d.id
        ) * 100.0 / CASE WHEN d.annual_fuel_budget > 0 THEN d.annual_fuel_budget ELSE 1 END,
        1
      ) as budget_utilization_pct
    FROM departments d
    ORDER BY d.id ASC
  `).all();

  res.json({ success: true, data: departments });
});

// Get single department with its assigned vehicles, fuel requests, and trips
router.get('/:id', authenticateToken, (req, res) => {
  const deptId = req.params.id;

  // Authorization check: HOD can only view their own department unless admin/management/auditor
  if (req.user.role === 'hod' && req.user.department_id && req.user.department_id !== Number(deptId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to view details of other departments' });
  }

  const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(deptId);
  if (!department) {
    return res.status(404).json({ success: false, error: 'Department not found' });
  }

  const vehicles = db.prepare(`
    SELECT v.*, dr.full_name as driver_name
    FROM vehicles v
    LEFT JOIN drivers dr ON v.assigned_driver_id = dr.id
    WHERE v.assigned_department_id = ?
  `).all(deptId);

  const requests = db.prepare(`
    SELECT fr.*, v.registration_number as vehicle_number
    FROM fuel_requests fr
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    WHERE fr.department_id = ?
    ORDER BY fr.id DESC
    LIMIT 25
  `).all(deptId);

  const trips = db.prepare(`
    SELECT t.*, v.registration_number as vehicle_number, dr.full_name as driver_name
    FROM trips t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers dr ON t.driver_id = dr.id
    WHERE t.department_id = ?
    ORDER BY t.id DESC
    LIMIT 25
  `).all(deptId);

  res.json({
    success: true,
    data: {
      ...department,
      vehicles,
      requests,
      trips
    }
  });
});

// Add new department (Admin only)
router.post('/', authenticateToken, requireRole(['admin']), (req, res) => {
  const { code, name, head_name, annual_fuel_budget = 0, contact_email, contact_phone } = req.body;

  if (!code || !name) {
    return res.status(400).json({ success: false, error: 'Department code and name are required' });
  }

  const existing = db.prepare('SELECT id FROM departments WHERE code = ?').get(code.trim().toUpperCase());
  if (existing) {
    return res.status(400).json({ success: false, error: 'Department code already exists' });
  }

  const insert = db.prepare(`
    INSERT INTO departments (code, name, head_name, annual_fuel_budget, contact_email, contact_phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    code.trim().toUpperCase(),
    name.trim(),
    head_name || null,
    Number(annual_fuel_budget),
    contact_email || null,
    contact_phone || null
  );

  logAudit({
    user: req.user,
    action: 'CREATE',
    module: 'Departments',
    recordId: result.lastInsertRowid,
    newValues: { code, name, budget: annual_fuel_budget },
    reason: 'Department created',
    ip: req.ip
  });

  res.status(201).json({ success: true, message: 'Department created successfully', id: result.lastInsertRowid });
});

// Update department
router.put('/:id', authenticateToken, requireRole(['admin', 'finance_officer']), (req, res) => {
  const deptId = req.params.id;
  const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(deptId);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Department not found' });
  }

  const { code, name, head_name, annual_fuel_budget, contact_email, contact_phone } = req.body;

  db.prepare(`
    UPDATE departments SET
      code = COALESCE(?, code),
      name = COALESCE(?, name),
      head_name = COALESCE(?, head_name),
      annual_fuel_budget = COALESCE(?, annual_fuel_budget),
      contact_email = COALESCE(?, contact_email),
      contact_phone = COALESCE(?, contact_phone)
    WHERE id = ?
  `).run(
    code ? code.trim().toUpperCase() : null,
    name,
    head_name,
    annual_fuel_budget !== undefined ? Number(annual_fuel_budget) : null,
    contact_email,
    contact_phone,
    deptId
  );

  logAudit({
    user: req.user,
    action: 'UPDATE',
    module: 'Departments',
    recordId: deptId,
    oldValues: existing,
    newValues: req.body,
    reason: 'Department details / budget updated',
    ip: req.ip
  });

  res.json({ success: true, message: 'Department updated successfully' });
});

module.exports = router;
