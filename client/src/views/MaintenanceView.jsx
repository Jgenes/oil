import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Car,
  Clock,
  Check
} from 'lucide-react';

export default function MaintenanceView() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeCost, setCompleteCost] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

  // New maintenance record state
  const [newMnt, setNewMnt] = useState({
    vehicle_id: '',
    service_date: new Date().toISOString().substring(0, 10),
    service_mileage: '',
    service_type: 'Routine Minor Service',
    description: '',
    spare_parts_used: '',
    service_provider: 'MoCU Mechanical Workshop',
    cost: '',
    invoice_number: '',
    next_service_date: '',
    next_service_mileage: '',
    supporting_documents: '',
    set_vehicle_status: 'Under Maintenance'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMaintenance();
  }, [searchTerm, statusFilter]);

  async function fetchInitialData() {
    try {
      const res = await api.get('/vehicles');
      if (res.data.success) {
        setVehicles(res.data.data);
        if (res.data.data.length > 0) {
          handleVehicleSelect(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchMaintenance() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/maintenance?${params.toString()}`);
      if (res.data.success) {
        setRecords(res.data.data.records);
        setReminders(res.data.data.reminders || []);
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
      setNewMnt(prev => ({
        ...prev,
        vehicle_id: v.id,
        service_mileage: v.current_odometer,
        next_service_mileage: v.current_odometer + 5000,
        next_service_date: new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10)
      }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/maintenance', newMnt);
      if (res.data.success) {
        alert(res.data.message);
        setShowAddModal(false);
        fetchMaintenance();
      }
    } catch (err) {
      alert('Error creating maintenance record: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      const res = await api.post(`/maintenance/${selectedRecord.id}/complete`, {
        final_cost: completeCost,
        completion_notes: completeNotes,
        return_vehicle_to_active: true
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowCompleteModal(false);
        fetchMaintenance();
      }
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-3 p-md-4">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Wrench className="text-primary" />
            <span>Vehicle Maintenance & Service Management</span>
          </h4>
          <p className="text-muted small mb-0">
            Log routine service schedules, spare parts replacements, garage invoices, and track automated service reminders.
          </p>
        </div>

        {(user?.role === 'transport_officer' || user?.role === 'admin') && (
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            <span>Log Vehicle Service</span>
          </button>
        )}
      </div>

      {/* Upcoming Service Reminders Widget */}
      {reminders.length > 0 && (
        <div className="card shadow-sm border-0 mb-4 bg-white">
          <div className="card-header bg-warning-subtle text-dark py-2.5 px-3 border-0 d-flex align-items-center gap-2">
            <Clock size={18} className="text-warning-emphasis" />
            <strong style={{ fontSize: '0.85rem' }}>Automated Maintenance & Inspection Reminders</strong>
          </div>
          <div className="card-body p-3">
            <div className="row g-2">
              {reminders.map((r, i) => (
                <div key={i} className="col-md-6 col-lg-4">
                  <div className="p-2.5 rounded border bg-light d-flex justify-content-between align-items-center small">
                    <div>
                      <strong className="text-dark font-monospace">{r.registration_number}</strong>
                      <span className="text-muted ms-1">({r.make} {r.model})</span>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>Next: {r.service_type}</div>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-warning text-dark font-monospace">
                        {r.km_remaining !== null ? `${r.km_remaining} KM remaining` : `${r.days_remaining} days`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={15} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search maintenance ref, vehicle, garage, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Service Statuses</option>
              <option value="In Progress">In Progress (Currently in Workshop)</option>
              <option value="Completed">Completed Services</option>
            </select>
          </div>

          <div className="col-md-3 text-end">
            <span className="text-muted small">
              Found <strong>{records.length}</strong> service records
            </span>
          </div>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
            <thead className="table-light">
              <tr>
                <th>Service Ref</th>
                <th>Vehicle</th>
                <th>Service Date</th>
                <th>Service Type</th>
                <th>Mileage (KM)</th>
                <th>Description & Parts</th>
                <th>Service Provider</th>
                <th className="text-end">Cost (TZS)</th>
                <th>Next Service Due</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Loading maintenance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-muted">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                records.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="fw-bold font-monospace text-dark">{m.maintenance_number}</div>
                    </td>
                    <td>
                      <div className="fw-bold font-monospace text-dark">{m.registration_number}</div>
                      <div className="text-muted small">{m.make} {m.model}</div>
                    </td>
                    <td>{m.service_date}</td>
                    <td>
                      <span className="fw-semibold text-primary">{m.service_type}</span>
                    </td>
                    <td className="font-monospace">{Number(m.service_mileage).toLocaleString()} KM</td>
                    <td style={{ maxWidth: '240px' }}>
                      <div className="fw-semibold text-truncate" title={m.description}>{m.description}</div>
                      {m.spare_parts_used && (
                        <div className="text-muted text-truncate small" title={m.spare_parts_used}>
                          Parts: {m.spare_parts_used}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold">{m.service_provider}</div>
                      {m.supporting_documents && (
                        <div className="text-muted small font-monospace" title={m.supporting_documents}>
                          📎 {m.supporting_documents}
                        </div>
                      )}
                    </td>
                    <td className="text-end font-monospace fw-bold text-dark">
                      {Number(m.cost).toLocaleString()} TZS
                    </td>
                    <td>
                      <div className="small font-monospace">
                        {m.next_service_mileage ? `${Number(m.next_service_mileage).toLocaleString()} KM` : '-'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{m.next_service_date || ''}</div>
                    </td>
                    <td>
                      <span className={`badge ${m.status === 'Completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="text-center">
                      {m.status === 'In Progress' ? (
                        <button
                          className="btn btn-sm btn-outline-success py-0.5 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedRecord(m);
                            setCompleteCost(m.cost);
                            setCompleteNotes('');
                            setShowCompleteModal(true);
                          }}
                        >
                          Complete Service
                        </button>
                      ) : (
                        <span className="text-success small fw-semibold">
                          <Check size={14} className="d-inline" /> Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Service */}
      {showAddModal && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <Wrench size={18} />
                  <span>Log Vehicle Maintenance & Workshop Service</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleAddSubmit}>
                <div className="modal-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Vehicle Registration *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={newMnt.vehicle_id}
                        onChange={(e) => handleVehicleSelect(e.target.value)}
                      >
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.registration_number} - {v.make} {v.model} ({v.current_odometer} KM)</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Service Type *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={newMnt.service_type}
                        onChange={(e) => setNewMnt({ ...newMnt, service_type: e.target.value })}
                      >
                        <option value="Routine Minor Service">Routine Minor Service (5,000 KM)</option>
                        <option value="Major Service">Major Comprehensive Service (10,000 KM)</option>
                        <option value="Brake System Overhaul">Brake System Overhaul</option>
                        <option value="Tire Replacement">Tire Replacement & Wheel Alignment</option>
                        <option value="Suspension Repair">Suspension & Steering Repair</option>
                        <option value="Electrical System">Electrical / Battery Replacement</option>
                        <option value="Emergency Repair">Emergency Breakdown Repair</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Service Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={newMnt.service_date}
                        onChange={(e) => setNewMnt({ ...newMnt, service_date: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Current Mileage at Service (KM) *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        required
                        value={newMnt.service_mileage}
                        onChange={(e) => setNewMnt({ ...newMnt, service_mileage: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Total Estimated Cost (TZS) *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace fw-bold"
                        required
                        placeholder="e.g. 850000"
                        value={newMnt.cost}
                        onChange={(e) => setNewMnt({ ...newMnt, cost: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Service Provider / Garage *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. MoCU Central Workshop or Toyota Tanzania Moshi"
                        value={newMnt.service_provider}
                        onChange={(e) => setNewMnt({ ...newMnt, service_provider: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Invoice / Work Order Reference</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        placeholder="e.g. INV-WKSH-2026-118"
                        value={newMnt.invoice_number}
                        onChange={(e) => setNewMnt({ ...newMnt, invoice_number: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">Maintenance Description *</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        required
                        placeholder="Detailed description of works performed..."
                        value={newMnt.description}
                        onChange={(e) => setNewMnt({ ...newMnt, description: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">Spare Parts Used</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="List of genuine parts, oil viscosity, part serial numbers..."
                        value={newMnt.spare_parts_used}
                        onChange={(e) => setNewMnt({ ...newMnt, spare_parts_used: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Next Service Target Mileage (KM)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        value={newMnt.next_service_mileage}
                        onChange={(e) => setNewMnt({ ...newMnt, next_service_mileage: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Next Service Due Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newMnt.next_service_date}
                        onChange={(e) => setNewMnt({ ...newMnt, next_service_date: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">Supporting Documents (Job Card / Garage Invoice Reference)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. DOC-TOYOTA-JC-99214.pdf / Attached Job Card No. 8812"
                        value={newMnt.supporting_documents}
                        onChange={(e) => setNewMnt({ ...newMnt, supporting_documents: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 fw-bold">
                    Log Maintenance Record
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Complete Service */}
      {showCompleteModal && selectedRecord && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white py-2.5 px-3">
                <h6 className="modal-title">Certify Maintenance Completion</h6>
                <button className="btn-close btn-close-white" onClick={() => setShowCompleteModal(false)}></button>
              </div>

              <form onSubmit={handleCompleteSubmit}>
                <div className="modal-body p-3">
                  <div className="p-2.5 bg-light rounded border mb-3 small">
                    <div><strong>Vehicle:</strong> {selectedRecord.registration_number} ({selectedRecord.make} {selectedRecord.model})</div>
                    <div><strong>Service:</strong> {selectedRecord.service_type}</div>
                    <div><strong>Provider:</strong> {selectedRecord.service_provider}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Final Certified Cost (TZS) *</label>
                    <input
                      type="number"
                      className="form-control form-control-sm font-monospace fw-bold"
                      required
                      value={completeCost}
                      onChange={(e) => setCompleteCost(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Completion Notes / Road Test Certification</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Road test satisfactory, vehicle released to active fleet..."
                      value={completeNotes}
                      onChange={(e) => setCompleteNotes(e.target.value)}
                    />
                  </div>

                  <div className="alert alert-info py-2 px-3 small mb-0">
                    Vehicle status will automatically revert from 'Under Maintenance' to 'Active'.
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCompleteModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-3 text-white fw-bold">
                    Certify & Release Vehicle
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
