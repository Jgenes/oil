import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Navigation,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Car,
  User,
  Gauge,
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export default function TripsView() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Start Trip Modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [newTrip, setNewTrip] = useState({
    vehicle_id: '',
    driver_id: '',
    department_id: '',
    destination: '',
    trip_purpose: '',
    starting_odometer: '',
    fuel_allocated_litres: 0,
    fuel_issued_litres: 0
  });

  // Complete Trip Modal
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    ending_odometer: '',
    fuel_consumed_litres: '',
    fuel_remaining_litres: 0,
    completion_notes: '',
    allow_odometer_override: false,
    override_reason: ''
  });
  const [submittingComplete, setSubmittingComplete] = useState(false);

  // Anomaly Resolution Modal
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [anomalyStatus, setAnomalyStatus] = useState('Under Investigation');
  const [anomalyNotes, setAnomalyNotes] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [statusFilter, anomalyFilter, searchTerm]);

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

  async function fetchTrips() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (anomalyFilter !== '') params.append('is_anomaly', anomalyFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await api.get(`/trips?${params.toString()}`);
      if (res.data.success) {
        setTrips(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleStartSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/trips', newTrip);
      if (res.data.success) {
        alert(res.data.message);
        setShowStartModal(false);
        fetchTrips();
      }
    } catch (err) {
      alert('Failed to start trip: ' + (err.response?.data?.error || err.message));
    }
  };

  const openCompleteModal = (trip) => {
    setSelectedTrip(trip);
    setCompletionData({
      ending_odometer: trip.starting_odometer + 50,
      fuel_consumed_litres: trip.fuel_issued_litres ? (trip.fuel_issued_litres * 0.9).toFixed(1) : '',
      fuel_remaining_litres: trip.fuel_issued_litres ? (trip.fuel_issued_litres * 0.1).toFixed(1) : 0,
      completion_notes: '',
      allow_odometer_override: false,
      override_reason: ''
    });
    setShowCompleteModal(true);
  };

  // Live calculation for completion modal
  const distanceCovered = selectedTrip && completionData.ending_odometer
    ? Math.max(0, Number(completionData.ending_odometer) - Number(selectedTrip.starting_odometer))
    : 0;

  const liveKmPerLitre = distanceCovered > 0 && completionData.fuel_consumed_litres > 0
    ? (distanceCovered / Number(completionData.fuel_consumed_litres)).toFixed(2)
    : null;

  const baseline = selectedTrip?.standard_efficiency_km_l || 8.0;
  const isAnomalyPreview = liveKmPerLitre !== null && Number(liveKmPerLitre) < (baseline * 0.75);

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrip) return;
    setSubmittingComplete(true);

    try {
      const res = await api.post(`/trips/${selectedTrip.id}/complete`, completionData);
      if (res.data.success) {
        alert(res.data.message);
        setShowCompleteModal(false);
        fetchTrips();
      }
    } catch (err) {
      alert('Trip completion error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmittingComplete(false);
    }
  };

  const handleAnomalyUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTrip) return;
    try {
      const res = await api.patch(`/trips/${selectedTrip.id}/anomaly-status`, {
        status: anomalyStatus,
        notes: anomalyNotes
      });
      if (res.data.success) {
        alert(res.data.message);
        setShowAnomalyModal(false);
        fetchTrips();
      }
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-3 p-md-4">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Navigation className="text-success" />
            <span>Trip & Distance Monitoring System</span>
          </h4>
          <p className="text-muted small mb-0">
            Real-time odometer validation (Ending KM &ge; Starting KM), distance calculation, fuel consumption separation, and automatic anomaly detection.
          </p>
        </div>

        {(user?.role === 'transport_officer' || user?.role === 'admin') && (
          <button
            className="btn btn-success d-flex align-items-center gap-2 shadow-sm text-white"
            onClick={() => {
              if (vehicles.length > 0) {
                const v = vehicles[0];
                setNewTrip({
                  vehicle_id: v.id,
                  driver_id: v.assigned_driver_id || (drivers[0]?.id || ''),
                  department_id: v.assigned_department_id || (departments[0]?.id || ''),
                  destination: '',
                  trip_purpose: '',
                  starting_odometer: v.current_odometer,
                  fuel_allocated_litres: 0,
                  fuel_issued_litres: 0
                });
              }
              setShowStartModal(true);
            }}
          >
            <Plus size={18} />
            <span>Start New Trip</span>
          </button>
        )}
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
                placeholder="Search trip no, destination, vehicle, driver..."
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
              <option value="">All Trip Statuses</option>
              <option value="In Progress">In Progress (Active Trips)</option>
              <option value="Completed">Completed Trips</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={anomalyFilter}
              onChange={(e) => setAnomalyFilter(e.target.value)}
            >
              <option value="">All Efficiency Records</option>
              <option value="1">Flagged Anomalies Only</option>
              <option value="0">Normal Consumption Only</option>
            </select>
          </div>

          <div className="col-md-2 text-end">
            <span className="text-muted small">
              Total <strong>{trips.length}</strong> trips recorded
            </span>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
            <thead className="table-light">
              <tr>
                <th>Trip Ref</th>
                <th>Vehicle & Driver</th>
                <th>Destination & Purpose</th>
                <th>Departure / Return</th>
                <th className="text-end">Starting KM</th>
                <th className="text-end">Ending KM</th>
                <th className="text-end">Distance (KM)</th>
                <th className="text-end">Fuel (Used / Remaining)</th>
                <th>Efficiency (KM/L)</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Loading trip logs...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-muted">
                    No trips found matching the criteria.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id} className={trip.is_anomaly ? 'table-danger-subtle' : ''}>
                    
                    {/* Trip Number */}
                    <td>
                      <div className="fw-bold font-monospace text-dark">{trip.trip_number}</div>
                      {trip.form_serial_number && (
                        <span className="badge bg-light text-primary border" style={{ fontSize: '0.68rem' }}>
                          Slip #{trip.form_serial_number}
                        </span>
                      )}
                    </td>

                    {/* Vehicle & Driver */}
                    <td>
                      <div className="fw-bold text-dark font-monospace">{trip.vehicle_number}</div>
                      <div className="text-muted" style={{ fontSize: '0.74rem' }}>{trip.vehicle_make} {trip.vehicle_model}</div>
                      <div className="text-secondary small">{trip.driver_name}</div>
                    </td>

                    {/* Destination & Purpose */}
                    <td style={{ maxWidth: '200px' }}>
                      <div className="fw-semibold text-truncate" title={trip.destination}>{trip.destination}</div>
                      <div className="text-muted text-truncate small" title={trip.trip_purpose}>{trip.trip_purpose}</div>
                      <div className="badge bg-light text-muted border" style={{ fontSize: '0.68rem' }}>{trip.department_name}</div>
                    </td>

                    {/* Departure & Return */}
                    <td>
                      <div className="small">{trip.departure_datetime ? trip.departure_datetime.substring(0, 16).replace('T', ' ') : '-'}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {trip.return_datetime ? trip.return_datetime.substring(0, 16).replace('T', ' ') : 'In transit'}
                      </div>
                    </td>

                    {/* Starting Odometer */}
                    <td className="text-end font-monospace">{Number(trip.starting_odometer).toLocaleString()} KM</td>

                    {/* Ending Odometer */}
                    <td className="text-end font-monospace">
                      {trip.ending_odometer ? `${Number(trip.ending_odometer).toLocaleString()} KM` : <span className="text-muted fst-italic">Active</span>}
                    </td>

                    {/* Total Distance */}
                    <td className="text-end font-monospace fw-bold text-primary">
                      {trip.total_distance_km ? `${Number(trip.total_distance_km).toLocaleString()} KM` : '-'}
                    </td>

                    {/* Fuel details */}
                    <td className="text-end font-monospace" style={{ fontSize: '0.78rem' }}>
                      {trip.fuel_consumed_litres ? (
                        <>
                          <div className="fw-bold text-dark">{trip.fuel_consumed_litres} L used</div>
                          <div className="text-muted">{trip.fuel_remaining_litres} L left in tank</div>
                        </>
                      ) : (
                        <div className="text-muted">{trip.fuel_issued_litres} L issued</div>
                      )}
                    </td>

                    {/* Efficiency & Anomaly */}
                    <td>
                      {trip.fuel_efficiency_km_l ? (
                        <div>
                          <span className={`fw-bold font-monospace ${trip.is_anomaly ? 'text-danger' : 'text-success'}`}>
                            {trip.fuel_efficiency_km_l} KM/L
                          </span>
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                            Base: {trip.standard_efficiency_km_l} KM/L
                          </div>
                          {trip.is_anomaly === 1 && (
                            <span className="badge bg-danger text-white d-block mt-0.5" style={{ fontSize: '0.65rem' }}>
                              Anomaly: {trip.anomaly_status}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${trip.status === 'Completed' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'}`}>
                        {trip.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="text-center">
                      {trip.status === 'In Progress' ? (
                        <button
                          className="btn btn-sm btn-primary py-1 px-2.5 d-flex align-items-center gap-1 shadow-sm"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => openCompleteModal(trip)}
                        >
                          <FileCheck size={14} />
                          <span>Complete Trip</span>
                        </button>
                      ) : trip.is_anomaly ? (
                        <button
                          className="btn btn-sm btn-outline-danger py-0.5 px-2"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => {
                            setSelectedTrip(trip);
                            setAnomalyStatus(trip.anomaly_status || 'Under Investigation');
                            setShowAnomalyModal(true);
                          }}
                        >
                          Investigation
                        </button>
                      ) : (
                        <span className="text-success small fw-semibold">
                          <CheckCircle size={15} className="d-inline me-1" /> Logged
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

      {/* Modal: Start Trip Manually */}
      {showStartModal && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <Navigation size={18} />
                  <span>Start New Vehicle Journey</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowStartModal(false)}></button>
              </div>

              <form onSubmit={handleStartSubmit}>
                <div className="modal-body p-3">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Vehicle Registration *</label>
                    <select
                      className="form-select form-select-sm"
                      required
                      value={newTrip.vehicle_id}
                      onChange={(e) => {
                        const v = vehicles.find(item => item.id === Number(e.target.value));
                        if (v) {
                          setNewTrip({
                            ...newTrip,
                            vehicle_id: v.id,
                            starting_odometer: v.current_odometer,
                            driver_id: v.assigned_driver_id || newTrip.driver_id,
                            department_id: v.assigned_department_id || newTrip.department_id
                          });
                        }
                      }}
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registration_number} - {v.make} {v.model} ({v.vehicle_status}, {v.current_odometer} KM)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Assigned Driver *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={newTrip.driver_id}
                        onChange={(e) => setNewTrip({ ...newTrip, driver_id: Number(e.target.value) })}
                      >
                        {drivers.map(dr => (
                          <option key={dr.id} value={dr.id}>{dr.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-bold">Department *</label>
                      <select
                        className="form-select form-select-sm"
                        required
                        value={newTrip.department_id}
                        onChange={(e) => setNewTrip({ ...newTrip, department_id: Number(e.target.value) })}
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Trip Destination *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      placeholder="e.g. TCDC Usa River, Arusha"
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Trip Purpose *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      placeholder="e.g. Practical academic training excursion"
                      value={newTrip.trip_purpose}
                      onChange={(e) => setNewTrip({ ...newTrip, trip_purpose: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Starting Odometer (KM) *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        required
                        value={newTrip.starting_odometer}
                        onChange={(e) => setNewTrip({ ...newTrip, starting_odometer: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Fuel Issued (Litres)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm font-monospace"
                        value={newTrip.fuel_issued_litres}
                        onChange={(e) => setNewTrip({ ...newTrip, fuel_issued_litres: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowStartModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-3 text-white fw-bold">
                    Start Journey
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Complete Trip (Odometer Validation & Anomaly Detection) */}
      {showCompleteModal && selectedTrip && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-md">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <FileCheck size={18} />
                  <span>Submit Trip Completion & Odometer Reading</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowCompleteModal(false)}></button>
              </div>

              <form onSubmit={handleCompleteSubmit}>
                <div className="modal-body p-3">
                  
                  {/* Trip Details Header */}
                  <div className="p-2.5 bg-light rounded border mb-3 small">
                    <div className="d-flex justify-content-between">
                      <strong>Trip Ref: {selectedTrip.trip_number}</strong>
                      <span className="font-monospace fw-bold">{selectedTrip.vehicle_number}</span>
                    </div>
                    <div>Destination: {selectedTrip.destination}</div>
                    <div>Driver: {selectedTrip.driver_name}</div>
                  </div>

                  {/* Starting Odometer Display */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Starting Odometer Reading (KM)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light font-monospace fw-bold"
                      readOnly
                      value={`${Number(selectedTrip.starting_odometer).toLocaleString()} KM`}
                    />
                  </div>

                  {/* Ending Odometer Input */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-primary">
                      Ending Odometer Reading (KM) *
                    </label>
                    <input
                      type="number"
                      required
                      className="form-control form-control-sm font-monospace fw-bold border-primary"
                      value={completionData.ending_odometer}
                      onChange={(e) => setCompletionData({ ...completionData, ending_odometer: e.target.value })}
                    />
                    <div className="small text-muted mt-1">
                      Must be &ge; Starting Odometer ({selectedTrip.starting_odometer} KM).
                    </div>
                  </div>

                  {/* Auto-Calculated Distance */}
                  <div className="p-2.5 bg-info-subtle rounded border border-info-subtle mb-3 d-flex justify-content-between align-items-center">
                    <span className="small fw-bold text-dark">Calculated Distance Covered:</span>
                    <span className="h5 fw-bold font-monospace text-primary mb-0">
                      {distanceCovered.toLocaleString()} KM
                    </span>
                  </div>

                  {/* Fuel Consumed vs Remaining */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Actual Fuel Consumed (L) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        className="form-control form-control-sm font-monospace"
                        placeholder="e.g. 52.5"
                        value={completionData.fuel_consumed_litres}
                        onChange={(e) => setCompletionData({ ...completionData, fuel_consumed_litres: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Remaining Fuel in Tank (L)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control form-control-sm font-monospace"
                        value={completionData.fuel_remaining_litres}
                        onChange={(e) => setCompletionData({ ...completionData, fuel_remaining_litres: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Live Fuel Efficiency Preview */}
                  {liveKmPerLitre && (
                    <div className="p-2.5 bg-light rounded border mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small fw-bold">Calculated Fuel Efficiency:</div>
                        <small className="text-muted">Standard baseline: {baseline} KM/L</small>
                      </div>
                      <div className={`h5 fw-bold font-monospace mb-0 ${isAnomalyPreview ? 'text-danger' : 'text-success'}`}>
                        {liveKmPerLitre} KM/L
                      </div>
                    </div>
                  )}

                  {/* Anomaly Callout Warning */}
                  {isAnomalyPreview && (
                    <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                      <AlertTriangle size={18} className="flex-shrink-0 text-danger" />
                      <div>
                        <strong>Anomaly Warning:</strong> This trip's efficiency ({liveKmPerLitre} KM/L) is significantly below the baseline ({baseline} KM/L). It will be automatically flagged for investigation.
                      </div>
                    </div>
                  )}

                  {/* Negative Distance Prevention / Odometer Rollover Override */}
                  {Number(completionData.ending_odometer) < Number(selectedTrip.starting_odometer) && (
                    <div className="p-2.5 bg-danger-subtle rounded border border-danger mb-3">
                      <div className="text-danger small fw-bold mb-1">
                        Odometer Validation Error: Ending odometer cannot be lower than starting odometer.
                      </div>
                      <div className="form-check small">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="odoOverride"
                          checked={completionData.allow_odometer_override}
                          onChange={(e) => setCompletionData({ ...completionData, allow_odometer_override: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="odoOverride">
                          Authorized supervisor rollover or odometer replacement
                        </label>
                      </div>
                      {completionData.allow_odometer_override && (
                        <input
                          type="text"
                          className="form-control form-control-sm mt-2"
                          placeholder="Mandatory justification reason..."
                          value={completionData.override_reason}
                          onChange={(e) => setCompletionData({ ...completionData, override_reason: e.target.value })}
                        />
                      )}
                    </div>
                  )}

                  {/* Completion Notes */}
                  <div className="mb-2">
                    <label className="form-label small fw-bold">Trip Completion Notes</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="Road conditions, mechanical notes, journey summary..."
                      value={completionData.completion_notes}
                      onChange={(e) => setCompletionData({ ...completionData, completion_notes: e.target.value })}
                    />
                  </div>

                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCompleteModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-3 fw-bold"
                    disabled={submittingComplete || (Number(completionData.ending_odometer) < Number(selectedTrip.starting_odometer) && !completionData.allow_odometer_override)}
                  >
                    {submittingComplete ? 'Verifying...' : 'Submit & Close Trip'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Anomaly Investigation Status */}
      {showAnomalyModal && selectedTrip && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <AlertTriangle size={18} />
                  <span>Fuel Consumption Anomaly Review</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowAnomalyModal(false)}></button>
              </div>

              <form onSubmit={handleAnomalyUpdate}>
                <div className="modal-body p-3">
                  <div className="p-2.5 bg-light rounded border mb-3 small">
                    <div><strong>Trip:</strong> {selectedTrip.trip_number} | <strong>Vehicle:</strong> {selectedTrip.vehicle_number}</div>
                    <div><strong>Efficiency:</strong> <span className="text-danger fw-bold">{selectedTrip.fuel_efficiency_km_l} KM/L</span> (Baseline: {selectedTrip.standard_efficiency_km_l} KM/L)</div>
                    <div className="text-secondary mt-1"><strong>Reason:</strong> {selectedTrip.anomaly_reason}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Investigation Status *</label>
                    <select
                      className="form-select form-select-sm"
                      value={anomalyStatus}
                      onChange={(e) => setAnomalyStatus(e.target.value)}
                    >
                      <option value="Under Investigation">Under Technical Investigation</option>
                      <option value="Justified">Justified (Heavy Traffic / Mountain Terrain / Severe AC)</option>
                      <option value="Cleared">Cleared (Verified Mechanical Cause Resolved)</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-bold">Investigator Resolution Notes *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      required
                      placeholder="State technical findings, mechanical workshop inspection results, or route justification..."
                      value={anomalyNotes}
                      onChange={(e) => setAnomalyNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAnomalyModal(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm px-3 fw-bold">
                    Update Investigation Status
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
