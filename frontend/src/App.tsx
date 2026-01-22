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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="/workspace" element={<SmartCanvasPage />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/datahub" element={<DataHub />} />
          <Route path="/ml-tuning" element={<MLTuningPage />} />
          <Route path="/prognostics" element={<Prognostics />} />
          <Route path="/queries" element={<Queries />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-management" element={<AiFinancialManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
