import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  FileSpreadsheet,
  CheckCircle,
  FileText,
  AlertTriangle,
  Fuel,
  Car,
  UserCheck,
  Building,
  TrendingUp,
  Wrench,
  ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ReportsView() {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('daily-issuance');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  // Filter States
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().substring(0, 10));
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().substring(0, 7));
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdown reference lists
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const reportsList = [
    { id: 'daily-issuance', label: '1. Daily Fuel Issuance Report', icon: Fuel },
    { id: 'monthly-consumption', label: '2. Monthly Fuel Consumption Report', icon: TrendingUp },
    { id: 'annual-expenditure', label: '3. Annual Fleet Fuel Expenditure', icon: BarChart3 },
    { id: 'vehicle-distance', label: '4. Vehicle Distance Coverage Report', icon: Car },
    { id: 'driver-trips', label: '5. Driver Trip & Fuel Efficiency Report', icon: UserCheck },
    { id: 'department-utilization', label: '6. Department Utilization & Ceilings', icon: Building },
    { id: 'requisitions-audit', label: '7. Fuel Requests & Approvals Audit Report', icon: FileText },
    { id: 'vehicle-performance', label: '8. Vehicle Performance & Lifecycle Report', icon: Car },
    { id: 'fuel-efficiency', label: '9. Fuel Efficiency & Anomaly Report', icon: AlertTriangle },
    { id: 'maintenance-costs', label: '10. Vehicle Maintenance & Garage Cost Report', icon: Wrench },
    { id: 'supplier-transactions', label: '11. Supplier Transactions & Invoices Report', icon: FileSpreadsheet },
    { id: 'budget-vs-actual', label: '12. Department Fuel Budget vs Actual Expenditure', icon: Building }
  ];

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [
    activeReport, dateFilter, monthFilter, yearFilter,
    startDate, endDate, vehicleFilter, driverFilter,
    departmentFilter, fuelTypeFilter, statusFilter
  ]);

  async function fetchFilterOptions() {
    try {
      const [vRes, dRes, deptRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/departments')
      ]);
      if (vRes.data.success) setVehicles(vRes.data.data);
      if (dRes.data.success) setDrivers(dRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  }

  async function fetchReport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      if (vehicleFilter) params.append('vehicle_id', vehicleFilter);
      if (driverFilter) params.append('driver_id', driverFilter);
      if (departmentFilter) params.append('department_id', departmentFilter);
      if (fuelTypeFilter) params.append('fuel_type', fuelTypeFilter);
      if (statusFilter) params.append('status', statusFilter);

      let endpoint = `/reports/${activeReport}`;
      if (activeReport === 'daily-issuance') {
        if (!startDate) params.append('date', dateFilter);
      } else if (activeReport === 'monthly-consumption') {
        params.append('month', monthFilter);
      } else if (activeReport === 'annual-expenditure') {
        params.append('year', yearFilter);
      }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const res = await api.get(url);
      if (res.data.success) {
        setReportData(res.data.data || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        alert(err.response.data.error || 'Access denied: Confidential department data');
      }
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }

  function exportToExcel() {
    if (!reportData || reportData.length === 0) {
      alert('No data available to export.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MoCU_Report');
    XLSX.writeFile(workbook, `MoCU_${activeReport}_${new Date().toISOString().substring(0, 10)}.xlsx`);
  }

  function handlePrint() {
    window.print();
  }

  const currentReportObj = reportsList.find(r => r.id === activeReport);

  return (
    <div className="container-fluid py-4">
      {/* Printable Letterhead (visible during print) */}
      <div className="d-none d-print-block mb-4 pb-3 border-bottom border-2 border-dark">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <img src="/coat-of-arms.svg" alt="Coat of Arms" style={{ width: '65px', height: '65px' }} />
          <div className="text-center flex-grow-1 px-3">
            <h5 className="fw-bold mb-0 text-uppercase">United Republic of Tanzania</h5>
            <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.85rem' }}>Ministry of Education, Science and Technology</h6>
            <h4 className="fw-bold mb-0 text-uppercase" style={{ color: '#056FE7' }}>
              Moshi Co-operative University (MoCU)
            </h4>
            <div className="fw-bold small">Chuo Kikuu cha Ushirika Moshi</div>
            <div className="small text-muted">06 Sokoine Road, 25121 Mfumuni, P.O. Box 474, Moshi, Kilimanjaro, Tanzania</div>
          </div>
          <img src="/logo.png" alt="MoCU Crest" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
        </div>
        <div className="text-center bg-light py-1 border rounded">
          <strong className="small text-uppercase">Official Institutional Report: {currentReportObj?.label}</strong>
          <span className="small text-muted ms-2">| Generated on: {new Date().toLocaleString()} by {user?.name} ({user?.role})</span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 d-print-none">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <BarChart3 className="text-primary" size={28} />
            Institutional Reports & Analytics
          </h3>
          <p className="text-muted small mb-0">
            Official Moshi Co-operative University fleet audit records, fuel consumption analytics, and vote allocations
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            onClick={exportToExcel}
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-2 fw-semibold shadow-sm"
          >
            <FileSpreadsheet size={16} />
            Export to Excel (.xlsx)
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 fw-semibold shadow-sm"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Main Grid: Left Selector, Right Content */}
      <div className="row g-4">
        {/* Left Column: Report Menu */}
        <div className="col-lg-3 d-print-none">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 border-bottom">
              <span className="fw-bold text-dark small text-uppercase tracking-wider">
                Select Report Format
              </span>
            </div>
            <div className="list-group list-group-flush py-2">
              {reportsList.map((rep) => {
                const IconComponent = rep.icon;
                const isActive = activeReport === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setActiveReport(rep.id)}
                    className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-2.5 px-3 border-0 small ${
                      isActive ? 'bg-primary text-white fw-bold shadow-sm' : 'text-dark'
                    }`}
                    style={isActive ? { backgroundColor: '#056FE7' } : {}}
                  >
                    <IconComponent size={16} className={isActive ? 'text-white' : 'text-muted'} />
                    <span className="text-truncate">{rep.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Filters & Report Table */}
        <div className="col-lg-9">
          {/* Dynamic Filter Toolbar */}
          <div className="card border-0 shadow-sm rounded-3 mb-3 d-print-none">
            <div className="card-body p-3">
              <div className="row g-2 align-items-end">
                {/* Single Date Filter (Daily Issuance) */}
                {activeReport === 'daily-issuance' && !startDate && (
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Specific Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                )}

                {/* Month Filter */}
                {activeReport === 'monthly-consumption' && (
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Select Month</label>
                    <input
                      type="month"
                      className="form-control form-control-sm"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                    />
                  </div>
                )}

                {/* Year Filter */}
                {activeReport === 'annual-expenditure' && (
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Fiscal Year</label>
                    <select
                      className="form-select form-select-sm"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                )}

                {/* Date Range Filters */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Date From</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Date To</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Vehicle Filter */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Vehicle</label>
                  <select
                    className="form-select form-select-sm"
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                  >
                    <option value="">All Vehicles</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number} ({v.model})</option>
                    ))}
                  </select>
                </div>

                {/* Department Filter (Scoping Notice) */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">
                    Department {user?.role === 'hod' && '(Scoped)'}
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={departmentFilter}
                    disabled={user?.role === 'hod'}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    {user?.role !== 'hod' && <option value="">All Departments</option>}
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Fuel Type */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Fuel Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={fuelTypeFilter}
                    onChange={(e) => setFuelTypeFilter(e.target.value)}
                  >
                    <option value="">All Fuel Types</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>

                {/* Approval Status Filter */}
                {activeReport === 'requisitions-audit' && (
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted mb-1">Approval Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="issued">Issued</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}

                {/* Reset Filters Button */}
                <div className="col-md-3">
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setVehicleFilter('');
                      setDriverFilter('');
                      setDepartmentFilter('');
                      setFuelTypeFilter('');
                      setStatusFilter('');
                      setDateFilter(new Date().toISOString().substring(0, 10));
                    }}
                    className="btn btn-outline-secondary btn-sm w-100"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Report Header & Summary */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold text-dark mb-0">{currentReportObj?.label}</h5>
                <span className="badge bg-light text-dark border small mt-1">
                  {reportData.length} Records Found
                </span>
              </div>
              {summary && (
                <div className="d-flex gap-3 text-end d-print-none">
                  <div>
                    <span className="text-muted small d-block">Total Litres</span>
                    <strong className="text-primary font-monospace">{Number(summary.total_litres).toLocaleString()} L</strong>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Total Amount</span>
                    <strong className="text-success font-monospace">{Number(summary.total_amount_tzs).toLocaleString()} TZS</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted small mt-2">Compiling institutional report records...</p>
                </div>
              ) : reportData.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FileText size={40} className="mb-2 text-muted opacity-50" />
                  <p className="mb-0">No records found matching the specified parameters.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                    <thead className="table-light border-bottom">
                      {/* Dynamic Headers Based on Report */}
                      {activeReport === 'daily-issuance' && (
                        <tr>
                          <th>Date & Time</th>
                          <th>Requisition / Slip</th>
                          <th>Vehicle Reg</th>
                          <th>Department</th>
                          <th>Driver</th>
                          <th>Fuel</th>
                          <th className="text-end">Issued (L)</th>
                          <th className="text-end">Unit Price</th>
                          <th className="text-end">Total (TZS)</th>
                          <th>Receipt No</th>
                        </tr>
                      )}

                      {activeReport === 'monthly-consumption' && (
                        <tr>
                          <th>Registration</th>
                          <th>Model</th>
                          <th>Category</th>
                          <th>Department</th>
                          <th className="text-center">Trips</th>
                          <th className="text-end">Distance (KM)</th>
                          <th className="text-end">Fuel Consumed</th>
                          <th className="text-end">Avg KM/L</th>
                          <th className="text-end">Cost (TZS)</th>
                        </tr>
                      )}

                      {activeReport === 'annual-expenditure' && (
                        <tr>
                          <th>Month</th>
                          <th className="text-center">Vouchers Count</th>
                          <th className="text-end">Total Fuel (L)</th>
                          <th className="text-end">Average Price/L</th>
                          <th className="text-end">Total Cost (TZS)</th>
                        </tr>
                      )}

                      {activeReport === 'vehicle-distance' && (
                        <tr>
                          <th>Registration</th>
                          <th>Make / Model</th>
                          <th>Department</th>
                          <th className="text-end">Current Odometer</th>
                          <th className="text-center">Trips</th>
                          <th className="text-end">Distance (KM)</th>
                          <th className="text-end">Fuel Consumed (L)</th>
                          <th className="text-end">Efficiency (KM/L)</th>
                        </tr>
                      )}

                      {activeReport === 'driver-trips' && (
                        <tr>
                          <th>Driver Name</th>
                          <th>Emp No</th>
                          <th>Licence</th>
                          <th>Assigned Vehicle</th>
                          <th className="text-center">Trips</th>
                          <th className="text-end">Total KM</th>
                          <th className="text-end">Fuel Used</th>
                          <th className="text-end">Avg KM/L</th>
                          <th className="text-center">Anomalies</th>
                        </tr>
                      )}

                      {activeReport === 'department-utilization' && (
                        <tr>
                          <th>Department</th>
                          <th>Code</th>
                          <th className="text-end">Annual Budget (TZS)</th>
                          <th className="text-end">Fuel Spent (TZS)</th>
                          <th className="text-center">Utilization</th>
                          <th className="text-center">Vehicles</th>
                          <th className="text-center">Trips</th>
                          <th className="text-end">Total Distance</th>
                        </tr>
                      )}

                      {activeReport === 'requisitions-audit' && (
                        <tr>
                          <th>Request No</th>
                          <th>Slip No</th>
                          <th>Date</th>
                          <th>Department</th>
                          <th>Vehicle</th>
                          <th>Destination</th>
                          <th className="text-end">Litres</th>
                          <th className="text-center">Status</th>
                          <th>HOD</th>
                          <th>Transport</th>
                          <th>HPMU</th>
                          <th>Vote Code</th>
                        </tr>
                      )}

                      {activeReport === 'vehicle-performance' && (
                        <tr>
                          <th>Registration</th>
                          <th>Model</th>
                          <th>Category</th>
                          <th>Department</th>
                          <th className="text-end">Odometer</th>
                          <th className="text-end">Baseline KM/L</th>
                          <th className="text-end">Actual KM/L</th>
                          <th className="text-end">Cost/KM</th>
                          <th className="text-center">Anomalies</th>
                        </tr>
                      )}

                      {activeReport === 'fuel-efficiency' && (
                        <tr>
                          <th>Trip No</th>
                          <th>Date</th>
                          <th>Vehicle</th>
                          <th>Driver</th>
                          <th className="text-end">Distance (KM)</th>
                          <th className="text-end">Fuel (L)</th>
                          <th className="text-end">Actual KM/L</th>
                          <th className="text-end">Baseline</th>
                          <th className="text-center">Status</th>
                        </tr>
                      )}

                      {activeReport === 'maintenance-costs' && (
                        <tr>
                          <th>Mnt No</th>
                          <th>Vehicle</th>
                          <th>Date</th>
                          <th>Service Type</th>
                          <th>Garage Provider</th>
                          <th className="text-end">Mileage</th>
                          <th className="text-end">Cost (TZS)</th>
                          <th>Invoice Ref</th>
                          <th>Status</th>
                        </tr>
                      )}

                      {activeReport === 'supplier-transactions' && (
                        <tr>
                          <th>Supplier Station</th>
                          <th>Issuance Date</th>
                          <th>Vehicle</th>
                          <th>Fuel Type</th>
                          <th className="text-end">Quantity (L)</th>
                          <th className="text-end">Unit Price</th>
                          <th className="text-end">Total Amount</th>
                          <th>Receipt / Invoice</th>
                        </tr>
                      )}

                      {activeReport === 'budget-vs-actual' && (
                        <tr>
                          <th>Department</th>
                          <th>HOD</th>
                          <th className="text-end">Budget Ceiling</th>
                          <th className="text-end">Actual Spent</th>
                          <th className="text-end">Remaining Balance</th>
                          <th className="text-center">Utilization</th>
                        </tr>
                      )}
                    </thead>

                    <tbody>
                      {reportData.map((row, idx) => (
                        <tr key={idx}>
                          {/* 1. Daily Issuance */}
                          {activeReport === 'daily-issuance' && (
                            <>
                              <td>{row.issuance_date}</td>
                              <td>
                                <span className="fw-bold">{row.request_number}</span>
                                {row.form_serial_number && (
                                  <span className="badge bg-secondary ms-1">#{row.form_serial_number}</span>
                                )}
                              </td>
                              <td className="fw-bold font-monospace">{row.registration_number}</td>
                              <td>{row.department_name}</td>
                              <td>{row.driver_name}</td>
                              <td>
                                <span className={`badge ${row.fuel_type === 'Diesel' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                                  {row.fuel_type}
                                </span>
                              </td>
                              <td className="text-end font-monospace fw-bold">{row.quantity_issued} L</td>
                              <td className="text-end font-monospace">{Number(row.unit_price).toLocaleString()}</td>
                              <td className="text-end font-monospace fw-bold">{Number(row.total_cost).toLocaleString()} TZS</td>
                              <td className="font-monospace small">{row.receipt_number || '-'}</td>
                            </>
                          )}

                          {/* 2. Monthly Consumption */}
                          {activeReport === 'monthly-consumption' && (
                            <>
                              <td className="fw-bold font-monospace">{row.registration_number}</td>
                              <td>{row.make} {row.model}</td>
                              <td><span className="badge bg-light text-dark border">{row.category}</span></td>
                              <td>{row.department_name}</td>
                              <td className="text-center">{row.trips_count}</td>
                              <td className="text-end font-monospace">{Number(row.total_distance_km).toLocaleString()} KM</td>
                              <td className="text-end font-monospace">{Number(row.fuel_consumed_litres).toLocaleString()} L</td>
                              <td className="text-end font-monospace fw-bold text-primary">{row.avg_km_l}</td>
                              <td className="text-end font-monospace fw-bold">{Number(row.estimated_cost_tzs).toLocaleString()} TZS</td>
                            </>
                          )}

                          {/* 3. Annual Expenditure */}
                          {activeReport === 'annual-expenditure' && (
                            <>
                              <td className="fw-bold">Month {row.month_num}</td>
                              <td className="text-center">{row.transactions_count}</td>
                              <td className="text-end font-monospace">{Number(row.total_litres).toLocaleString()} L</td>
                              <td className="text-end font-monospace">{Number(row.avg_unit_price).toLocaleString()} TZS</td>
                              <td className="text-end font-monospace fw-bold text-success">{Number(row.total_cost_tzs).toLocaleString()} TZS</td>
                            </>
                          )}

                          {/* 4. Vehicle Distance */}
                          {activeReport === 'vehicle-distance' && (
                            <>
                              <td className="fw-bold font-monospace">{row.registration_number}</td>
                              <td>{row.make} {row.model}</td>
                              <td>{row.department_name}</td>
                              <td className="text-end font-monospace">{Number(row.current_odometer).toLocaleString()} KM</td>
                              <td className="text-center">{row.trips_count}</td>
                              <td className="text-end font-monospace fw-bold text-primary">{Number(row.total_km_covered).toLocaleString()} KM</td>
                              <td className="text-end font-monospace">{Number(row.fuel_consumed).toLocaleString()} L</td>
                              <td className="text-end font-monospace">{row.efficiency_km_l}</td>
                            </>
                          )}

                          {/* 5. Driver Trips */}
                          {activeReport === 'driver-trips' && (
                            <>
                              <td className="fw-bold">{row.full_name}</td>
                              <td className="font-monospace small">{row.employee_number}</td>
                              <td className="font-monospace small">{row.driving_licence_number}</td>
                              <td className="font-monospace">{row.assigned_vehicle || '-'}</td>
                              <td className="text-center">{row.trips_count}</td>
                              <td className="text-end font-monospace fw-bold">{Number(row.total_distance_km).toLocaleString()} KM</td>
                              <td className="text-end font-monospace">{Number(row.total_fuel_consumed).toLocaleString()} L</td>
                              <td className="text-end font-monospace fw-bold text-primary">{row.avg_km_l}</td>
                              <td className="text-center">
                                {row.anomalies_count > 0 ? (
                                  <span className="badge bg-danger-subtle text-danger">{row.anomalies_count} Flagged</span>
                                ) : (
                                  <span className="badge bg-success-subtle text-success">Clean</span>
                                )}
                              </td>
                            </>
                          )}

                          {/* 6. Department Utilization */}
                          {activeReport === 'department-utilization' && (
                            <>
                              <td className="fw-bold">{row.name}</td>
                              <td><span className="badge bg-light text-dark border font-monospace">{row.code}</span></td>
                              <td className="text-end font-monospace">{Number(row.annual_fuel_budget).toLocaleString()} TZS</td>
                              <td className="text-end font-monospace fw-bold text-dark">{Number(row.total_spent).toLocaleString()} TZS</td>
                              <td className="text-center">
                                <div className="d-flex align-items-center gap-1 justify-content-center">
                                  <div className="progress flex-grow-1" style={{ height: '6px', maxWidth: '80px' }}>
                                    <div
                                      className={`progress-bar ${row.utilization_pct > 80 ? 'bg-danger' : 'bg-primary'}`}
                                      style={{ width: `${Math.min(row.utilization_pct, 100)}%` }}
                                    />
                                  </div>
                                  <span className="small font-monospace">{row.utilization_pct}%</span>
                                </div>
                              </td>
                              <td className="text-center">{row.vehicles_count}</td>
                              <td className="text-center">{row.trips_count}</td>
                              <td className="text-end font-monospace">{Number(row.total_distance_km).toLocaleString()} KM</td>
                            </>
                          )}

                          {/* 7. Requisitions Audit */}
                          {activeReport === 'requisitions-audit' && (
                            <>
                              <td className="fw-bold font-monospace">{row.request_number}</td>
                              <td><span className="badge bg-secondary font-monospace">#{row.form_serial_number}</span></td>
                              <td>{row.created_at?.substring(0, 10)}</td>
                              <td>{row.department_name}</td>
                              <td className="fw-bold font-monospace">{row.registration_number}</td>
                              <td className="text-truncate" style={{ maxWidth: '140px' }} title={row.destination}>
                                {row.destination}
                              </td>
                              <td className="text-end font-monospace fw-bold">{row.requested_quantity_litres} L</td>
                              <td className="text-center">
                                <span className={`badge ${
                                  row.status === 'approved' || row.status === 'issued' ? 'bg-success' :
                                  row.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td>{row.hod_name || '-'}</td>
                              <td>{row.transport_name || '-'}</td>
                              <td>{row.hpmu_name || '-'}</td>
                              <td className="font-monospace small">{row.finance_vote_code || '-'}</td>
                            </>
                          )}

                          {/* 8. Vehicle Performance */}
                          {activeReport === 'vehicle-performance' && (
                            <>
                              <td className="fw-bold font-monospace">{row.registration_number}</td>
                              <td>{row.make} {row.model}</td>
                              <td><span className="badge bg-light text-dark border">{row.category}</span></td>
                              <td>{row.department_name}</td>
                              <td className="text-end font-monospace">{Number(row.current_odometer).toLocaleString()} KM</td>
                              <td className="text-end font-monospace">{row.standard_efficiency_km_l}</td>
                              <td className="text-end font-monospace fw-bold text-primary">{row.actual_km_l}</td>
                              <td className="text-end font-monospace">{row.avg_cost_per_km} TZS</td>
                              <td className="text-center">
                                {row.anomaly_flags_count > 0 ? (
                                  <span className="badge bg-danger-subtle text-danger">{row.anomaly_flags_count} flags</span>
                                ) : (
                                  <span className="badge bg-success-subtle text-success">Normal</span>
                                )}
                              </td>
                            </>
                          )}

                          {/* 9. Fuel Efficiency & Anomaly */}
                          {activeReport === 'fuel-efficiency' && (
                            <>
                              <td className="fw-bold font-monospace">{row.trip_number}</td>
                              <td>{row.departure_datetime?.substring(0, 10)}</td>
                              <td className="fw-bold font-monospace">{row.registration_number}</td>
                              <td>{row.driver_name}</td>
                              <td className="text-end font-monospace">{row.total_distance_km} KM</td>
                              <td className="text-end font-monospace">{row.fuel_consumed_litres} L</td>
                              <td className="text-end font-monospace fw-bold text-primary">{row.fuel_efficiency_km_l}</td>
                              <td className="text-end font-monospace">{row.baseline_km_l}</td>
                              <td className="text-center">
                                {row.is_anomaly ? (
                                  <span className="badge bg-danger">{row.anomaly_status || 'Flagged'}</span>
                                ) : (
                                  <span className="badge bg-success">Optimal</span>
                                )}
                              </td>
                            </>
                          )}

                          {/* 10. Maintenance Costs */}
                          {activeReport === 'maintenance-costs' && (
                            <>
                              <td className="fw-bold font-monospace">{row.maintenance_number}</td>
                              <td className="fw-bold font-monospace">{row.registration_number}</td>
                              <td>{row.service_date}</td>
                              <td className="fw-semibold text-primary">{row.service_type}</td>
                              <td>{row.service_provider}</td>
                              <td className="text-end font-monospace">{Number(row.service_mileage).toLocaleString()} KM</td>
                              <td className="text-end font-monospace fw-bold">{Number(row.cost).toLocaleString()} TZS</td>
                              <td className="font-monospace small">{row.invoice_number || '-'}</td>
                              <td>
                                <span className={`badge ${row.status === 'Completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                                  {row.status}
                                </span>
                              </td>
                            </>
                          )}

                          {/* 11. Supplier Transactions */}
                          {activeReport === 'supplier-transactions' && (
                            <>
                              <td className="fw-bold">{row.supplier_name}</td>
                              <td>{row.issuance_date}</td>
                              <td className="fw-bold font-monospace">{row.registration_number}</td>
                              <td><span className="badge bg-light text-dark border">{row.fuel_type}</span></td>
                              <td className="text-end font-monospace fw-bold">{row.quantity_issued} L</td>
                              <td className="text-end font-monospace">{Number(row.unit_price).toLocaleString()}</td>
                              <td className="text-end font-monospace fw-bold text-success">{Number(row.total_cost).toLocaleString()} TZS</td>
                              <td className="font-monospace small">{row.receipt_number || row.invoice_reference || '-'}</td>
                            </>
                          )}

                          {/* 12. Budget vs Actual */}
                          {activeReport === 'budget-vs-actual' && (
                            <>
                              <td className="fw-bold">{row.name}</td>
                              <td>{row.head_name}</td>
                              <td className="text-end font-monospace">{Number(row.annual_fuel_budget).toLocaleString()} TZS</td>
                              <td className="text-end font-monospace fw-bold text-danger">{Number(row.actual_expenditure_tzs).toLocaleString()} TZS</td>
                              <td className="text-end font-monospace fw-bold text-success">{Number(row.remaining_budget_tzs).toLocaleString()} TZS</td>
                              <td className="text-center">
                                <span className={`badge ${row.utilization_pct > 80 ? 'bg-danger' : 'bg-primary'}`}>
                                  {row.utilization_pct}%
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Print Footer with Official Signature Certifications */}
            <div className="card-footer bg-light p-4 border-top d-none d-print-block">
              <div className="row text-center pt-3">
                <div className="col-4">
                  <div className="border-bottom border-dark mb-1 pb-4" />
                  <strong className="d-block small">Capt. Michael Shirima</strong>
                  <span className="text-muted small">Transport & Logistics Officer</span>
                </div>
                <div className="col-4">
                  <div className="border-bottom border-dark mb-1 pb-4" />
                  <strong className="d-block small">CPA Frank Moshi</strong>
                  <span className="text-muted small">Chief Internal Auditor</span>
                </div>
                <div className="col-4">
                  <div className="border-bottom border-dark mb-1 pb-4" />
                  <strong className="d-block small">Prof. Alfred S. Sife</strong>
                  <span className="text-muted small">Vice Chancellor, MoCU</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
