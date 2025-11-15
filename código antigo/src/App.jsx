import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ProjectsView from '@/components/ProjectsView';
import SettingsView from '@/components/SettingsView';
import TemplatesView from '@/components/TemplatesView';
import TeamView from '@/components/TeamView';
import OperatorView from '@/components/OperatorView';
import PresenterView from '@/components/PresenterView';
import RoleSelectionView from '@/components/RoleSelectionView';
import MiniPresenterView from '@/components/MiniPresenterView';
import { useRundown } from '@/contexts/RundownContext.jsx';

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
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
};

function App() {
  const location = useLocation();

  return (
    <>
      <Helmet>
        <title>Run It Down - Controle de Transmissão</title>
        <meta name="description" content="Plataforma inteligente para controle de transmissões ao vivo com rundowns automatizados" />
      </Helmet>
      
      <MiniViewManager />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/project/:projectId/operator" element={<OperatorView />} />
          <Route path="/project/:projectId/presenter" element={<PresenterView />} />
          <Route path="/project/:projectId/select-role" element={<RoleSelectionView />} />
          <Route path="/*" element={
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectsView />} />
                <Route path="/settings" element={<SettingsView />} />
                <Route path="/templates" element={<TemplatesView />} />
                <Route path="/team" element={<TeamView />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </MainLayout>
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;