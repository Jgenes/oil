import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Gauge,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Fuel,
  Navigation,
  Building,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

export default function FuelConsumptionView() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles', 'anomalies', 'departments'
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('Justified');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchConsumptionData();
  }, []);

  async function fetchConsumptionData() {
    setLoading(true);
    try {
      const res = await api.get('/fuel-consumption');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateAnomaly = async (e) => {
    e.preventDefault();
    if (!selectedAnomaly) return;
    setUpdating(true);
    try {
      const res = await api.patch(`/trips/${selectedAnomaly.id}/anomaly-status`, {
        status: resolutionStatus,
        notes: resolutionNotes
      });
      if (res.data.success) {
        alert(res.data.message);
        setSelectedAnomaly(null);
        fetchConsumptionData();
      }
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="mt-2 text-muted">Analyzing fleet fuel consumption and anomalies...</div>
      </div>
    );
  }

  const { fleetTotals, vehicleConsumption, departmentConsumption, anomalies } = data;

  return (
    <div className="p-3 p-md-4">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Gauge className="text-primary" />
            <span>Intelligent Fuel Consumption & Anomaly Detection</span>
          </h4>
          <p className="text-muted small mb-0">
            Real-time tracking of fuel issued vs fuel consumed vs fuel remaining, KM/L efficiency benchmarks, and automated anomaly flagging.
          </p>
        </div>

        {anomalies.length > 0 && (
          <div className="badge bg-danger fs-6 px-3 py-2 d-flex align-items-center gap-2 shadow-sm">
            <AlertTriangle size={16} />
            <span>{anomalies.length} Consumption Anomalies Flagged</span>
          </div>
        )}
      </div>

      {/* Fleet Totals Summary Cards */}
      <div className="row g-3 mb-4">
        
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Fuel Issued</span>
              <Fuel size={18} className="text-primary" />
            </div>
            <div className="h4 fw-bold text-dark font-monospace mb-0">
              {Number(fleetTotals.total_fuel_allocated).toLocaleString()} L
            </div>
            <small className="text-muted">Station fuel supplied</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Fuel Consumed</span>
              <Gauge size={18} className="text-success" />
            </div>
            <div className="h4 fw-bold text-success font-monospace mb-0">
              {Number(fleetTotals.total_fuel_consumed).toLocaleString()} L
            </div>
            <small className="text-muted">Actually burned on trips</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Fuel Remaining</span>
              <Fuel size={18} className="text-warning" />
            </div>
            <div className="h4 fw-bold text-dark font-monospace mb-0">
              {Number(fleetTotals.total_fuel_remaining).toLocaleString()} L
            </div>
            <small className="text-muted">Unconsumed in vehicle tanks</small>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Fleet Avg KM / L</span>
              <TrendingUp size={18} className="text-info" />
            </div>
            <div className="h4 fw-bold text-primary font-monospace mb-0">
              {fleetTotals.fleet_avg_km_l} KM/L
            </div>
            <small className="text-muted">Cost: ~{fleetTotals.fleet_avg_cost_per_km} TZS/KM</small>
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-3 p-1 bg-light rounded border" style={{ width: 'fit-content' }}>
        <li className="nav-item">
          <button
            className={`nav-link py-1.5 px-3 fw-bold small ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            Vehicle Consumption & Efficiency ({vehicleConsumption.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-1.5 px-3 fw-bold small ${activeTab === 'anomalies' ? 'active text-white bg-danger' : 'text-danger'}`}
            onClick={() => setActiveTab('anomalies')}
          >
            Flagged Anomalies ({anomalies.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-1.5 px-3 fw-bold small ${activeTab === 'departments' ? 'active' : ''}`}
            onClick={() => setActiveTab('departments')}
          >
            Department Breakdown ({departmentConsumption.length})
          </button>
        </li>
      </ul>

      {/* Tab 1: Vehicle Consumption Table */}
      {activeTab === 'vehicles' && (
        <div className="card shadow-sm border-0 bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Vehicle Number</th>
                  <th>Make & Model</th>
                  <th>Department</th>
                  <th className="text-end">Trips</th>
                  <th className="text-end">Distance (KM)</th>
                  <th className="text-end">Issued (L)</th>
                  <th className="text-end">Consumed (L)</th>
                  <th className="text-end">Remaining (L)</th>
                  <th className="text-end">Baseline KM/L</th>
                  <th className="text-end">Actual KM/L</th>
                  <th className="text-end">Cost / KM (TZS)</th>
                  <th className="text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicleConsumption.map((v) => {
                  const variancePct = v.standard_efficiency_km_l > 0 && v.actual_km_l > 0
                    ? (((v.actual_km_l - v.standard_efficiency_km_l) / v.standard_efficiency_km_l) * 100).toFixed(1)
                    : 0;
                  const isPoor = v.actual_km_l > 0 && Number(variancePct) < -20;

                  return (
                    <tr key={v.id} className={isPoor ? 'table-warning' : ''}>
                      <td>
                        <span className="fw-bold font-monospace text-dark">{v.registration_number}</span>
                      </td>
                      <td>
                        <div className="fw-semibold">{v.make} {v.model}</div>
                        <small className="text-muted">{v.category} • {v.fuel_type}</small>
                      </td>
                      <td>{v.department_name}</td>
                      <td className="text-end font-monospace">{v.total_trips}</td>
                      <td className="text-end font-monospace fw-bold text-primary">
                        {Number(v.total_distance_km).toLocaleString()} KM
                      </td>
                      <td className="text-end font-monospace">{v.total_fuel_issued} L</td>
                      <td className="text-end font-monospace fw-bold text-success">{v.total_fuel_consumed} L</td>
                      <td className="text-end font-monospace">{v.total_fuel_remaining} L</td>
                      <td className="text-end font-monospace text-muted">{v.standard_efficiency_km_l}</td>
                      <td className="text-end font-monospace fw-bold">
                        <span className={isPoor ? 'text-danger' : 'text-success'}>
                          {v.actual_km_l > 0 ? `${v.actual_km_l} KM/L` : '-'}
                        </span>
                        {v.actual_km_l > 0 && (
                          <div style={{ fontSize: '0.68rem' }} className={Number(variancePct) >= 0 ? 'text-success' : 'text-danger'}>
                            {variancePct}%
                          </div>
                        )}
                      </td>
                      <td className="text-end font-monospace">{v.avg_cost_per_km} TZS</td>
                      <td className="text-center">
                        {v.anomaly_count > 0 ? (
                          <span className="badge bg-danger text-white">
                            {v.anomaly_count} Anomalies Flagged
                          </span>
                        ) : (
                          <span className="badge bg-success-subtle text-success">Within Bounds</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Flagged Anomalies Center */}
      {activeTab === 'anomalies' && (
        <div className="card shadow-sm border-0 bg-white">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-bold mb-0 text-danger d-flex align-items-center gap-2">
                <AlertTriangle size={18} />
                <span>Flagged Fuel Consumption Discrepancies</span>
              </h6>
              <small className="text-muted">
                Vehicles whose fuel consumption rate exceeds the standard threshold by &gt; 25%.
              </small>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Trip Ref</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Destination</th>
                  <th className="text-end">Distance</th>
                  <th className="text-end">Fuel Used</th>
                  <th className="text-end">Actual KM/L</th>
                  <th className="text-end">Target KM/L</th>
                  <th>Anomaly Detection Reason</th>
                  <th>Investigation Status</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-success fw-semibold">
                      <CheckCircle size={20} className="d-inline me-2" />
                      No consumption anomalies detected. All trips conform to standard efficiency baselines.
                    </td>
                  </tr>
                ) : (
                  anomalies.map((anom) => (
                    <tr key={anom.id} className="table-danger-subtle">
                      <td className="fw-bold font-monospace text-danger">{anom.trip_number}</td>
                      <td className="fw-bold font-monospace">{anom.registration_number}</td>
                      <td>{anom.driver_name}</td>
                      <td>{anom.destination}</td>
                      <td className="text-end font-monospace">{anom.total_distance_km} KM</td>
                      <td className="text-end font-monospace">{anom.fuel_consumed_litres} L</td>
                      <td className="text-end font-monospace fw-bold text-danger fs-6">
                        {anom.fuel_efficiency_km_l} KM/L
                      </td>
                      <td className="text-end font-monospace text-muted">
                        {anom.standard_efficiency_km_l} KM/L
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div className="small text-danger fw-semibold">{anom.anomaly_reason}</div>
                      </td>
                      <td>
                        <span className={`badge ${anom.anomaly_status === 'Cleared' ? 'bg-success text-white' : anom.anomaly_status === 'Justified' ? 'bg-info text-white' : 'bg-warning text-dark'}`}>
                          {anom.anomaly_status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-danger py-0.5 px-2.5"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => {
                            setSelectedAnomaly(anom);
                            setResolutionStatus(anom.anomaly_status === 'None' || anom.anomaly_status === 'Flagged' ? 'Under Investigation' : anom.anomaly_status);
                            setResolutionNotes('');
                          }}
                        >
                          Review & Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Department Breakdown */}
      {activeTab === 'departments' && (
        <div className="card shadow-sm border-0 bg-white">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="table-light">
                <tr>
                  <th>Department / Section</th>
                  <th>Assigned Vehicles</th>
                  <th className="text-end">Total Trips</th>
                  <th className="text-end">Distance Driven (KM)</th>
                  <th className="text-end">Fuel Consumed (L)</th>
                  <th className="text-end">Total Expenditure (TZS)</th>
                  <th className="text-end">Annual Budget (TZS)</th>
                  <th className="text-end">Budget Used</th>
                </tr>
              </thead>
              <tbody>
                {departmentConsumption.map((dept) => {
                  const usedPct = dept.annual_fuel_budget > 0
                    ? ((dept.total_expenditure_tzs / dept.annual_fuel_budget) * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={dept.id}>
                      <td>
                        <strong className="text-dark">{dept.name}</strong>
                        <div className="text-muted small">Code: {dept.code}</div>
                      </td>
                      <td>{dept.vehicle_count} vehicles</td>
                      <td className="text-end font-monospace">{dept.total_trips}</td>
                      <td className="text-end font-monospace fw-bold text-primary">
                        {Number(dept.total_distance_km).toLocaleString()} KM
                      </td>
                      <td className="text-end font-monospace fw-bold text-success">
                        {Number(dept.total_fuel_consumed).toLocaleString()} L
                      </td>
                      <td className="text-end font-monospace fw-bold text-dark">
                        {Number(dept.total_expenditure_tzs).toLocaleString()} TZS
                      </td>
                      <td className="text-end font-monospace text-muted">
                        {Number(dept.annual_fuel_budget).toLocaleString()} TZS
                      </td>
                      <td className="text-end">
                        <span className={`badge ${Number(usedPct) > 75 ? 'bg-danger' : Number(usedPct) > 50 ? 'bg-warning text-dark' : 'bg-primary'}`}>
                          {usedPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Anomaly Resolution */}
      {selectedAnomaly && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <ShieldCheck size={18} />
                  <span>Technical Anomaly Resolution & Audit Endorsement</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setSelectedAnomaly(null)}></button>
              </div>

              <form onSubmit={handleUpdateAnomaly}>
                <div className="modal-body p-3">
                  <div className="p-2.5 bg-light rounded border mb-3 small">
                    <div><strong>Trip Number:</strong> {selectedAnomaly.trip_number}</div>
                    <div><strong>Vehicle:</strong> {selectedAnomaly.registration_number} | <strong>Driver:</strong> {selectedAnomaly.driver_name}</div>
                    <div><strong>Recorded Efficiency:</strong> <span className="text-danger fw-bold">{selectedAnomaly.fuel_efficiency_km_l} KM/L</span> (Baseline: {selectedAnomaly.standard_efficiency_km_l} KM/L)</div>
                    <div className="text-danger mt-1">{selectedAnomaly.anomaly_reason}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Resolution Decision *</label>
                    <select
                      className="form-select form-select-sm fw-bold"
                      value={resolutionStatus}
                      onChange={(e) => setResolutionStatus(e.target.value)}
                    >
                      <option value="Under Investigation">Under Technical Investigation (In Workshop)</option>
                      <option value="Justified">Justified (Heavy Terrain / Cargo / Traffic Congestion Confirmed)</option>
                      <option value="Cleared">Cleared (Mechanical Fault Detected & Fixed / Restitution Handled)</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-bold">Official Resolution Findings & Audit Notes *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      required
                      placeholder="Detail findings from vehicle ECU diagnostics, driver interview, or garage inspection..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedAnomaly(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm px-3 fw-bold" disabled={updating}>
                    {updating ? 'Recording...' : 'Update Audit Resolution'}
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
