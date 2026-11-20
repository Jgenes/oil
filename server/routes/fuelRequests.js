const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole, logAudit, createNotification } = require('../middleware/auth');

// Get all fuel requests (with filters: status, stage, department, vehicle, date range)
router.get('/', authenticateToken, (req, res) => {
  const { status, stage, department_id, vehicle_id, start_date, end_date, search } = req.query;

  let query = `
    SELECT
      fr.*,
      d.name as department_name,
      d.code as department_code,
      v.registration_number as vehicle_number,
      v.make as vehicle_make,
      v.model as vehicle_model,
      dr.full_name as driver_name,
      dr.phone_number as driver_phone,
      u.name as submitter_name
    FROM fuel_requests fr
    LEFT JOIN departments d ON fr.department_id = d.id
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    LEFT JOIN drivers dr ON fr.driver_id = dr.id
    LEFT JOIN users u ON fr.requested_by_id = u.id
    WHERE 1=1
  `;
  const params = [];

  // Scoping: HOD role only sees requests from their department unless admin/management/transport/approver
  if (req.user.role === 'hod' && req.user.department_id) {
    query += ' AND fr.department_id = ?';
    params.push(req.user.department_id);
  } else if (department_id) {
    query += ' AND fr.department_id = ?';
    params.push(department_id);
  }

  if (status) {
    query += ' AND fr.status = ?';
    params.push(status);
  }

  if (stage) {
    query += ' AND fr.stage = ?';
    params.push(stage);
  }

  if (vehicle_id) {
    query += ' AND fr.vehicle_id = ?';
    params.push(vehicle_id);
  }

  if (start_date) {
    query += ' AND date(fr.created_at) >= date(?)';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND date(fr.created_at) <= date(?)';
    params.push(end_date);
  }

  if (search) {
    query += ' AND (fr.request_number LIKE ? OR fr.form_serial_number LIKE ? OR fr.destination LIKE ? OR fr.requested_by_name LIKE ? OR v.registration_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY fr.id DESC';

  const requests = db.prepare(query).all(...params);

  // Fetch items for each request
  const getItems = db.prepare('SELECT * FROM fuel_request_items WHERE fuel_request_id = ? ORDER BY serial_no ASC');
  const enriched = requests.map(r => ({
    ...r,
    items: getItems.all(r.id)
  }));

  res.json({ success: true, data: enriched });
});

// Get single fuel request with full workflow details & items
router.get('/:id', authenticateToken, (req, res) => {
  const request = db.prepare(`
    SELECT
      fr.*,
      d.name as department_name,
      d.code as department_code,
      d.annual_fuel_budget,
      d.allocated_fuel_budget,
      v.registration_number as vehicle_number,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.fuel_tank_capacity,
      v.current_odometer as vehicle_current_odometer,
      dr.full_name as driver_name,
      dr.phone_number as driver_phone,
      dr.driving_licence_number,
      u_sub.name as submitter_name,
      u_hod.name as hod_reviewer_name,
      u_tr.name as transport_officer_name,
      u_hpmu.name as hpmu_officer_name,
      u_fin.name as finance_officer_name
    FROM fuel_requests fr
    LEFT JOIN departments d ON fr.department_id = d.id
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    LEFT JOIN drivers dr ON fr.driver_id = dr.id
    LEFT JOIN users u_sub ON fr.requested_by_id = u_sub.id
    LEFT JOIN users u_hod ON fr.hod_recommended_by_id = u_hod.id
    LEFT JOIN users u_tr ON fr.transport_verified_by_id = u_tr.id
    LEFT JOIN users u_hpmu ON fr.hpmu_authorized_by_id = u_hpmu.id
    LEFT JOIN users u_fin ON fr.finance_recorded_by_id = u_fin.id
    WHERE fr.id = ?
  `).get(req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, error: 'Fuel request not found' });
  }

  const items = db.prepare('SELECT * FROM fuel_request_items WHERE fuel_request_id = ? ORDER BY serial_no ASC').all(req.params.id);
  const issuance = db.prepare('SELECT * FROM fuel_issuances WHERE fuel_request_id = ?').get(req.params.id);
  const trip = db.prepare('SELECT * FROM trips WHERE fuel_request_id = ?').get(req.params.id);

  res.json({
    success: true,
    data: {
      ...request,
      items,
      issuance,
      trip
    }
  });
});

