import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  Plus,
  Search,
  Filter,
  Eye,
  Wrench,
  Fuel,
  Navigation,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Shield,
  FileText
} from 'lucide-react';

export default function VehiclesView() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdjustOdoModal, setShowAdjustOdoModal] = useState(false);
  const [newOdo, setNewOdo] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Add vehicle state
  const [newVeh, setNewVeh] = useState({
    registration_number: '',
    make: 'Toyota',
    model: '',
    category: 'Operational / Pick-up',
    fuel_type: 'Diesel',
    engine_capacity: '2800 cc',
    assigned_department_id: '',
    assigned_driver_id: '',
    current_odometer: 0,
    fuel_tank_capacity: 80,
    standard_efficiency_km_l: 8.5,
    insurance_expiry_date: '2027-06-30',
    inspection_expiry_date: '2027-05-31',
    chassis_number: '',
    year_of_manufacture: 2022,
    color: 'White',
    image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, deptFilter, categoryFilter, searchTerm]);

  async function fetchInitialData() {
    try {
      const [deptRes, drvRes] = await Promise.all([
        api.get('/departments'),
        api.get('/drivers')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (drvRes.data.success) setDrivers(drvRes.data.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchVehicles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (deptFilter) params.append('department_id', deptFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await api.get(`/vehicles?${params.toString()}`);
      if (res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewVehicle(id) {
    try {
      const res = await api.get(`/vehicles/${id}`);
      if (res.data.success) {
        setVehicleDetails(res.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      alert('Failed to load vehicle details: ' + err.message);
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/vehicles', newVeh);
      if (res.data.success) {
        alert(res.data.message);
        setShowAddModal(false);
        fetchVehicles();
      }
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAdjustOdometer = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setAdjusting(true);
    try {
      const res = await api.post(`/vehicles/${selectedVehicle.id}/adjust-odometer`, {
        new_odometer: newOdo,
        reason: adjustReason
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowAdjustOdoModal(false);
        fetchVehicles();
        if (showDetailModal) viewVehicle(selectedVehicle.id);
      }
    } catch (err) {
      alert('Adjustment failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setAdjusting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/vehicles/${id}/status`, { status });
      if (res.data.success) {
        fetchVehicles();
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
            <Car className="text-primary" />
            <span>Moshi Co-operative University Vehicle Fleet</span>
          </h4>
          <p className="text-muted small mb-0">
            Registered university vehicles, operational status, odometer tracking, statutory inspections, and assignment logs.
          </p>
        </div>

        {(user?.role === 'transport_officer' || user?.role === 'admin') && (
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            <span>Register Vehicle</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <Search size={15} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search registration, make, model..."
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
              <option value="Active">Active (Ready)</option>
              <option value="On Trip">On Trip (In Transit)</option>
              <option value="Under Maintenance">Under Maintenance (Workshop)</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Executive / SUV">Executive / SUV</option>
              <option value="Operational / Pick-up">Operational / Pick-up</option>
              <option value="Passenger / Bus">Passenger / Bus</option>
              <option value="Utility / Van">Utility / Van</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Assigned Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Grid / Cards */}
      <div className="row g-3">
        {loading ? (
          <div className="col-12 text-center py-5 text-muted">
            <div className="spinner-border text-primary me-2" role="status" />
            Loading vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            No vehicles found matching the filter parameters.
          </div>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="col-md-6 col-xl-4">
              <div className="card shadow-sm border-0 h-100 overflow-hidden bg-white">
                
                {/* Vehicle Image & Badges */}
                <div className="position-relative" style={{ height: '170px', overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                  <img
                    src={v.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'}
                    alt={v.registration_number}
                    className="w-100 h-100 object-fit-cover"
                  />
                  <div className="position-absolute top-0 start-0 m-2">
                    <span className="badge bg-dark bg-opacity-75 font-monospace fs-6 px-2.5 py-1">
                      {v.registration_number}
                    </span>
                  </div>
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className={`badge ${v.vehicle_status === 'Active' ? 'bg-success' : v.vehicle_status === 'On Trip' ? 'bg-info text-white' : v.vehicle_status === 'Under Maintenance' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                      {v.vehicle_status}
                    </span>
                  </div>
                </div>

                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">{v.make} {v.model}</h6>
                        <small className="text-muted">{v.category} • {v.year_of_manufacture || '2022'}</small>
                      </div>
                      <span className="badge bg-light text-dark border font-monospace">
                        {v.fuel_type}
                      </span>
                    </div>

                    <div className="my-2 p-2 bg-light rounded text-secondary" style={{ fontSize: '0.8rem' }}>
                      <div className="d-flex justify-content-between">
                        <span>Assigned Section:</span>
                        <strong className="text-dark text-truncate" style={{ maxWidth: '170px' }}>{v.department_name}</strong>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <span>Assigned Driver:</span>
                        <strong className="text-dark">{v.driver_name || 'Unassigned'}</strong>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <span>Current Odometer:</span>
                        <strong className="font-monospace text-primary">{Number(v.current_odometer).toLocaleString()} KM</strong>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <span>Tank Capacity:</span>
                        <span>{v.fuel_tank_capacity} L (Target: {v.standard_efficiency_km_l} KM/L)</span>
                      </div>
                    </div>

                    {/* Inspection Expiry Warning Badge if due */}
                    {v.inspection_expiry_date && (
                      <div className="d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.74rem' }}>
                        <Clock size={13} className="text-warning" />
                        <span>Inspection: {v.inspection_expiry_date}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 pt-2 border-top d-flex gap-2 justify-content-between">
                    <button
                      className="btn btn-sm btn-outline-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                      onClick={() => viewVehicle(v.id)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <Eye size={14} />
                      <span>Full History</span>
                    </button>

                    {(user?.role === 'transport_officer' || user?.role === 'admin') && (
                      <button
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                        style={{ fontSize: '0.78rem' }}
                        title="Authorized Odometer Correction"
                        onClick={() => {
                          setSelectedVehicle(v);
                          setNewOdo(v.current_odometer);
                          setAdjustReason('');
                          setShowAdjustOdoModal(true);
                        }}
                      >
                        <Edit size={14} />
                        <span>Adjust KM</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Register Vehicle */}
      {showAddModal && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <Car size={18} />
                  <span>Register University Vehicle</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleAddSubmit}>
                <div className="modal-body p-3 p-md-4">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Registration Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace fw-bold"
                        required
                        placeholder="e.g. SM 4123 or DFPA 2045"
                        value={newVeh.registration_number}
                        onChange={(e) => setNewVeh({ ...newVeh, registration_number: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Make *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. Toyota"
                        value={newVeh.make}
                        onChange={(e) => setNewVeh({ ...newVeh, make: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Model *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        placeholder="e.g. Land Cruiser Prado TX"
                        value={newVeh.model}
                        onChange={(e) => setNewVeh({ ...newVeh, model: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Category *</label>
                      <select
                        className="form-select form-select-sm"
                        value={newVeh.category}
                        onChange={(e) => setNewVeh({ ...newVeh, category: e.target.value })}
                      >
                        <option value="Executive / SUV">Executive / SUV</option>
                        <option value="Operational / Pick-up">Operational / Pick-up</option>
                        <option value="Passenger / Bus">Passenger / Bus</option>
                        <option value="Utility / Van">Utility / Van</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Fuel Type *</label>
                      <select
                        className="form-select form-select-sm"
                        value={newVeh.fuel_type}
                        onChange={(e) => setNewVeh({ ...newVeh, fuel_type: e.target.value })}
                      >
                        <option value="Diesel">Diesel</option>
                        <option value="Petrol">Petrol</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Engine Capacity</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 2982 cc"
                        value={newVeh.engine_capacity}
                        onChange={(e) => setNewVeh({ ...newVeh, engine_capacity: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Assigned Department</label>
                      <select
                        className="form-select form-select-sm"
                        value={newVeh.assigned_department_id}
                        onChange={(e) => setNewVeh({ ...newVeh, assigned_department_id: Number(e.target.value) })}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Assigned Primary Driver</label>
                      <select
                        className="form-select form-select-sm"
                        value={newVeh.assigned_driver_id}
                        onChange={(e) => setNewVeh({ ...newVeh, assigned_driver_id: Number(e.target.value) })}
                      >
                        <option value="">Select Driver</option>
                        {drivers.map(dr => (
                          <option key={dr.id} value={dr.id}>{dr.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Current Odometer (KM)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        value={newVeh.current_odometer}
                        onChange={(e) => setNewVeh({ ...newVeh, current_odometer: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Fuel Tank Capacity (Litres) *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        required
                        value={newVeh.fuel_tank_capacity}
                        onChange={(e) => setNewVeh({ ...newVeh, fuel_tank_capacity: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold">Baseline Efficiency (KM/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control form-control-sm font-monospace"
                        value={newVeh.standard_efficiency_km_l}
                        onChange={(e) => setNewVeh({ ...newVeh, standard_efficiency_km_l: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Statutory Inspection Expiry</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newVeh.inspection_expiry_date}
                        onChange={(e) => setNewVeh({ ...newVeh, inspection_expiry_date: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Insurance Expiry Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newVeh.insurance_expiry_date}
                        onChange={(e) => setNewVeh({ ...newVeh, insurance_expiry_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 fw-bold">
                    Save Vehicle
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Vehicle Details & History */}
      {showDetailModal && vehicleDetails && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <Car size={18} />
                  <span>Vehicle Profile & Complete Audit History: {vehicleDetails.registration_number}</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>

              <div className="modal-body p-3 p-md-4">
                {/* Specifications Bar */}
                <div className="row g-3 mb-4 p-3 bg-light rounded border">
                  <div className="col-md-3">
                    <small className="text-muted d-block">Make & Model</small>
                    <strong>{vehicleDetails.make} {vehicleDetails.model}</strong>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">Category / Fuel</small>
                    <strong>{vehicleDetails.category} ({vehicleDetails.fuel_type})</strong>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">Department</small>
                    <strong>{vehicleDetails.department_name}</strong>
                  </div>
                  <div className="col-md-3">
                    <small className="text-muted d-block">Odometer / Baseline</small>
                    <strong className="text-primary font-monospace">{Number(vehicleDetails.current_odometer).toLocaleString()} KM</strong> ({vehicleDetails.standard_efficiency_km_l} KM/L)
                  </div>
                </div>

                {/* Tabs: Trips, Service, Adjustments */}
                <ul className="nav nav-tabs mb-3" role="tablist">
                  <li className="nav-item">
                    <button className="nav-link active fw-bold" data-bs-toggle="tab" data-bs-target="#tab-trips">
                      Trip History ({vehicleDetails.trips?.length || 0})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link fw-bold" data-bs-toggle="tab" data-bs-target="#tab-maint">
                      Service & Maintenance ({vehicleDetails.maintenance?.length || 0})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link fw-bold" data-bs-toggle="tab" data-bs-target="#tab-odo">
                      Odometer Corrections ({vehicleDetails.odometerAdjustments?.length || 0})
                    </button>
                  </li>
                </ul>

                <div className="tab-content">
                  {/* Trip history tab */}
                  <div className="tab-pane fade show active" id="tab-trips">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Trip #</th>
                            <th>Date</th>
                            <th>Destination & Purpose</th>
                            <th>Driver</th>
                            <th className="text-end">Start KM</th>
                            <th className="text-end">End KM</th>
                            <th className="text-end">Distance</th>
                            <th className="text-end">Efficiency</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleDetails.trips?.map((t) => (
                            <tr key={t.id}>
                              <td className="font-monospace fw-bold">{t.trip_number}</td>
                              <td>{t.departure_datetime?.substring(0, 10)}</td>
                              <td>{t.destination}</td>
                              <td>{t.driver_name}</td>
                              <td className="text-end font-monospace">{t.starting_odometer}</td>
                              <td className="text-end font-monospace">{t.ending_odometer || '-'}</td>
                              <td className="text-end font-monospace fw-bold">{t.total_distance_km ? `${t.total_distance_km} KM` : '-'}</td>
                              <td className="text-end font-monospace">{t.fuel_efficiency_km_l ? `${t.fuel_efficiency_km_l} KM/L` : '-'}</td>
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

                  {/* Maintenance tab */}
                  <div className="tab-pane fade" id="tab-maint">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Service Type</th>
                            <th>Service Provider</th>
                            <th>Mileage</th>
                            <th>Cost (TZS)</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleDetails.maintenance?.map((m) => (
                            <tr key={m.id}>
                              <td>{m.service_date}</td>
                              <td className="fw-bold">{m.service_type}</td>
                              <td>{m.service_provider}</td>
                              <td className="font-monospace">{m.service_mileage} KM</td>
                              <td className="font-monospace fw-bold">{Number(m.cost).toLocaleString()} TZS</td>
                              <td><span className="badge bg-success-subtle text-success">{m.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Odometer adjustments tab */}
                  <div className="tab-pane fade" id="tab-odo">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Previous KM</th>
                            <th>Corrected KM</th>
                            <th>Justification Reason</th>
                            <th>Authorized By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleDetails.odometerAdjustments?.map((adj) => (
                            <tr key={adj.id}>
                              <td>{adj.created_at?.substring(0, 16).replace('T', ' ')}</td>
                              <td className="font-monospace">{adj.previous_odometer} KM</td>
                              <td className="font-monospace fw-bold text-primary">{adj.new_odometer} KM</td>
                              <td>{adj.reason}</td>
                              <td className="fw-semibold">{adj.authorized_by_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>

              <div className="modal-footer bg-light py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Authorized Odometer Adjustment */}
      {showAdjustOdoModal && selectedVehicle && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-warning text-dark py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <Shield size={18} />
                  <span>Authorized Odometer Adjustment: {selectedVehicle.registration_number}</span>
                </h6>
                <button className="btn-close" onClick={() => setShowAdjustOdoModal(false)}></button>
              </div>

              <form onSubmit={handleAdjustOdometer}>
                <div className="modal-body p-3">
                  <div className="alert alert-warning py-2 px-3 small mb-3">
                    <strong>Statutory Audit Requirement:</strong> Every manual odometer change is logged in the permanent audit trail with your name, role, IP address, and supervisor justification.
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Current Logged Odometer</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light font-monospace"
                      readOnly
                      value={`${selectedVehicle.current_odometer} KM`}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">New Physical Odometer Reading (KM) *</label>
                    <input
                      type="number"
                      required
                      className="form-control form-control-sm font-monospace fw-bold"
                      value={newOdo}
                      onChange={(e) => setNewOdo(e.target.value)}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-bold">Mandatory Justification Reason *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      required
                      placeholder="e.g. Speedometer replacement at Toyota workshop, rollover correction, calibration repair..."
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdjustOdoModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning btn-sm px-3 fw-bold text-dark" disabled={adjusting}>
                    {adjusting ? 'Recording Audit...' : 'Authorize & Update Odometer'}
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
