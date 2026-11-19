const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'mocu_fleet.db');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for data integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      head_name TEXT,
      annual_fuel_budget REAL DEFAULT 0,
      allocated_fuel_budget REAL DEFAULT 0,
      contact_email TEXT,
      contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin', 'transport_officer', 'driver', 'hod', 'approving_officer', 'finance_officer', 'internal_auditor', 'management'
      department_id INTEGER,
      phone TEXT,
      designation TEXT,
      signature_title TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      full_name TEXT NOT NULL,
      employee_number TEXT UNIQUE NOT NULL,
      phone_number TEXT NOT NULL,
      email TEXT,
      driving_licence_number TEXT UNIQUE NOT NULL,
      licence_classes TEXT DEFAULT 'A, B, C, D, E',
      licence_expiry_date DATE NOT NULL,
      assigned_vehicle_id INTEGER,
      employment_status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'On Leave', 'Suspended'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_number TEXT UNIQUE NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Executive / SUV', 'Operational / Pick-up', 'Passenger / Bus', 'Utility / Van'
      fuel_type TEXT NOT NULL, -- 'Diesel', 'Petrol'
      engine_capacity TEXT NOT NULL,
      assigned_department_id INTEGER,
      assigned_driver_id INTEGER,
      vehicle_status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Inactive', 'Under Maintenance', 'On Trip'
      current_odometer REAL NOT NULL DEFAULT 0,
      initial_odometer REAL NOT NULL DEFAULT 0,
      fuel_tank_capacity REAL NOT NULL,
      image_url TEXT,
      insurance_expiry_date DATE,
      inspection_expiry_date DATE,
      chassis_number TEXT,
      year_of_manufacture INTEGER,
      color TEXT,
      standard_efficiency_km_l REAL DEFAULT 8.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_department_id) REFERENCES departments(id),
      FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL,
      station_name TEXT NOT NULL,
      location TEXT NOT NULL,
      contact_person TEXT,
      phone_number TEXT,
      email TEXT,
      diesel_price_per_litre REAL NOT NULL DEFAULT 3280,
      petrol_price_per_litre REAL NOT NULL DEFAULT 3240,
      is_active INTEGER DEFAULT 1,
      contract_reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fuel_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_number TEXT UNIQUE NOT NULL,
      form_serial_number TEXT,
      department_id INTEGER NOT NULL,
      requested_by_id INTEGER NOT NULL,
      requested_by_name TEXT NOT NULL,
      requested_by_title TEXT,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER,
      destination TEXT NOT NULL,
      trip_purpose TEXT NOT NULL,
      expected_departure_date DATETIME NOT NULL,
      expected_return_date DATETIME NOT NULL,
      last_request_odometer REAL NOT NULL,
      present_request_odometer REAL NOT NULL,
      estimated_distance_km REAL NOT NULL,
      fuel_type TEXT NOT NULL,
      requested_quantity_litres REAL NOT NULL,
      unit_price REAL NOT NULL,
      estimated_fuel_cost REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted', -- 'Submitted', 'HOD_Recommended', 'Transport_Verified', 'Authorized', 'Rejected', 'Finance_Recorded', 'Issued', 'Completed', 'Cancelled'
      stage TEXT NOT NULL DEFAULT 'hod_review', -- 'hod_review', 'transport_review', 'hpmu_review', 'finance_record', 'issuance', 'completed'
      hod_recommendation TEXT,
      hod_recommended_by_id INTEGER,
      hod_recommended_at DATETIME,
      hod_comments TEXT,
      transport_verification TEXT,
      transport_verified_by_id INTEGER,
      transport_verified_at DATETIME,
      transport_comments TEXT,
      hpmu_authorization TEXT, -- 'Authorized' or 'Rejected'
      hpmu_authorized_by_id INTEGER,
      hpmu_authorized_at DATETIME,
      hpmu_comments TEXT,
      finance_recorded_by_id INTEGER,
      finance_recorded_at DATETIME,
      finance_vote_code TEXT,
      finance_comments TEXT,
      rejection_reason TEXT,
      supporting_document_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (requested_by_id) REFERENCES users(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (hod_recommended_by_id) REFERENCES users(id),
      FOREIGN KEY (transport_verified_by_id) REFERENCES users(id),
      FOREIGN KEY (hpmu_authorized_by_id) REFERENCES users(id),
      FOREIGN KEY (finance_recorded_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_request_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fuel_request_id INTEGER NOT NULL,
      serial_no INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      vehicle_number TEXT NOT NULL,
      quantity_litres REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_value REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (fuel_request_id) REFERENCES fuel_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS fuel_issuances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issuance_number TEXT UNIQUE NOT NULL,
      fuel_request_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER,
      supplier_id INTEGER NOT NULL,
      fuel_station_name TEXT NOT NULL,
      fuel_type TEXT NOT NULL,
      quantity_approved REAL NOT NULL,
      quantity_issued REAL NOT NULL,
      quantity_variance REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_cost REAL NOT NULL,
      issuance_date DATETIME NOT NULL,
      receipt_number TEXT NOT NULL,
      invoice_reference TEXT,
      recorded_by_id INTEGER NOT NULL,
      recorded_by_name TEXT NOT NULL,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fuel_request_id) REFERENCES fuel_requests(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (supplier_id) REFERENCES fuel_suppliers(id),
      FOREIGN KEY (recorded_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_number TEXT UNIQUE NOT NULL,
      fuel_request_id INTEGER,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      destination TEXT NOT NULL,
      trip_purpose TEXT NOT NULL,
      departure_datetime DATETIME NOT NULL,
      return_datetime DATETIME,
      starting_odometer REAL NOT NULL,
      ending_odometer REAL,
      total_distance_km REAL,
      fuel_allocated_litres REAL NOT NULL DEFAULT 0,
      fuel_issued_litres REAL NOT NULL DEFAULT 0,
      fuel_consumed_litres REAL DEFAULT 0,
      fuel_remaining_litres REAL DEFAULT 0,
      fuel_efficiency_km_l REAL,
      fuel_cost_per_km REAL,
      status TEXT NOT NULL DEFAULT 'In Progress', -- 'Scheduled', 'In Progress', 'Completed', 'Cancelled'
      completion_notes TEXT,
      completed_by_id INTEGER,
      completed_at DATETIME,
      is_anomaly INTEGER DEFAULT 0,
      anomaly_reason TEXT,
      anomaly_status TEXT DEFAULT 'None', -- 'None', 'Flagged', 'Under Investigation', 'Cleared', 'Justified'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fuel_request_id) REFERENCES fuel_requests(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (completed_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      maintenance_number TEXT UNIQUE NOT NULL,
      vehicle_id INTEGER NOT NULL,
      service_date DATE NOT NULL,
      service_mileage REAL NOT NULL,
      service_type TEXT NOT NULL,
      description TEXT NOT NULL,
      spare_parts_used TEXT,
      service_provider TEXT NOT NULL,
      cost REAL NOT NULL,
      invoice_number TEXT,
      next_service_date DATE,
      next_service_mileage REAL,
      status TEXT NOT NULL DEFAULT 'Completed', -- 'Scheduled', 'In Progress', 'Completed', 'Cancelled'
      recorded_by_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (recorded_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      old_values TEXT,
      new_values TEXT,
      reason TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      target_role TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'danger'
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS odometer_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      previous_odometer REAL NOT NULL,
      new_odometer REAL NOT NULL,
      reason TEXT NOT NULL,
      authorized_by_id INTEGER NOT NULL,
      authorized_by_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (authorized_by_id) REFERENCES users(id)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_requests_status ON fuel_requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_dept ON fuel_requests(department_id);
    CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
    CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(vehicle_status);
    CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
  `);
}

initSchema();

module.exports = { db, initSchema };
