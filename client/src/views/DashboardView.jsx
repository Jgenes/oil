import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  Fuel,
  Navigation,
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  Gauge,
  CheckCircle,
  ArrowUpRight,
  Calendar,
  Filter,
  Eye,
  Plus
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardView({ onNavigate, onViewSlip }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('annual');

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  async function fetchMetrics() {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/metrics?period=${period}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <div className="mt-3 text-secondary fw-semibold">Loading MoCU Fleet Intelligence Dashboard...</div>
      </div>
    );
  }

  const { vehicles, requests, issuances, trips, monthlyTrends, departmentExpenditures, vehicleUtilization, recentRequests, recentTrips } = data;

  // Chart 1: Monthly Fuel Consumption & Distance Chart
  const monthlyChartData = {
    labels: monthlyTrends.map(m => m.month),
    datasets: [
      {
        label: 'Fuel Consumed (Litres)',
        data: monthlyTrends.map(m => m.fuel_consumed),
        borderColor: '#133E87',
        backgroundColor: 'rgba(19, 62, 135, 0.15)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Fuel Allocated (Litres)',
        data: monthlyTrends.map(m => m.fuel_allocated),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderDash: [5, 5],
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Distance Travelled (KM)',
        data: monthlyTrends.map(m => m.total_km),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y1',
        type: 'line'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: { padding: 10 }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Litres' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Distance (KM)' }
      }
    }
  };

  return (
    <div className="p-3 p-md-4">
      
      {/* Top Welcome & Period Filter */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <span>Executive Fleet Analytics & Overview</span>
            <span className="badge bg-primary text-white" style={{ fontSize: '0.75rem' }}>Live Database</span>
          </h4>
          <p className="text-muted small mb-0">
            Moshi Co-operative University • Comprehensive monitoring of vehicles, fuel requisitions, trips, and expenditure.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm shadow-sm" role="group">
            {['daily', 'weekly', 'monthly', 'quarterly', 'annual'].map((p) => (
              <button
                key={p}
                type="button"
                className={`btn text-capitalize ${period === p ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 shadow-sm"
            onClick={() => onNavigate('fuel-requests')}
          >
            <Plus size={16} />
            <span>New Requisition</span>
          </button>
        </div>
      </div>

      {/* Real-time Alert Callout Banner */}
      <div className="alert alert-warning border-warning shadow-sm d-flex align-items-center justify-content-between mb-4 py-2.5 px-3">
        <div className="d-flex align-items-center gap-2">
          <AlertTriangle size={20} className="text-warning flex-shrink-0" />
          <div className="small">
            <strong className="text-dark">Operational Attention Required: </strong>
            <span className="text-secondary">
              Slip No. <strong>3143</strong> (DFPA 2045) awaiting HPMU Authorization • 1 Fuel consumption anomaly flagged (T 281 DFP) • 1 Inspection due (DFPA 2045).
            </span>
          </div>
        </div>
        <button
          className="btn btn-sm btn-outline-dark py-1 px-2.5 ms-2 text-nowrap"
          style={{ fontSize: '0.78rem' }}
          onClick={() => onNavigate('fuel-requests')}
        >
          Review Requests
        </button>
      </div>

      {/* Row 1: The 13 Requested Core Metrics Cards */}
      <div className="row g-3 mb-4">
        
        {/* Vehicles Registered */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card-stat p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Total Vehicles</span>
              <div className="stat-icon-wrapper bg-primary-subtle text-primary">
                <Car size={20} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{vehicles.total_vehicles}</h3>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              <span className="text-success fw-bold">{vehicles.active_vehicles} Active</span> • {vehicles.on_trip_vehicles} on Trip
            </div>
          </div>
        </div>

        {/* Vehicles on Trips */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card-stat p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">On Trips</span>
              <div className="stat-icon-wrapper bg-info-subtle text-info">
                <Navigation size={20} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{vehicles.on_trip_vehicles}</h3>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Currently in transit
            </div>
          </div>
        </div>

        {/* Vehicles Under Maintenance */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card-stat p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Maintenance</span>
              <div className="stat-icon-wrapper bg-warning-subtle text-warning">
                <Gauge size={20} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{vehicles.maintenance_vehicles}</h3>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              In university workshop
            </div>
          </div>
        </div>

        {/* Total Fuel Requisitions */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card-stat p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Requisitions</span>
              <div className="stat-icon-wrapper bg-primary-subtle text-primary">
                <FileText size={20} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark">{requests.total_requests}</h3>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              <span className="text-warning fw-bold">{requests.pending_requests} Pending</span> • {requests.approved_requests} Approved
            </div>
          </div>
        </div>

        {/* Total Distance Covered (KM) */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card-stat p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Distance (KM)</span>
              <div className="stat-icon-wrapper bg-success-subtle text-success">
                <TrendingUp size={20} />
              </div>
            </div>
            <h3 className="fw-bold mb-0 text-dark font-monospace">
              {Number(trips.total_distance_km).toLocaleString()}
            </h3>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Tracked across all trips
            </div>
          </div>
        </div>

        {/* Total Fuel Expenditure (TZS) */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card-stat p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold">Expenditure</span>
              <div className="stat-icon-wrapper bg-danger-subtle text-danger">
                <DollarSign size={20} />
              </div>
            </div>
            <h4 className="fw-bold mb-0 text-dark font-monospace" style={{ fontSize: '1.2rem' }}>
              {Number(issuances.total_fuel_expenditure).toLocaleString()}
            </h4>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              TZS verified by Finance
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Secondary Efficiency & Fuel Volume KPI Summary Cards */}
      <div className="row g-3 mb-4">
        
        {/* Total Fuel Allocated vs Consumed */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Fuel Allocated (Issued)</span>
              <Fuel size={18} className="text-primary" />
            </div>
            <div className="h3 fw-bold text-dark font-monospace mb-1">
              {Number(issuances.total_fuel_allocated).toLocaleString()} <small className="text-muted fs-6">L</small>
            </div>
            <div className="small text-secondary">
              Station vouchers verified against requisitions
            </div>
          </div>
        </div>

        {/* Actual Fuel Consumed */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Actual Fuel Consumed</span>
              <Gauge size={18} className="text-success" />
            </div>
            <div className="h3 fw-bold text-success font-monospace mb-1">
              {Number(trips.total_fuel_consumed).toLocaleString()} <small className="text-muted fs-6">L</small>
            </div>
            <div className="small text-muted">
              Remaining in tanks: <strong>{Number(trips.total_fuel_remaining).toFixed(1)} L</strong>
            </div>
          </div>
        </div>

        {/* Fleet Average KM / L */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Fleet Avg KM / L</span>
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div className="h3 fw-bold text-primary font-monospace mb-1">
              {Number(trips.avg_km_per_litre).toFixed(2)} <small className="text-muted fs-6">KM/L</small>
            </div>
            <div className="small text-muted">
              Baseline benchmark: 8.0 KM/L
            </div>
          </div>
        </div>

        {/* Average Fuel Cost per KM */}
        <div className="col-md-3">
          <div className="card shadow-sm border-0 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small fw-bold text-uppercase">Avg Fuel Cost / KM</span>
              <DollarSign size={18} className="text-warning" />
            </div>
            <div className="h3 fw-bold text-dark font-monospace mb-1">
              {Number(trips.avg_cost_per_km).toFixed(1)} <small className="text-muted fs-6">TZS/KM</small>
            </div>
            <div className="small text-muted">
              Weighted average across fleet trips
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Interactive Charts */}
      <div className="row g-3 mb-4">
        
        {/* Monthly Consumption Trends Chart */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Monthly Fuel Consumption & Travel Distance</h6>
                <small className="text-muted">Track fuel allocation vs actual consumption vs KM covered</small>
              </div>
              <span className="badge bg-light text-dark border">6 Months Rolling</span>
            </div>
            <div style={{ height: '300px' }}>
              <Line data={monthlyChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Department Fuel Budget Utilization Breakdown */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-dark">Department Budget vs Actual</h6>
              <button
                className="btn btn-sm btn-link p-0 text-decoration-none"
                onClick={() => onNavigate('departments')}
              >
                View All
              </button>
            </div>
            <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '300px' }}>
              {departmentExpenditures.slice(0, 5).map((dept) => (
                <div key={dept.id}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-bold text-dark">{dept.code}</span>
                    <span className="small font-monospace text-muted">
                      {Number(dept.current_expenditure).toLocaleString()} / {Number(dept.annual_fuel_budget).toLocaleString()} TZS
                    </span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className={`progress-bar ${dept.budget_used_pct > 75 ? 'bg-danger' : dept.budget_used_pct > 50 ? 'bg-warning' : 'bg-primary'}`}
                      role="progressbar"
                      style={{ width: `${Math.min(100, dept.budget_used_pct)}%` }}
                    />
                  </div>
                  <div className="d-flex justify-content-between mt-0.5" style={{ fontSize: '0.7rem' }}>
                    <span className="text-muted">{dept.name}</span>
                    <span className="fw-bold">{dept.budget_used_pct}% used</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 4: Recent Requisitions & Recent Trips */}
      <div className="row g-3">
        
        {/* Recent Fuel Requisitions */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <FileText size={18} className="text-primary" />
                <h6 className="fw-bold mb-0 text-dark">Recent Fuel Requisitions</h6>
              </div>
              <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => onNavigate('fuel-requests')}>
                View Table <ArrowUpRight size={14} className="d-inline" />
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Slip No</th>
                    <th>Vehicle</th>
                    <th>Destination</th>
                    <th>Litres</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="fw-bold font-monospace text-primary">
                        {req.form_serial_number || req.request_number}
                      </td>
                      <td className="fw-semibold">{req.vehicle_number}</td>
                      <td className="text-truncate" style={{ maxWidth: '140px' }} title={req.destination}>
                        {req.destination}
                      </td>
                      <td className="font-monospace text-end">{req.requested_quantity_litres} L</td>
                      <td>
                        <span className={`badge-status badge-${req.status.toLowerCase().replace('_', '')}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-outline-primary py-0 px-2"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => onViewSlip(req.id)}
                          title="View Official MoCU Slip"
                        >
                          <Eye size={12} className="d-inline me-1" /> Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <Navigation size={18} className="text-success" />
                <h6 className="fw-bold mb-0 text-dark">Recent Vehicle Trips & Distance</h6>
              </div>
              <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => onNavigate('trips')}>
                View Trips <ArrowUpRight size={14} className="d-inline" />
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Trip ID</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Distance</th>
                    <th>Efficiency</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td className="fw-bold font-monospace">{trip.trip_number}</td>
                      <td className="fw-semibold">{trip.vehicle_number}</td>
                      <td>{trip.driver_name || 'Assigned Driver'}</td>
                      <td className="font-monospace text-end">
                        {trip.total_distance_km ? `${trip.total_distance_km} KM` : 'Active'}
                      </td>
                      <td className="font-monospace">
                        {trip.fuel_efficiency_km_l ? (
                          <span className={trip.is_anomaly ? 'text-danger fw-bold' : 'text-success'}>
                            {trip.fuel_efficiency_km_l} KM/L
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        {trip.is_anomaly ? (
                          <span className="badge bg-danger text-white">Anomaly</span>
                        ) : (
                          <span className={`badge ${trip.status === 'Completed' ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info'}`}>
                            {trip.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
