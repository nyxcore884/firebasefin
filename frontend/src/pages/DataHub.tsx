import { useState } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, Workflow, BrainCircuit, Activity } from 'lucide-react';
import { AIText } from '@/components/common/AIText';

// Sub-components
// PipelineMonitor Removed

// Sub-components
import DatasetRegistry from '@/components/data-hub/DatasetRegistry';
import MappingMatrix from '@/components/data-hub/MappingMatrix';
import AITrainingControls from '@/components/data-hub/AITrainingControls';
import VertexAIPipelines from '@/components/data-hub/VertexAIPipelines';
import FinancialOps from '@/components/data-hub/FinancialOps';
import ChartOfAccounts from '@/components/data-hub/ChartOfAccounts';
import DataExplorer from '@/components/data-hub/DataExplorer';

import { FinancialHierarchy } from '@/components/data-hub/FinancialHierarchy';
<<<<<<< Updated upstream
import { PaymentTree } from '@/components/data-hub/PaymentTree';
import { MOCK_COMPANY_STRUCTURE, PAYMENT_TREE } from '@/data/mock-engine';
=======
import PaymentMatrix from '@/components/analysis/PaymentMatrix';
>>>>>>> Stashed changes
import { PrognosisDashboard } from '@/components/prognosis/PrognosisDashboard';
import StorageManager from '@/components/data-hub/StorageManager';
import FinancialInsightsDashboard from '@/components/data-hub/FinancialInsightsDashboard';

const DataHub = () => {
  const [dashboardView, setDashboardView] = useState<'executive' | 'finance' | 'department'>('executive');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleIngestionSuccess = (data: any) => {
    console.log("Ingestion Success Triggered", data);
    setRefreshKey(prev => prev + 1);
    toast.success("Intelligence engine updated with new ledger entries");
  };

  return (
<<<<<<< Updated upstream
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <Tabs defaultValue="insights" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground/90 flex items-center gap-3">
              <span className="bg-primary/10 p-2 rounded-lg"><Upload className="h-6 w-6 text-primary" /></span>
              Data Hub
=======
    <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <Tabs defaultValue="insights" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-glow uppercase italic">
              <AIText>Strategic Ledger Nexus</AIText>
>>>>>>> Stashed changes
            </h1>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 mt-1">
              <Activity className="h-3 w-3" /> <AIText>Financial Operations & Governance Gateway</AIText>
            </p>
          </div>
          <TabsList className="bg-primary/5 dark:bg-slate-900/40 p-1 rounded-xl border border-primary/10 dark:border-white/5 backdrop-blur-xl h-auto flex-wrap justify-start gap-1 shadow-vivid">
            <TabsTrigger value="insights" className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all shadow-lg shadow-primary/20"><AIText>Intelligence</AIText></TabsTrigger>
            <TabsTrigger value="operations" className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-primary/5 transition-colors"><AIText>Operations</AIText></TabsTrigger>
            <TabsTrigger value="database" className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-primary/5 transition-colors"><AIText>Database</AIText></TabsTrigger>
            <TabsTrigger value="accounts" className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-primary/5 transition-colors"><AIText>Accounting</AIText></TabsTrigger>
            <TabsTrigger value="ingestion" className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-primary/5 transition-colors"><AIText>Pipeline</AIText></TabsTrigger>
            <TabsTrigger value="engineering" className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-primary/5 transition-colors"><AIText>Systems</AIText></TabsTrigger>
          </TabsList>
        </div>

        {/* --- TABS CONTENT --- */}

        <TabsContent value="insights" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-1.5 bg-background/50 dark:bg-slate-950/40 p-1.5 rounded-xl border border-primary/10 dark:border-white/5 backdrop-blur-md w-fit shadow-vivid">
            {[
              { id: 'executive', label: 'Executive' },
              { id: 'finance', label: 'Finance' },
              { id: 'department', label: 'Dept' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setDashboardView(v.id as any)}
                className={cn(
                  "px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                  dashboardView === v.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <AIText>{v.label}</AIText>
              </button>
            ))}
          </div>
          <FinancialInsightsDashboard key={refreshKey} view={dashboardView} />
        </TabsContent>

        <TabsContent value="operations" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <FinancialOps />
        </TabsContent>

        <TabsContent value="database" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <DataExplorer />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ChartOfAccounts />
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
<<<<<<< Updated upstream
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Data Ingestion Pipeline</h3>
              <p className="text-sm text-muted-foreground">Upload raw financial documents (Excel, CSV, PDF) here. The system will automatically validate, transform, and map them to the SOCAR hierarchy.</p>
            </div>
            <StorageManager onIngestionSuccess={handleIngestionSuccess} />
          </div>
        </TabsContent>

        <TabsContent value="datasets" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <DatasetRegistry />
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <FinancialHierarchy data={MOCK_COMPANY_STRUCTURE} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <PaymentTree data={PAYMENT_TREE} />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <MappingMatrix />
        </TabsContent>

        <TabsContent value="ai-controls" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <AITrainingControls />
        </TabsContent>

        <TabsContent value="prognosis" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <PrognosisDashboard />
        </TabsContent>

        <TabsContent value="storage" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
=======
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
>>>>>>> Stashed changes
            <div className="lg:col-span-2">
              <StorageManager onIngestionSuccess={handleIngestionSuccess} />
            </div>
            <div className="space-y-6">
              <Card className="glass-vivid border-primary/20 overflow-hidden relative group p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Workflow className="h-5 w-5 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-widest"><AIText>Pipeline Status</AIText></h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Service Health</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 text-[8px] font-black">ACTIVE</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Cloud Storage</span>
                    <span className="text-[10px] font-black text-primary">Connected</span>
                  </div>
                </div>
              </Card>
              <DatasetRegistry />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="engineering" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AITrainingControls />
              <VertexAIPipelines />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MappingMatrix />
              <FinancialHierarchy />
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default DataHub;
