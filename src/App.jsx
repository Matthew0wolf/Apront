import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/shared/Sidebar';
import Dashboard from '@/components/views/Dashboard';
import ProjectsView from '@/components/views/ProjectsView';
import SettingsView from '@/components/views/SettingsView';
import TemplatesView from '@/components/views/TemplatesView';
import TeamView from '@/components/views/TeamView';
import PlansView from '@/components/views/PlansView';
import OperatorView from '@/components/views/OperatorView';
import PresenterView from '@/components/views/PresenterView';
import PracticeModeView from '@/components/views/PracticeModeView';
import TransmissionHistoryView from '@/components/views/TransmissionHistoryView';
import BackupManagementView from '@/components/views/BackupManagementView';
import SecurityAuditView from '@/components/views/SecurityAuditView';
import RoleSelectionView from '@/components/views/RoleSelectionView';
import RoleGuard from '@/components/guards/RoleGuard';
import PermissionGuard from '@/components/guards/PermissionGuard';
import AnalyticsView from '@/components/views/AnalyticsView';

import MiniPresenterView from '@/components/shared/MiniPresenterView';
import { useRundown } from '@/contexts/RundownContext.jsx';

import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import AcceptInvitePage from '@/pages/AcceptInvitePage.jsx';
import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';

const MiniViewManager = () => {
  const { isRunning, activeRundown } = useRundown();
  const location = useLocation();
  const [isMiniViewVisible, setIsMiniViewVisible] = useState(true);

  const showMiniView = isRunning && activeRundown && !location.pathname.includes('/presenter') && isMiniViewVisible;

  useEffect(() => {
    if (isRunning && activeRundown) {
      setIsMiniViewVisible(true);
    }
  }, [isRunning, activeRundown]);

  return (
    <AnimatePresence>
      {showMiniView && <MiniPresenterView onClose={() => setIsMiniViewVisible(false)} />}
    </AnimatePresence>
  );
};

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <Sidebar currentView={location.pathname.substring(1) || 'dashboard'} onViewChange={(view) => navigate(`/${view}`)} />
      <main className="flex-1 p-3 sm:p-6 overflow-auto pt-14 sm:pt-16">{children}</main>
    </div>
  );
};


function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  if (!user) {
    window.localStorage.setItem('redirectAfterLogin', location.pathname);
    return <LoginPage />;
  }
  return children;
}

function App() {
  const location = useLocation();

  return (
    <>
      <Helmet>
        <title>Apront - Controle de Transmissão</title>
        <meta name="description" content="Plataforma inteligente Apront para controle de transmissões ao vivo com rundowns automatizados" />
      </Helmet>
      <MiniViewManager />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/project/:projectId/operator" element={
            <PrivateRoute>
              <PermissionGuard permission="operate">
                <OperatorView />
              </PermissionGuard>
            </PrivateRoute>
          } />
          <Route path="/project/:projectId/presenter" element={
            <PrivateRoute>
              <PermissionGuard permission="present">
                <PresenterView />
              </PermissionGuard>
            </PrivateRoute>
          } />
          <Route path="/project/:projectId/practice" element={
            <PrivateRoute>
              <PermissionGuard permission="present">
                <PracticeModeView />
              </PermissionGuard>
            </PrivateRoute>
          } />
          <Route path="/project/:projectId/select-role" element={
            <PrivateRoute>
              <RoleGuard allowedRoles={['admin', 'operator', 'presenter']}>
                <RoleSelectionView />
              </RoleGuard>
            </PrivateRoute>
          } />
          <Route path="/*" element={
            <PrivateRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={
                    <RoleGuard allowedRoles={['admin', 'operator', 'presenter']}>
                      <ProjectsView />
                    </RoleGuard>
                  } />
                  <Route path="/settings" element={
                    <RoleGuard allowedRoles={['admin']}>
                      <SettingsView />
                    </RoleGuard>
                  } />
                  <Route path="/templates" element={
                    <RoleGuard allowedRoles={['admin', 'operator']}>
                      <TemplatesView />
                    </RoleGuard>
                  } />
                  <Route path="/team" element={
                    <RoleGuard allowedRoles={['admin']}>
                      <TeamView />
                    </RoleGuard>
                  } />
                  <Route path="/plans" element={
                    <RoleGuard allowedRoles={['admin']}>
                      <PlansView />
                    </RoleGuard>
                  } />
                  <Route path="/analytics" element={<AnalyticsView />} />
                  <Route path="/history" element={<TransmissionHistoryView />} />
                  <Route path="/backup" element={
                    <RoleGuard allowedRoles={['admin']}>
                      <BackupManagementView />
                    </RoleGuard>
                  } />
                  <Route path="/security" element={
                    <RoleGuard allowedRoles={['admin']}>
                      <SecurityAuditView />
                    </RoleGuard>
                  } />
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              </MainLayout>
            </PrivateRoute>
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;