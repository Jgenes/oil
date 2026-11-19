const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole, logAudit, createNotification } = require('../middleware/auth');

// Get all trips (filters: status, vehicle, driver, department, anomalies, search)
router.get('/', authenticateToken, (req, res) => {
  const { status, vehicle_id, driver_id, department_id, is_anomaly, search } = req.query;

  let query = `
    SELECT
      t.*,
      v.registration_number as vehicle_number,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.standard_efficiency_km_l,
      v.fuel_type,
      dr.full_name as driver_name,
      dr.phone_number as driver_phone,
      d.name as department_name,
      d.code as department_code,
      fr.request_number,
      fr.form_serial_number
    FROM trips t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers dr ON t.driver_id = dr.id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN fuel_requests fr ON t.fuel_request_id = fr.id
    WHERE 1=1
  `;
  const params = [];

  // If driver role, default filter to trips assigned to them
  if (req.user.role === 'driver') {
    const driverRecord = db.prepare('SELECT id FROM drivers WHERE user_id = ?').get(req.user.id);
    if (driverRecord) {
      query += ' AND t.driver_id = ?';
      params.push(driverRecord.id);
    }
  } else if (driver_id) {
    query += ' AND t.driver_id = ?';
    params.push(driver_id);
  }

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (vehicle_id) {
    query += ' AND t.vehicle_id = ?';
    params.push(vehicle_id);
  }

  if (department_id) {
    query += ' AND t.department_id = ?';
    params.push(department_id);
  }

  if (is_anomaly !== undefined && is_anomaly !== '') {
    query += ' AND t.is_anomaly = ?';
    params.push(Number(is_anomaly));
  }

  if (search) {
    query += ' AND (t.trip_number LIKE ? OR t.destination LIKE ? OR v.registration_number LIKE ? OR dr.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY t.id DESC';

  const trips = db.prepare(query).all(...params);
  res.json({ success: true, data: trips });
});

// Get single trip
router.get('/:id', authenticateToken, (req, res) => {
  const trip = db.prepare(`
    SELECT
      t.*,
      v.registration_number as vehicle_number,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.fuel_tank_capacity,
      v.standard_efficiency_km_l,
      v.fuel_type,
      dr.full_name as driver_name,
      dr.phone_number as driver_phone,
      dr.employee_number as driver_emp_no,
      d.name as department_name,
      d.code as department_code,
      fr.request_number,
      fr.form_serial_number,
      u.name as completed_by_name
    FROM trips t
    LEFT JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers dr ON t.driver_id = dr.id
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN fuel_requests fr ON t.fuel_request_id = fr.id
    LEFT JOIN users u ON t.completed_by_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  res.json({ success: true, data: trip });
});

// Create / Start a new trip manually
router.post('/', authenticateToken, requireRole(['transport_officer', 'admin']), (req, res) => {
  const {
    vehicle_id,
    driver_id,
    department_id,
    destination,
    trip_purpose,
    departure_datetime = new Date().toISOString(),
    starting_odometer,
    fuel_allocated_litres = 0,
    fuel_issued_litres = 0,
    fuel_request_id = null
  } = req.body;

  if (!vehicle_id || !driver_id || !destination || !trip_purpose) {
    return res.status(400).json({ success: false, error: 'Vehicle, driver, destination, and purpose are required' });
  }

  // Check vehicle status and conflict rule 8: "A vehicle cannot have conflicting active trip assignments"
  const activeTrip = db.prepare("SELECT id, trip_number FROM trips WHERE vehicle_id = ? AND status = 'In Progress'").get(vehicle_id);
  if (activeTrip) {
    return res.status(400).json({
      success: false,
      error: `Conflict: Vehicle is already engaged in an active trip (${activeTrip.trip_number}). A vehicle cannot have conflicting active trip assignments.`
    });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' });
  }

  const startOdo = starting_odometer !== undefined ? Number(starting_odometer) : vehicle.current_odometer;

  const countRow = db.prepare('SELECT COUNT(*) as count FROM trips').get();
  const tripNumber = `TRP-${new Date().getFullYear()}-${String(countRow.count + 1).padStart(4, '0')}`;

  let tripId;
  db.transaction(() => {
    const insert = db.prepare(`
      INSERT INTO trips (
        trip_number, fuel_request_id, vehicle_id, driver_id, department_id,
        destination, trip_purpose, departure_datetime, starting_odometer,
        fuel_allocated_litres, fuel_issued_litres, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'In Progress')
    `);

    const result = insert.run(
      tripNumber,
      fuel_request_id,
      vehicle_id,
      driver_id,
      department_id || vehicle.assigned_department_id,
      destination,
      trip_purpose,
      departure_datetime,
      startOdo,
      Number(fuel_allocated_litres),
      Number(fuel_issued_litres)
    );

    tripId = result.lastInsertRowid;

    // Update vehicle status
    db.prepare("UPDATE vehicles SET vehicle_status = 'On Trip' WHERE id = ?").run(vehicle_id);

    logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'Trips',
      recordId: tripNumber,
      newValues: { tripNumber, destination, startOdo, vehicle: vehicle.registration_number },
      reason: 'Trip started',
      ip: req.ip
    });
  })();

  res.status(201).json({
    success: true,
    message: 'Trip started successfully',
    data: { id: tripId, trip_number: tripNumber }
  });
});

// Complete Trip (Ending odometer reading, distance calculation, fuel consumed, anomaly detection)
// Strictly enforces Rule 5: prevent ending_odometer < starting_odometer
// Strictly enforces Rule 7: separate records for fuel issued, fuel remaining, fuel consumed
// Strictly enforces Module E: intelligent anomaly detection
router.post('/:id/complete', authenticateToken, (req, res) => {
  const tripId = req.params.id;
  const {
    ending_odometer,
    fuel_consumed_litres,
    fuel_remaining_litres = 0,
    return_datetime = new Date().toISOString(),
    completion_notes,
    allow_odometer_override = false, // for authorized rollover/adjustment only
    override_reason
  } = req.body;

  if (ending_odometer === undefined || ending_odometer === null || ending_odometer === '') {
    return res.status(400).json({ success: false, error: 'Ending odometer reading is required' });
  }

  const trip = db.prepare(`
    SELECT t.*, v.standard_efficiency_km_l, v.fuel_type, v.registration_number
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.id = ?
  `).get(tripId);

  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  if (trip.status === 'Completed') {
    return res.status(400).json({ success: false, error: 'This trip is already marked as Completed' });
  }

  const endOdo = Number(ending_odometer);
  const startOdo = Number(trip.starting_odometer);

  // Business Rule 5: Prevent ending odometer < starting odometer
  if (endOdo < startOdo) {
    if (!allow_odometer_override || !override_reason) {
      return res.status(400).json({
        success: false,
        error: `Invalid Odometer Reading: Ending odometer (${endOdo} KM) cannot be lower than starting odometer (${startOdo} KM). If odometer rolled over or was replaced, an authorized supervisor justification is required.`
      });
    }
  }

  const totalDistance = Math.max(0, endOdo - startOdo);

  // Fuel consumed calculations (Rule 7: do not assume all fuel allocated was consumed)
  const consumedLitres = fuel_consumed_litres !== undefined && fuel_consumed_litres !== null && fuel_consumed_litres !== ''
    ? Number(fuel_consumed_litres)
    : Math.max(0, Number(trip.fuel_issued_litres) - Number(fuel_remaining_litres));

  const remainingLitres = fuel_remaining_litres !== undefined ? Number(fuel_remaining_litres) : 0;

  // Calculate efficiency (KM/L) and cost per KM
  let kmPerLitre = null;
  let costPerKm = null;
  const unitPrice = trip.fuel_type === 'Diesel' ? 3280 : 3240;

  if (consumedLitres > 0 && totalDistance > 0) {
    kmPerLitre = Number((totalDistance / consumedLitres).toFixed(2));
    costPerKm = Number(((consumedLitres * unitPrice) / totalDistance).toFixed(2));
  }

  // Module E: Intelligent Anomaly Detection
  // Baseline is vehicle's standard efficiency. If actual KM/L is more than 25% worse than baseline, flag as anomaly!
  let isAnomaly = 0;
  let anomalyReason = null;
  let anomalyStatus = 'None';

  const baselineEfficiency = trip.standard_efficiency_km_l || 8.0;
  if (kmPerLitre !== null && kmPerLitre > 0) {
    const deviationPct = ((baselineEfficiency - kmPerLitre) / baselineEfficiency) * 100;
    if (deviationPct >= 25) {
      isAnomaly = 1;
      anomalyReason = `Abnormal fuel consumption detected: ${kmPerLitre} KM/L vs expected baseline ${baselineEfficiency} KM/L (${deviationPct.toFixed(1)}% higher consumption). Investigation recommended.`;
      anomalyStatus = 'Flagged';
    }
  }

  db.transaction(() => {
    // 1. Update trip record
    db.prepare(`
      UPDATE trips SET
        ending_odometer = ?,
        total_distance_km = ?,
        fuel_consumed_litres = ?,
        fuel_remaining_litres = ?,
        fuel_efficiency_km_l = ?,
        fuel_cost_per_km = ?,
        return_datetime = ?,
        status = 'Completed',
        completion_notes = ?,
        completed_by_id = ?,
        completed_at = CURRENT_TIMESTAMP,
        is_anomaly = ?,
        anomaly_reason = ?,
        anomaly_status = ?
      WHERE id = ?
    `).run(
      endOdo,
      totalDistance,
      consumedLitres,
      remainingLitres,
      kmPerLitre,
      costPerKm,
      return_datetime,
      completion_notes || null,
      req.user.id,
      isAnomaly,
      anomalyReason,
      anomalyStatus,
      tripId
    );

    // 2. Update vehicle current odometer & status back to 'Active'
    db.prepare(`
      UPDATE vehicles SET
        current_odometer = ?,
        vehicle_status = 'Active'
      WHERE id = ?
    `).run(endOdo, trip.vehicle_id);

    // 3. If linked to fuel request, mark request completed
    if (trip.fuel_request_id) {
      db.prepare("UPDATE fuel_requests SET status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(trip.fuel_request_id);
    }

    // 4. If odometer override occurred, log in adjustments table
    if (endOdo < startOdo && allow_odometer_override) {
      db.prepare(`
        INSERT INTO odometer_adjustments (vehicle_id, previous_odometer, new_odometer, reason, authorized_by_id, authorized_by_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(trip.vehicle_id, startOdo, endOdo, override_reason, req.user.id, req.user.name);
    }

    // 5. Audit log
    logAudit({
      user: req.user,
      action: 'COMPLETE_TRIP',
      module: 'Trips',
      recordId: trip.trip_number,
      newValues: {
        endingOdometer: endOdo,
        distanceCovered: totalDistance,
        fuelConsumed: consumedLitres,
        fuelRemaining: remainingLitres,
        fuelEfficiency: kmPerLitre,
        isAnomaly
      },
      reason: 'Trip completed and distance/fuel verified',
      ip: req.ip
    });

    // 6. If anomaly detected, trigger urgent notification
    if (isAnomaly) {
      createNotification({
        targetRole: 'transport_officer',
        title: 'Abnormal Fuel Consumption Flagged',
        message: `Trip ${trip.trip_number} (${trip.registration_number}): recorded ${kmPerLitre} KM/L vs ${baselineEfficiency} KM/L baseline. Please review.`,
        type: 'danger',
        link: '/fuel-consumption'
      });
      createNotification({
        targetRole: 'internal_auditor',
        title: 'Audit Alert: Fuel Consumption Anomaly',
        message: `Trip ${trip.trip_number} flagged for technical audit. Discrepancy in fuel efficiency.`,
        type: 'warning',
        link: '/audit-trail'
      });
    }
  })();

  res.json({
    success: true,
    message: 'Trip completed successfully',
    data: {
      trip_number: trip.trip_number,
      distance_covered_km: totalDistance,
      fuel_consumed_litres: consumedLitres,
      fuel_remaining_litres: remainingLitres,
      fuel_efficiency_km_l: kmPerLitre,
      fuel_cost_per_km: costPerKm,
      is_anomaly: isAnomaly,
      anomaly_reason: anomalyReason
    }
  });
});

// Update Anomaly Status (Investigation / Resolution by Transport Officer or Auditor)
router.patch('/:id/anomaly-status', authenticateToken, requireRole(['transport_officer', 'internal_auditor', 'admin']), (req, res) => {
  const { status, notes } = req.body; // 'Under Investigation', 'Cleared', 'Justified'
  if (!['Flagged', 'Under Investigation', 'Cleared', 'Justified'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid anomaly status' });
  }

  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  db.prepare(`
    UPDATE trips SET
      anomaly_status = ?,
      completion_notes = COALESCE(?, completion_notes)
    WHERE id = ?
  `).run(status, notes ? `${trip.completion_notes || ''} [Investigation Update: ${notes}]` : null, req.params.id);

  logAudit({
    user: req.user,
    action: 'ANOMALY_STATUS_UPDATE',
    module: 'Trips',
    recordId: trip.trip_number,
    oldValues: { anomaly_status: trip.anomaly_status },
    newValues: { anomaly_status: status, notes },
    reason: `Fuel consumption anomaly status updated to ${status}`,
    ip: req.ip
  });

  res.json({ success: true, message: `Anomaly investigation status updated to ${status}` });
});

module.exports = router;
