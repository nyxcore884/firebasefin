import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import Dashboard from '@/pages/Dashboard';
import Analysis from '@/pages/Analysis';
import DataHub from '@/pages/DataHub';
import MLTuningPage from '@/pages/MLTuningPage';
import Prognostics from '@/pages/Prognostics';
import Queries from '@/pages/Queries';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import AiFinancialManagement from '@/pages/AiFinancialManagement';

import SmartCanvasPage from '@/pages/SmartCanvasPage';
import KnowledgeBasePage from '@/pages/KnowledgeBasePage';
import StatutoryReports from '@/pages/StatutoryReports';

import SystemsHub from '@/pages/SystemsHub';

import { SmartTranslationProvider } from '@/hooks/use-smart-translation';

function App() {
  return (
    <Router>
      <SmartTranslationProvider>
        <Routes>
          <Route path="/" element={<Shell />}>
            {/* Core Dashboard */}
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Analysis & Data */}
            <Route path="analysis" element={<Analysis />} />
            <Route path="datahub" element={<DataHub />} />
            <Route path="knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="workspace" element={<SmartCanvasPage />} />

            {/* AI & Innovation */}
            <Route path="ai-management" element={<AiFinancialManagement />} />
            <Route path="ml-tuning" element={<MLTuningPage />} />
            <Route path="prognostics" element={<Prognostics />} />
            <Route path="queries" element={<Queries />} />
            <Route path="systems" element={<SystemsHub />} />

            {/* Reporting & Settings */}
            <Route path="reports" element={<Reports />} />
            <Route path="statutory-reports" element={<StatutoryReports />} />
            <Route path="settings" element={<Settings />} />

            {/* Redirects/Fallbacks (Optional: Catch-all to Dashboard) */}
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </SmartTranslationProvider>
    </Router>
  );
}

export default App;
