import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../context/AuthContext';
import api from '../api/apiClient';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
  UserCheck,
  ChevronDown,
  Menu,
  ExternalLink,
  Info
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, onNavigate }) {
  const { user, switchRole, ROLES } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user]);

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // quiet catch
    }
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleResetDemo() {
    if (!window.confirm('Reset MoCU Fleet database to pristine initial state with realistic sample data?')) return;
    setResetting(true);
    try {
      const res = await api.post('/system/reset-demo');
      setResetMsg('Database reset successfully!');
      setTimeout(() => {
        setResetMsg('');
        window.location.reload();
      }, 1000);
    } catch (err) {
      alert('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <nav className="mocu-topbar px-3 py-2 sticky-top shadow-sm">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        
        {/* Left: Mobile Toggle, MoCU Logos & Title */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <button
            className="btn btn-outline-light btn-sm d-md-none p-1"
            onClick={onToggleSidebar}
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>

          <div className="d-flex align-items-center gap-2">
            <img
              src="/coat-of-arms.svg"
              alt="Tanzania Coat of Arms"
              style={{ width: '36px', height: '36px' }}
              className="d-none d-sm-block"
            />
            <img
              src="/logo.png"
              alt="MoCU Crest"
              style={{ width: '44px', height: '44px', objectFit: 'contain' }}
            />
            <div>
              <div className="fw-bold lh-1 text-white d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                  MOSHI CO-OPERATIVE UNIVERSITY
                </span>
                <span className="badge bg-warning text-dark px-2 py-0.5 fw-bold" style={{ fontSize: '0.68rem' }}>
                  MoCU
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 mt-1">
                <span className="text-white-50" style={{ fontSize: '0.75rem', letterSpacing: '0.3px' }}>
                  CHUO KIKUU CHA USHIRIKA MOSHI • FLEET FUEL & VEHICLE MANAGEMENT SYSTEM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Role Switcher, Reset Demo, Notifications, User Profile */}
        <div className="d-flex align-items-center gap-2 gap-lg-3">

          {/* Quick Role Switcher Dropdown */}
          <div className="dropdown">
            <button
              className="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-2 shadow-sm fw-medium"
              type="button"
              data-bs-toggle="dropdown"
              style={{ fontSize: '0.82rem', borderColor: '#CBD5E1' }}
            >
              <UserCheck size={16} className="text-primary" />
              <span className="d-none d-lg-inline text-muted">Role:</span>
              <strong className="text-dark">
                {ROLES.find(r => r.role === user?.role)?.label || user?.role}
              </strong>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0 py-2" style={{ minWidth: '280px' }}>
              <li className="dropdown-header text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem' }}>
                Test As Any University Role:
              </li>
              {ROLES.map((r) => (
                <li key={r.role}>
                  <button
                    className={`dropdown-item py-2 d-flex align-items-center justify-content-between ${user?.role === r.role ? 'bg-primary text-white active' : ''}`}
                    onClick={() => switchRole(r.email)}
                  >
                    <div>
                      <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{r.label}</div>
                      <small className={user?.role === r.role ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.72rem' }}>
                        {r.name}
                      </small>
                    </div>
                    {user?.role === r.role && <CheckCircle size={16} className="text-white" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* System Reset Demo */}
          <button
            className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1.5 px-2.5 py-1 text-white border-warning"
            onClick={handleResetDemo}
            disabled={resetting}
            title="Reset database to clean initial MoCU demo state"
            style={{ fontSize: '0.78rem' }}
          >
            <RotateCcw size={14} className={resetting ? 'spin' : ''} />
            <span className="d-none d-xl-inline">{resetting ? 'Resetting...' : 'Reset Demo'}</span>
          </button>
          {resetMsg && (
            <span className="badge bg-success" style={{ fontSize: '0.75rem' }}>{resetMsg}</span>
          )}

          {/* Notifications Center */}
          <div className="position-relative">
            <button
              className="btn btn-dark btn-sm rounded-circle p-2 position-relative shadow-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
              onClick={() => setShowNotifs(!showNotifs)}
              title="Notifications & Alerts"
            >
              <Bell size={18} className="text-white" />
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifs && (
              <div
                className="position-absolute end-0 mt-2 card shadow-lg border-0"
                style={{ width: '360px', zIndex: 1050, maxHeight: '480px', overflowY: 'auto' }}
              >
                <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between py-2 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <Bell size={16} />
                    <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Notifications & Alerts</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="btn btn-link btn-sm text-white text-decoration-none p-0"
                      onClick={markAllRead}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="list-group list-group-flush">
                  {notifications.length === 0 ? (
                    <div className="p-3 text-center text-muted" style={{ fontSize: '0.85rem' }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`list-group-item list-group-item-action p-2.5 ${!n.is_read ? 'bg-light' : ''}`}
                        style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                        onClick={() => {
                          if (n.link) onNavigate(n.link.replace('/', ''));
                          setShowNotifs(false);
                        }}
                      >
                        <div className="d-flex align-items-start gap-2">
                          {n.type === 'danger' && <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />}
                          {n.type === 'warning' && <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />}
                          {n.type === 'success' && <CheckCircle size={16} className="text-success flex-shrink-0 mt-0.5" />}
                          {n.type === 'info' && <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />}
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark">{n.title}</div>
                            <div className="text-secondary small">{n.message}</div>
                            <div className="text-muted text-end mt-1" style={{ fontSize: '0.68rem' }}>
                              {n.created_at ? n.created_at.substring(0, 16).replace('T', ' ') : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="d-none d-sm-flex align-items-center gap-2 ps-2 border-start border-white-50">
            <div
              className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}
            >
              {user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'U'}
            </div>
            <div className="d-none d-md-block text-start lh-sm">
              <div className="text-white fw-bold" style={{ fontSize: '0.82rem' }}>
                {user?.name}
              </div>
              <div className="text-white-50" style={{ fontSize: '0.7rem' }}>
                {user?.designation || user?.department_name || 'MoCU Staff'}
              </div>
            </div>
          </div>

        </div>

      </div>
    </nav>
  );
}
