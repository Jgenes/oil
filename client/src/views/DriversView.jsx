import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  Navigation,
  Car
} from 'lucide-react';

export default function DriversView() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);

  // Add Driver state
  const [newDriver, setNewDriver] = useState({
    full_name: '',
    employee_number: '',
    phone_number: '',
    email: '',
    driving_licence_number: '',
    licence_classes: 'A, B, C, D, E',
    licence_expiry_date: '2028-06-30',
    assigned_vehicle_id: '',
    employment_status: 'Active',
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [searchTerm, statusFilter]);

  async function fetchInitialData() {
    try {
      const res = await api.get('/vehicles');
      if (res.data.success) setVehicles(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchDrivers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/drivers?${params.toString()}`);
      if (res.data.success) {
        setDrivers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewDriver(id) {
    try {
      const res = await api.get(`/drivers/${id}`);
      if (res.data.success) {
        setDriverDetails(res.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      alert('Error fetching driver details: ' + err.message);
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/drivers', newDriver);
      if (res.data.success) {
        alert(res.data.message);
        setShowAddModal(false);
        fetchDrivers();
      }
    } catch (err) {
      alert('Failed to register driver: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-3 p-md-4">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Users className="text-primary" />
            <span>Moshi Co-operative University Driver Management</span>
          </h4>
          <p className="text-muted small mb-0">
            Certified university chauffeurs, licence validity tracking, driving histories, and individual fuel efficiency records.
          </p>
        </div>

        {(user?.role === 'transport_officer' || user?.role === 'admin') && (
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            <span>Register Driver</span>
          </button>
        )}
      </div>

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
                placeholder="Search driver name, employee number, licence..."
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
              <option value="">All Employment Statuses</option>
              <option value="Active">Active Duty</option>
              <option value="On Leave">On Leave</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="col-md-3 text-end">
            <span className="text-muted small">
              Total <strong>{drivers.length}</strong> drivers registered
            </span>
          </div>
        </div>
      </div>

      {/* Driver Cards Grid */}
      <div className="row g-3">
        {loading ? (
          <div className="col-12 text-center py-5 text-muted">
            <div className="spinner-border text-primary me-2" role="status" />
            Loading drivers...
          </div>
        ) : drivers.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            No drivers found matching criteria.
          </div>
        ) : (
          drivers.map((drv) => (
            <div key={drv.id} className="col-md-6 col-lg-4">
              <div className="card shadow-sm border-0 p-3 h-100 bg-white d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle bg-primary-subtle text-primary p-2 fw-bold" style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {drv.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">{drv.full_name}</h6>
                        <small className="text-muted font-monospace">{drv.employee_number}</small>
                      </div>
                    </div>
                    <span className={`badge ${drv.employment_status === 'Active' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                      {drv.employment_status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-light rounded text-secondary my-2" style={{ fontSize: '0.8rem' }}>
                    <div className="d-flex justify-content-between">
                      <span>Phone:</span>
                      <strong className="text-dark">{drv.phone_number}</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span>Assigned Vehicle:</span>
                      <strong className="text-primary font-monospace">{drv.assigned_vehicle_number || 'None'}</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span>Licence No:</span>
                      <span className="font-monospace">{drv.driving_licence_number} ({drv.licence_classes})</span>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span>Licence Expiry:</span>
                      <span className={`fw-bold ${drv.licence_status === 'Expiring Soon' ? 'text-warning' : drv.licence_status === 'Expired' ? 'text-danger' : 'text-success'}`}>
                        {drv.licence_expiry_date} ({drv.licence_status})
                      </span>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between text-muted mt-2 pt-2 border-top" style={{ fontSize: '0.75rem' }}>
                    <div>
                      <span className="d-block fw-bold text-dark font-monospace">{drv.completed_trips_count}</span>
                      <span>Trips</span>
                    </div>
                    <div>
                      <span className="d-block fw-bold text-dark font-monospace">{Number(drv.total_km_driven).toLocaleString()} KM</span>
                      <span>Distance</span>
                    </div>
                    <div>
                      <span className="d-block fw-bold text-success font-monospace">{drv.avg_km_l || '8.5'} KM/L</span>
                      <span>Avg Efficiency</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-top">
                  <button
                    className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1.5"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => viewDriver(drv.id)}
                  >
                    <Eye size={14} />
                    <span>View Driving History</span>
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Register Driver */}
      {showAddModal && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <Users size={18} />
                  <span>Register University Driver</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleAddSubmit}>
                <div className="modal-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. Ally Hamisi Swai"
                        value={newDriver.full_name}
                        onChange={(e) => setNewDriver({ ...newDriver, full_name: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Employee Identification Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        required
                        placeholder="e.g. MOCU/DRV/1120"
                        value={newDriver.employee_number}
                        onChange={(e) => setNewDriver({ ...newDriver, employee_number: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Phone Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. +255 754 000 111"
                        value={newDriver.phone_number}
                        onChange={(e) => setNewDriver({ ...newDriver, phone_number: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">University Email</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="e.g. driver@mocu.ac.tz"
                        value={newDriver.email}
                        onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Driving Licence Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        required
                        placeholder="e.g. DL-TZ-998822"
                        value={newDriver.driving_licence_number}
                        onChange={(e) => setNewDriver({ ...newDriver, driving_licence_number: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Licence Endorsement Classes</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="A, B, C, D, E"
                        value={newDriver.licence_classes}
                        onChange={(e) => setNewDriver({ ...newDriver, licence_classes: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Licence Expiry Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={newDriver.licence_expiry_date}
                        onChange={(e) => setNewDriver({ ...newDriver, licence_expiry_date: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Assigned Primary Vehicle</label>
                      <select
                        className="form-select form-select-sm"
                        value={newDriver.assigned_vehicle_id}
                        onChange={(e) => setNewDriver({ ...newDriver, assigned_vehicle_id: Number(e.target.value) })}
                      >
                        <option value="">No Primary Vehicle</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.registration_number} - {v.make} {v.model}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold">Driver Qualifications & Certifications</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Defensive driving courses, heavy commercial endorsements, experience..."
                        value={newDriver.notes}
                        onChange={(e) => setNewDriver({ ...newDriver, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 fw-bold">
                    Register Driver
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Driver Trip History */}
      {showDetailModal && driverDetails && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2.5 px-3">
                <h6 className="modal-title">
                  Driver Profile & Trip Record: {driverDetails.full_name}
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>

              <div className="modal-body p-3">
                <div className="p-3 bg-light rounded border mb-3 small">
                  <div><strong>Employee ID:</strong> {driverDetails.employee_number} | <strong>Licence:</strong> {driverDetails.driving_licence_number}</div>
                  <div><strong>Licence Expiry:</strong> {driverDetails.licence_expiry_date} ({driverDetails.licence_status})</div>
                  <div><strong>Assigned Vehicle:</strong> {driverDetails.assigned_vehicle_number || 'None'}</div>
                </div>

                <h6 className="fw-bold small text-uppercase text-secondary mb-2">Assigned Trips ({driverDetails.trips?.length || 0})</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Trip #</th>
                        <th>Vehicle</th>
                        <th>Date</th>
                        <th>Destination</th>
                        <th className="text-end">Distance</th>
                        <th className="text-end">Fuel Used</th>
                        <th className="text-end">Efficiency</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverDetails.trips?.map((t) => (
                        <tr key={t.id}>
                          <td className="font-monospace fw-bold">{t.trip_number}</td>
                          <td className="font-monospace">{t.vehicle_number}</td>
                          <td>{t.departure_datetime?.substring(0, 10)}</td>
                          <td>{t.destination}</td>
                          <td className="text-end font-monospace">{t.total_distance_km ? `${t.total_distance_km} KM` : '-'}</td>
                          <td className="text-end font-monospace">{t.fuel_consumed_litres ? `${t.fuel_consumed_litres} L` : '-'}</td>
                          <td className="text-end font-monospace fw-bold">{t.fuel_efficiency_km_l ? `${t.fuel_efficiency_km_l} KM/L` : '-'}</td>
                          <td>
                            <span className={`badge ${t.status === 'Completed' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`}>
                              {t.status}
                            </span>
                          </td>
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