// Submit a new fuel request
router.post('/', authenticateToken, (req, res) => {
  const {
    department_id,
    vehicle_id,
    driver_id,
    destination,
    trip_purpose,
    expected_departure_date,
    expected_return_date,
    last_request_odometer,
    present_request_odometer,
    estimated_distance_km,
    fuel_type,
    requested_quantity_litres,
    unit_price = 3280,
    supporting_document_url,
    items = [] // multi-vehicle table support
  } = req.body;

  if (!department_id || !vehicle_id || !destination || !trip_purpose || !requested_quantity_litres) {
    return res.status(400).json({ success: false, error: 'Please provide all required trip and fuel details' });
  }

  // Get vehicle
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) {
    return res.status(400).json({ success: false, error: 'Selected vehicle not found' });
  }

  // Generate unique request reference number and serial form number
  const countRow = db.prepare('SELECT COUNT(*) as count FROM fuel_requests').get();
  const nextSerial = 3140 + countRow.count + 1; // continues sequence from form 3143
  const requestNumber = `MOCU-FR-${new Date().getFullYear()}-${String(nextSerial).padStart(6, '0')}`;
  const formSerialNumber = String(nextSerial);

  const estimatedFuelCost = Number(requested_quantity_litres) * Number(unit_price);
  const lastOdo = last_request_odometer !== undefined ? Number(last_request_odometer) : vehicle.current_odometer;
  const presentOdo = present_request_odometer !== undefined ? Number(present_request_odometer) : vehicle.current_odometer;
  const estDistance = estimated_distance_km ? Number(estimated_distance_km) : 0;

  let requestId;
  db.transaction(() => {
    const insert = db.prepare(`
      INSERT INTO fuel_requests (
        request_number, form_serial_number, department_id, requested_by_id, requested_by_name,
        requested_by_title, vehicle_id, driver_id, destination, trip_purpose,
        expected_departure_date, expected_return_date, last_request_odometer, present_request_odometer,
        estimated_distance_km, fuel_type, requested_quantity_litres, unit_price, estimated_fuel_cost,
        status, stage, supporting_document_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', 'hod_review', ?, CURRENT_TIMESTAMP)
    `);

    const result = insert.run(
      requestNumber,
      formSerialNumber,
      department_id,
      req.user.id,
      req.user.name,
      req.user.designation || 'Requisition Officer',
      vehicle_id,
      driver_id || vehicle.assigned_driver_id || null,
      destination,
      trip_purpose,
      expected_departure_date || new Date().toISOString(),
      expected_return_date || new Date().toISOString(),
      lastOdo,
      presentOdo,
      estDistance,
      fuel_type || vehicle.fuel_type,
      Number(requested_quantity_litres),
      Number(unit_price),
      estimatedFuelCost,
      supporting_document_url || null
    );

    requestId = result.lastInsertRowid;

    // Insert items table (if passed, or create single item for primary vehicle)
    const insertItem = db.prepare(`
      INSERT INTO fuel_request_items (fuel_request_id, serial_no, vehicle_id, vehicle_number, quantity_litres, unit_price, total_value, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (items && items.length > 0) {
      items.forEach((item, index) => {
        insertItem.run(
          requestId,
          index + 1,
          item.vehicle_id || vehicle_id,
          item.vehicle_number || vehicle.registration_number,
          Number(item.quantity_litres || requested_quantity_litres),
          Number(item.unit_price || unit_price),
          Number(item.quantity_litres || requested_quantity_litres) * Number(item.unit_price || unit_price),
          item.notes || trip_purpose
        );
      });
    } else {
      insertItem.run(
        requestId,
        1,
        vehicle_id,
        vehicle.registration_number,
        Number(requested_quantity_litres),
        Number(unit_price),
        estimatedFuelCost,
        trip_purpose
      );
    }

    // Audit log
    logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'Fuel Requests',
      recordId: requestNumber,
      newValues: { requestNumber, formSerialNumber, destination, litres: requested_quantity_litres, cost: estimatedFuelCost },
      reason: 'New Fuel Requisition Submitted',
      ip: req.ip
    });

    // Notify HOD
    createNotification({
      targetRole: 'hod',
      title: 'New Fuel Requisition Submitted',
      message: `Requisition ${requestNumber} (Slip No. ${formSerialNumber}) for vehicle ${vehicle.registration_number} awaits HOD recommendation.`,
      type: 'info',
      link: '/fuel-requests'
    });
  })();

  res.status(201).json({
    success: true,
    message: `Fuel requisition submitted successfully with Slip No. ${formSerialNumber}`,
    data: { id: requestId, request_number: requestNumber, form_serial_number: formSerialNumber }
  });
});

// Step 2: Head of Department Review & Recommend (or Reject)
router.post('/:id/hod-recommend', authenticateToken, requireRole(['hod', 'admin']), (req, res) => {
  const { action, comments } = req.body; // action: 'Recommended' or 'Rejected'
  const reqId = req.params.id;

  const request = db.prepare('SELECT * FROM fuel_requests WHERE id = ?').get(reqId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Fuel request not found' });
  }

  if (request.status !== 'Submitted') {
    return res.status(400).json({ success: false, error: `Cannot recommend request in '${request.status}' status` });
  }

  const isRecommended = action === 'Recommended';
  const newStatus = isRecommended ? 'HOD_Recommended' : 'Rejected';
  const newStage = isRecommended ? 'transport_review' : 'completed';

  db.prepare(`
    UPDATE fuel_requests SET
      status = ?,
      stage = ?,
      hod_recommendation = ?,
      hod_recommended_by_id = ?,
      hod_recommended_at = CURRENT_TIMESTAMP,
      hod_comments = ?,
      rejection_reason = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    newStatus,
    newStage,
    isRecommended ? 'Recommended' : 'Rejected',
    req.user.id,
    comments || (isRecommended ? 'Recommended for approval' : 'Rejected by HOD'),
    isRecommended ? null : comments,
    reqId
  );

  logAudit({
    user: req.user,
    action: isRecommended ? 'RECOMMEND' : 'REJECT',
    module: 'Fuel Requests',
    recordId: request.request_number,
    oldValues: { status: request.status },
    newValues: { status: newStatus, comments },
    reason: `HOD review: ${action}`,
    ip: req.ip
  });

  if (isRecommended) {
    createNotification({
      targetRole: 'transport_officer',
      title: 'Requisition Awaiting Transport Verification',
      message: `Requisition ${request.request_number} (Slip No. ${request.form_serial_number}) recommended by HOD. Awaiting Transport Officer verification.`,
      type: 'info',
      link: '/fuel-requests'
    });
  }

  res.json({ success: true, message: `Request successfully ${action.toLowerCase()} by Head of Department` });
});

// Step 3: Transport Officer Verification (or Reject)
router.post('/:id/transport-verify', authenticateToken, requireRole(['transport_officer', 'admin']), (req, res) => {
  const { action, comments, verified_odometer, assigned_driver_id } = req.body;
  const reqId = req.params.id;

  const request = db.prepare('SELECT * FROM fuel_requests WHERE id = ?').get(reqId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Fuel request not found' });
  }

  if (request.status !== 'HOD_Recommended') {
    return res.status(400).json({ success: false, error: `Request must be in HOD_Recommended status to verify. Current: ${request.status}` });
  }

  const isVerified = action === 'Verified';
  const newStatus = isVerified ? 'Transport_Verified' : 'Rejected';
  const newStage = isVerified ? 'hpmu_review' : 'completed';

  db.transaction(() => {
    db.prepare(`
      UPDATE fuel_requests SET
        status = ?,
        stage = ?,
        driver_id = COALESCE(?, driver_id),
        present_request_odometer = COALESCE(?, present_request_odometer),
        transport_verification = ?,
        transport_verified_by_id = ?,
        transport_verified_at = CURRENT_TIMESTAMP,
        transport_comments = ?,
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newStatus,
      newStage,
      assigned_driver_id || null,
      verified_odometer ? Number(verified_odometer) : null,
      isVerified ? 'Verified' : 'Rejected',
      req.user.id,
      comments || (isVerified ? 'Vehicle verified roadworthy, odometer and driver cleared.' : 'Rejected by Transport Section'),
      isVerified ? null : comments,
      reqId
    );

    // If transport officer updated odometer, update vehicle current odometer
    if (verified_odometer) {
      db.prepare('UPDATE vehicles SET current_odometer = ? WHERE id = ?').run(Number(verified_odometer), request.vehicle_id);
    }

    logAudit({
      user: req.user,
      action: isVerified ? 'VERIFY' : 'REJECT',
      module: 'Fuel Requests',
      recordId: request.request_number,
      oldValues: { status: request.status },
      newValues: { status: newStatus, comments },
      reason: `Transport verification: ${action}`,
      ip: req.ip
    });

    if (isVerified) {
      createNotification({
        targetRole: 'approving_officer',
        title: 'Requisition Awaiting Authorization (HPMU)',
        message: `Requisition ${request.request_number} (Slip No. ${request.form_serial_number}) verified by Transport Section. Please authorize or reject.`,
        type: 'warning',
        link: '/fuel-requests'
      });
    }
  })();

  res.json({ success: true, message: `Request successfully ${action.toLowerCase()} by Transport Officer` });
});

// Step 4: Authorized Approving Officer (HPMU) Authorize or Reject
// Matches official slip prompt: "I authorize/ do not authorize the above mentioned fuel to be supplied"
router.post('/:id/authorize', authenticateToken, requireRole(['approving_officer', 'management', 'admin']), (req, res) => {
  const { action, comments } = req.body; // 'Authorized' or 'Rejected'
  const reqId = req.params.id;

  const request = db.prepare('SELECT * FROM fuel_requests WHERE id = ?').get(reqId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Fuel request not found' });
  }

  if (request.status !== 'Transport_Verified') {
    return res.status(400).json({ success: false, error: `Request must be in Transport_Verified status to authorize. Current: ${request.status}` });
  }

  const isAuthorized = action === 'Authorized';
  const newStatus = isAuthorized ? 'Authorized' : 'Rejected';
  const newStage = isAuthorized ? 'finance_record' : 'completed';

  db.prepare(`
    UPDATE fuel_requests SET
      status = ?,
      stage = ?,
      hpmu_authorization = ?,
      hpmu_authorized_by_id = ?,
      hpmu_authorized_at = CURRENT_TIMESTAMP,
      hpmu_comments = ?,
      rejection_reason = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    newStatus,
    newStage,
    isAuthorized ? 'Authorized' : 'Rejected',
    req.user.id,
    comments || (isAuthorized ? 'I authorize the above mentioned fuel to be supplied.' : 'I do not authorize the above mentioned fuel to be supplied.'),
    isAuthorized ? null : comments,
    reqId
  );

  logAudit({
    user: req.user,
    action: isAuthorized ? 'APPROVE' : 'REJECT',
    module: 'Fuel Requests',
    recordId: request.request_number,
    oldValues: { status: request.status },
    newValues: { status: newStatus, comments },
    reason: `HPMU Authorization decision: ${action}`,
    ip: req.ip
  });

  if (isAuthorized) {
    createNotification({
      targetRole: 'finance_officer',
      title: 'Requisition Authorized - Financial Allocation Pending',
      message: `Requisition ${request.request_number} (Slip No. ${request.form_serial_number}) authorized by HPMU. Please commit financial vote allocation.`,
      type: 'info',
      link: '/fuel-requests'
    });
  }

  res.json({
    success: true,
    message: isAuthorized
      ? 'Fuel requisition authorized! Financial vote recording is now required.'
      : 'Fuel requisition has been rejected.'
  });
});

// Step 5: Finance Officer records financial allocation / vote code
router.post('/:id/finance-record', authenticateToken, requireRole(['finance_officer', 'admin']), (req, res) => {
  const { vote_code, comments } = req.body;
  const reqId = req.params.id;

  const request = db.prepare('SELECT * FROM fuel_requests WHERE id = ?').get(reqId);
  if (!request) {
    return res.status(404).json({ success: false, error: 'Fuel request not found' });
  }

  if (request.status !== 'Authorized') {
    return res.status(400).json({ success: false, error: `Request must be in Authorized status to record finance. Current: ${request.status}` });
  }

  db.prepare(`
    UPDATE fuel_requests SET
      status = 'Finance_Recorded',
      stage = 'issuance',
      finance_recorded_by_id = ?,
      finance_recorded_at = CURRENT_TIMESTAMP,
      finance_vote_code = ?,
      finance_comments = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    req.user.id,
    vote_code || 'VOTE-MOCU-CENTRAL-FUEL-2026',
    comments || 'Expenditure vote verified against departmental fuel budget.',
    reqId
  );

  logAudit({
    user: req.user,
    action: 'FINANCE_COMMIT',
    module: 'Fuel Requests',
    recordId: request.request_number,
    oldValues: { status: request.status },
    newValues: { status: 'Finance_Recorded', vote_code },
    reason: 'Finance Officer committed expenditure vote',
    ip: req.ip
  });

  createNotification({
    targetRole: 'transport_officer',
    title: 'Fuel Requisition Ready for Station Issuance',
    message: `Requisition ${request.request_number} (Slip No. ${request.form_serial_number}) cleared by Finance. Fuel may now be issued at supplier station.`,
    type: 'success',
    link: '/fuel-issuances'
  });

  res.json({ success: true, message: 'Financial allocation recorded. Fuel is cleared for issuance.' });
});

// Printable slip data (Exact digital replica of the paper form in the user's photo)
router.get('/:id/slip-data', authenticateToken, (req, res) => {
  const request = db.prepare(`
    SELECT
      fr.*,
      d.name as department_name,
      d.code as department_code,
      v.registration_number as vehicle_number,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.fuel_type as vehicle_fuel_type,
      v.fuel_tank_capacity,
      dr.full_name as driver_name,
      u_sub.name as requisition_officer_name,
      u_sub.signature_title as requisition_officer_title,
      u_tr.name as transport_officer_name,
      u_tr.signature_title as transport_officer_title,
      u_hod.name as hod_name,
      u_hod.signature_title as hod_title,
      u_hpmu.name as hpmu_name,
      u_hpmu.signature_title as hpmu_title,
      u_fin.name as finance_name,
      u_fin.signature_title as finance_title
    FROM fuel_requests fr
    LEFT JOIN departments d ON fr.department_id = d.id
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    LEFT JOIN drivers dr ON fr.driver_id = dr.id
    LEFT JOIN users u_sub ON fr.requested_by_id = u_sub.id
    LEFT JOIN users u_tr ON fr.transport_verified_by_id = u_tr.id
    LEFT JOIN users u_hod ON fr.hod_recommended_by_id = u_hod.id
    LEFT JOIN users u_hpmu ON fr.hpmu_authorized_by_id = u_hpmu.id
    LEFT JOIN users u_fin ON fr.finance_recorded_by_id = u_fin.id
    WHERE fr.id = ?
  `).get(req.params.id);

  if (!request) {
    return res.status(404).json({ success: false, error: 'Fuel request not found' });
  }

  const items = db.prepare('SELECT * FROM fuel_request_items WHERE fuel_request_id = ? ORDER BY serial_no ASC').all(req.params.id);

  res.json({
    success: true,
    data: {
      slip: {
        form_title: 'FUEL REQUISITION FORM',
        form_number: request.form_serial_number || '3143',
        university_name: 'MOSHI CO-OPERATIVE UNIVERSITY (MoCU)',
        swahili_name: 'CHUO KIKUU CHA USHIRIKA MOSHI',
        ministry: 'MINISTRY OF EDUCATION, SCIENCE AND TECHNOLOGY',
        country: 'UNITED REPUBLIC OF TANZANIA',
        office: 'OFFICE OF THE VICE CHANCELLOR',
        address: '06 Sokoine Road, 25121 Mfumuni, P. O. Box 474, Moshi, Tanzania',
        tel: '+255 272751833',
        email: 'vc@mocu.ac.tz',
        website: 'www.mocu.ac.tz',
        requisition_officer: request.requested_by_name,
        department_section: request.department_name,
        type_of_fuel: request.fuel_type,
        supply_for: `${request.destination} - ${request.trip_purpose}`,
        last_request_km: request.last_request_odometer,
        present_request_km: request.present_request_odometer,
        estimated_distance_km: request.estimated_distance_km,
        table_items: items.length > 0 ? items : [
          {
            serial_no: 1,
            vehicle_number: request.vehicle_number,
            quantity_litres: request.requested_quantity_litres,
            unit_price: request.unit_price,
            total_value: request.estimated_fuel_cost
          }
        ],
        signatures: {
          requisition_officer: {
            date: request.created_at ? request.created_at.substring(0, 10) : '2026-11-19',
            name: request.requisition_officer_name,
            title: request.requisition_officer_title || 'Requisition Officer'
          },
          head_driver: {
            date: request.transport_verified_at ? request.transport_verified_at.substring(0, 10) : '',
            name: request.transport_officer_name || 'Capt. Michael Shirima',
            title: 'Sign of Head Driver / Transport Officer',
            verified: !!request.transport_verified_at
          },
          hod: {
            date: request.hod_recommended_at ? request.hod_recommended_at.substring(0, 10) : '',
            name: request.hod_name || 'Dr. Prosper Mrosso',
            title: 'Sign of Head of Department/Section',
            recommended: !!request.hod_recommended_at
          },
          hpmu: {
            date: request.hpmu_authorized_at ? request.hpmu_authorized_at.substring(0, 10) : '',
            name: request.hpmu_name || 'Ms. Beatrice Swai',
            title: 'Sign of HPMU',
            decision: request.hpmu_authorization || 'Pending',
            authorized: request.hpmu_authorization === 'Authorized'
          }
        }
      }
    }
  });
});

module.exports = router;
