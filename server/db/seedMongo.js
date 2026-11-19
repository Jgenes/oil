const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  User,
  Department,
  Vehicle,
  Driver,
  FuelSupplier,
  FuelRequest,
  FuelIssuance,
  Trip,
  MaintenanceRecord,
  AuditLog,
  Notification,
  OdometerAdjustment
} = require('../models');

async function seedMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mocu_fleet';
  console.log(`[MongoDB Seeder] Connecting to ${uri.replace(/:[^:]*@/, ':****@')}...`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('[MongoDB Seeder] Connected to MongoDB successfully.');

    // Clear existing collections
    await User.deleteMany({});
    await Department.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await FuelSupplier.deleteMany({});
    await FuelRequest.deleteMany({});
    await FuelIssuance.deleteMany({});
    await Trip.deleteMany({});
    await MaintenanceRecord.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    await OdometerAdjustment.deleteMany({});

    console.log('[MongoDB Seeder] Cleared existing collections.');

    // 1. Users
    const defaultPassword = await bcrypt.hash('mocu@2026', 10);
    const users = await User.insertMany([
      {
        username: 'admin',
        email: 'admin@mocu.ac.tz',
        password_hash: defaultPassword,
        full_name: 'Eng. Godfrey Tarimo',
        role: 'admin',
        department: 'ICT & Systems Directorate',
        phone: '+255 754 112 233',
        signature_title: 'Chief ICT Systems Administrator'
      },
      {
        username: 'transport',
        email: 'transport@mocu.ac.tz',
        password_hash: defaultPassword,
        full_name: 'Capt. Michael Shirima',
        role: 'transport_officer',
        department: 'Transport Section',
        phone: '+255 784 990 011',
        signature_title: 'Head Transport & Fleet Logistics Officer'
      },
      {
        username: 'hod_estate',
        email: 'hod.estate@mocu.ac.tz',
        password_hash: defaultPassword,
        full_name: 'Dr. Prosper Mrosso',
        role: 'hod',
        department: 'Estates & Works Department',
        phone: '+255 713 445 566',
        signature_title: 'Head of Department, Estates & Works'
      },
      {
        username: 'approver_hpmu',
        email: 'hpmu@mocu.ac.tz',
        password_hash: defaultPassword,
        full_name: 'Ms. Beatrice Swai',
        role: 'approver_hpmu',
        department: 'Procurement Management Unit (HPMU)',
        phone: '+255 768 776 655',
        signature_title: 'Head of Procurement Management Unit (HPMU)'
      },
      {
        username: 'finance',
        email: 'finance@mocu.ac.tz',
        password_hash: defaultPassword,
        full_name: 'CPA Daniel Kimaro',
        role: 'finance_officer',
        department: 'Finance & Accounts Directorate',
        phone: '+255 755 332 211',
        signature_title: 'Principal University Accountant'
      },
      {
        username: 'driver1',
        email: 'driver@mocu.ac.tz',
        password_hash: defaultPassword,
        full_name: 'Juma Shabani Mushi',
        role: 'driver',
        department: 'Transport Section',
        phone: '+255 712 889 900',
        signature_title: 'Senior University Chauffeur'
      },
      {
        username: 'auditor',
        email: 'auditor@mocu.ac.tz',
        password_hash: defaultPassword,
        full_name: 'CPA Frank Moshi',
        role: 'auditor',
        department: 'Internal Audit Directorate',
        phone: '+255 789 223 344',
        signature_title: 'Chief Internal Auditor'
      },
      {
        username: 'management',
        email: 'vc@mocu.ac.tz',
        password_hash: defaultPassword,
        full_name: 'Prof. Alfred S. Sife',
        role: 'management',
        department: 'Office of the Vice Chancellor',
        phone: '+255 754 000 001',
        signature_title: 'Vice Chancellor, MoCU'
      }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${users.length} users.`);

    // 2. Departments
    const departments = await Department.insertMany([
      { code: 'EST', name: 'Estates & Works Department', hod_name: 'Dr. Prosper Mrosso', hod_email: 'hod.estate@mocu.ac.tz', budget_allocated: 45000000, budget_spent: 12450000, description: 'Campus physical infrastructure, grounds and utilities maintenance' },
      { code: 'VC', name: 'Office of the Vice Chancellor', hod_name: 'Prof. Alfred S. Sife', hod_email: 'vc@mocu.ac.tz', budget_allocated: 60000000, budget_spent: 21800000, description: 'Institutional executive governance, protocol and external relations' },
      { code: 'TRP', name: 'Transport Section', hod_name: 'Capt. Michael Shirima', hod_email: 'transport@mocu.ac.tz', budget_allocated: 80000000, budget_spent: 34500000, description: 'Central vehicle fleet pool, maintenance and chauffeur logistics' },
      { code: 'FCCD', name: 'Faculty of Co-operative & Community Dev.', hod_name: 'Dr. Neema Mori', hod_email: 'fccd@mocu.ac.tz', budget_allocated: 35000000, budget_spent: 8700000, description: 'Academic outreach, rural co-operative research and field study' },
      { code: 'FBIS', name: 'Faculty of Business & Information Sciences', hod_name: 'Dr. Emmanuel Chao', hod_email: 'fbis@mocu.ac.tz', budget_allocated: 35000000, budget_spent: 6900000, description: 'Business management, accounting, procurement and IT studies' },
      { code: 'DRPS', name: 'Directorate of Research & Postgraduate Studies', hod_name: 'Prof. John Safari', hod_email: 'drps@mocu.ac.tz', budget_allocated: 40000000, budget_spent: 14200000, description: 'National and international research dissemination projects' },
      { code: 'FIN', name: 'Finance & Accounts Directorate', hod_name: 'CPA Daniel Kimaro', hod_email: 'finance@mocu.ac.tz', budget_allocated: 25000000, budget_spent: 5300000, description: 'Institutional revenue collection, payroll and disbursements' },
      { code: 'HPMU', name: 'Procurement Management Unit', hod_name: 'Ms. Beatrice Swai', hod_email: 'hpmu@mocu.ac.tz', budget_allocated: 20000000, budget_spent: 4100000, description: 'Tendering, supply contracts, goods inspection and inventory' },
      { code: 'DOS', name: 'Dean of Students Directorate', hod_name: 'Rev. Fr. Method Kilasara', hod_email: 'dos@mocu.ac.tz', budget_allocated: 30000000, budget_spent: 7800000, description: 'Student welfare, hostel accommodation and sports delegations' },
      { code: 'ICT', name: 'ICT & Systems Directorate', hod_name: 'Eng. Godfrey Tarimo', hod_email: 'ict@mocu.ac.tz', budget_allocated: 22000000, budget_spent: 3900000, description: 'Campus network backbone, ERP systems and hardware maintenance' }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${departments.length} departments.`);

    // 3. Vehicles
    const vehicles = await Vehicle.insertMany([
      { registration_number: 'DFPA 2045', make: 'Toyota', model: 'Hilux Double Cabin 4WD', year: 2021, category: 'Operational / Pick-up', engine_capacity: '2.8L GD-6 Turbo Diesel', fuel_type: 'Diesel', tank_capacity_litres: 80, baseline_consumption_kml: 8.5, assigned_department: 'Estates & Works Department', assigned_driver: 'Juma Shabani Mushi', current_odometer: 64820, status: 'Active', insurance_expiry: '2027-04-15', inspection_expiry: '2027-05-30', last_service_date: '2026-09-10', last_service_odometer: 60000 },
      { registration_number: 'SM 4123', make: 'Toyota', model: 'Land Cruiser Prado V6', year: 2022, category: 'Executive / SUV', engine_capacity: '4.0L V6 Petrol', fuel_type: 'Petrol', tank_capacity_litres: 87, baseline_consumption_kml: 6.8, assigned_department: 'Office of the Vice Chancellor', assigned_driver: 'David Julius Macha', current_odometer: 48950, status: 'Active', insurance_expiry: '2027-08-10', inspection_expiry: '2027-09-01', last_service_date: '2026-10-05', last_service_odometer: 45000 },
      { registration_number: 'STK 6140', make: 'Isuzu', model: 'NQR 75L 38-Passenger Bus', year: 2020, category: 'Passenger / Bus', engine_capacity: '5.2L 4HK1 Diesel', fuel_type: 'Diesel', tank_capacity_litres: 140, baseline_consumption_kml: 4.8, assigned_department: 'Transport Section', assigned_driver: 'Salim Athumani Mvungi', current_odometer: 112400, status: 'Active', insurance_expiry: '2027-03-01', inspection_expiry: '2027-03-25', last_service_date: '2026-08-20', last_service_odometer: 110000 },
      { registration_number: 'T 281 DFP', make: 'Nissan', model: 'Patrol Y61 Station Wagon', year: 2019, category: 'Executive / SUV', engine_capacity: '4.8L TB48DE Petrol', fuel_type: 'Petrol', tank_capacity_litres: 95, baseline_consumption_kml: 6.2, assigned_department: 'Directorate of Research & Postgraduate Studies', assigned_driver: 'Emmanuel Peter Lyimo', current_odometer: 98450, status: 'Active', insurance_expiry: '2027-01-20', inspection_expiry: '2027-02-15', last_service_date: '2026-07-14', last_service_odometer: 95000 },
      { registration_number: 'SM 5580', make: 'Toyota', model: 'HiAce Commuter Van (16 Seater)', year: 2021, category: 'Utility / Van', engine_capacity: '3.0L 1KD-FTV Diesel', fuel_type: 'Diesel', tank_capacity_litres: 70, baseline_consumption_kml: 9.2, assigned_department: 'Transport Section', assigned_driver: 'Godfrey Lucas Temu', current_odometer: 75200, status: 'On Trip', insurance_expiry: '2027-06-18', inspection_expiry: '2027-07-01', last_service_date: '2026-09-28', last_service_odometer: 70000 },
      { registration_number: 'T 419 DKL', make: 'Ford', model: 'Ranger Double Cab XLT', year: 2020, category: 'Operational / Pick-up', engine_capacity: '2.2L TDCi Diesel', fuel_type: 'Diesel', tank_capacity_litres: 80, baseline_consumption_kml: 8.8, assigned_department: 'Dean of Students Directorate', assigned_driver: 'Kelvin Richard Mwangi', current_odometer: 82340, status: 'Active', insurance_expiry: '2027-05-12', inspection_expiry: '2027-06-10', last_service_date: '2026-08-05', last_service_odometer: 80000 },
      { registration_number: 'SM 3891', make: 'Toyota', model: 'Coaster 30-Passenger Minibus', year: 2018, category: 'Passenger / Bus', engine_capacity: '4.2L 1HZ Diesel', fuel_type: 'Diesel', tank_capacity_litres: 95, baseline_consumption_kml: 5.5, assigned_department: 'Transport Section', assigned_driver: 'Hassan Rajabu Mbaga', current_odometer: 146100, status: 'Maintenance', insurance_expiry: '2026-12-15', inspection_expiry: '2026-12-30', last_service_date: '2026-11-02', last_service_odometer: 145000 },
      { registration_number: 'DFPA 3110', make: 'Toyota', model: 'Land Cruiser Hardtop HZJ76', year: 2023, category: 'Executive / SUV', engine_capacity: '4.2L 1HZ Diesel', fuel_type: 'Diesel', tank_capacity_litres: 130, baseline_consumption_kml: 7.8, assigned_department: 'Office of the Vice Chancellor', assigned_driver: 'Baraka Joseph Kiwelu', current_odometer: 32150, status: 'Active', insurance_expiry: '2027-11-05', inspection_expiry: '2027-11-20', last_service_date: '2026-10-18', last_service_odometer: 30000 }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${vehicles.length} vehicles.`);

    // 4. Drivers
    const drivers = await Driver.insertMany([
      { employee_number: 'MOCU/DRV/1012', full_name: 'Juma Shabani Mushi', email: 'driver@mocu.ac.tz', phone: '+255 712 889 900', licence_number: 'TZ-DL-08992144', licence_classes: 'A, B, C, D, E', licence_expiry: '2028-06-30', status: 'Active', assigned_vehicle_reg: 'DFPA 2045', total_trips: 42, total_km_driven: 18450, avg_kml: 8.6 },
      { employee_number: 'MOCU/DRV/1015', full_name: 'David Julius Macha', email: 'd.macha@mocu.ac.tz', phone: '+255 754 881 223', licence_number: 'TZ-DL-04421980', licence_classes: 'A, B, C, D', licence_expiry: '2027-11-14', status: 'Active', assigned_vehicle_reg: 'SM 4123', total_trips: 38, total_km_driven: 16200, avg_kml: 6.9 },
      { employee_number: 'MOCU/DRV/1008', full_name: 'Salim Athumani Mvungi', email: 's.mvungi@mocu.ac.tz', phone: '+255 784 330 112', licence_number: 'TZ-DL-09923811', licence_classes: 'B, C, D, E (PSV)', licence_expiry: '2029-01-20', status: 'Active', assigned_vehicle_reg: 'STK 6140', total_trips: 56, total_km_driven: 28900, avg_kml: 4.9 },
      { employee_number: 'MOCU/DRV/1019', full_name: 'Emmanuel Peter Lyimo', email: 'e.lyimo@mocu.ac.tz', phone: '+255 713 554 433', licence_number: 'TZ-DL-07712398', licence_classes: 'A, B, C, D', licence_expiry: '2026-12-14', status: 'Active', assigned_vehicle_reg: 'T 281 DFP', total_trips: 29, total_km_driven: 12800, avg_kml: 6.1 },
      { employee_number: 'MOCU/DRV/1021', full_name: 'Godfrey Lucas Temu', email: 'g.temu@mocu.ac.tz', phone: '+255 767 119 922', licence_number: 'TZ-DL-05511099', licence_classes: 'A, B, C, D, E', licence_expiry: '2028-09-08', status: 'Active', assigned_vehicle_reg: 'SM 5580', total_trips: 34, total_km_driven: 15400, avg_kml: 9.1 },
      { employee_number: 'MOCU/DRV/1024', full_name: 'Kelvin Richard Mwangi', email: 'k.mwangi@mocu.ac.tz', phone: '+255 789 667 788', licence_number: 'TZ-DL-08833112', licence_classes: 'B, C, D', licence_expiry: '2027-08-25', status: 'Active', assigned_vehicle_reg: 'T 419 DKL', total_trips: 22, total_km_driven: 9800, avg_kml: 8.7 },
      { employee_number: 'MOCU/DRV/1005', full_name: 'Hassan Rajabu Mbaga', email: 'h.mbaga@mocu.ac.tz', phone: '+255 756 221 144', licence_number: 'TZ-DL-03388712', licence_classes: 'B, C, D, E (PSV)', licence_expiry: '2028-04-12', status: 'Active', assigned_vehicle_reg: 'SM 3891', total_trips: 61, total_km_driven: 33400, avg_kml: 5.6 },
      { employee_number: 'MOCU/DRV/1028', full_name: 'Baraka Joseph Kiwelu', email: 'b.kiwelu@mocu.ac.tz', phone: '+255 715 443 322', licence_number: 'TZ-DL-06655431', licence_classes: 'A, B, C, D', licence_expiry: '2029-03-10', status: 'Active', assigned_vehicle_reg: 'DFPA 3110', total_trips: 18, total_km_driven: 7900, avg_kml: 7.9 }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${drivers.length} drivers.`);

    // 5. Fuel Suppliers
    const suppliers = await FuelSupplier.insertMany([
      { name: 'Puma Energy Sokoine Road', contact_person: 'Amina Shabani', phone: '+255 27 275 4321', email: 'sokoine.moshi@pumaenergy.com', address: 'Plot 44, Sokoine Road, Moshi Urban', station_type: 'Contracted Station (Direct Account)', diesel_price_per_litre: 3280, petrol_price_per_litre: 3240, contract_status: 'Active', notes: 'Primary supplier for university pool fleet with monthly credit invoicing facility' },
      { name: 'TotalEnergies Mawenzi Service Station', contact_person: 'Rashid Khalfan', phone: '+255 27 275 8899', email: 'mawenzi@totalenergies.co.tz', address: 'Mawenzi Road Junction, Moshi', station_type: 'Contracted Station', diesel_price_per_litre: 3290, petrol_price_per_litre: 3250, contract_status: 'Active', notes: 'Secondary supplier for emergency refueling and executive fleet' },
      { name: 'Oryx Energies Boma Road', contact_person: 'Flora Mrema', phone: '+255 27 275 1122', email: 'boma.moshi@oryxenergies.com', address: 'Boma Road, Moshi CBD', station_type: 'Contracted Station', diesel_price_per_litre: 3275, petrol_price_per_litre: 3235, contract_status: 'Active', notes: 'Authorized station for diesel passenger buses and heavy fleet' },
      { name: 'Lake Oil Kilimanjaro Highway', contact_person: 'Hussein Nassor', phone: '+255 27 275 7766', email: 'klm.highway@lakeoilgroup.com', address: 'Moshi - Arusha Highway, Mailisita', station_type: 'Approved Transit Station', diesel_price_per_litre: 3270, petrol_price_per_litre: 3230, contract_status: 'Active', notes: 'Designated transit refueling station for long-distance Arusha/Babati trips' }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${suppliers.length} fuel suppliers.`);

    // 6. Fuel Requests (including authentic Slip #3143)
    const fuelRequests = await FuelRequest.insertMany([
      {
        requisition_no: 'MOCU-FR-2026-003143',
        slip_no: 3143,
        vehicle_registration: 'DFPA 2045',
        vehicle_model: 'Toyota Hilux Double Cabin 4WD',
        department: 'Estates & Works Department',
        requisition_officer_name: 'Dr. Prosper Mrosso',
        date_requested: '2026-11-16',
        fuel_type: 'Diesel',
        litres_requested: 65,
        current_odometer: 64820,
        last_request_odometer: 64270,
        purpose_of_journey: 'Supervision and technical inspection of Mweka water intake gravity pipeline and campus water treatment plant',
        destination: 'Mweka Water Intake Station & Kibosho Campus, Moshi Rural',
        driver_name: 'Juma Shabani Mushi',
        status: 'issued',
        unit_price_estimate: 3280,
        total_estimated_cost: 213200,
        hod_reviewed_by: 'Dr. Prosper Mrosso',
        hod_review_date: '2026-11-16 08:45:00',
        hod_comments: 'Trip confirmed essential for emergency pipeline restoration. Recommended for full approval.',
        transport_verified_by: 'Capt. Michael Shirima',
        transport_verify_date: '2026-11-16 09:15:00',
        transport_comments: 'Vehicle DFPA 2045 inspected; tires, oil pressure and roadworthiness verified. Odometer confirmed at 64,820 KM.',
        transport_verified_odometer: 64820,
        hpmu_authorized_by: 'Ms. Beatrice Swai',
        hpmu_authorize_date: '2026-11-16 10:00:00',
        hpmu_declaration: 'I authorize the above mentioned fuel to be supplied',
        hpmu_litres_authorized: 65,
        hpmu_comments: 'Requisition verified against transport tariff. 65 Litres Diesel authorized under Vote Code VOTE-EST-WAT-2026.',
        finance_allocated_by: 'CPA Daniel Kimaro',
        finance_allocation_date: '2026-11-16 10:30:00',
        finance_vote_code: 'VOTE-EST-WAT-2026',
        finance_amount_allocated: 213200
      },
      {
        requisition_no: 'MOCU-FR-2026-003144',
        slip_no: 3144,
        vehicle_registration: 'SM 4123',
        vehicle_model: 'Toyota Land Cruiser Prado V6',
        department: 'Office of the Vice Chancellor',
        requisition_officer_name: 'Prof. Alfred S. Sife',
        date_requested: '2026-11-17',
        fuel_type: 'Petrol',
        litres_requested: 80,
        current_odometer: 48950,
        last_request_odometer: 48400,
        purpose_of_journey: 'Official delegation travel to Inter-University Council of East Africa (IUCEA) Regional Consultative Assembly',
        destination: 'Arusha International Conference Centre (AICC), Arusha',
        driver_name: 'David Julius Macha',
        status: 'hpmu_authorized',
        unit_price_estimate: 3240,
        total_estimated_cost: 259200,
        hod_reviewed_by: 'Prof. Alfred S. Sife',
        hod_review_date: '2026-11-17 08:30:00',
        hod_comments: 'High-priority statutory engagement.',
        transport_verified_by: 'Capt. Michael Shirima',
        transport_verify_date: '2026-11-17 09:00:00',
        transport_comments: 'Vehicle SM 4123 in immaculate condition.',
        transport_verified_odometer: 48950,
        hpmu_authorized_by: 'Ms. Beatrice Swai',
        hpmu_authorize_date: '2026-11-17 09:40:00',
        hpmu_declaration: 'I authorize the above mentioned fuel to be supplied',
        hpmu_litres_authorized: 80,
        hpmu_comments: 'Authorized for executive representation.'
      },
      {
        requisition_no: 'MOCU-FR-2026-003145',
        slip_no: 3145,
        vehicle_registration: 'STK 6140',
        vehicle_model: 'Isuzu NQR 75L 38-Passenger Bus',
        department: 'Faculty of Co-operative & Community Dev.',
        requisition_officer_name: 'Dr. Neema Mori',
        date_requested: '2026-11-18',
        fuel_type: 'Diesel',
        litres_requested: 120,
        current_odometer: 112400,
        last_request_odometer: 111820,
        purpose_of_journey: 'Transporting 35 third-year co-operative management students for practical field assessment at Rombo SACCOS Union',
        destination: 'Rombo District SACCOS Headquarters, Mwika, Rombo',
        driver_name: 'Salim Athumani Mvungi',
        status: 'transport_verified',
        unit_price_estimate: 3280,
        total_estimated_cost: 393600,
        hod_reviewed_by: 'Dr. Neema Mori',
        hod_review_date: '2026-11-18 09:10:00',
        hod_comments: 'Approved under field practical training curriculum vote.',
        transport_verified_by: 'Capt. Michael Shirima',
        transport_verify_date: '2026-11-18 10:15:00',
        transport_comments: 'Bus STK 6140 checked. Brake systems and emergency exits verified.',
        transport_verified_odometer: 112400
      },
      {
        requisition_no: 'MOCU-FR-2026-003146',
        slip_no: 3146,
        vehicle_registration: 'T 281 DFP',
        vehicle_model: 'Nissan Patrol Y61 Station Wagon',
        department: 'Directorate of Research & Postgraduate Studies',
        requisition_officer_name: 'Prof. John Safari',
        date_requested: '2026-11-19',
        fuel_type: 'Petrol',
        litres_requested: 90,
        current_odometer: 98450,
        last_request_odometer: 97890,
        purpose_of_journey: 'Coffee Smallholder Value-Chain Research survey and cooperative leadership interviews across Hai district',
        destination: 'Machame, Roo and Kibongoto cooperative societies, Hai District',
        driver_name: 'Emmanuel Peter Lyimo',
        status: 'submitted',
        unit_price_estimate: 3240,
        total_estimated_cost: 291600
      }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${fuelRequests.length} fuel requests.`);

    // 7. Fuel Issuance (for Slip 3143)
    const issuances = await FuelIssuance.insertMany([
      {
        fuel_request_id: fuelRequests[0]._id,
        requisition_no: 'MOCU-FR-2026-003143',
        slip_no: 3143,
        vehicle_registration: 'DFPA 2045',
        driver_name: 'Juma Shabani Mushi',
        supplier_name: 'Puma Energy Sokoine Road',
        station_location: 'Plot 44, Sokoine Road, Moshi Urban',
        fuel_type: 'Diesel',
        approved_litres: 65,
        issued_litres: 65,
        unit_price: 3280,
        total_cost: 213200,
        quantity_variance: 0,
        variance_reason: 'Dispensed exact approved volume.',
        odometer_at_issuance: 64820,
        invoice_receipt_no: 'PUMA-MSH-2026-88190',
        issued_by: 'Capt. Michael Shirima',
        issuance_date: '2026-11-16 11:15:00',
        remarks: 'Direct electronic card dispensing. Tank topped up.'
      }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${issuances.length} fuel issuances.`);

    // 8. Trips
    const trips = await Trip.insertMany([
      {
        trip_number: 'TRP-2026-0077',
        fuel_request_id: fuelRequests[0]._id,
        fuel_issuance_id: issuances[0]._id,
        vehicle_registration: 'DFPA 2045',
        driver_name: 'Juma Shabani Mushi',
        department: 'Estates & Works Department',
        destination: 'Mweka Water Intake Station & Kibosho Campus, Moshi Rural',
        purpose: 'Supervision and technical inspection of Mweka water intake gravity pipeline and campus water treatment plant',
        start_date: '2026-11-16 11:30:00',
        start_odometer: 64820,
        end_date: '2026-11-16 17:45:00',
        end_odometer: 65365,
        distance_covered_km: 545,
        fuel_allocated_litres: 65,
        fuel_issued_litres: 65,
        fuel_consumed_litres: 62,
        fuel_remaining_litres: 3,
        calculated_kml: 8.79,
        baseline_kml: 8.5,
        cost_per_km: 373.1,
        total_trip_cost: 203360,
        status: 'Completed',
        is_anomaly: false,
        anomaly_severity: 'None',
        anomaly_status: 'None',
        driver_remarks: 'Pipeline inspection completed successfully. Moderate dirt roads in Mweka.'
      },
      {
        trip_number: 'TRP-2026-0078',
        vehicle_registration: 'SM 5580',
        driver_name: 'Godfrey Lucas Temu',
        department: 'Transport Section',
        destination: 'Moshi CBD to Kilimanjaro International Airport (KIA) return shuttle',
        purpose: 'Shuttle delegation of visiting external academic examiners from KIA airport to MoCU Main Campus',
        start_date: '2026-11-18 14:00:00',
        start_odometer: 75200,
        fuel_allocated_litres: 50,
        fuel_issued_litres: 50,
        baseline_kml: 9.2,
        status: 'In Progress'
      },
      {
        trip_number: 'TRP-2026-0079',
        vehicle_registration: 'T 281 DFP',
        driver_name: 'Emmanuel Peter Lyimo',
        department: 'Directorate of Research & Postgraduate Studies',
        destination: 'Moshi - Same - Mwanga - Moshi',
        purpose: 'Field monitoring of dryland irrigation research plots',
        start_date: '2026-11-14 07:00:00',
        start_odometer: 97890,
        end_date: '2026-11-14 18:30:00',
        end_odometer: 98190,
        distance_covered_km: 300,
        fuel_allocated_litres: 70,
        fuel_issued_litres: 70,
        fuel_consumed_litres: 70,
        fuel_remaining_litres: 0,
        calculated_kml: 4.29,
        baseline_kml: 6.8,
        cost_per_km: 756.0,
        total_trip_cost: 226800,
        status: 'Completed',
        is_anomaly: true,
        anomaly_severity: 'Severe',
        anomaly_reason: 'Actual fuel efficiency (4.29 KM/L) is 36.9% below vehicle baseline (6.80 KM/L). Possible fuel siphon, mechanical injector leakage, or extreme terrain resistance.',
        anomaly_status: 'Flagged',
        driver_remarks: 'Heavy mud and rough terrain encountered in Mwanga rural lowlands.'
      }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${trips.length} trips.`);

    // 9. Maintenance Records
    const maintenance = await MaintenanceRecord.insertMany([
      {
        vehicle_registration: 'SM 3891',
        service_type: 'Major Scheduled Service (145,000 KM)',
        service_date: '2026-11-02',
        odometer_at_service: 145000,
        garage_supplier: 'MoCU Central Mechanical Workshop',
        description_of_work: 'Complete engine oil flush, replacement of fuel and oil filters, front brake pad replacement, and steering linkage greasing.',
        spare_parts_replaced: 'Toyota 1HZ Oil Filter, Fuel Filter, Genuine Front Brake Pad Set',
        parts_cost: 380000,
        labor_cost: 150000,
        total_cost: 530000,
        invoice_number: 'MOCU-MNT-2026-0091',
        next_service_odometer: 155000,
        next_service_date: '2027-02-02',
        service_status: 'In Progress',
        approved_by: 'Capt. Michael Shirima'
      }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${maintenance.length} maintenance records.`);

    // 10. Notifications
    const notifications = await Notification.insertMany([
      {
        user_role: 'approver_hpmu',
        title: 'New Requisition Pending Authorization',
        message: 'Requisition MOCU-FR-2026-003144 for SM 4123 (80L Petrol) is verified and awaiting your authorization.',
        link: '/fuel-requests',
        is_read: false
      },
      {
        user_role: 'transport_officer',
        title: 'Fuel Anomaly Flagged on Trip TRP-2026-0079',
        message: 'Vehicle T 281 DFP recorded abnormal efficiency (4.29 KM/L vs baseline 6.80 KM/L). Review required.',
        link: '/fuel-consumption',
        is_read: false
      }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${notifications.length} notifications.`);

    // 11. Audit Log
    const audit = await AuditLog.insertMany([
      {
        username: 'admin',
        user_role: 'admin',
        action: 'SYSTEM_INITIALIZATION',
        module: 'System Core',
        record_id: 'SYSTEM',
        description: 'MoCU Fleet Fuel and Vehicle Management System seeded on MongoDB database.',
        ip_address: '127.0.0.1'
      },
      {
        username: 'hpmu',
        user_role: 'approver_hpmu',
        action: 'APPROVE',
        module: 'Fuel Requests',
        record_id: 'MOCU-FR-2026-003143',
        description: 'HPMU authorized 65 Litres Diesel for DFPA 2045 (Slip No. 3143) with declaration "I authorize the above mentioned fuel to be supplied".',
        ip_address: '192.168.1.104'
      }
    ]);
    console.log(`[MongoDB Seeder] Inserted ${audit.length} audit logs.`);

    console.log('[MongoDB Seeder] All seed data populated successfully into MongoDB!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[MongoDB Seeder] Error during seeding:', error.message);
    process.exit(1);
  }
}

seedMongo();
