import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  Eye,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Building,
  Car
} from 'lucide-react';

export default function FuelRequestsView({ onViewSlip }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'hod', 'transport', 'hpmu', 'finance'
  const [actionDecision, setActionDecision] = useState('Recommended');
  const [actionComments, setActionComments] = useState('');
  const [actionVoteCode, setActionVoteCode] = useState('VOTE-MOCU-CENTRAL-FUEL-2026');
  const [verifiedOdo, setVerifiedOdo] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Form state for creating new requisition
  const [newReq, setNewReq] = useState({
    department_id: '',
    vehicle_id: '',
    driver_id: '',
    destination: '',
    trip_purpose: '',
    expected_departure_date: new Date().toISOString().substring(0, 16),
    expected_return_date: new Date(Date.now() + 86400000).toISOString().substring(0, 16),
    last_request_odometer: '',
    present_request_odometer: '',
    estimated_distance_km: '',
    fuel_type: 'Diesel',
    requested_quantity_litres: '',
    unit_price: 3280,
    items: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, deptFilter, searchTerm]);

  async function fetchInitialData() {
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
      console.error(err);
    }
  }

  async function fetchRequests() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (deptFilter) params.append('department_id', deptFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await api.get(`/fuel-requests?${params.toString()}`);
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleVehicleSelect = (vId) => {
    const v = vehicles.find(item => item.id === Number(vId));
    if (v) {
      setNewReq(prev => ({
        ...prev,
        vehicle_id: v.id,
        fuel_type: v.fuel_type,
        present_request_odometer: v.current_odometer,
        last_request_odometer: Math.max(0, v.current_odometer - 500),
        driver_id: v.assigned_driver_id || prev.driver_id,
        department_id: v.assigned_department_id || prev.department_id,
        unit_price: v.fuel_type === 'Diesel' ? 3280 : 3240
      }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/fuel-requests', newReq);
      if (res.data.success) {
        alert(res.data.message);
        setShowCreateModal(false);
        fetchRequests();
      }
    } catch (err) {
      alert('Error creating requisition: ' + (err.response?.data?.error || err.message));
    }
  };

  const openActionModal = (req, type) => {
    setSelectedRequest(req);
    setActionType(type);
    setActionComments('');
    setVerifiedOdo(req.present_request_odometer);
    if (type === 'hod') setActionDecision('Recommended');
    if (type === 'transport') setActionDecision('Verified');
    if (type === 'hpmu') setActionDecision('Authorized');
    setShowActionModal(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmittingAction(true);

    try {
      let endpoint = '';
      let payload = {};

      if (actionType === 'hod') {
        endpoint = `/fuel-requests/${selectedRequest.id}/hod-recommend`;
        payload = { action: actionDecision, comments: actionComments };
      } else if (actionType === 'transport') {
        endpoint = `/fuel-requests/${selectedRequest.id}/transport-verify`;
        payload = { action: actionDecision, comments: actionComments, verified_odometer: verifiedOdo };
      } else if (actionType === 'hpmu') {
        endpoint = `/fuel-requests/${selectedRequest.id}/authorize`;
        payload = { action: actionDecision, comments: actionComments };
      } else if (actionType === 'finance') {
        endpoint = `/fuel-requests/${selectedRequest.id}/finance-record`;
        payload = { vote_code: actionVoteCode, comments: actionComments };
      }

      const res = await api.post(endpoint, payload);
      if (res.data.success) {
        alert(res.data.message);
        setShowActionModal(false);
        fetchRequests();
      }
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="p-3 p-md-4">
      
      {/* Header and Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FileText className="text-primary" />
            <span>Fuel Requisition Management & Approval</span>
          </h4>
          <p className="text-muted small mb-0">
            Multi-level approval workflow: Submitter &rarr; HOD Review &rarr; Transport Verification &rarr; HPMU Authorization &rarr; Finance Allocation &rarr; Station Issuance.
          </p>
        </div>

        <button
          className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
          onClick={() => {
            if (vehicles.length > 0) handleVehicleSelect(vehicles[0].id);
            setShowCreateModal(true);
          }}
        >
          <Plus size={18} />
          <span>New Fuel Requisition</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={15} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search slip no, vehicle, destination, submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted (Pending HOD)</option>
              <option value="HOD_Recommended">HOD Recommended (Pending Transport)</option>
              <option value="Transport_Verified">Transport Verified (Pending HPMU)</option>
              <option value="Authorized">Authorized (Pending Finance)</option>
              <option value="Finance_Recorded">Finance Recorded (Pending Issuance)</option>
              <option value="Issued">Issued (Trip Active)</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div className="col-md-2 text-end">
            <span className="text-muted small">
              Found <strong>{requests.length}</strong> requisitions
            </span>
          </div>
        </div>
      </div>

      {/* Requisitions List Table */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
            <thead className="table-light">
              <tr>
                <th>Slip No.</th>
                <th>Department</th>
                <th>Vehicle & Driver</th>
                <th>Destination & Purpose</th>
                <th>Departure / Return</th>
                <th className="text-end">Litres</th>
                <th className="text-end">Estimated Cost</th>
                <th>Status & Stage</th>
                <th className="text-center">Official Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Loading requisitions...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No fuel requisitions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    {/* Slip No & Date */}
                    <td>
                      <div className="fw-bold font-monospace text-primary" style={{ fontSize: '0.92rem' }}>
                        No: {req.form_serial_number || req.request_number}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {req.created_at ? req.created_at.substring(0, 10) : ''}
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <div className="fw-semibold text-dark">{req.department_name}</div>
                      <div className="text-muted small">By: {req.requested_by_name}</div>
                    </td>

                    {/* Vehicle & Driver */}
                    <td>
                      <div className="fw-bold text-dark font-monospace">{req.vehicle_number}</div>
                      <div className="text-muted" style={{ fontSize: '0.74rem' }}>
                        {req.vehicle_make} {req.vehicle_model}
                      </div>
                      <div className="text-secondary small">
                        Driver: <strong>{req.driver_name || 'Not assigned'}</strong>
                      </div>
                    </td>

                    {/* Destination & Purpose */}
                    <td style={{ maxWidth: '200px' }}>
                      <div className="fw-semibold text-truncate" title={req.destination}>
                        {req.destination}
                      </div>
                      <div className="text-muted text-truncate small" title={req.trip_purpose}>
                        {req.trip_purpose}
                      </div>
                    </td>

                    {/* Expected Dates */}
                    <td>
                      <div className="small">
                        {req.expected_departure_date ? req.expected_departure_date.substring(0, 10) : '-'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        to {req.expected_return_date ? req.expected_return_date.substring(0, 10) : '-'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Est: {req.estimated_distance_km} KM
                      </div>
                    </td>

                    {/* Litres */}
                    <td className="text-end font-monospace">
                      <span className="fw-bold">{req.requested_quantity_litres} L</span>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{req.fuel_type}</div>
                    </td>

                    {/* Estimated Cost */}
                    <td className="text-end font-monospace fw-semibold text-dark">
                      {Number(req.estimated_fuel_cost).toLocaleString()} TZS
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge-status badge-${req.status.toLowerCase().replace('_', '')}`}>
                        {req.status}
                      </span>
                      {req.rejection_reason && (
                        <div className="text-danger small mt-1" style={{ fontSize: '0.72rem' }}>
                          Reason: {req.rejection_reason}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="d-flex flex-column gap-1 align-items-center">
                        
                        {/* Print / View Physical Slip */}
                        <button
                          className="btn btn-sm btn-outline-primary py-0.5 px-2 d-flex align-items-center gap-1 w-100 justify-content-center"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => onViewSlip(req.id)}
                          title="View Official Physical Paper Slip Replica"
                        >
                          <Eye size={13} />
                          <span>View MoCU Slip</span>
                        </button>

                        {/* Step 1 Workflow Action: HOD Recommendation */}
                        {req.status === 'Submitted' && (user?.role === 'hod' || user?.role === 'admin') && (
                          <button
                            className="btn btn-sm btn-warning py-0.5 px-2 w-100 fw-medium"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => openActionModal(req, 'hod')}
                          >
                            HOD Review
                          </button>
                        )}

                        {/* Step 2 Workflow Action: Transport Verification */}
                        {req.status === 'HOD_Recommended' && (user?.role === 'transport_officer' || user?.role === 'admin') && (
                          <button
                            className="btn btn-sm btn-info text-white py-0.5 px-2 w-100 fw-medium"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => openActionModal(req, 'transport')}
                          >
                            Verify Vehicle
                          </button>
                        )}

                        {/* Step 3 Workflow Action: HPMU Authorization ("I authorize / do not authorize") */}
                        {req.status === 'Transport_Verified' && (user?.role === 'approving_officer' || user?.role === 'management' || user?.role === 'admin') && (
                          <button
                            className="btn btn-sm btn-success py-0.5 px-2 w-100 fw-bold"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => openActionModal(req, 'hpmu')}
                          >
                            HPMU Authorize
                          </button>
                        )}

                        {/* Step 4 Workflow Action: Finance Recording */}
                        {req.status === 'Authorized' && (user?.role === 'finance_officer' || user?.role === 'admin') && (
                          <button
                            className="btn btn-sm btn-dark py-0.5 px-2 w-100 fw-medium"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => openActionModal(req, 'finance')}
                          >
                            Commit Vote
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Fuel Requisition Form */}
      {showCreateModal && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <FileText size={18} />
                  <span>Submit Fuel Requisition Form (MoCU Official Form)</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-3 p-md-4">
                  
                  <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>
                      Digital requisition automatically generates the official MoCU serial reference and advances to Head of Department review.
                    </span>
                  </div>

                  <div className="row g-3">
                    {/* Requisition Officer */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Name of Requisition Officer</label>
                      <input type="text" className="form-control form-control-sm bg-light" value={user?.name || ''} readOnly />
                    </div>

                    {/* Department */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Department / Section *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={newReq.department_id}
                        onChange={(e) => setNewReq({ ...newReq, department_id: Number(e.target.value) })}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Vehicle Number */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Vehicle Registration Number *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={newReq.vehicle_id}
                        onChange={(e) => handleVehicleSelect(e.target.value)}
                      >
                        <option value="">Select Vehicle</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.registration_number} - {v.make} {v.model} ({v.fuel_type}, Tank: {v.fuel_tank_capacity}L)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Driver */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Assigned Driver</label>
                      <select
                        className="form-select form-select-sm"
                        value={newReq.driver_id}
                        onChange={(e) => setNewReq({ ...newReq, driver_id: Number(e.target.value) })}
                      >
                        <option value="">Select Driver</option>
                        {drivers.map(dr => (
                          <option key={dr.id} value={dr.id}>{dr.full_name} ({dr.employee_number})</option>
                        ))}
                      </select>
                    </div>

                    {/* Destination */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Trip Destination *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. Dodoma, Hai, Rombo, Dar es Salaam..."
                        value={newReq.destination}
                        onChange={(e) => setNewReq({ ...newReq, destination: e.target.value })}
                      />
                    </div>

                    {/* Purpose */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Please Supply the Following for (Trip Purpose) *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. Campus water inspection, Student field supervision..."
                        value={newReq.trip_purpose}
                        onChange={(e) => setNewReq({ ...newReq, trip_purpose: e.target.value })}
                      />
                    </div>

                    {/* Departure Date */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Expected Departure Date & Time</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={newReq.expected_departure_date}
                        onChange={(e) => setNewReq({ ...newReq, expected_departure_date: e.target.value })}
                      />
                    </div>

                    {/* Return Date */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Expected Return Date & Time</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={newReq.expected_return_date}
                        onChange={(e) => setNewReq({ ...newReq, expected_return_date: e.target.value })}
                      />
                    </div>

                    {/* Odometer Fields from official slip */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Last Request Kilometer (KM)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        value={newReq.last_request_odometer}
                        onChange={(e) => setNewReq({ ...newReq, last_request_odometer: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Present Request Kilometer (KM)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        value={newReq.present_request_odometer}
                        onChange={(e) => setNewReq({ ...newReq, present_request_odometer: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Estimated Distance (KM)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        placeholder="e.g. 450"
                        value={newReq.estimated_distance_km}
                        onChange={(e) => setNewReq({ ...newReq, estimated_distance_km: Number(e.target.value) })}
                      />
                    </div>

                    {/* Fuel Details */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Type of Fuel</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light"
                        readOnly
                        value={newReq.fuel_type}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Requested Fuel Quantity (Litres) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        className="form-control form-control-sm font-monospace fw-bold"
                        placeholder="e.g. 65"
                        value={newReq.requested_quantity_litres}
                        onChange={(e) => setNewReq({ ...newReq, requested_quantity_litres: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Estimated Total Value (TZS)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light font-monospace fw-bold text-success"
                        readOnly
                        value={`${(Number(newReq.requested_quantity_litres || 0) * Number(newReq.unit_price)).toLocaleString()} TZS`}
                      />
                    </div>

                  </div>

                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 fw-bold">
                    Submit Fuel Requisition
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Workflow Action (HOD / Transport / HPMU / Finance) */}
      {showActionModal && selectedRequest && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2.5 px-3">
                <h6 className="modal-title">
                  {actionType === 'hod' && 'Head of Department Review & Recommendation'}
                  {actionType === 'transport' && 'Transport Section Verification & Vehicle Inspection'}
                  {actionType === 'hpmu' && 'HPMU Authorization Endorsement'}
                  {actionType === 'finance' && 'Finance & Accounts Vote Commitment'}
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowActionModal(false)}></button>
              </div>

              <form onSubmit={handleActionSubmit}>
                <div className="modal-body p-3">
                  <div className="p-2.5 bg-light rounded border mb-3 small">
                    <div><strong>Slip No:</strong> {selectedRequest.form_serial_number || selectedRequest.request_number}</div>
                    <div><strong>Vehicle:</strong> {selectedRequest.vehicle_number} | <strong>Dept:</strong> {selectedRequest.department_name}</div>
                    <div><strong>Litres:</strong> {selectedRequest.requested_quantity_litres} L ({selectedRequest.fuel_type}) | <strong>Cost:</strong> {Number(selectedRequest.estimated_fuel_cost).toLocaleString()} TZS</div>
                    <div><strong>Destination:</strong> {selectedRequest.destination}</div>
                  </div>

                  {/* Decision select for HOD, Transport, HPMU */}
                  {actionType !== 'finance' && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Decision *</label>
                      <select
                        className="form-select form-select-sm fw-bold"
                        value={actionDecision}
                        onChange={(e) => setActionDecision(e.target.value)}
                      >
                        {actionType === 'hod' && (
                          <>
                            <option value="Recommended">Recommend for Approval (Yes)</option>
                            <option value="Rejected">Reject Request (No)</option>
                          </>
                        )}
                        {actionType === 'transport' && (
                          <>
                            <option value="Verified">Verify Vehicle Roadworthiness & Cleared (Yes)</option>
                            <option value="Rejected">Reject Vehicle Condition / Logistics (No)</option>
                          </>
                        )}
                        {actionType === 'hpmu' && (
                          <>
                            <option value="Authorized">I authorize the above mentioned fuel to be supplied</option>
                            <option value="Rejected">I do not authorize the above mentioned fuel to be supplied</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Transport Odometer verification */}
                  {actionType === 'transport' && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Verified Physical Odometer Reading (KM)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        value={verifiedOdo}
                        onChange={(e) => setVerifiedOdo(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Finance Vote Code */}
                  {actionType === 'finance' && (
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Budget Vote / Cost Code *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        required
                        value={actionVoteCode}
                        onChange={(e) => setActionVoteCode(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Comments / Endorsement text */}
                  <div className="mb-2">
                    <label className="form-label small fw-bold">Official Remarks / Comments</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Enter verification notes, justification, or reason..."
                      value={actionComments}
                      onChange={(e) => setActionComments(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowActionModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-3 fw-bold" disabled={submittingAction}>
                    {submittingAction ? 'Processing...' : 'Confirm Decision'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
