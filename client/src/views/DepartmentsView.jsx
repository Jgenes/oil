import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  DollarSign,
  Car,
  Navigation,
  FileText,
  Plus,
  Eye,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function DepartmentsView() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptDetails, setDeptDetails] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewDepartment(id) {
    try {
      const res = await api.get(`/departments/${id}`);
      if (res.data.success) {
        setDeptDetails(res.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      alert('Error fetching department details: ' + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div className="p-3 p-md-4">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Building2 className="text-primary" />
            <span>University Departments & Fuel Vote Budgets</span>
          </h4>
          <p className="text-muted small mb-0">
            Monitor departmental vehicle allocations, vote expenditure versus annual ceilings, and departmental requisition histories.
          </p>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="row g-3">
        {loading ? (
          <div className="col-12 text-center py-5 text-muted">
            <div className="spinner-border text-primary me-2" role="status" />
            Loading departments...
          </div>
        ) : (
          departments.map((dept) => {
            const usedPct = dept.budget_utilization_pct || 0;
            const remaining = Math.max(0, dept.annual_fuel_budget - dept.actual_fuel_expenditure);

            return (
              <div key={dept.id} className="col-md-6 col-xl-4">
                <div className="card shadow-sm border-0 p-3 h-100 bg-white d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{dept.name}</h6>
                        <span className="badge bg-primary-subtle text-primary font-monospace mt-1">
                          {dept.code}
                        </span>
                      </div>
                      <span className={`badge ${usedPct > 75 ? 'bg-danger' : usedPct > 50 ? 'bg-warning text-dark' : 'bg-success'}`}>
                        {usedPct}% Utilized
                      </span>
                    </div>

                    <div className="text-secondary small mb-3">
                      Head: <strong>{dept.head_name || 'Designated Dean/Director'}</strong>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Vote Expenditure:</span>
                        <span className="font-monospace fw-bold text-dark">
                          {Number(dept.actual_fuel_expenditure).toLocaleString()} TZS
                        </span>
                      </div>
                      <div className="progress" style={{ height: '7px' }}>
                        <div
                          className={`progress-bar ${usedPct > 75 ? 'bg-danger' : usedPct > 50 ? 'bg-warning' : 'bg-primary'}`}
                          role="progressbar"
                          style={{ width: `${Math.min(100, usedPct)}%` }}
                        />
                      </div>
                      <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                        <span>Ceiling: {Number(dept.annual_fuel_budget).toLocaleString()} TZS</span>
                        <span>Rem: {Number(remaining).toLocaleString()} TZS</span>
                      </div>
                    </div>

                    {/* Department Quick Stats */}
                    <div className="row g-2 text-center p-2 bg-light rounded text-secondary" style={{ fontSize: '0.78rem' }}>
                      <div className="col-4 border-end">
                        <strong className="d-block text-dark">{dept.vehicles_count}</strong>
                        <span>Vehicles</span>
                      </div>
                      <div className="col-4 border-end">
                        <strong className="d-block text-dark">{dept.requests_count}</strong>
                        <span>Requests</span>
                      </div>
                      <div className="col-4">
                        <strong className="d-block text-primary font-monospace">{Number(dept.total_km_driven).toLocaleString()}</strong>
                        <span>KM Driven</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-top">
                    <button
                      className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1.5"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => viewDepartment(dept.id)}
                    >
                      <Eye size={14} />
                      <span>View Department Details</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Department Details */}
      {showDetailModal && deptDetails && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2.5 px-3">
                <h6 className="modal-title">
                  Department Fuel & Fleet Profile: {deptDetails.name} ({deptDetails.code})
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>

              <div className="modal-body p-3">
                <div className="p-3 bg-light rounded border mb-3 small">
                  <div><strong>Annual Budget Ceiling:</strong> {Number(deptDetails.annual_fuel_budget).toLocaleString()} TZS</div>
                  <div><strong>Contact:</strong> {deptDetails.contact_email} | {deptDetails.contact_phone}</div>
                </div>

                <h6 className="fw-bold small text-uppercase text-secondary mb-2">Assigned Vehicles ({deptDetails.vehicles?.length || 0})</h6>
                <div className="row g-2 mb-3">
                  {deptDetails.vehicles?.map(v => (
                    <div key={v.id} className="col-md-6">
                      <div className="p-2 border rounded bg-white small d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="font-monospace text-primary">{v.registration_number}</strong>
                          <div className="text-muted">{v.make} {v.model}</div>
                        </div>
                        <span className="badge bg-light text-dark border">{v.vehicle_status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <h6 className="fw-bold small text-uppercase text-secondary mb-2">Recent Requisitions ({deptDetails.requests?.length || 0})</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Slip #</th>
                        <th>Vehicle</th>
                        <th>Destination</th>
                        <th>Litres</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptDetails.requests?.map(r => (
                        <tr key={r.id}>
                          <td className="font-monospace fw-bold">{r.form_serial_number || r.request_number}</td>
                          <td className="font-monospace">{r.vehicle_number}</td>
                          <td>{r.destination}</td>
                          <td>{r.requested_quantity_litres} L</td>
                          <td><span className="badge bg-light text-dark border">{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer bg-light py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
