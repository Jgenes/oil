import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Lock,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function AuditTrailView() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, moduleFilter, actionFilter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (moduleFilter) params.append('module', moduleFilter);
      if (actionFilter) params.append('action', actionFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
        if (res.data.modules) setModules(res.data.modules);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-3 p-md-4">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <ShieldCheck className="text-primary" />
            <span>Immutable Audit Trail & System Accountability</span>
          </h4>
          <p className="text-muted small mb-0">
            Statutory university compliance ledger: tamper-evident logging of all transactions, approvals, odometer modifications, and user operations.
          </p>
        </div>

        <div className="badge bg-success-subtle text-success fs-6 px-3 py-1.5 border border-success-subtle d-flex align-items-center gap-1.5">
          <Lock size={15} />
          <span>Non-Modifiable Ledger</span>
        </div>
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
                placeholder="Search user, record reference, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="">All System Modules</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <select
              className="form-select form-select-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="APPROVE">APPROVE / RECOMMEND</option>
              <option value="VERIFY">VERIFY</option>
              <option value="ISSUE">ISSUE FUEL</option>
              <option value="COMPLETE_TRIP">COMPLETE TRIP</option>
              <option value="ODOMETER_ADJUSTMENT">ODOMETER ADJUSTMENT</option>
              <option value="ANOMALY_FLAG">ANOMALY FLAG</option>
            </select>
          </div>

          <div className="col-md-2 text-end">
            <span className="text-muted small">
              Found <strong>{logs.length}</strong> audit events
            </span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
            <thead className="table-light">
              <tr>
                <th>Audit ID</th>
                <th>Timestamp</th>
                <th>User / Officer</th>
                <th>Role</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record Reference</th>
                <th>Justification / Reason</th>
                <th>IP Address</th>
                <th className="text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-muted">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-monospace text-muted">#{log.id}</td>
                    <td className="text-nowrap">{log.created_at?.substring(0, 19).replace('T', ' ')}</td>
                    <td className="fw-semibold text-dark">{log.user_name}</td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace" style={{ fontSize: '0.72rem' }}>
                        {log.user_role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        log.action.includes('APPROVE') || log.action.includes('RECOMMEND') ? 'bg-success text-white' :
                        log.action.includes('VERIFY') ? 'bg-info text-white' :
                        log.action.includes('ANOMALY') ? 'bg-danger text-white' :
                        log.action.includes('ODOMETER') ? 'bg-warning text-dark' :
                        log.action.includes('ISSUE') ? 'bg-primary text-white' : 'bg-secondary text-white'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="fw-semibold text-secondary">{log.module}</td>
                    <td className="font-monospace fw-bold text-dark">{log.record_id || '-'}</td>
                    <td style={{ maxWidth: '240px' }}>
                      <div className="text-truncate" title={log.reason}>{log.reason || '-'}</div>
                    </td>
                    <td className="font-monospace text-muted small">{log.ip_address}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-outline-secondary py-0.5 px-2"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye size={13} className="d-inline me-1" /> View Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Audit Log Diff Detail */}
      {selectedLog && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <ShieldCheck size={18} />
                  <span>Audit Event Detail: #{selectedLog.id} ({selectedLog.action})</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setSelectedLog(null)}></button>
              </div>

              <div className="modal-body p-3">
                <div className="p-3 bg-light rounded border mb-3 small">
                  <div className="row g-2">
                    <div className="col-6"><strong>User:</strong> {selectedLog.user_name} ({selectedLog.user_role})</div>
                    <div className="col-6"><strong>Timestamp:</strong> {selectedLog.created_at}</div>
                    <div className="col-6"><strong>Module:</strong> {selectedLog.module}</div>
                    <div className="col-6"><strong>Record ID:</strong> {selectedLog.record_id}</div>
                    <div className="col-12"><strong>IP Address:</strong> {selectedLog.ip_address}</div>
                    <div className="col-12"><strong>Reason / Justification:</strong> {selectedLog.reason}</div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Previous State (Old Values)</label>
                    <pre className="p-2.5 bg-light rounded border font-monospace small" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedLog.old_values ? JSON.stringify(JSON.parse(selectedLog.old_values), null, 2) : 'None (Record creation)'}
                    </pre>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-success">Updated State (New Values)</label>
                    <pre className="p-2.5 bg-light rounded border font-monospace small" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedLog.new_values ? JSON.stringify(JSON.parse(selectedLog.new_values), null, 2) : 'None'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedLog(null)}>Close</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
