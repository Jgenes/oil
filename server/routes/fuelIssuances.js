const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole, logAudit, createNotification } = require('../middleware/auth');

// Get all fuel issuances (with filters: supplier, vehicle, date range, search)
router.get('/', authenticateToken, (req, res) => {
  const { supplier_id, vehicle_id, start_date, end_date, search } = req.query;

  let query = `
    SELECT
      fi.*,
      v.registration_number as vehicle_number,
      v.make as vehicle_make,
      v.model as vehicle_model,
      dr.full_name as driver_name,
      s.supplier_name,
      fr.request_number,
      fr.form_serial_number,
      fr.destination,
      fr.trip_purpose,
      d.name as department_name
    FROM fuel_issuances fi
    LEFT JOIN vehicles v ON fi.vehicle_id = v.id
    LEFT JOIN drivers dr ON fi.driver_id = dr.id
    LEFT JOIN fuel_suppliers s ON fi.supplier_id = s.id
    LEFT JOIN fuel_requests fr ON fi.fuel_request_id = fr.id
    LEFT JOIN departments d ON fr.department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (supplier_id) {
    query += ' AND fi.supplier_id = ?';
    params.push(supplier_id);
  }

  if (vehicle_id) {
    query += ' AND fi.vehicle_id = ?';
    params.push(vehicle_id);
  }

  if (start_date) {
    query += ' AND date(fi.issuance_date) >= date(?)';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND date(fi.issuance_date) <= date(?)';
    params.push(end_date);
  }

  if (search) {
    query += ' AND (fi.issuance_number LIKE ? OR fi.receipt_number LIKE ? OR v.registration_number LIKE ? OR dr.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY fi.id DESC';

  const issuances = db.prepare(query).all(...params);
  res.json({ success: true, data: issuances });
});

// Record new fuel issuance (reconciled against approved fuel request)
router.post('/', authenticateToken, requireRole(['transport_officer', 'admin']), (req, res) => {
  const {
    fuel_request_id,
    supplier_id,
    quantity_issued,
    unit_price,
    receipt_number,
    invoice_reference,
    issuance_date = new Date().toISOString(),
    remarks,
    auto_create_trip = true
  } = req.body;

  if (!fuel_request_id || !supplier_id || !quantity_issued || !receipt_number) {
    return res.status(400).json({ success: false, error: 'Fuel request, supplier, issued quantity, and receipt number are required' });
  }

  const request = db.prepare(`
    SELECT fr.*, v.registration_number, v.current_odometer
    FROM fuel_requests fr
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    WHERE fr.id = ?
  `).get(fuel_request_id);

  if (!request) {
    return res.status(404).json({ success: false, error: 'Fuel request not found' });
  }

  // Check that request is approved or finance recorded
  if (!['Authorized', 'Finance_Recorded'].includes(request.status)) {
    return res.status(400).json({
      success: false,
      error: `Cannot issue fuel for request with status '${request.status}'. Request must be Authorized or Finance_Recorded.`
    });
  }

  const supplier = db.prepare('SELECT * FROM fuel_suppliers WHERE id = ?').get(supplier_id);
  if (!supplier) {
    return res.status(404).json({ success: false, error: 'Fuel supplier station not found' });
  }

  const qtyApproved = Number(request.requested_quantity_litres);
  const qtyIssued = Number(quantity_issued);
  const price = unit_price ? Number(unit_price) : (request.fuel_type === 'Diesel' ? supplier.diesel_price_per_litre : supplier.petrol_price_per_litre);
  const totalCost = qtyIssued * price;
  const variance = qtyApproved - qtyIssued; // positive means issued less, negative means issued more

  // Generate unique issuance number
  const countRow = db.prepare('SELECT COUNT(*) as count FROM fuel_issuances').get();
  const issuanceNumber = `FIS-${new Date().getFullYear()}-${String(countRow.count + 1).padStart(4, '0')}`;

  let issuanceId;
  let tripId = null;

  db.transaction(() => {
    // 1. Insert fuel issuance record
    const insert = db.prepare(`
      INSERT INTO fuel_issuances (
        issuance_number, fuel_request_id, vehicle_id, driver_id, supplier_id,
        fuel_station_name, fuel_type, quantity_approved, quantity_issued, quantity_variance,
        unit_price, total_cost, issuance_date, receipt_number, invoice_reference,
        recorded_by_id, recorded_by_name, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      issuanceNumber,
      fuel_request_id,
      request.vehicle_id,
      request.driver_id,
      supplier_id,
      supplier.station_name,
      request.fuel_type,
      qtyApproved,
      qtyIssued,
      variance,
      price,
      totalCost,
      issuance_date,
      receipt_number,
      invoice_reference || null,
      req.user.id,
      req.user.name,
      remarks || null
    );

    issuanceId = result.lastInsertRowid;

    // 2. Update fuel request status to 'Issued'
    db.prepare(`
      UPDATE fuel_requests SET
        status = 'Issued',
        stage = 'completed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(fuel_request_id);

    // 3. Update vehicle status to 'On Trip'
    db.prepare("UPDATE vehicles SET vehicle_status = 'On Trip' WHERE id = ?").run(request.vehicle_id);

    // 4. Optionally create or link trip in progress
    if (auto_create_trip) {
      const tripCount = db.prepare('SELECT COUNT(*) as count FROM trips').get();
      const tripNumber = `TRP-${new Date().getFullYear()}-${String(tripCount.count + 1).padStart(4, '0')}`;

      const insertTrip = db.prepare(`
        INSERT INTO trips (
          trip_number, fuel_request_id, vehicle_id, driver_id, department_id,
          destination, trip_purpose, departure_datetime,
          starting_odometer, fuel_allocated_litres, fuel_issued_litres, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Progress')
      `);

      const tripRes = insertTrip.run(
        tripNumber,
        fuel_request_id,
        request.vehicle_id,
        request.driver_id,
        request.department_id,
        request.destination,
        request.trip_purpose,
        request.expected_departure_date || new Date().toISOString(),
        request.present_request_odometer || request.current_odometer,
        qtyApproved,
        qtyIssued
      );

      tripId = tripRes.lastInsertRowid;
    }

    // 5. Audit Log
    logAudit({
      user: req.user,
      action: 'ISSUE',
      module: 'Fuel Issuance',
      recordId: issuanceNumber,
      newValues: {
        issuanceNumber,
        approved: qtyApproved,
        issued: qtyIssued,
        variance,
        station: supplier.station_name,
        receipt: receipt_number,
        totalCost
      },
      reason: 'Fuel issued against approved requisition',
      ip: req.ip
    });

    createNotification({
      targetRole: 'driver',
      title: 'Fuel Issued for Trip',
      message: `${qtyIssued}L ${request.fuel_type} issued for vehicle ${request.registration_number} at ${supplier.station_name}.`,
      type: 'success',
      link: '/trips'
    });
  })();

  res.status(201).json({
    success: true,
    message: `Fuel issued successfully: ${qtyIssued} Litres reconciled against approved ${qtyApproved} Litres (Variance: ${variance} L).`,
    data: {
      issuance_id: issuanceId,
      issuance_number: issuanceNumber,
      trip_id: tripId,
      reconciliation: {
        approved: qtyApproved,
        issued: qtyIssued,
        variance
      }
    }
  });
});

module.exports = router;
