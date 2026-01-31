import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Login } from '@/pages/auth/Login';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from './store/authSlice';
import { authService } from './services/authService';
import { RootState } from './store';

// Pages
import { OperationalConsolePage } from '@/pages/OperationalConsolePage';
import { NeuralControl } from '@/pages/operational/NeuralControl';
import { DashboardHome } from '@/pages/dashboard/DashboardHome';
import { CompanySelector } from '@/components/common/CompanySelector';
import { SGPDashboard } from '@/pages/companies/SGPDashboard';
import { SGGDashboard } from '@/pages/companies/SGGDashboard';
import { CompanyDashboardSwitcher } from '@/pages/companies/CompanyDashboardSwitcher';
import { CompanyLayout } from '@/components/layout/CompanyLayout';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';

// Scaffolded Pages
import { DataHub } from '@/pages/data/DataHub';
import { DataQuality } from '@/pages/data/DataQuality';
import { Templates } from '@/pages/data/Templates';
import { LiveDashboardPage } from '@/pages/analysis/LiveDashboardPage';
import { ProfitLoss } from '@/pages/analysis/ProfitLoss';
import { BalanceSheet } from '@/pages/analysis/BalanceSheet';
import { CashFlow } from '@/pages/analysis/CashFlow';
import { Consolidation } from '@/pages/analysis/Consolidation';
import { IntercompanyReview } from '@/pages/analysis/IntercompanyReview';
import { Prognostics } from '@/pages/analysis/Prognostics';
import { GenerateReport } from '@/pages/reports/GenerateReport';
import { AiAssistant } from '@/pages/ai/AiAssistant';
import { FinancialConsole } from '@/pages/ai/FinancialConsole';
import { Insights } from '@/pages/ai/Insights';
import AIContextHub from '@/pages/ai/AIContextHub';
import { WorkflowBuilder } from '@/pages/workflows/WorkflowBuilder';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { EntityManager } from '@/pages/settings/EntityManager';
import { ProcessingMonitor } from '@/components/layout/ProcessingMonitor';
import { FinancialEngine } from '@/pages/engine/FinancialEngine';
import { GovernanceCenter } from '@/pages/operational/GovernanceCenter';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Restore session
  React.useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      dispatch(loginSuccess(user));
    }
  }, [dispatch]);

  // Hardcoded Org ID for demo
  const orgId = "SOCAR_GROUP";

  return (
    // Provider is now at root level in main.tsx
    // Tailwind base styles are already global via index.css
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/*" element={
          <ProtectedRoute>
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
              <SidebarInset className="bg-background transition-colors duration-300">
                {/* Header / Trigger */}
                <div className="p-3 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-xl relative z-30">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger className="text-white/60 hover:text-white transition-colors" />
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <div>
                      <div className="text-[10px] font-black text-primary tracking-[0.3em] uppercase text-glow-vivid">Enterprise Intelligence</div>
                    </div>
                  </div>
                  <div className="w-[320px]">
                    <CompanySelector />
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto p-0">
                  <Routes>
                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* SOCAR Group Dashboard (Consolidated) */}
                    <Route path="/dashboard" element={<DashboardHome />} />

                    {/* Company-Specific Routes */}
                    <Route path="/companies/:orgId" element={<CompanyLayout />}>
                      <Route path="dashboard" element={<CompanyDashboardSwitcher />} />
                      <Route path="data-hub" element={<DataHub />} />
                    </Route>

                    {/* Legacy routes for backward compatibility - redirect to new structure */}
                    <Route path="/dashboard/sgg" element={<Navigate to="/companies/sgg/dashboard" replace />} />
                    <Route path="/dashboard/sgp" element={<Navigate to="/companies/sgp/dashboard" replace />} />

                    {/* 2-5 Data Management */}
                    <Route path="/data/hub" element={
                      <ProtectedRoute allowedRoles={['Admin', 'Analyst']}>
                        <DataHub />
                      </ProtectedRoute>
                    } />
                    <Route path="/data/templates" element={
                      <ProtectedRoute allowedRoles={['Admin', 'Analyst']}>
                        <Templates />
                      </ProtectedRoute>
                    } />

                    {/* 6-9 Financial Analysis */}
                    <Route path="/analysis/dashboard" element={<LiveDashboardPage />} />
                    <Route path="/analysis/pl" element={<ProfitLoss />} />
                    <Route path="/analysis/balance-sheet" element={<BalanceSheet />} />
                    <Route path="/analysis/cash-flow" element={<CashFlow />} />
                    <Route path="/analysis/consolidation" element={<Consolidation />} />
                    <Route path="/analysis/intercompany" element={<IntercompanyReview />} />
                    <Route path="/analysis/prognostics" element={<Prognostics />} />
                    <Route path="/prognostics" element={<div className="p-8 text-white">Prognostics Array Active</div>} />

                    {/* 10 Reports */}
                    <Route path="/reports" element={<div className="p-8 text-white">Reports Library Active</div>} />
                    <Route path="/reports/generate" element={<GenerateReport />} />

                    {/* 11-12 AI */}
                    <Route path="/ai/assistant" element={<AiAssistant />} />
                    <Route path="/ai/insights" element={<Insights />} />
                    <Route path="/ai/studio" element={<AIContextHub />} />
                    <Route path="/queries" element={<AiAssistant />} />
                    <Route path="/canvas" element={<div className="p-8 text-white">Smart Canvas Active</div>} />

                    {/* Settings */}
                    <Route path="/settings" element={<SettingsPage />} />

                    {/* Engine / Console (Legacy/Admin) */}
                    <Route path="/governance" element={<GovernanceCenter />} />
                    <Route path="/engine" element={<FinancialEngine />} />
                    <Route path="/operational/neural" element={
                      <ProtectedRoute allowedRoles={['Admin']}>
                        <NeuralControl />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ProtectedRoute>
        } />
      </Routes>

      {/* Global AI Assistant - Available on all pages */}
      <AIAssistantPanel />

      {/* Global Processing Monitor */}
      <ProcessingMonitor />
    </BrowserRouter >
  );
};

export default App;
