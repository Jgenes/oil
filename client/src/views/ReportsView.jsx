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
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ReportsView() {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('daily-issuance');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().substring(0, 10));
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().substring(0, 7));

  const reportsList = [
    { id: 'daily-issuance', label: '1. Daily Fuel Issuance Report' },
    { id: 'monthly-consumption', label: '2. Monthly Fuel Consumption Report' },
    { id: 'budget-vs-actual', label: '3. Department Budget vs Actual Fuel Expenditure' },
    { id: 'vehicle-performance', label: '4. Vehicle Distance Coverage & Performance' },
    { id: 'driver-trips', label: '5. Driver Trip & Fuel Efficiency Report' },
    { id: 'requisitions-audit', label: '6. Fuel Requisition & Approval Audit Report' },
    { id: 'supplier-transactions', label: '7. Supplier Transactions & Invoices Report' },
    { id: 'maintenance-costs', label: '8. Vehicle Maintenance & Garage Cost Report' }
  ];

  useEffect(() => {
    fetchReport();
  }, [activeReport, dateFilter, monthFilter]);

  async function fetchReport() {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeReport === 'daily-issuance') {
        endpoint = `/reports/daily-issuance?date=${dateFilter}`;
      } else if (activeReport === 'monthly-consumption') {
        endpoint = `/reports/monthly-consumption?month=${monthFilter}`;
      } else if (activeReport === 'budget-vs-actual') {
        endpoint = '/reports/budget-vs-actual';
      } else if (activeReport === 'vehicle-performance') {
        endpoint = '/reports/vehicle-performance';
      } else if (activeReport === 'driver-trips') {
        endpoint = '/reports/driver-trips';
      } else if (activeReport === 'requisitions-audit') {
        endpoint = '/reports/requisitions-audit';
      } else if (activeReport === 'supplier-transactions') {
        endpoint = '/reports/supplier-transactions';
      } else if (activeReport === 'maintenance-costs') {
        endpoint = '/reports/maintenance-costs';
      }

      const res = await api.get(endpoint);
      if (res.data.success) {
        setReportData(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Export to Excel / CSV using XLSX library
  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MoCU_Report');
    XLSX.writeFile(workbook, `MoCU_${activeReport}_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-3 p-md-4">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 no-print">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <BarChart3 className="text-primary" />
            <span>Institutional Reports & Analytical Exports</span>
          </h4>
          <p className="text-muted small mb-0">
            Moshi Co-operative University • Comprehensive management reports with Excel export and printable letterheads.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1.5 shadow-sm"
            onClick={handleExportExcel}
            title="Download as Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} />
            <span>Export to Excel</span>
          </button>

          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm"
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Select Report & Filters Bar */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-white no-print">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <label className="form-label small fw-bold text-muted mb-1">Select Report Template</label>
            <select
              className="form-select form-select-sm fw-bold"
              value={activeReport}
              onChange={(e) => setActiveReport(e.target.value)}
            >
              {reportsList.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {activeReport === 'daily-issuance' && (
            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted mb-1">Select Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          )}

          {activeReport === 'monthly-consumption' && (
            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted mb-1">Select Month (YYYY-MM)</label>
              <input
                type="month"
                className="form-control form-control-sm"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
            </div>
          )}

          <div className="col-md-4 text-end ms-auto align-self-end">
            <span className="badge bg-light text-dark border p-2">
              Records: <strong>{reportData.length}</strong> entries
            </span>
          </div>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="card shadow-sm border-0 bg-white p-4 printable-area">
        
        {/* Official Letterhead in Print View */}
        <div className="text-center pb-3 mb-3 border-bottom border-dark">
          <div className="d-flex align-items-center justify-content-center gap-3 mb-1">
            <img src="/coat-of-arms.svg" alt="Coat of Arms" style={{ width: '45px', height: '45px' }} />
            <div>
              <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>UNITED REPUBLIC OF TANZANIA</div>
              <div className="fw-bold" style={{ fontSize: '1.15rem', color: '#0B2545' }}>
                MOSHI CO-OPERATIVE UNIVERSITY (MoCU)
              </div>
              <div className="text-secondary small fw-semibold">DIRECTORATE OF PLANNING, FINANCE AND FLEET LOGISTICS</div>
            </div>
            <img src="/logo.svg" alt="MoCU Logo" style={{ width: '45px', height: '45px' }} />
          </div>
          <h5 className="fw-bold text-uppercase mt-2 mb-0" style={{ letterSpacing: '0.5px' }}>
            {reportsList.find(r => r.id === activeReport)?.label}
          </h5>
          <small className="text-muted">
            Generated on: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • Authorized by: {user?.name} ({user?.role})
          </small>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead className="table-light">
              {activeReport === 'daily-issuance' && (
                <tr>
                  <th>Issuance Ref</th>
                  <th>Date & Time</th>
                  <th>Vehicle Number</th>
                  <th>Driver</th>
                  <th>Department</th>
                  <th>Station</th>
                  <th className="text-end">Quantity (L)</th>
                  <th className="text-end">Tariff (TZS)</th>
                  <th className="text-end">Total Amount (TZS)</th>
                  <th>Receipt Number</th>
                </tr>
              )}

              {activeReport === 'monthly-consumption' && (
                <tr>
                  <th>Vehicle Number</th>
                  <th>Model</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th className="text-end">Trips</th>
                  <th className="text-end">Distance (KM)</th>
                  <th className="text-end">Fuel Issued (L)</th>
                  <th className="text-end">Fuel Consumed (L)</th>
                  <th className="text-end">Actual KM/L</th>
                </tr>
              )}

              {activeReport === 'budget-vs-actual' && (
                <tr>
                  <th>Department Code</th>
                  <th>Department Name</th>
                  <th>Assigned Vehicles</th>
                  <th className="text-end">Annual Fuel Budget (TZS)</th>
                  <th className="text-end">Fuel Issued (Litres)</th>
                  <th className="text-end">Actual Expenditure (TZS)</th>
                  <th className="text-end">Remaining Vote (TZS)</th>
                  <th className="text-end">Utilization %</th>
                </tr>
              )}

              {activeReport === 'vehicle-performance' && (
                <tr>
                  <th>Vehicle Number</th>
                  <th>Make & Model</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th className="text-end">Current Odometer</th>
                  <th className="text-end">Trips</th>
                  <th className="text-end">Distance (KM)</th>
                  <th className="text-end">Fuel Consumed (L)</th>
                  <th className="text-end">Avg KM/L</th>
                  <th className="text-end">Cost/KM</th>
                </tr>
              )}

              {activeReport === 'driver-trips' && (
                <tr>
                  <th>Driver Name</th>
                  <th>Employee No</th>
                  <th>Licence No</th>
                  <th>Licence Expiry</th>
                  <th>Assigned Vehicle</th>
                  <th className="text-end">Trips</th>
                  <th className="text-end">Distance (KM)</th>
                  <th className="text-end">Fuel Consumed (L)</th>
                  <th className="text-end">Efficiency</th>
                </tr>
              )}

              {activeReport === 'requisitions-audit' && (
                <tr>
                  <th>Slip / Ref No</th>
                  <th>Date</th>
                  <th>Submitter</th>
                  <th>Department</th>
                  <th>Vehicle</th>
                  <th>Destination</th>
                  <th className="text-end">Litres</th>
                  <th>Status</th>
                  <th>HOD Review</th>
                  <th>Transport Verify</th>
                  <th>HPMU Authorize</th>
                </tr>
              )}

              {activeReport === 'supplier-transactions' && (
                <tr>
                  <th>Supplier Station</th>
                  <th>Issuance Ref</th>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Fuel Type</th>
                  <th className="text-end">Litres</th>
                  <th className="text-end">Unit Price</th>
                  <th className="text-end">Total (TZS)</th>
                  <th>Receipt / Invoice</th>
                </tr>
              )}

              {activeReport === 'maintenance-costs' && (
                <tr>
                  <th>Maintenance Ref</th>
                  <th>Vehicle</th>
                  <th>Service Date</th>
                  <th>Service Type</th>
                  <th>Service Provider</th>
                  <th className="text-end">Mileage (KM)</th>
                  <th className="text-end">Cost (TZS)</th>
                  <th>Status</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Generating report data...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-muted">
                    No data found for this report period.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx}>
                    {activeReport === 'daily-issuance' && (
                      <>
                        <td className="font-monospace fw-bold">{row.issuance_number}</td>
                        <td>{row.issuance_date?.substring(0, 16).replace('T', ' ')}</td>
                        <td className="font-monospace fw-bold">{row.registration_number}</td>
                        <td>{row.driver_name}</td>
                        <td>{row.department_name}</td>
                        <td>{row.fuel_station_name}</td>
                        <td className="text-end font-monospace">{row.quantity_issued} L</td>
                        <td className="text-end font-monospace">{row.unit_price}</td>
                        <td className="text-end font-monospace fw-bold">{Number(row.total_cost).toLocaleString()} TZS</td>
                        <td className="font-monospace">{row.receipt_number}</td>
                      </>
                    )}

                    {activeReport === 'monthly-consumption' && (
                      <>
                        <td className="font-monospace fw-bold">{row.registration_number}</td>
                        <td>{row.make} {row.model}</td>
                        <td>{row.category}</td>
                        <td>{row.department_name}</td>
                        <td className="text-end font-monospace">{row.trips_count}</td>
                        <td className="text-end font-monospace fw-bold">{Number(row.total_distance_km).toLocaleString()} KM</td>
                        <td className="text-end font-monospace">{row.fuel_issued_litres} L</td>
                        <td className="text-end font-monospace fw-bold text-success">{row.fuel_consumed_litres} L</td>
                        <td className="text-end font-monospace fw-bold">{row.avg_km_l} KM/L</td>
                      </>
                    )}

                    {activeReport === 'budget-vs-actual' && (
                      <>
                        <td className="font-monospace fw-bold text-primary">{row.code}</td>
                        <td className="fw-semibold">{row.name}</td>
                        <td>{row.assigned_vehicles}</td>
                        <td className="text-end font-monospace">{Number(row.annual_fuel_budget).toLocaleString()} TZS</td>
                        <td className="text-end font-monospace">{row.total_fuel_litres_issued} L</td>
                        <td className="text-end font-monospace fw-bold text-dark">{Number(row.actual_expenditure_tzs).toLocaleString()} TZS</td>
                        <td className="text-end font-monospace">{Number(row.remaining_budget_tzs).toLocaleString()} TZS</td>
                        <td className="text-end font-monospace fw-bold">{row.utilization_pct}%</td>
                      </>
                    )}

                    {activeReport === 'vehicle-performance' && (
                      <>
                        <td className="font-monospace fw-bold text-primary">{row.registration_number}</td>
                        <td>{row.make} {row.model}</td>
                        <td>{row.department_name}</td>
                        <td><span className="badge bg-light text-dark border">{row.vehicle_status}</span></td>
                        <td className="text-end font-monospace">{Number(row.current_odometer).toLocaleString()} KM</td>
                        <td className="text-end font-monospace">{row.completed_trips}</td>
                        <td className="text-end font-monospace fw-bold">{Number(row.total_trip_distance_km).toLocaleString()} KM</td>
                        <td className="text-end font-monospace">{row.total_fuel_consumed} L</td>
                        <td className="text-end font-monospace fw-bold text-success">{row.actual_km_l} KM/L</td>
                        <td className="text-end font-monospace">{row.avg_cost_per_km} TZS</td>
                      </>
                    )}

                    {activeReport === 'driver-trips' && (
                      <>
                        <td className="fw-semibold">{row.full_name}</td>
                        <td className="font-monospace">{row.employee_number}</td>
                        <td className="font-monospace">{row.driving_licence_number}</td>
                        <td>{row.licence_expiry_date}</td>
                        <td className="font-monospace">{row.assigned_vehicle || '-'}</td>
                        <td className="text-end font-monospace">{row.trips_count}</td>
                        <td className="text-end font-monospace fw-bold">{Number(row.total_distance_km).toLocaleString()} KM</td>
                        <td className="text-end font-monospace">{row.total_fuel_consumed} L</td>
                        <td className="text-end font-monospace fw-bold">{row.avg_km_l} KM/L</td>
                      </>
                    )}

                    {activeReport === 'requisitions-audit' && (
                      <>
                        <td className="font-monospace fw-bold text-primary">#{row.form_serial_number || row.request_number}</td>
                        <td>{row.created_at?.substring(0, 10)}</td>
                        <td>{row.requested_by_name}</td>
                        <td>{row.department_name}</td>
                        <td className="font-monospace">{row.registration_number}</td>
                        <td>{row.destination}</td>
                        <td className="text-end font-monospace">{row.requested_quantity_litres} L</td>
                        <td><span className="badge bg-light text-dark border">{row.status}</span></td>
                        <td>{row.hod_recommendation || 'Pending'}</td>
                        <td>{row.transport_verification || 'Pending'}</td>
                        <td>{row.hpmu_authorization || 'Pending'}</td>
                      </>
                    )}

                    {activeReport === 'supplier-transactions' && (
                      <>
                        <td className="fw-semibold">{row.station_name}</td>
                        <td className="font-monospace text-primary">{row.issuance_number}</td>
                        <td>{row.issuance_date?.substring(0, 10)}</td>
                        <td className="font-monospace">{row.registration_number}</td>
                        <td>{row.fuel_type}</td>
                        <td className="text-end font-monospace">{row.quantity_issued} L</td>
                        <td className="text-end font-monospace">{row.unit_price}</td>
                        <td className="text-end font-monospace fw-bold">{Number(row.total_cost).toLocaleString()} TZS</td>
                        <td className="font-monospace">{row.receipt_number}</td>
                      </>
                    )}

                    {activeReport === 'maintenance-costs' && (
                      <>
                        <td className="font-monospace fw-bold">{row.maintenance_number}</td>
                        <td className="font-monospace">{row.registration_number}</td>
                        <td>{row.service_date}</td>
                        <td className="fw-semibold">{row.service_type}</td>
                        <td>{row.service_provider}</td>
                        <td className="text-end font-monospace">{Number(row.service_mileage).toLocaleString()} KM</td>
                        <td className="text-end font-monospace fw-bold">{Number(row.cost).toLocaleString()} TZS</td>
                        <td><span className="badge bg-light text-dark border">{row.status}</span></td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Official Certification Footer in Print View */}
        <div className="mt-5 pt-4 border-top d-flex justify-content-between text-center" style={{ fontSize: '0.85rem' }}>
          <div>
            <div>........................................................</div>
            <strong className="d-block mt-1">Prepared by: Transport Officer</strong>
            <small className="text-muted">Capt. Michael Shirima</small>
          </div>
          <div>
            <div>........................................................</div>
            <strong className="d-block mt-1">Checked by: Internal Auditor</strong>
            <small className="text-muted">CPA Frank Moshi</small>
          </div>
          <div>
            <div>........................................................</div>
            <strong className="d-block mt-1">Authorized by: Vice Chancellor / HPMU</strong>
            <small className="text-muted">Prof. Alfred S. Sife / Ms. Beatrice Swai</small>
          </div>
        </div>

      </div>

    </div>
  );
}
