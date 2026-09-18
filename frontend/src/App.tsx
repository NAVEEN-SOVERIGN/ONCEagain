import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { NavItem } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { NewScreeningPage } from './pages/NewScreeningPage';
import { ScreeningListPage } from './pages/ScreeningListPage';
import { ScreeningDetailPage } from './pages/ScreeningDetailPage';
import { SensorMonitorPage } from './pages/SensorMonitorPage';
import { PhysioPodDashboardPage } from './pages/PhysioPodDashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Patient, ScreeningSession } from './api/types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [screeningPatient, setScreeningPatient] = useState<Patient | null>(null);
  const [selectedSession, setSelectedSession] = useState<ScreeningSession | null>(null);

  const handleNavigate = (tab: NavItem, context?: any) => {
    if (tab === 'screenings' && context?.sessionId) {
      // Find session or load directly
      setSelectedSession({
        id: context.sessionId,
        patient_id: '',
        started_at: new Date().toISOString(),
        screening_status: 'IN_PROGRESS',
      });
      setCurrentTab('screenings');
      return;
    }
    setSelectedSession(null);
    setCurrentTab(tab);
  };

  const handleStartScreeningForPatient = (patient: Patient) => {
    setScreeningPatient(patient);
    setSelectedSession(null);
    setCurrentTab('new-screening');
  };

  const handleSimulationComplete = (result: any) => {
    if (result?.screening_id) {
      handleNavigate('screenings', { sessionId: result.screening_id });
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setSelectedSession(null);
        setCurrentTab(tab);
      }}
      onSimulationComplete={handleSimulationComplete}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage
          onNavigate={handleNavigate}
          onRunSimulation={handleSimulationComplete}
        />
      )}

      {currentTab === 'patients' && (
        <PatientsPage onStartScreening={handleStartScreeningForPatient} />
      )}

      {currentTab === 'new-screening' && (
        <NewScreeningPage
          initialPatient={screeningPatient}
          onNavigate={handleNavigate}
        />
      )}

      {currentTab === 'screenings' &&
        (selectedSession ? (
          <ScreeningDetailPage
            session={selectedSession}
            onBack={() => setSelectedSession(null)}
          />
        ) : (
          <ScreeningListPage
            onSelectSession={(sc) => setSelectedSession(sc)}
            onNavigate={handleNavigate}
          />
        ))}

      {currentTab === 'sensors' && <SensorMonitorPage />}

      {currentTab === 'physio-pods' && (
        <PhysioPodDashboardPage onNavigate={handleNavigate} />
      )}

      {currentTab === 'reports' && <ReportsPage />}

      {currentTab === 'settings' && <SettingsPage onNavigate={handleNavigate} />}
    </Layout>
  );
}

export default App;
