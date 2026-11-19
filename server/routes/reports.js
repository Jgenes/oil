const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// 1. Daily Fuel Issuance Report
router.get('/daily-issuance', authenticateToken, (req, res) => {
  const { date = new Date().toISOString().substring(0, 10), supplier_id } = req.query;

  let query = `
    SELECT
      fi.*,
      v.registration_number,
      v.make,
      v.model,
      dr.full_name as driver_name,
      d.name as department_name,
      fr.request_number,
      fr.form_serial_number
    FROM fuel_issuances fi
    JOIN vehicles v ON fi.vehicle_id = v.id
    LEFT JOIN drivers dr ON fi.driver_id = dr.id
    LEFT JOIN fuel_requests fr ON fi.fuel_request_id = fr.id
    LEFT JOIN departments d ON fr.department_id = d.id
    WHERE date(fi.issuance_date) = date(?)
  `;
  const params = [date];

  if (supplier_id) {
    query += ' AND fi.supplier_id = ?';
    params.push(supplier_id);
  }

  query += ' ORDER BY fi.issuance_date DESC';

  const issuances = db.prepare(query).all(...params);

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_issuances,
      COALESCE(SUM(quantity_issued), 0) as total_litres,
      COALESCE(SUM(total_cost), 0) as total_amount_tzs
    FROM fuel_issuances
    WHERE date(issuance_date) = date(?)
  `).get(date);

  res.json({ success: true, date, summary, data: issuances });
});

// 2. Monthly Fuel Consumption Report
router.get('/monthly-consumption', authenticateToken, (req, res) => {
  const { month = new Date().toISOString().substring(0, 7) } = req.query; // YYYY-MM

  const records = db.prepare(`
    SELECT
      v.registration_number,
      v.make,
      v.model,
      v.category,
      v.fuel_type,
      d.name as department_name,
      COUNT(t.id) as trips_count,
      COALESCE(SUM(t.total_distance_km), 0) as total_distance_km,
      COALESCE(SUM(t.fuel_consumed_litres), 0) as fuel_consumed_litres,
      COALESCE(SUM(t.fuel_issued_litres), 0) as fuel_issued_litres,
      ROUND(COALESCE(AVG(CASE WHEN t.fuel_efficiency_km_l > 0 THEN t.fuel_efficiency_km_l END), 0), 2) as avg_km_l,
      COALESCE(SUM(t.fuel_cost_per_km * t.total_distance_km), 0) as estimated_cost_tzs
    FROM vehicles v
    LEFT JOIN departments d ON v.assigned_department_id = d.id
    LEFT JOIN trips t ON t.vehicle_id = v.id AND strftime('%Y-%m', t.departure_datetime) = ? AND t.status = 'Completed'
    GROUP BY v.id
    ORDER BY total_distance_km DESC
  `).all(month);

  res.json({ success: true, month, data: records });
});

// 3. Department Fuel Budget vs Actual Expenditure Report
router.get('/budget-vs-actual', authenticateToken, (req, res) => {
  const departments = db.prepare(`
    SELECT
      d.id,
      d.code,
      d.name,
      d.head_name,
      d.annual_fuel_budget,
      COUNT(DISTINCT v.id) as assigned_vehicles,
      COUNT(DISTINCT fr.id) as requests_count,
      COALESCE(SUM(fi.quantity_issued), 0) as total_fuel_litres_issued,
      COALESCE(SUM(fi.total_cost), 0) as actual_expenditure_tzs,
      (d.annual_fuel_budget - COALESCE(SUM(fi.total_cost), 0)) as remaining_budget_tzs,
      ROUND(COALESCE(SUM(fi.total_cost), 0) * 100.0 / CASE WHEN d.annual_fuel_budget > 0 THEN d.annual_fuel_budget ELSE 1 END, 1) as utilization_pct
    FROM departments d
    LEFT JOIN vehicles v ON v.assigned_department_id = d.id
    LEFT JOIN fuel_requests fr ON fr.department_id = d.id
    LEFT JOIN fuel_issuances fi ON fi.fuel_request_id = fr.id
    GROUP BY d.id
    ORDER BY actual_expenditure_tzs DESC
  `).all();

  res.json({ success: true, data: departments });
});

// 4. Vehicle Distance Coverage & Performance Report
router.get('/vehicle-performance', authenticateToken, (req, res) => {
  const vehicles = db.prepare(`
    SELECT
      v.id,
      v.registration_number,
      v.make,
      v.model,
      v.category,
      v.fuel_type,
      v.vehicle_status,
      v.initial_odometer,
      v.current_odometer,
      (v.current_odometer - v.initial_odometer) as system_tracked_km,
      v.standard_efficiency_km_l,
      d.name as department_name,
      COUNT(t.id) as completed_trips,
      COALESCE(SUM(t.total_distance_km), 0) as total_trip_distance_km,
      COALESCE(SUM(t.fuel_consumed_litres), 0) as total_fuel_consumed,
      ROUND(COALESCE(AVG(CASE WHEN t.fuel_efficiency_km_l > 0 THEN t.fuel_efficiency_km_l END), 0), 2) as actual_km_l,
      ROUND(COALESCE(AVG(CASE WHEN t.fuel_cost_per_km > 0 THEN t.fuel_cost_per_km END), 0), 2) as avg_cost_per_km,
      SUM(CASE WHEN t.is_anomaly = 1 THEN 1 ELSE 0 END) as anomaly_flags_count
    FROM vehicles v
    LEFT JOIN departments d ON v.assigned_department_id = d.id
    LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Completed'
    GROUP BY v.id
    ORDER BY total_trip_distance_km DESC
  `).all();

  res.json({ success: true, data: vehicles });
});

// 5. Driver Trip and Efficiency Report
router.get('/driver-trips', authenticateToken, (req, res) => {
  const drivers = db.prepare(`
    SELECT
      dr.id,
      dr.full_name,
      dr.employee_number,
      dr.driving_licence_number,
      dr.licence_expiry_date,
      dr.employment_status,
      v.registration_number as assigned_vehicle,
      COUNT(t.id) as trips_count,
      COALESCE(SUM(t.total_distance_km), 0) as total_distance_km,
      COALESCE(SUM(t.fuel_consumed_litres), 0) as total_fuel_consumed,
      ROUND(COALESCE(AVG(CASE WHEN t.fuel_efficiency_km_l > 0 THEN t.fuel_efficiency_km_l END), 0), 2) as avg_km_l,
      SUM(CASE WHEN t.is_anomaly = 1 THEN 1 ELSE 0 END) as anomalies_count
    FROM drivers dr
    LEFT JOIN vehicles v ON dr.assigned_vehicle_id = v.id
    LEFT JOIN trips t ON t.driver_id = dr.id AND t.status = 'Completed'
    GROUP BY dr.id
    ORDER BY total_distance_km DESC
  `).all();

  res.json({ success: true, data: drivers });
});

// 6. Fuel Requisition & Approval Audit Report
router.get('/requisitions-audit', authenticateToken, (req, res) => {
  const requests = db.prepare(`
    SELECT
      fr.request_number,
      fr.form_serial_number,
      fr.created_at,
      fr.requested_by_name,
      d.name as department_name,
      v.registration_number,
      fr.destination,
      fr.requested_quantity_litres,
      fr.estimated_fuel_cost,
      fr.status,
      fr.stage,
      fr.hod_recommendation,
      fr.hod_recommended_at,
      u_hod.name as hod_name,
      fr.transport_verification,
      fr.transport_verified_at,
      u_tr.name as transport_name,
      fr.hpmu_authorization,
      fr.hpmu_authorized_at,
      u_hpmu.name as hpmu_name,
      fr.finance_vote_code,
      fr.finance_recorded_at,
      u_fin.name as finance_name
    FROM fuel_requests fr
    LEFT JOIN departments d ON fr.department_id = d.id
    LEFT JOIN vehicles v ON fr.vehicle_id = v.id
    LEFT JOIN users u_hod ON fr.hod_recommended_by_id = u_hod.id
    LEFT JOIN users u_tr ON fr.transport_verified_by_id = u_tr.id
    LEFT JOIN users u_hpmu ON fr.hpmu_authorized_by_id = u_hpmu.id
    LEFT JOIN users u_fin ON fr.finance_recorded_by_id = u_fin.id
    ORDER BY fr.id DESC
  `).all();

  res.json({ success: true, data: requests });
});

// 7. Supplier Transactions & Invoices Report
router.get('/supplier-transactions', authenticateToken, (req, res) => {
  const transactions = db.prepare(`
    SELECT
      s.supplier_name,
      s.station_name,
      fi.issuance_number,
      fi.issuance_date,
      fi.receipt_number,
      fi.invoice_reference,
      v.registration_number,
      fi.fuel_type,
      fi.quantity_issued,
      fi.unit_price,
      fi.total_cost,
      fr.request_number,
      d.name as department_name
    FROM fuel_issuances fi
    JOIN fuel_suppliers s ON fi.supplier_id = s.id
    JOIN vehicles v ON fi.vehicle_id = v.id
    LEFT JOIN fuel_requests fr ON fi.fuel_request_id = fr.id
    LEFT JOIN departments d ON fr.department_id = d.id
    ORDER BY fi.issuance_date DESC
  `).all();

  res.json({ success: true, data: transactions });
});

// 8. Vehicle Maintenance & Cost Report
router.get('/maintenance-costs', authenticateToken, (req, res) => {
  const records = db.prepare(`
    SELECT
      m.*,
      v.registration_number,
      v.make,
      v.model,
      d.name as department_name
    FROM maintenance_records m
    JOIN vehicles v ON m.vehicle_id = v.id
    LEFT JOIN departments d ON v.assigned_department_id = d.id
    ORDER BY m.service_date DESC
  `).all();

  const totalCost = db.prepare('SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_records').get();

  res.json({ success: true, totalMaintenanceCost: totalCost.total, data: records });
});

module.exports = router;
