import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Fuel,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Store,
  Receipt,
  Car
} from 'lucide-react';

export default function FuelIssuancesView() {
  const { user } = useAuth();
  const [issuances, setIssuances] = useState([]);
  const [authorizedRequests, setAuthorizedRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Record Issuance Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [formData, setFormData] = useState({
    fuel_request_id: '',
    supplier_id: '',
    quantity_issued: '',
    unit_price: 3280,
    receipt_number: '',
    invoice_reference: '',
    issuance_date: new Date().toISOString().substring(0, 16),
    remarks: '',
    auto_create_trip: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchIssuances();
  }, [searchTerm, supplierFilter]);

  async function fetchInitialData() {
    try {
      const [sRes, reqRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/fuel-requests')
      ]);
      if (sRes.data.success) {
        setSuppliers(sRes.data.data);
        if (sRes.data.data.length > 0) {
          setFormData(prev => ({ ...prev, supplier_id: sRes.data.data[0].id }));
        }
      }
      if (reqRes.data.success) {
        // filter requests ready for issuance
        const ready = reqRes.data.data.filter(r => ['Authorized', 'Finance_Recorded'].includes(r.status));
        setAuthorizedRequests(ready);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchIssuances() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (supplierFilter) params.append('supplier_id', supplierFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await api.get(`/fuel-issuances?${params.toString()}`);
      if (res.data.success) {
        setIssuances(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleReqSelect = (reqId) => {
    const r = authorizedRequests.find(item => item.id === Number(reqId));
    setSelectedReq(r);
    if (r) {
      const supplier = suppliers.find(s => s.id === Number(formData.supplier_id)) || suppliers[0];
      const price = r.fuel_type === 'Diesel' ? supplier.diesel_price_per_litre : supplier.petrol_price_per_litre;
      setFormData(prev => ({
        ...prev,
        fuel_request_id: r.id,
        quantity_issued: r.requested_quantity_litres,
        unit_price: price
      }));
    }
  };

  const handleSupplierSelect = (supId) => {
    const s = suppliers.find(item => item.id === Number(supId));
    if (s && selectedReq) {
      const price = selectedReq.fuel_type === 'Diesel' ? s.diesel_price_per_litre : s.petrol_price_per_litre;
      setFormData(prev => ({
        ...prev,
        supplier_id: s.id,
        unit_price: price
      }));
    } else {
      setFormData(prev => ({ ...prev, supplier_id: supId }));
    }
  };

  const handleIssuanceSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/fuel-issuances', formData);
      if (res.data.success) {
        alert(res.data.message);
        setShowModal(false);
        fetchIssuances();
        fetchInitialData();
      }
    } catch (err) {
      alert('Issuance failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Reconciled variance in modal
  const approvedQty = selectedReq ? Number(selectedReq.requested_quantity_litres) : 0;
  const issuedQty = Number(formData.quantity_issued || 0);
  const variance = approvedQty - issuedQty;
  const totalCost = issuedQty * Number(formData.unit_price || 0);

  return (
    <div className="p-3 p-md-4">
      
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Fuel className="text-primary" />
            <span>Fuel Issuance & Station Reconciliation</span>
          </h4>
          <p className="text-muted small mb-0">
            Record contracted station fuel vouchers, reconcile approved volume against actual volume dispensed, and audit price tariffs.
          </p>
        </div>

        {(user?.role === 'transport_officer' || user?.role === 'admin') && (
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => {
              if (authorizedRequests.length > 0) handleReqSelect(authorizedRequests[0].id);
              setShowModal(true);
            }}
          >
            <Plus size={18} />
            <span>Record Station Fuel Issuance</span>
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
                placeholder="Search issuance ref, receipt no, vehicle, driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select form-select-sm"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="">All Fuel Station Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.station_name} ({s.supplier_name})</option>
              ))}
            </select>
          </div>

          <div className="col-md-3 text-end">
            <span className="text-muted small">
              Total <strong>{issuances.length}</strong> fuel issuances logged
            </span>
          </div>
        </div>
      </div>

      {/* Issuances Table */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.84rem' }}>
            <thead className="table-light">
              <tr>
                <th>Issuance Ref</th>
                <th>Requisition Slip</th>
                <th>Vehicle & Driver</th>
                <th>Station / Supplier</th>
                <th className="text-end">Approved</th>
                <th className="text-end">Issued</th>
                <th className="text-end">Variance</th>
                <th className="text-end">Unit Tariff</th>
                <th className="text-end">Total (TZS)</th>
                <th>Receipt / Invoice</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    Loading issuances...
                  </td>
                </tr>
              ) : issuances.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-muted">
                    No fuel issuance records found.
                  </td>
                </tr>
              ) : (
                issuances.map((fi) => (
                  <tr key={fi.id}>
                    <td>
                      <div className="fw-bold font-monospace text-primary">{fi.issuance_number}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {fi.issuance_date ? fi.issuance_date.substring(0, 16).replace('T', ' ') : ''}
                      </div>
                    </td>

                    <td>
                      <div className="fw-semibold font-monospace">{fi.form_serial_number || fi.request_number}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '140px' }}>
                        {fi.destination}
                      </div>
                    </td>

                    <td>
                      <div className="fw-bold font-monospace text-dark">{fi.vehicle_number}</div>
                      <div className="text-secondary small">{fi.driver_name}</div>
                    </td>

                    <td>
                      <div className="fw-semibold text-dark">{fi.fuel_station_name}</div>
                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.68rem' }}>
                        {fi.fuel_type}
                      </span>
                    </td>

                    <td className="text-end font-monospace">{fi.quantity_approved} L</td>

                    <td className="text-end font-monospace fw-bold text-success">
                      {fi.quantity_issued} L
                    </td>

                    <td className="text-end font-monospace">
                      {fi.quantity_variance !== 0 ? (
                        <span className={fi.quantity_variance > 0 ? 'text-primary' : 'text-danger'}>
                          {fi.quantity_variance > 0 ? `+${fi.quantity_variance}` : fi.quantity_variance} L
                        </span>
                      ) : (
                        <span className="text-muted">0 L</span>
                      )}
                    </td>

                    <td className="text-end font-monospace">
                      {Number(fi.unit_price).toLocaleString()}
                    </td>

                    <td className="text-end font-monospace fw-bold text-dark">
                      {Number(fi.total_cost).toLocaleString()} TZS
                    </td>

                    <td>
                      <div className="font-monospace text-dark fw-semibold">{fi.receipt_number}</div>
                      {fi.invoice_reference && (
                        <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                          {fi.invoice_reference}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="small fw-semibold">{fi.recorded_by_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>Station Certified</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Fuel Issuance */}
      {showModal && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white py-2.5 px-3">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <Fuel size={18} />
                  <span>Record Fuel Issuance & Reconcile Station Voucher</span>
                </h6>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleIssuanceSubmit}>
                <div className="modal-body p-3 p-md-4">
                  
                  {authorizedRequests.length === 0 ? (
                    <div className="alert alert-warning">
                      No requisitions are currently authorized and pending issuance. Please authorize a requisition first.
                    </div>
                  ) : (
                    <div className="row g-3">
                      
                      {/* Select Approved Request */}
                      <div className="col-12">
                        <label className="form-label small fw-bold">Select Authorized Fuel Requisition *</label>
                        <select
                          className="form-select form-select-sm"
                          required
                          value={formData.fuel_request_id}
                          onChange={(e) => handleReqSelect(e.target.value)}
                        >
                          <option value="">Select Requisition</option>
                          {authorizedRequests.map(r => (
                            <option key={r.id} value={r.id}>
                              Slip #{r.form_serial_number || r.request_number} - {r.vehicle_number} ({r.department_name}): {r.requested_quantity_litres}L {r.fuel_type} for {r.destination}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Station Supplier */}
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Fuel Station / Supplier *</label>
                        <select
                          className="form-select form-select-sm"
                          required
                          value={formData.supplier_id}
                          onChange={(e) => handleSupplierSelect(e.target.value)}
                        >
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.station_name} (Diesel: {s.diesel_price_per_litre} / Petrol: {s.petrol_price_per_litre})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Issuance Date */}
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Issuance Date & Time *</label>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          required
                          value={formData.issuance_date}
                          onChange={(e) => setFormData({ ...formData, issuance_date: e.target.value })}
                        />
                      </div>

                      {/* Reconciliation Box */}
                      <div className="col-12">
                        <div className="p-3 bg-light rounded border">
                          <h6 className="fw-bold mb-2 small text-uppercase text-secondary">
                            Voucher Reconciliation Summary
                          </h6>
                          <div className="row g-2 align-items-center">
                            <div className="col-md-4">
                              <small className="text-muted d-block">Approved Quantity</small>
                              <strong className="fs-6 font-monospace">{approvedQty} L</strong>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label small fw-bold text-success mb-0">Quantity Actually Issued (L) *</label>
                              <input
                                type="number"
                                step="0.1"
                                required
                                className="form-control form-control-sm font-monospace fw-bold border-success mt-1"
                                value={formData.quantity_issued}
                                onChange={(e) => setFormData({ ...formData, quantity_issued: e.target.value })}
                              />
                            </div>
                            <div className="col-md-4">
                              <small className="text-muted d-block">Quantity Variance</small>
                              <strong className={`fs-6 font-monospace ${variance === 0 ? 'text-muted' : variance > 0 ? 'text-primary' : 'text-danger'}`}>
                                {variance >= 0 ? `+${variance}` : variance} L {variance !== 0 ? (variance > 0 ? '(Saved)' : '(Exceeded)') : '(Exact)'}
                              </strong>
                            </div>
                          </div>

                          <div className="row g-2 mt-2 pt-2 border-top">
                            <div className="col-md-6">
                              <label className="form-label small fw-bold mb-0">Station Tariff (Price / Litre TZS)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm font-monospace mt-1"
                                value={formData.unit_price}
                                onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                              />
                            </div>
                            <div className="col-md-6">
                              <small className="text-muted d-block">Total Invoice Value (TZS)</small>
                              <div className="h5 fw-bold font-monospace text-primary mb-0 mt-1">
                                {totalCost.toLocaleString()} TZS
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Receipt & Invoice No */}
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Fuel Station Receipt Number *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace fw-bold"
                          required
                          placeholder="e.g. REC-PUMA-10492"
                          value={formData.receipt_number}
                          onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold">Station Invoice / Credit Reference</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace"
                          placeholder="e.g. INV-PUMA-2026-11-049"
                          value={formData.invoice_reference}
                          onChange={(e) => setFormData({ ...formData, invoice_reference: e.target.value })}
                        />
                      </div>

                      {/* Remarks */}
                      <div className="col-12">
                        <label className="form-label small fw-bold">Remarks / Dispenser Notes</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows="2"
                          placeholder="Station attendant details, tank pump notes, vehicle seal verification..."
                          value={formData.remarks}
                          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        />
                      </div>

                    </div>
                  )}

                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-4 fw-bold"
                    disabled={submitting || authorizedRequests.length === 0}
                  >
                    {submitting ? 'Recording...' : 'Record Issuance & Launch Trip'}
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
