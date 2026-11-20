const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Get comprehensive fuel consumption analytics per vehicle & fleet-wide
router.get('/', authenticateToken, (req, res) => {
  const { department_id, period } = req.query;

  // 1. Vehicle-by-vehicle consumption stats
  const vehicleConsumption = db.prepare(`
    SELECT
      v.id,
      v.registration_number,
      v.make,
      v.model,
      v.category,
      v.fuel_type,
      v.standard_efficiency_km_l,
      d.name as department_name,
      d.code as department_code,
      COUNT(t.id) as total_trips,
      COALESCE(SUM(t.total_distance_km), 0) as total_distance_km,
      COALESCE(SUM(t.fuel_allocated_litres), 0) as total_fuel_allocated,
      COALESCE(SUM(t.fuel_issued_litres), 0) as total_fuel_issued,
      COALESCE(SUM(t.fuel_consumed_litres), 0) as total_fuel_consumed,
      COALESCE(SUM(t.fuel_remaining_litres), 0) as total_fuel_remaining,
      ROUND(COALESCE(AVG(CASE WHEN t.fuel_efficiency_km_l > 0 THEN t.fuel_efficiency_km_l END), 0), 2) as avg_km_l,
      ROUND(COALESCE(AVG(CASE WHEN t.fuel_cost_per_km > 0 THEN t.fuel_cost_per_km END), 0), 2) as avg_cost_per_km,
      SUM(CASE WHEN t.is_anomaly = 1 THEN 1 ELSE 0 END) as anomaly_count
    FROM vehicles v
    LEFT JOIN departments d ON v.assigned_department_id = d.id
    LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Completed'
    GROUP BY v.id
    ORDER BY total_distance_km DESC
  `).all();

  // 2. Department-level fuel utilization and cost
  const departmentConsumption = db.prepare(`
    SELECT
      d.id,
      d.name,
      d.code,
      d.annual_fuel_budget,
      COUNT(DISTINCT v.id) as vehicle_count,
      COUNT(t.id) as total_trips,
      COALESCE(SUM(t.total_distance_km), 0) as total_distance_km,
      COALESCE(SUM(t.fuel_consumed_litres), 0) as total_fuel_consumed,
      COALESCE(SUM(fi.total_cost), 0) as total_expenditure_tzs,
      ROUND(COALESCE(AVG(CASE WHEN t.fuel_efficiency_km_l > 0 THEN t.fuel_efficiency_km_l END), 0), 2) as avg_km_l
    FROM departments d
    LEFT JOIN vehicles v ON v.assigned_department_id = d.id
    LEFT JOIN trips t ON t.department_id = d.id AND t.status = 'Completed'
    LEFT JOIN fuel_requests fr ON fr.department_id = d.id
    LEFT JOIN fuel_issuances fi ON fi.fuel_request_id = fr.id
    GROUP BY d.id
    ORDER BY total_expenditure_tzs DESC
  `).all();

  // 3. List of Flagged Anomaly Trips
  const anomalies = db.prepare(`
    SELECT
      t.*,
      v.registration_number,
      v.make,
      v.model,
      v.standard_efficiency_km_l,
      dr.full_name as driver_name,
      d.name as department_name
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id
    LEFT JOIN drivers dr ON t.driver_id = dr.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.is_anomaly = 1
    ORDER BY t.id DESC
  `).all();

  // 4. Fleet summary totals
  const fleetTotals = db.prepare(`
    SELECT
      COALESCE(SUM(total_distance_km), 0) as total_distance_km,
      COALESCE(SUM(fuel_allocated_litres), 0) as total_fuel_allocated,
      COALESCE(SUM(fuel_consumed_litres), 0) as total_fuel_consumed,
      COALESCE(SUM(fuel_remaining_litres), 0) as total_fuel_remaining,
      ROUND(COALESCE(AVG(CASE WHEN fuel_efficiency_km_l > 0 THEN fuel_efficiency_km_l END), 0), 2) as fleet_avg_km_l,
      ROUND(COALESCE(AVG(CASE WHEN fuel_cost_per_km > 0 THEN fuel_cost_per_km END), 0), 2) as fleet_avg_cost_per_km
    FROM trips
    WHERE status = 'Completed'
  `).get();

  res.json({
    success: true,
    data: {
      fleetTotals,
      vehicleConsumption,
      departmentConsumption,
      anomalies
    }
  });
});

module.exports = router;
