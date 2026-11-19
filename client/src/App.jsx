import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import api from './api/apiClient';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RequisitionSlipModal from './components/RequisitionSlipModal';

// Views
import DashboardView from './views/DashboardView';
import FuelRequestsView from './views/FuelRequestsView';
import TripsView from './views/TripsView';
import VehiclesView from './views/VehiclesView';
import FuelIssuancesView from './views/FuelIssuancesView';
import FuelConsumptionView from './views/FuelConsumptionView';
import MaintenanceView from './views/MaintenanceView';
import DriversView from './views/DriversView';
import DepartmentsView from './views/DepartmentsView';
import SuppliersView from './views/SuppliersView';
import ReportsView from './views/ReportsView';
import AuditTrailView from './views/AuditTrailView';

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Slip Modal state
  const [activeSlipData, setActiveSlipData] = useState(null);
  const [loadingSlip, setLoadingSlip] = useState(false);

  const handleViewSlip = async (requestId = 1) => {
    setLoadingSlip(true);
    try {
      const res = await api.get(`/fuel-requests/${requestId}/slip-data`);
      if (res.data.success) {
        setActiveSlipData(res.data.data);
      }
    } catch (err) {
      alert('Failed to load official requisition slip: ' + err.message);
    } finally {
      setLoadingSlip(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="text-center">
          <img src="/logo.png" alt="MoCU" style={{ width: '70px', height: '70px', objectFit: 'contain' }} className="mb-3" />
          <h5 className="fw-bold text-dark">Moshi Co-operative University</h5>
          <div className="text-muted small">Initializing Fleet Fuel and Vehicle Management System...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      <div className="d-flex flex-grow-1">
        
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Main Content View Container */}
        <main className="flex-grow-1 bg-light" style={{ minWidth: 0 }}>
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setCurrentTab(tab)}
              onViewSlip={handleViewSlip}
            />
          )}

          {currentTab === 'fuel-requests' && (
            <FuelRequestsView
              onViewSlip={handleViewSlip}
            />
          )}

          {currentTab === 'trips' && (
            <TripsView />
          )}

          {currentTab === 'vehicles' && (
            <VehiclesView />
          )}

          {currentTab === 'fuel-issuances' && (
            <FuelIssuancesView />
          )}

          {currentTab === 'fuel-consumption' && (
            <FuelConsumptionView />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceView />
          )}

          {currentTab === 'drivers' && (
            <DriversView />
          )}

          {currentTab === 'departments' && (
            <DepartmentsView />
          )}

          {currentTab === 'suppliers' && (
            <SuppliersView />
          )}

          {currentTab === 'reports' && (
            <ReportsView />
          )}

          {currentTab === 'audit-trail' && (
            <AuditTrailView />
          )}
        </main>

      </div>

      {/* Global Printable Official MoCU Requisition Slip Modal */}
      {activeSlipData && (
        <RequisitionSlipModal
          slipData={activeSlipData}
          onClose={() => setActiveSlipData(null)}
        />
      )}

    </div>
  );
}
