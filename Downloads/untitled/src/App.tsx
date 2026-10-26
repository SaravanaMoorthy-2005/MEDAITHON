import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { DemoControls } from './components/DemoControls';
import { EmergencyModal } from './components/EmergencyModal';
import { RfidScanModal } from './components/RfidScanModal';
import { DashboardPage } from './pages/DashboardPage';
import { StaffPage } from './pages/StaffPage';
import { BedsPage } from './pages/BedsPage';
import { AccessEventsPage } from './pages/AccessEventsPage';
import { HygieneEventsPage } from './pages/HygieneEventsPage';
import { AlertsPage } from './pages/AlertsPage';
import { TechniqueStationPage } from './pages/TechniqueStationPage';
import { DeviceHealthPage } from './pages/DeviceHealthPage';
import { SettingsPage } from './pages/SettingsPage';
import { hospitalStore } from './services/hospitalStore';
import { Alert, WardType } from './types';

export const App: React.FC = () => {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedWard, setSelectedWard] = useState<'All' | WardType>('General Ward');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [reviewedNotice, setReviewedNotice] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to reactive hospital store changes
    const unsubscribe = hospitalStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const beds = hospitalStore.getBeds();
  const staffList = hospitalStore.getStaff();
  const visits = hospitalStore.getVisits();
  const alerts = hospitalStore.getAlerts();
  const accessEvents = hospitalStore.getAccessEvents();
  const hygieneEvents = hospitalStore.getHygieneEvents();
  const devices = hospitalStore.getDevices();
  const metrics = hospitalStore.getMetrics();

  const criticalAlertCount = alerts.filter(
    (a) => a.severity === 'CRITICAL' || a.severity === 'WARNING'
  ).length;

  const handleReviewAlert = (alert: Alert) => {
    setReviewedNotice(`Alert [${alert.id}] "${alert.title}" reviewed and acknowledged by duty supervisor.`);
    setTimeout(() => setReviewedNotice(null), 3500);
  };

  return (
    <div className="app-layout">
      {/* HEADER */}
      <Header
        selectedWard={selectedWard}
        onSelectWard={(w) => setSelectedWard(w)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
      />

      {/* TOP DEMO SIMULATION CONTROLS */}
      <DemoControls
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
      />

      {reviewedNotice && (
        <div className="demo-toast-banner success reviewed-toast">
          <span className="toast-label">CLINICAL AUDIT:</span>
          <span className="toast-text">{reviewedNotice}</span>
        </div>
      )}

      {/* MAIN CONTAINER: SIDEBAR + CONTENT */}
      <div className="main-content-layout">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          alertCount={criticalAlertCount}
        />

        <main className="page-viewport">
          {activeTab === 'dashboard' && (
            <DashboardPage
              beds={beds}
              visits={visits}
              alerts={alerts}
              staffList={staffList}
              metrics={metrics}
              selectedWard={selectedWard}
              onSelectWard={setSelectedWard}
              onReviewAlert={handleReviewAlert}
            />
          )}

          {activeTab === 'staff' && <StaffPage staffList={staffList} />}

          {activeTab === 'beds' && <BedsPage beds={beds} />}

          {activeTab === 'access' && <AccessEventsPage events={accessEvents} />}

          {activeTab === 'hygiene' && <HygieneEventsPage events={hygieneEvents} />}

          {activeTab === 'alerts' && (
            <AlertsPage alerts={alerts} onReviewAlert={handleReviewAlert} />
          )}

          {activeTab === 'technique' && <TechniqueStationPage />}

          {activeTab === 'devices' && <DeviceHealthPage devices={devices} />}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* MODALS */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        beds={beds}
      />

      <RfidScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        staffList={staffList}
        beds={beds}
      />
    </div>
  );
};

export default App;
