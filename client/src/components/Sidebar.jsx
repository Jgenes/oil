import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Navigation,
  Car,
  Fuel,
  Gauge,
  Wrench,
  Users,
  Building2,
  Store,
  BarChart3,
  ShieldCheck,
  LogOut,
  MapPin
} from 'lucide-react';

export default function Sidebar({ currentTab, onSelectTab, isOpen, onCloseMobile }) {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'fuel-requests', label: 'Fuel Requisitions', icon: FileText, badge: 'Workflow' },
    { id: 'trips', label: 'Trip & Distance Monitor', icon: Navigation },
    { id: 'vehicles', label: 'Vehicle Fleet', icon: Car },
    { id: 'fuel-issuances', label: 'Fuel Issuance & Station', icon: Fuel },
    { id: 'fuel-consumption', label: 'Fuel Consumption & Anomalies', icon: Gauge, alertBadge: true },
    { id: 'maintenance', label: 'Vehicle Maintenance', icon: Wrench },
    { id: 'drivers', label: 'Driver Management', icon: Users },
    { id: 'departments', label: 'Departments & Budgets', icon: Building2 },
    { id: 'suppliers', label: 'Suppliers & Stations', icon: Store },
    { id: 'reports', label: 'Institutional Reports', icon: BarChart3 },
    { id: 'audit-trail', label: 'Audit Trail & Compliance', icon: ShieldCheck }
  ];

  const handleSelect = (id) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`mocu-sidebar p-3 d-flex flex-column justify-content-between position-relative ${isOpen ? 'd-block' : 'd-none d-md-flex'}`}
        style={{
          width: '260px',
          zIndex: 1045,
          position: isOpen ? 'fixed' : 'sticky',
          top: '60px',
          height: 'calc(100vh - 60px)',
          overflowY: 'auto'
        }}
      >
        <div>
          {/* Institution Header Mini */}
          <div className="pb-2 mb-3 border-bottom d-flex align-items-center gap-2 text-secondary">
            <MapPin size={14} className="text-primary" />
            <span style={{ fontSize: '0.73rem', letterSpacing: '0.5px' }} className="fw-semibold text-uppercase">
              Moshi Campus • Kilimanjaro
            </span>
          </div>

          {/* Navigation Links */}
          <div className="nav flex-column">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`nav-link-mocu border-0 bg-transparent text-start w-100 ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} className={isActive ? 'text-primary' : 'text-secondary'} />
                  <span className="flex-grow-1">{item.label}</span>
                  {item.badge && (
                    <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: '0.62rem' }}>
                      {item.badge}
                    </span>
                  )}
                  {item.alertBadge && (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.62rem' }}>
                      Alerts
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-3 border-top mt-auto">
          <div className="p-2.5 rounded bg-light border text-secondary lh-sm" style={{ fontSize: '0.72rem' }}>
            <div className="fw-bold text-dark">MoCU Fleet System v2.0</div>
            <div className="text-muted mt-0.5">United Republic of Tanzania</div>
            <div className="text-muted">Office of the Vice Chancellor</div>
            <div className="mt-1.5 pt-1.5 border-top border-secondary-subtle d-flex justify-content-between align-items-center">
              <span className="badge bg-success-subtle text-success">Secure System</span>
              <span className="font-monospace text-muted">2026.11</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
