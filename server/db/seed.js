const bcrypt = require('bcryptjs');
const { db, initSchema } = require('./database');

function seedDatabase() {
  initSchema();

  console.log('Seeding MoCU Fleet Management System database...');

  // Clear existing data in correct foreign key order and reset autoincrement sequence
  db.exec(`
    DELETE FROM odometer_adjustments;
    DELETE FROM notifications;
    DELETE FROM audit_logs;
    DELETE FROM maintenance_records;
    DELETE FROM trips;
    DELETE FROM fuel_issuances;
    DELETE FROM fuel_request_items;
    DELETE FROM fuel_requests;
    DELETE FROM vehicles;
    DELETE FROM drivers;
    DELETE FROM users;
    DELETE FROM fuel_suppliers;
    DELETE FROM departments;
    DELETE FROM sqlite_sequence;
  `);

  // 1. Departments
  const departments = [
    {
      code: 'VC-OFFICE',
      name: 'Office of the Vice Chancellor',
      head_name: 'Prof. Alfred S. Sife',
      annual_fuel_budget: 45000000,
      allocated_fuel_budget: 18500000,
      contact_email: 'vc@mocu.ac.tz',
      contact_phone: '+255 272751833'
    },
    {
      code: 'DVC-PFA',
      name: 'Office of DVC - Planning, Finance and Administration',
      head_name: 'Prof. John K. Safari',
      annual_fuel_budget: 38000000,
      allocated_fuel_budget: 14200000,
      contact_email: 'dvc-pfa@mocu.ac.tz',
      contact_phone: '+255 272751834'
    },
    {
      code: 'DVC-ARC',
      name: 'Office of DVC - Academic, Research and Consultancy',
      head_name: 'Prof. Faustine K. Bee',
      annual_fuel_budget: 35000000,
      allocated_fuel_budget: 12000000,
      contact_email: 'dvc-arc@mocu.ac.tz',
      contact_phone: '+255 272751835'
    },
    {
      code: 'TRANSPORT',
      name: 'Transport and Fleet Management Section',
      head_name: 'Capt. Michael Shirima',
      annual_fuel_budget: 55000000,
      allocated_fuel_budget: 24500000,
      contact_email: 'transport@mocu.ac.tz',
      contact_phone: '+255 272751840'
    },
    {
      code: 'ESTATE',
      name: 'Estates and Works Department',
      head_name: 'Dr. Prosper Mrosso',
      annual_fuel_budget: 30000000,
      allocated_fuel_budget: 11400000,
      contact_email: 'estates@mocu.ac.tz',
      contact_phone: '+255 272751842'
    },
    {
      code: 'FCCD',
      name: 'Faculty of Co-operative and Community Development',
      head_name: 'Dr. Neema Mori',
      annual_fuel_budget: 28000000,
      allocated_fuel_budget: 9800000,
      contact_email: 'fccd@mocu.ac.tz',
      contact_phone: '+255 272751845'
    },
    {
      code: 'FBIS',
      name: 'Faculty of Business and Information Sciences',
      head_name: 'Dr. Baraka Kavishe',
      annual_fuel_budget: 26000000,
      allocated_fuel_budget: 8900000,
      contact_email: 'fbis@mocu.ac.tz',
      contact_phone: '+255 272751848'
    },
    {
      code: 'DRPS',
      name: 'Directorate of Research and Postgraduate Studies',
      head_name: 'Prof. Esther Mbise',
      annual_fuel_budget: 32000000,
      allocated_fuel_budget: 13500000,
      contact_email: 'drps@mocu.ac.tz',
      contact_phone: '+255 272751850'
    },
    {
      code: 'FINANCE',
      name: 'Directorate of Finance and Accounts',
      head_name: 'CPA Daniel Kimaro',
      annual_fuel_budget: 20000000,
      allocated_fuel_budget: 6500000,
      contact_email: 'finance@mocu.ac.tz',
      contact_phone: '+255 272751852'
    },
    {
      code: 'PMU',
      name: 'Procurement Management Unit (PMU)',
      head_name: 'Ms. Beatrice Swai',
      annual_fuel_budget: 18000000,
      allocated_fuel_budget: 5200000,
      contact_email: 'pmu@mocu.ac.tz',
      contact_phone: '+255 272751855'
    }
  ];

  const insertDept = db.prepare(`
    INSERT INTO departments (code, name, head_name, annual_fuel_budget, allocated_fuel_budget, contact_email, contact_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const deptMap = {};
  for (const d of departments) {
    const res = insertDept.run(d.code, d.name, d.head_name, d.annual_fuel_budget, d.allocated_fuel_budget, d.contact_email, d.contact_phone);
    deptMap[d.code] = res.lastInsertRowid;
  }

  // 2. Users (all 8 roles represented)
  const defaultPasswordHash = bcrypt.hashSync('mocu@2026', 10);

  const users = [
    {
      name: 'Eng. Godfrey Tarimo',
      email: 'admin@mocu.ac.tz',
      role: 'admin',
      department_id: deptMap['TRANSPORT'],
      phone: '+255 754 112 233',
      designation: 'Director of ICT & Systems Administrator',
      signature_title: 'System Administrator - MoCU'
    },
    {
      name: 'Capt. Michael Shirima',
      email: 'transport@mocu.ac.tz',
      role: 'transport_officer',
      department_id: deptMap['TRANSPORT'],
      phone: '+255 754 223 344',
      designation: 'Head Transport & Fleet Logistics Officer',
      signature_title: 'Sign of Head Driver / Transport Officer'
    },
    {
      name: 'Juma Shabani Mushi',
      email: 'driver@mocu.ac.tz',
      role: 'driver',
      department_id: deptMap['TRANSPORT'],
      phone: '+255 754 334 455',
      designation: 'Senior University Chauffeur',
      signature_title: 'University Driver'
    },
    {
      name: 'Dr. Prosper Mrosso',
      email: 'hod.estate@mocu.ac.tz',
      role: 'hod',
      department_id: deptMap['ESTATE'],
      phone: '+255 754 445 566',
      designation: 'Head of Department, Estates and Works',
      signature_title: 'Sign of Head of Department/Section'
    },
    {
      name: 'Ms. Beatrice Swai',
      email: 'hpmu@mocu.ac.tz',
      role: 'approving_officer',
      department_id: deptMap['PMU'],
      phone: '+255 754 556 677',
      designation: 'Head of Procurement Management Unit (HPMU)',
      signature_title: 'Sign of HPMU / Authorizing Officer'
    },
    {
      name: 'CPA Daniel Kimaro',
      email: 'finance@mocu.ac.tz',
      role: 'finance_officer',
      department_id: deptMap['FINANCE'],
      phone: '+255 754 667 788',
      designation: 'Principal Accountant - Expenditure Control',
      signature_title: 'Finance & Vote Controller'
    },
    {
      name: 'CPA Frank Moshi',
      email: 'auditor@mocu.ac.tz',
      role: 'internal_auditor',
      department_id: deptMap['VC-OFFICE'],
      phone: '+255 754 778 899',
      designation: 'Chief Internal Auditor',
      signature_title: 'Internal Audit Oversight'
    },
    {
      name: 'Prof. Alfred S. Sife',
      email: 'vc@mocu.ac.tz',
      role: 'management',
      department_id: deptMap['VC-OFFICE'],
      phone: '+255 272751833',
      designation: 'Vice Chancellor, MoCU',
      signature_title: 'Office of the Vice Chancellor'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, department_id, phone, designation, signature_title)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const userMap = {};
  for (const u of users) {
    const res = insertUser.run(u.name, u.email, defaultPasswordHash, u.role, u.department_id, u.phone, u.designation, u.signature_title);
    userMap[u.email] = res.lastInsertRowid;
  }

  // 3. Fuel Suppliers
  const suppliers = [
    {
      supplier_name: 'Puma Energy Tanzania Ltd',
      station_name: 'Puma Service Station - Sokoine Road',
      location: '08 Sokoine Road, Moshi Urban (Near MoCU Main Campus)',
      contact_person: 'Mr. Baraka Minde',
      phone_number: '+255 27 275 4321',
      email: 'moshi.station@pumaenergy.co.tz',
      diesel_price_per_litre: 3280,
      petrol_price_per_litre: 3240,
      contract_reference: 'MOCU/T/2025/2026/G/04'
    },
    {
      supplier_name: 'TotalEnergies Marketing Tanzania',
      station_name: 'TotalEnergies Mawenzi Service Station',
      location: 'Mawenzi Road / Arusha-Himo Junction, Moshi',
      contact_person: 'Ms. Grace Massawe',
      phone_number: '+255 27 275 8890',
      email: 'mawenzi@totalenergies.co.tz',
      diesel_price_per_litre: 3290,
      petrol_price_per_litre: 3250,
      contract_reference: 'MOCU/T/2025/2026/G/05'
    },
    {
      supplier_name: 'Oryx Energies Tanzania Ltd',
      station_name: 'Oryx Boma Road Service Station',
      location: 'Boma Road, Central Business District, Moshi',
      contact_person: 'Mr. Julius Kweka',
      phone_number: '+255 27 275 1100',
      email: 'boma.moshi@oryxenergies.com',
      diesel_price_per_litre: 3275,
      petrol_price_per_litre: 3235,
      contract_reference: 'MOCU/T/2025/2026/G/06'
    },
    {
      supplier_name: 'Lake Oil Ltd',
      station_name: 'Lake Oil Kilimanjaro Highway Station',
      location: 'Kilimanjaro Highway, Maili Sita, Moshi Rural',
      contact_person: 'Mr. Salim Rashid',
      phone_number: '+255 27 275 6677',
      email: 'moshi@lakeoilgroup.com',
      diesel_price_per_litre: 3260,
      petrol_price_per_litre: 3220,
      contract_reference: 'MOCU/T/2025/2026/G/07'
    }
  ];

  const insertSupplier = db.prepare(`
    INSERT INTO fuel_suppliers (supplier_name, station_name, location, contact_person, phone_number, email, diesel_price_per_litre, petrol_price_per_litre, contract_reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const supplierIds = [];
  for (const s of suppliers) {
    const res = insertSupplier.run(s.supplier_name, s.station_name, s.location, s.contact_person, s.phone_number, s.email, s.diesel_price_per_litre, s.petrol_price_per_litre, s.contract_reference);
    supplierIds.push(res.lastInsertRowid);
  }

  // 4. Drivers
  const drivers = [
    {
      user_id: userMap['driver@mocu.ac.tz'],
      full_name: 'Juma Shabani Mushi',
      employee_number: 'MOCU/DRV/1012',
      phone_number: '+255 754 334 455',
      email: 'driver@mocu.ac.tz',
      driving_licence_number: 'DL-TZ-448210',
      licence_classes: 'A, B, C, D, E',
      licence_expiry_date: '2027-08-15',
      employment_status: 'Active',
      notes: 'Assigned to Executive Vice Chancellor Fleet. Advanced VIP defensive driving certification.'
    },
    {
      user_id: null,
      full_name: 'Emmanuel Peter Lyimo',
      employee_number: 'MOCU/DRV/1035',
      phone_number: '+255 755 889 012',
      email: 'e.lyimo@mocu.ac.tz',
      driving_licence_number: 'DL-TZ-591244',
      licence_classes: 'B, C, D, E',
      licence_expiry_date: '2026-12-14', // Expiring in ~25 days! Triggers notification alert
      employment_status: 'Active',
      notes: 'Assigned to Coaster Passenger Bus STK 6140. Heavy commercial and passenger endorsement.'
    },
    {
      user_id: null,
      full_name: 'Rashid Ally Massawe',
      employee_number: 'MOCU/DRV/1048',
      phone_number: '+255 767 123 456',
      email: 'r.massawe@mocu.ac.tz',
      driving_licence_number: 'DL-TZ-612093',
      licence_classes: 'A, B, C, D',
      licence_expiry_date: '2027-11-20',
      employment_status: 'Active',
      notes: 'Assigned to Estates and Works Hilux DFPA 2045. Excellent track record.'
    },
    {
      user_id: null,
      full_name: 'Joseph Francis Kessy',
      employee_number: 'MOCU/DRV/1071',
      phone_number: '+255 784 990 112',
      email: 'j.kessy@mocu.ac.tz',
      driving_licence_number: 'DL-TZ-739105',
      licence_classes: 'B, C, D',
      licence_expiry_date: '2028-03-10',
      employment_status: 'Active',
      notes: 'Assigned to DVC - PFA Nissan Patrol T 281 DFP.'
    },
    {
      user_id: null,
      full_name: 'Hamisi Ramadhani Mallya',
      employee_number: 'MOCU/DRV/1089',
      phone_number: '+255 713 445 678',
      email: 'h.mallya@mocu.ac.tz',
      driving_licence_number: 'DL-TZ-801243',
      licence_classes: 'B, C',
      licence_expiry_date: '2027-05-30',
      employment_status: 'Active',
      notes: 'Assigned to Faculty of Co-operative & Comm Dev Isuzu D-Max SM 5580.'
    },
    {
      user_id: null,
      full_name: 'Daudi Baraka Temu',
      employee_number: 'MOCU/DRV/1104',
      phone_number: '+255 762 901 234',
      email: 'd.temu@mocu.ac.tz',
      driving_licence_number: 'DL-TZ-910321',
      licence_classes: 'B, C, D, E',
      licence_expiry_date: '2028-09-18',
      employment_status: 'Active',
      notes: 'Assigned to Research Directorate Hardtop SM 3891. Off-road safari experience.'
    }
  ];

  const insertDriver = db.prepare(`
    INSERT INTO drivers (user_id, full_name, employee_number, phone_number, email, driving_licence_number, licence_classes, licence_expiry_date, employment_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const driverIds = [];
  for (const drv of drivers) {
    const res = insertDriver.run(drv.user_id, drv.full_name, drv.employee_number, drv.phone_number, drv.email, drv.driving_licence_number, drv.licence_classes, drv.licence_expiry_date, drv.employment_status, drv.notes);
    driverIds.push(res.lastInsertRowid);
  }

  // 5. Vehicles (Realistic MoCU fleet)
  const vehicles = [
    {
      registration_number: 'SM 4123',
      make: 'Toyota',
      model: 'Land Cruiser Prado TX-L',
      category: 'Executive / SUV',
      fuel_type: 'Diesel',
      engine_capacity: '2982 cc (1KD-FTV)',
      assigned_department_id: deptMap['VC-OFFICE'],
      assigned_driver_id: driverIds[0],
      vehicle_status: 'Active',
      current_odometer: 98450,
      initial_odometer: 45000,
      fuel_tank_capacity: 87,
      image_url: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=600&q=80',
      insurance_expiry_date: '2027-04-30',
      inspection_expiry_date: '2027-04-15',
      chassis_number: 'TRJ150-0198421',
      year_of_manufacture: 2022,
      color: 'Pearl White',
      standard_efficiency_km_l: 8.5
    },
    {
      registration_number: 'DFPA 2045',
      make: 'Toyota',
      model: 'Hilux Double Cabin 4x4',
      category: 'Operational / Pick-up',
      fuel_type: 'Diesel',
      engine_capacity: '2755 cc (1GD-FTV)',
      assigned_department_id: deptMap['ESTATE'],
      assigned_driver_id: driverIds[2],
      vehicle_status: 'Active',
      current_odometer: 142300,
      initial_odometer: 82000,
      fuel_tank_capacity: 80,
      image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
      insurance_expiry_date: '2027-03-31',
      inspection_expiry_date: '2026-12-07', // Inspection due in 18 days! Triggers inspection alert
      chassis_number: 'GUN126-0831124',
      year_of_manufacture: 2021,
      color: 'Silver Metallic',
      standard_efficiency_km_l: 9.2
    },
    {
      registration_number: 'STK 6140',
      make: 'Toyota',
      model: 'Coaster Bus (30 Seater)',
      category: 'Passenger / Bus',
      fuel_type: 'Diesel',
      engine_capacity: '4164 cc (1HZ)',
      assigned_department_id: deptMap['TRANSPORT'],
      assigned_driver_id: driverIds[1],
      vehicle_status: 'Active',
      current_odometer: 84200,
      initial_odometer: 15000,
      fuel_tank_capacity: 120,
      image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
      insurance_expiry_date: '2027-06-30',
      inspection_expiry_date: '2027-05-20',
      chassis_number: 'HZB50-0045129',
      year_of_manufacture: 2020,
      color: 'White & Navy Stripe',
      standard_efficiency_km_l: 5.5
    },
    {
      registration_number: 'T 281 DFP',
      make: 'Nissan',
      model: 'Patrol Y62 V8 5.6L',
      category: 'Executive / SUV',
      fuel_type: 'Petrol',
      engine_capacity: '5552 cc (VK56VD)',
      assigned_department_id: deptMap['DVC-PFA'],
      assigned_driver_id: driverIds[3],
      vehicle_status: 'Active',
      current_odometer: 76500,
      initial_odometer: 22000,
      fuel_tank_capacity: 100,
      image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
      insurance_expiry_date: '2027-02-28',
      inspection_expiry_date: '2027-02-15',
      chassis_number: 'Y62-0941235',
      year_of_manufacture: 2021,
      color: 'Midnight Black',
      standard_efficiency_km_l: 6.8
    },
    {
      registration_number: 'SM 5580',
      make: 'Isuzu',
      model: 'D-Max Double Cabin 4x4',
      category: 'Operational / Pick-up',
      fuel_type: 'Diesel',
      engine_capacity: '2999 cc (4JJ3-TCX)',
      assigned_department_id: deptMap['FCCD'],
      assigned_driver_id: driverIds[4],
      vehicle_status: 'Active',
      current_odometer: 112600,
      initial_odometer: 54000,
      fuel_tank_capacity: 76,
      image_url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=600&q=80',
      insurance_expiry_date: '2027-08-31',
      inspection_expiry_date: '2027-08-10',
      chassis_number: 'TFS40-771204',
      year_of_manufacture: 2022,
      color: 'Oxford Blue',
      standard_efficiency_km_l: 9.8
    },
    {
      registration_number: 'T 419 DKL',
      make: 'Toyota',
      model: 'HiAce High Roof Commuter (15 Seater)',
      category: 'Utility / Van',
      fuel_type: 'Diesel',
      engine_capacity: '2982 cc (1KD)',
      assigned_department_id: deptMap['FBIS'],
      assigned_driver_id: driverIds[1],
      vehicle_status: 'Active',
      current_odometer: 168900,
      initial_odometer: 95000,
      fuel_tank_capacity: 70,
      image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
      insurance_expiry_date: '2027-01-31',
      inspection_expiry_date: '2027-01-15',
      chassis_number: 'KDH222-008912',
      year_of_manufacture: 2019,
      color: 'Solid White',
      standard_efficiency_km_l: 8.8
    },
    {
      registration_number: 'SM 3891',
      make: 'Toyota',
      model: 'Land Cruiser 79 Double Cabin Hardtop',
      category: 'Operational / Pick-up',
      fuel_type: 'Diesel',
      engine_capacity: '4164 cc (1HZ)',
      assigned_department_id: deptMap['DRPS'],
      assigned_driver_id: driverIds[5],
      vehicle_status: 'On Trip', // Currently on field research trip to Marangu/Rombo
      current_odometer: 214100,
      initial_odometer: 140000,
      fuel_tank_capacity: 130,
      image_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
      insurance_expiry_date: '2027-09-30',
      inspection_expiry_date: '2027-09-15',
      chassis_number: 'HZJ79-021948',
      year_of_manufacture: 2018,
      color: 'Desert Sand / Beige',
      standard_efficiency_km_l: 7.0
    },
    {
      registration_number: 'DFPA 3110',
      make: 'Ford',
      model: 'Ranger XLT 3.2 4x4',
      category: 'Operational / Pick-up',
      fuel_type: 'Diesel',
      engine_capacity: '3198 cc (Duratorq)',
      assigned_department_id: deptMap['TRANSPORT'],
      assigned_driver_id: null,
      vehicle_status: 'Under Maintenance', // In garage for brake system overhaul
      current_odometer: 131250,
      initial_odometer: 60000,
      fuel_tank_capacity: 80,
      image_url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80',
      insurance_expiry_date: '2027-05-15',
      inspection_expiry_date: '2027-05-01',
      chassis_number: 'MNB29-440192',
      year_of_manufacture: 2019,
      color: 'Moondust Silver',
      standard_efficiency_km_l: 8.5
    }
  ];

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (
      registration_number, make, model, category, fuel_type, engine_capacity,
      assigned_department_id, assigned_driver_id, vehicle_status, current_odometer,
      initial_odometer, fuel_tank_capacity, image_url, insurance_expiry_date,
      inspection_expiry_date, chassis_number, year_of_manufacture, color, standard_efficiency_km_l
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const vehicleMap = {};
  for (const v of vehicles) {
    const res = insertVehicle.run(
      v.registration_number, v.make, v.model, v.category, v.fuel_type, v.engine_capacity,
      v.assigned_department_id, v.assigned_driver_id, v.vehicle_status, v.current_odometer,
      v.initial_odometer, v.fuel_tank_capacity, v.image_url, v.insurance_expiry_date,
      v.inspection_expiry_date, v.chassis_number, v.year_of_manufacture, v.color, v.standard_efficiency_km_l
    );
    vehicleMap[v.registration_number] = res.lastInsertRowid;
  }

  // Update drivers with assigned vehicle ids
  db.prepare('UPDATE drivers SET assigned_vehicle_id = ? WHERE id = ?').run(vehicleMap['SM 4123'], driverIds[0]);
  db.prepare('UPDATE drivers SET assigned_vehicle_id = ? WHERE id = ?').run(vehicleMap['STK 6140'], driverIds[1]);
  db.prepare('UPDATE drivers SET assigned_vehicle_id = ? WHERE id = ?').run(vehicleMap['DFPA 2045'], driverIds[2]);
  db.prepare('UPDATE drivers SET assigned_vehicle_id = ? WHERE id = ?').run(vehicleMap['T 281 DFP'], driverIds[3]);
  db.prepare('UPDATE drivers SET assigned_vehicle_id = ? WHERE id = ?').run(vehicleMap['SM 5580'], driverIds[4]);
  db.prepare('UPDATE drivers SET assigned_vehicle_id = ? WHERE id = ?').run(vehicleMap['SM 3891'], driverIds[5]);

  // 6. Fuel Requests
  // Request 1: The exact slip from the image! No. 3143
  const insertFuelReq = db.prepare(`
    INSERT INTO fuel_requests (
      request_number, form_serial_number, department_id, requested_by_id, requested_by_name,
      requested_by_title, vehicle_id, driver_id, destination, trip_purpose,
      expected_departure_date, expected_return_date, last_request_odometer, present_request_odometer,
      estimated_distance_km, fuel_type, requested_quantity_litres, unit_price, estimated_fuel_cost,
      status, stage, hod_recommendation, hod_recommended_by_id, hod_recommended_at, hod_comments,
      transport_verification, transport_verified_by_id, transport_verified_at, transport_comments,
      hpmu_authorization, hpmu_authorized_by_id, hpmu_authorized_at, hpmu_comments,
      finance_recorded_by_id, finance_recorded_at, finance_vote_code, finance_comments,
      created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertReqItem = db.prepare(`
    INSERT INTO fuel_request_items (fuel_request_id, serial_no, vehicle_id, vehicle_number, quantity_litres, unit_price, total_value, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Request 1: Form 3143 (Ready for HPMU approval!)
  const req1 = insertFuelReq.run(
    'MOCU-FR-2026-003143', '3143', deptMap['ESTATE'], userMap['hod.estate@mocu.ac.tz'],
    'Dr. Prosper Mrosso', 'Head of Department, Estates and Works',
    vehicleMap['DFPA 2045'], driverIds[2],
    'Hai District & Machame Campus Facilities', 'Inspection and maintenance assessment of MoCU off-campus water treatment plant and residential quarters',
    '2026-11-20 08:00:00', '2026-11-21 17:00:00',
    141750, 142300, 480, 'Diesel',
    65.0, 3280.0, 213200.0,
    'Transport_Verified', 'hpmu_review',
    'Recommended', userMap['hod.estate@mocu.ac.tz'], '2026-11-19 09:30:00', 'Official inspection trip strongly recommended for campus infrastructure maintenance.',
    'Verified', userMap['transport@mocu.ac.tz'], '2026-11-19 10:15:00', 'Vehicle DFPA 2045 inspected, tire pressures verified, driver Rashid assigned. Odometer confirmed at 142,300 KM.',
    null, null, null, null,
    null, null, null, null,
    '2026-11-19 08:30:00'
  );
  insertReqItem.run(req1.lastInsertRowid, 1, vehicleMap['DFPA 2045'], 'DFPA 2045', 65.0, 3280.0, 213200.0, 'Campus water treatment plant inspection');

  // Request 2: Completed VC Office Trip to Dodoma
  const req2 = insertFuelReq.run(
    'MOCU-FR-2026-003140', '3140', deptMap['VC-OFFICE'], userMap['vc@mocu.ac.tz'],
    'Prof. Alfred S. Sife', 'Vice Chancellor, MoCU',
    vehicleMap['SM 4123'], driverIds[0],
    'Dodoma (Ministry of Education & TCU Headquarters)', 'Attending Annual Inter-University Committee on Higher Education & Co-operative Curriculum Review',
    '2026-11-12 06:00:00', '2026-11-15 19:00:00',
    96800, 97350, 1100, 'Diesel',
    150.0, 3280.0, 492000.0,
    'Completed', 'completed',
    'Recommended', userMap['vc@mocu.ac.tz'], '2026-11-10 10:00:00', 'Statutory official university governance mission.',
    'Verified', userMap['transport@mocu.ac.tz'], '2026-11-10 11:30:00', 'Vehicle SM 4123 in excellent operational condition. Chauffeur Juma Mushi cleared.',
    'Authorized', userMap['hpmu@mocu.ac.tz'], '2026-11-10 14:00:00', 'Approved in accordance with University Travel Regulations and Vice Chancellor vote.',
    userMap['finance@mocu.ac.tz'], '2026-11-10 15:30:00', 'VOTE-MOCU-VC-TRV-2026', 'Committed under Office of VC Statutory Travel Allocation.',
    '2026-11-10 09:00:00'
  );
  insertReqItem.run(req2.lastInsertRowid, 1, vehicleMap['SM 4123'], 'SM 4123', 150.0, 3280.0, 492000.0, 'Dodoma Official Governance Trip');

  // Request 3: Active Student Academic Trip to Arusha National Park
  const req3 = insertFuelReq.run(
    'MOCU-FR-2026-003141', '3141', deptMap['TRANSPORT'], userMap['transport@mocu.ac.tz'],
    'Capt. Michael Shirima', 'Head Transport Officer',
    vehicleMap['STK 6140'], driverIds[1],
    'Arusha National Park & TCDC Usa River', 'Field study excursion for Department of Co-operative Economics undergraduate students',
    '2026-11-18 07:00:00', '2026-11-19 20:00:00',
    83850, 84200, 320, 'Diesel',
    95.0, 3280.0, 311600.0,
    'Issued', 'issuance',
    'Recommended', userMap['transport@mocu.ac.tz'], '2026-11-16 08:30:00', 'Approved academic curriculum field trip for 28 students.',
    'Verified', userMap['transport@mocu.ac.tz'], '2026-11-16 09:00:00', 'Coaster STK 6140 safety equipment and first aid box checked.',
    'Authorized', userMap['hpmu@mocu.ac.tz'], '2026-11-16 11:00:00', 'Authorized as per approved academic calendar semester budget.',
    userMap['finance@mocu.ac.tz'], '2026-11-16 14:00:00', 'VOTE-MOCU-ACAD-FL-2026', 'Academic Fieldwork budget allocation confirmed.',
    '2026-11-16 08:00:00'
  );
  insertReqItem.run(req3.lastInsertRowid, 1, vehicleMap['STK 6140'], 'STK 6140', 95.0, 3280.0, 311600.0, 'Student Academic Study Tour');

  // Request 4: Faculty of Business Rombo supervision (Pending HPMU Approval)
  const req4 = insertFuelReq.run(
    'MOCU-FR-2026-003142', '3142', deptMap['FBIS'], userMap['admin@mocu.ac.tz'],
    'Dr. Baraka Kavishe', 'Dean, Faculty of Business & Information Sciences',
    vehicleMap['T 419 DKL'], driverIds[1],
    'Rombo District (Useri, Mwika, Mkuu)', 'Field supervision of students undertaking banking and co-operative accounting internships',
    '2026-11-22 08:00:00', '2026-11-23 18:00:00',
    168400, 168900, 260, 'Diesel',
    50.0, 3280.0, 164000.0,
    'Transport_Verified', 'hpmu_review',
    'Recommended', userMap['admin@mocu.ac.tz'], '2026-11-18 11:00:00', 'Supervision schedule approved by Faculty Board.',
    'Verified', userMap['transport@mocu.ac.tz'], '2026-11-18 14:00:00', 'Vehicle T 419 DKL available and roadworthy.',
    null, null, null, null,
    null, null, null, null,
    '2026-11-18 10:00:00'
  );
  insertReqItem.run(req4.lastInsertRowid, 1, vehicleMap['T 419 DKL'], 'T 419 DKL', 50.0, 3280.0, 164000.0, 'Practical Training Field Supervision');

  // Request 5: Research Directorate Trip to Marangu (On trip now)
  const req5 = insertFuelReq.run(
    'MOCU-FR-2026-003144', '3144', deptMap['DRPS'], userMap['admin@mocu.ac.tz'],
    'Prof. Esther Mbise', 'Director, Research & Postgraduate Studies',
    vehicleMap['SM 3891'], driverIds[5],
    'Marangu, Mwika & Kilema Co-operative Societies', 'Data collection on coffee primary co-operative societies financial digitalization',
    '2026-11-19 06:30:00', '2026-11-20 18:00:00',
    213800, 214100, 280, 'Diesel',
    60.0, 3280.0, 196800.0,
    'Issued', 'issuance',
    'Recommended', userMap['admin@mocu.ac.tz'], '2026-11-17 09:00:00', 'COSTECH supported collaborative research project.',
    'Verified', userMap['transport@mocu.ac.tz'], '2026-11-17 11:30:00', 'Hardtop 4x4 assigned for mountainous terrain.',
    'Authorized', userMap['hpmu@mocu.ac.tz'], '2026-11-17 15:00:00', 'Authorized under Research Grant Fund vote.',
    userMap['finance@mocu.ac.tz'], '2026-11-17 16:30:00', 'VOTE-MOCU-RES-GRANT-2026', 'Fund allocation committed.',
    '2026-11-17 08:30:00'
  );
  insertReqItem.run(req5.lastInsertRowid, 1, vehicleMap['SM 3891'], 'SM 3891', 60.0, 3280.0, 196800.0, 'Field Data Collection');

  // Request 6: Faculty of Co-operative Siha outreach (Pending HOD Recommendation)
  const req6 = insertFuelReq.run(
    'MOCU-FR-2026-003145', '3145', deptMap['FCCD'], userMap['driver@mocu.ac.tz'],
    'Dr. Neema Mori', 'Dean, FCCD',
    vehicleMap['SM 5580'], driverIds[4],
    'Siha District (Sanya Juu & Ngarenanyuki)', 'Agricultural extension training and advisory services for dairy co-operatives',
    '2026-11-25 08:00:00', '2026-11-26 17:00:00',
    112200, 112600, 220, 'Diesel',
    45.0, 3280.0, 147600.0,
    'Submitted', 'hod_review',
    null, null, null, null,
    null, null, null, null,
    null, null, null, null,
    null, null, null, null,
    '2026-11-19 11:00:00'
  );
  insertReqItem.run(req6.lastInsertRowid, 1, vehicleMap['SM 5580'], 'SM 5580', 45.0, 3280.0, 147600.0, 'Community Outreach Training');

  // Request 7: Completed Trip with Anomaly flagged! (DVC-PFA Patrol Trip with high consumption)
  const req7 = insertFuelReq.run(
    'MOCU-FR-2026-003136', '3136', deptMap['DVC-PFA'], userMap['admin@mocu.ac.tz'],
    'Prof. John K. Safari', 'Deputy Vice Chancellor - PFA',
    vehicleMap['T 281 DFP'], driverIds[3],
    'Dar es Salaam (Treasury & Higher Education Students Loans Board)', 'Mid-year budget harmonization consultations with Ministry of Finance',
    '2026-11-04 05:30:00', '2026-11-08 21:00:00',
    75100, 75450, 1150, 'Petrol',
    210.0, 3240.0, 680400.0,
    'Completed', 'completed',
    'Recommended', userMap['admin@mocu.ac.tz'], '2026-11-02 09:00:00', 'Crucial ministry budget defense session.',
    'Verified', userMap['transport@mocu.ac.tz'], '2026-11-02 11:00:00', 'Vehicle T 281 DFP inspected and approved.',
    'Authorized', userMap['hpmu@mocu.ac.tz'], '2026-11-02 14:30:00', 'Approved in full.',
    userMap['finance@mocu.ac.tz'], '2026-11-02 16:00:00', 'VOTE-MOCU-DVC-ADM-2026', 'Committed under central administrative vote.',
    '2026-11-02 08:30:00'
  );
  insertReqItem.run(req7.lastInsertRowid, 1, vehicleMap['T 281 DFP'], 'T 281 DFP', 210.0, 3240.0, 680400.0, 'Dar es Salaam Treasury Consultations');

  // 7. Fuel Issuances (Reconciled fuel issuance records)
  const insertIssuance = db.prepare(`
    INSERT INTO fuel_issuances (
      issuance_number, fuel_request_id, vehicle_id, driver_id, supplier_id,
      fuel_station_name, fuel_type, quantity_approved, quantity_issued, quantity_variance,
      unit_price, total_cost, issuance_date, receipt_number, invoice_reference,
      recorded_by_id, recorded_by_name, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Issuance for VC Dodoma trip
  insertIssuance.run(
    'FIS-2026-0088', req2.lastInsertRowid, vehicleMap['SM 4123'], driverIds[0], supplierIds[0],
    'Puma Service Station - Sokoine Road', 'Diesel', 150.0, 150.0, 0.0,
    3280.0, 492000.0, '2026-11-11 16:45:00', 'REC-PUMA-99412', 'INV-PUMA-2026-11-042',
    userMap['transport@mocu.ac.tz'], 'Capt. Michael Shirima', 'Fueled full tank before early departure to Dodoma.'
  );

  // Issuance for Coaster student trip
  insertIssuance.run(
    'FIS-2026-0089', req3.lastInsertRowid, vehicleMap['STK 6140'], driverIds[1], supplierIds[1],
    'TotalEnergies Mawenzi Service Station', 'Diesel', 95.0, 95.0, 0.0,
    3290.0, 312550.0, '2026-11-17 15:30:00', 'REC-TOT-48192', 'INV-TOT-2026-11-081',
    userMap['transport@mocu.ac.tz'], 'Capt. Michael Shirima', 'Supplied on MoCU fleet credit card facility.'
  );

  // Issuance for Research trip SM 3891
  insertIssuance.run(
    'FIS-2026-0090', req5.lastInsertRowid, vehicleMap['SM 3891'], driverIds[5], supplierIds[0],
    'Puma Service Station - Sokoine Road', 'Diesel', 60.0, 60.0, 0.0,
    3280.0, 196800.0, '2026-11-18 17:00:00', 'REC-PUMA-99504', 'INV-PUMA-2026-11-049',
    userMap['transport@mocu.ac.tz'], 'Capt. Michael Shirima', 'Requisition voucher No. 3144 verified.'
  );

  // Issuance for Dar es Salaam DVC trip
  insertIssuance.run(
    'FIS-2026-0085', req7.lastInsertRowid, vehicleMap['T 281 DFP'], driverIds[3], supplierIds[2],
    'Oryx Boma Road Service Station', 'Petrol', 210.0, 205.0, 5.0,
    3235.0, 663175.0, '2026-11-03 16:00:00', 'REC-ORYX-11204', 'INV-ORYX-2026-11-019',
    userMap['transport@mocu.ac.tz'], 'Capt. Michael Shirima', 'Approved 210L, tank took 205L. 5L variance returned to credit voucher.'
  );

  // 8. Trips (including Distance Covered = Ending - Starting, Fuel Consumed, Fuel Remaining, and Anomaly Detection)
  const insertTrip = db.prepare(`
    INSERT INTO trips (
      trip_number, fuel_request_id, vehicle_id, driver_id, department_id,
      destination, trip_purpose, departure_datetime, return_datetime,
      starting_odometer, ending_odometer, total_distance_km,
      fuel_allocated_litres, fuel_issued_litres, fuel_consumed_litres, fuel_remaining_litres,
      fuel_efficiency_km_l, fuel_cost_per_km, status, completion_notes,
      completed_by_id, completed_at, is_anomaly, anomaly_reason, anomaly_status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Trip 1: Completed VC Dodoma trip (normal good efficiency: 8.42 KM/L)
  // Distance: 98450 - 97350 = 1100 KM
  // Fuel consumed: 130.5L (out of 150L issued), 19.5L remaining
  // KM/L: 1100 / 130.5 = 8.43 KM/L
  // Fuel Cost per KM: (130.5 * 3280) / 1100 = 389.1 TZS/KM
  insertTrip.run(
    'TRP-2026-0081', req2.lastInsertRowid, vehicleMap['SM 4123'], driverIds[0], deptMap['VC-OFFICE'],
    'Dodoma (Ministry of Education & TCU Headquarters)', 'Attending Annual Inter-University Committee on Higher Education',
    '2026-11-12 06:00:00', '2026-11-15 18:30:00',
    97350, 98450, 1100,
    150.0, 150.0, 130.5, 19.5,
    8.43, 389.13, 'Completed', 'Trip completed successfully without any mechanical incidents. Remaining fuel left in tank.',
    userMap['transport@mocu.ac.tz'], '2026-11-15 19:30:00', 0, null, 'None',
    '2026-11-11 17:00:00'
  );

  // Trip 2: Active Student Academic Trip (In Progress)
  insertTrip.run(
    'TRP-2026-0082', req3.lastInsertRowid, vehicleMap['STK 6140'], driverIds[1], deptMap['TRANSPORT'],
    'Arusha National Park & TCDC Usa River', 'Field study excursion for Department of Co-operative Economics undergraduate students',
    '2026-11-18 07:00:00', null,
    83850, null, null,
    95.0, 95.0, null, null,
    null, null, 'In Progress', null,
    null, null, 0, null, 'None',
    '2026-11-17 16:00:00'
  );

  // Trip 3: Active Field Research Trip (In Progress)
  insertTrip.run(
    'TRP-2026-0083', req5.lastInsertRowid, vehicleMap['SM 3891'], driverIds[5], deptMap['DRPS'],
    'Marangu, Mwika & Kilema Co-operative Societies', 'Data collection on coffee primary co-operative societies financial digitalization',
    '2026-11-19 06:30:00', null,
    213800, null, null,
    60.0, 60.0, null, null,
    null, null, 'In Progress', null,
    null, null, 0, null, 'None',
    '2026-11-18 17:30:00'
  );

  // Trip 4: Completed Trip with ANOMALY! (High fuel consumption flagged!)
  // Nissan Patrol Y62: 76500 - 75450 = 1050 KM
  // Fuel consumed: 245 Litres (required extra fueling en-route)
  // KM/L: 1050 / 245 = 4.29 KM/L (Expected standard: 6.8 KM/L) -> -36.9% deviation!
  // Cost per KM: (245 * 3240) / 1050 = 756.0 TZS/KM
  insertTrip.run(
    'TRP-2026-0079', req7.lastInsertRowid, vehicleMap['T 281 DFP'], driverIds[3], deptMap['DVC-PFA'],
    'Dar es Salaam (Treasury & Higher Education Students Loans Board)', 'Mid-year budget harmonization consultations with Ministry of Finance',
    '2026-11-04 05:30:00', '2026-11-08 20:30:00',
    75450, 76500, 1050,
    210.0, 205.0, 245.0, 12.0,
    4.29, 756.00, 'Completed', 'Significant traffic congestion in Chalinze/Dar corridor and heavy AC usage noted by driver. Mechanical tuning required.',
    userMap['transport@mocu.ac.tz'], '2026-11-08 21:30:00', 1, 'Abnormal fuel consumption detected: 4.29 KM/L vs baseline 6.8 KM/L (36.9% higher consumption than expected threshold).', 'Flagged',
    '2026-11-03 17:00:00'
  );

  // Trip 5: Past Completed Estates Trip
  insertTrip.run(
    'TRP-2026-0075', null, vehicleMap['DFPA 2045'], driverIds[2], deptMap['ESTATE'],
    'Mwanga & Same Sub-Centres', 'Quarterly maintenance inspection of MoCU teaching centres and staff housing',
    '2026-10-24 07:30:00', '2026-10-26 17:00:00',
    140800, 141750, 950,
    110.0, 110.0, 102.0, 8.0,
    9.31, 352.31, 'Completed', 'Routine inspection completed on schedule. Vehicle performed well.',
    userMap['transport@mocu.ac.tz'], '2026-10-26 18:00:00', 0, null, 'None',
    '2026-10-23 15:00:00'
  );

  // Trip 6: Past Completed FCCD Outreach Trip
  insertTrip.run(
    'TRP-2026-0072', null, vehicleMap['SM 5580'], driverIds[4], deptMap['FCCD'],
    'Rombo District (Useri & Keni)', 'Training co-operative leaders on governance and audit compliance',
    '2026-10-14 08:00:00', '2026-10-15 18:00:00',
    111950, 112600, 650,
    70.0, 70.0, 66.5, 3.5,
    9.77, 335.71, 'Completed', 'Leadership seminar conducted at Useri AMCOS.',
    userMap['transport@mocu.ac.tz'], '2026-10-15 19:00:00', 0, null, 'None',
    '2026-10-13 14:00:00'
  );

  // 9. Maintenance Records
  const insertMaintenance = db.prepare(`
    INSERT INTO maintenance_records (
      maintenance_number, vehicle_id, service_date, service_mileage, service_type,
      description, spare_parts_used, service_provider, cost, invoice_number,
      next_service_date, next_service_mileage, status, recorded_by_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Service 1: Ongoing maintenance for Ford Ranger DFPA 3110
  insertMaintenance.run(
    'MNT-2026-0045', vehicleMap['DFPA 3110'], '2026-11-15', 131250, 'Brake System Overhaul',
    'Comprehensive brake pad replacement, front rotors skimming, brake fluid flush, and ABS sensor calibration.',
    'Front Brake Pads OEM, Rear Brake Shoes, DOT 4 Brake Fluid 1L, Front Disc Rotors Skimming',
    'MoCU Central Mechanical Workshop', 785000, 'INV-WKSH-2026-114',
    '2027-05-15', 136250, 'In Progress', userMap['transport@mocu.ac.tz'], '2026-11-15 09:00:00'
  );

  // Service 2: Prado SM 4123 90,000 KM major service (Routine service)
  insertMaintenance.run(
    'MNT-2026-0040', vehicleMap['SM 4123'], '2026-09-20', 92000, 'Major Service',
    'Engine oil change (Synthetic 5W-30), oil filter, diesel fuel filter, engine air filter, cabin AC filter, differential fluid check, wheel alignment and balancing.',
    'Toyota Genuine 5W-30 Diesel Oil (8L), Oil Filter 90915-20003, Fuel Filter Element, Cabin Filter',
    'Toyota Tanzania Ltd - Arusha/Moshi Branch', 1420000, 'INV-TTL-2026-8941',
    '2026-12-05', 100000, 'Completed', userMap['transport@mocu.ac.tz'], '2026-09-20 16:30:00' // Next service due at 100,000 KM or Dec 5 (upcoming reminder!)
  );

  // Service 3: Hilux DFPA 2045 Routine Minor Service
  insertMaintenance.run(
    'MNT-2026-0038', vehicleMap['DFPA 2045'], '2026-08-10', 138000, 'Routine Minor Service',
    'Routine 5,000 KM service: 15W-40 oil replacement, oil filter, suspension grease nipples lubrication, coolant top-up.',
    'Total Rubia 15W-40 Diesel Oil, Genuine Oil Filter',
    'MoCU Central Mechanical Workshop', 320000, 'INV-WKSH-2026-092',
    '2026-12-20', 143000, 'Completed', userMap['transport@mocu.ac.tz'], '2026-08-10 14:00:00'
  );

  // Service 4: Coaster Bus STK 6140 Tire Replacement
  insertMaintenance.run(
    'MNT-2026-0035', vehicleMap['STK 6140'], '2026-07-05', 78000, 'Tire Replacement',
    'Replacement of all four rear dual tires with new Bridgestone heavy duty commercial tires, high-speed wheel balancing.',
    '4x Bridgestone R249 7.00R16 Radial Highway Tires, 4x Heavy Duty Tubes & Flaps',
    'Kilimanjaro Tire Centre Ltd, Moshi', 2850000, 'INV-KTC-2026-402',
    '2027-01-10', 88000, 'Completed', userMap['transport@mocu.ac.tz'], '2026-07-05 17:00:00'
  );

  // 10. Notifications & Alerts
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, type, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run(
    null, 'approving_officer', 'Requisition Awaiting HPMU Authorization',
    'Requisition No. 3143 for vehicle DFPA 2045 (Estates & Works - 65L Diesel) has been verified by Transport and awaits your authorization.',
    'warning', '/fuel-requests', '2026-11-19 10:16:00'
  );

  insertNotification.run(
    null, 'transport_officer', 'Abnormal Fuel Consumption Flagged',
    'Trip TRP-2026-0079 (Nissan Patrol T 281 DFP) recorded 4.29 KM/L against standard 6.8 KM/L (36.9% deviation). Technical audit recommended.',
    'danger', '/fuel-consumption', '2026-11-08 21:35:00'
  );

  insertNotification.run(
    null, 'transport_officer', 'Driver Driving Licence Expiry Alert',
    'Driver Emmanuel Peter Lyimo (MOCU/DRV/1035) driving licence DL-TZ-591244 expires on 2026-12-14 (in 25 days). Renewal notice required.',
    'warning', '/drivers', '2026-11-18 08:00:00'
  );

  insertNotification.run(
    null, 'transport_officer', 'Vehicle Mandatory Inspection Due',
    'Vehicle DFPA 2045 (Toyota Hilux) statutory government inspection expires on 2026-12-07 (in 18 days). Schedule inspection with LATRA / Police.',
    'warning', '/vehicles', '2026-11-19 08:00:00'
  );

  insertNotification.run(
    null, 'transport_officer', 'Vehicle Scheduled Maintenance Due',
    'Vehicle SM 4123 (Toyota Land Cruiser Prado) is at 98,450 KM and next 100,000 KM major service is scheduled for 2026-12-05.',
    'info', '/maintenance', '2026-11-19 09:00:00'
  );

  insertNotification.run(
    null, 'hod', 'New Fuel Request Submitted',
    'Requisition No. 3145 submitted for Faculty of Co-operative outreach trip to Siha District.',
    'info', '/fuel-requests', '2026-11-19 11:05:00'
  );

  // 11. Comprehensive Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, module, record_id, old_values, new_values, reason, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(
    userMap['admin@mocu.ac.tz'], 'Eng. Godfrey Tarimo', 'admin', 'SYSTEM_INITIALIZATION', 'System',
    'SYS-INIT', null, 'MoCU Fleet System v2.0 Initialized with institutional parameters',
    'System deployment and configuration', '192.168.10.15', '2026-11-01 08:00:00'
  );

  insertAudit.run(
    userMap['hod.estate@mocu.ac.tz'], 'Dr. Prosper Mrosso', 'hod', 'CREATE', 'Fuel Requests',
    'MOCU-FR-2026-003143', null, JSON.stringify({ form_serial: '3143', vehicle: 'DFPA 2045', litres: 65, purpose: 'Water facility inspection' }),
    'Initial paper requisition slip digitized', '192.168.10.42', '2026-11-19 08:30:00'
  );

  insertAudit.run(
    userMap['hod.estate@mocu.ac.tz'], 'Dr. Prosper Mrosso', 'hod', 'APPROVE', 'Fuel Requests',
    'MOCU-FR-2026-003143', JSON.stringify({ status: 'Submitted' }), JSON.stringify({ status: 'HOD_Recommended' }),
    'Recommended by Head of Department', '192.168.10.42', '2026-11-19 09:30:00'
  );

  insertAudit.run(
    userMap['transport@mocu.ac.tz'], 'Capt. Michael Shirima', 'transport_officer', 'VERIFY', 'Fuel Requests',
    'MOCU-FR-2026-003143', JSON.stringify({ status: 'HOD_Recommended' }), JSON.stringify({ status: 'Transport_Verified' }),
    'Verified vehicle roadworthiness, tire pressure, and assigned driver', '192.168.10.28', '2026-11-19 10:15:00'
  );

  insertAudit.run(
    userMap['transport@mocu.ac.tz'], 'Capt. Michael Shirima', 'transport_officer', 'ANOMALY_FLAG', 'Trips',
    'TRP-2026-0079', JSON.stringify({ status: 'In Progress' }), JSON.stringify({ status: 'Completed', is_anomaly: 1, km_l: 4.29 }),
    'Excessive fuel consumption flagged on Nissan Patrol Dar trip', '192.168.10.28', '2026-11-08 21:30:00'
  );

  console.log('MoCU Fleet Database successfully seeded!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
