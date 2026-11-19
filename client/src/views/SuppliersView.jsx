import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  Fuel,
  MapPin,
  Phone,
  Mail,
  Edit,
  DollarSign,
  Receipt,
  Eye,
  CheckCircle
} from 'lucide-react';

export default function SuppliersView() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [priceData, setPriceData] = useState({ diesel_price_per_litre: 3280, petrol_price_per_litre: 3240 });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewSupplier(id) {
    try {
      const res = await api.get(`/suppliers/${id}`);
      if (res.data.success) {
        setSupplierDetails(res.data.data);
        setShowDetailModal(true);
      }
    } catch (err) {
      alert('Error fetching supplier details: ' + err.message);
    }
  }

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    try {
      const res = await api.put(`/suppliers/${selectedSupplier.id}`, priceData);
      if (res.data.success) {
        alert(res.data.message);
        setShowEditPriceModal(false);
        fetchSuppliers();
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
            <Store className="text-primary" />
            <span>Contracted Fuel Suppliers & Service Stations</span>
          </h4>
          <p className="text-muted small mb-0">
            Official petroleum service stations contracted by Moshi Co-operative University for fleet fuel card dispensing.
          </p>
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="row g-3">
        {loading ? (
          <div className="col-12 text-center py-5 text-muted">
            <div className="spinner-border text-primary me-2" role="status" />
            Loading suppliers...
          </div>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="col-md-6 col-xl-6">
              <div className="card shadow-sm border-0 p-3 h-100 bg-white d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="fw-bold text-dark mb-0">{s.station_name}</h6>
                      <small className="text-primary fw-semibold">{s.supplier_name}</small>
                    </div>
                    <span className="badge bg-success-subtle text-success">Contract Active</span>
                  </div>

                  <div className="p-2.5 bg-light rounded text-secondary my-2" style={{ fontSize: '0.8rem' }}>
                    <div className="d-flex align-items-center gap-1.5 text-muted mb-1">
                      <MapPin size={14} className="text-danger flex-shrink-0" />
                      <span>{s.location}</span>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span>Contact Officer:</span>
                      <strong className="text-dark">{s.contact_person} ({s.phone_number})</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span>Framework Contract:</span>
                      <strong className="font-monospace">{s.contract_reference}</strong>
                    </div>
                  </div>

                  {/* Pricing Tariffs Display */}
                  <div className="row g-2 text-center mt-2">
                    <div className="col-6">
                      <div className="p-2 border rounded bg-white">
                        <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Diesel Tariff</small>
                        <span className="fw-bold font-monospace text-dark" style={{ fontSize: '0.95rem' }}>
                          {Number(s.diesel_price_per_litre).toLocaleString()} TZS/L
                        </span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 border rounded bg-white">
                        <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Petrol Tariff</small>
                        <span className="fw-bold font-monospace text-dark" style={{ fontSize: '0.95rem' }}>
                          {Number(s.petrol_price_per_litre).toLocaleString()} TZS/L
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="d-flex justify-content-between mt-3 pt-2 border-top small text-muted">
                    <span>Total Supplied: <strong>{Number(s.total_litres_supplied).toLocaleString()} L</strong></span>
                    <span>Total Invoiced: <strong className="text-dark font-monospace">{Number(s.total_amount_paid).toLocaleString()} TZS</strong></span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-top d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => viewSupplier(s.id)}
                  >
                    <Eye size={14} />
                    <span>Transactions</span>
                  </button>

                  {(user?.role === 'transport_officer' || user?.role === 'finance_officer' || user?.role === 'admin') && (
                    <button
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => {
                        setSelectedSupplier(s);
                        setPriceData({
                          diesel_price_per_litre: s.diesel_price_per_litre,
                          petrol_price_per_litre: s.petrol_price_per_litre
                        });
                        setShowEditPriceModal(true);
                      }}
                    >
                      <Edit size={14} />
                      <span>Update Tariffs</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Edit Price Tariffs */}
      {showEditPriceModal && selectedSupplier && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2.5 px-3">
                <h6 className="modal-title">Update Station Fuel Tariffs: {selectedSupplier.station_name}</h6>
                <button className="btn-close btn-close-white" onClick={() => setShowEditPriceModal(false)}></button>
              </div>

              <form onSubmit={handlePriceUpdate}>
                <div className="modal-body p-3">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Diesel Price per Litre (TZS) *</label>
                    <input
                      type="number"
                      required
                      className="form-control form-control-sm font-monospace fw-bold"
                      value={priceData.diesel_price_per_litre}
                      onChange={(e) => setPriceData({ ...priceData, diesel_price_per_litre: Number(e.target.value) })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Petrol Price per Litre (TZS) *</label>
                    <input
                      type="number"
                      required
                      className="form-control form-control-sm font-monospace fw-bold"
                      value={priceData.petrol_price_per_litre}
                      onChange={(e) => setPriceData({ ...priceData, petrol_price_per_litre: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditPriceModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-3 fw-bold">
                    Update Tariffs
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Modal: Supplier Transactions */}
      {showDetailModal && supplierDetails && (
        <div className="modal show fade d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1055 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white py-2.5 px-3">
                <h6 className="modal-title">Fuel Dispensing Records: {supplierDetails.station_name}</h6>
                <button className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
              </div>

              <div className="modal-body p-3">
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Issuance #</th>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th className="text-end">Litres</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Total (TZS)</th>
                        <th>Receipt No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierDetails.transactions?.map(t => (
                        <tr key={t.id}>
                          <td className="font-monospace fw-bold">{t.issuance_number}</td>
                          <td>{t.issuance_date?.substring(0, 10)}</td>
                          <td className="font-monospace">{t.registration_number}</td>
                          <td>{t.driver_name}</td>
                          <td className="text-end font-monospace">{t.quantity_issued} L</td>
                          <td className="text-end font-monospace">{t.unit_price}</td>
                          <td className="text-end font-monospace fw-bold">{Number(t.total_cost).toLocaleString()} TZS</td>
                          <td className="font-monospace">{t.receipt_number}</td>
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
