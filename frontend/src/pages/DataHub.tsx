import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Activity, Workflow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIText } from '@/components/common/AIText';

// Sub-components
import DatasetRegistry from '@/components/data-hub/DatasetRegistry';
import MappingMatrix from '@/components/data-hub/MappingMatrix';
import MappingUpload from '@/components/data-hub/MappingUpload';
import AITrainingControls from '@/components/data-hub/AITrainingControls';
import VertexAIPipelines from '@/components/data-hub/VertexAIPipelines';
import FinancialOps from '@/components/data-hub/FinancialOps';
import ChartOfAccounts from '@/components/data-hub/ChartOfAccounts';
import DataExplorer from '@/components/data-hub/DataExplorer';
import { FinancialHierarchy } from '@/components/data-hub/FinancialHierarchy';
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
    <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <Tabs defaultValue="insights" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-glow uppercase italic">
              <AIText>Strategic Ledger Nexus</AIText>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <MappingUpload />
              <AITrainingControls />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MappingMatrix />
              <VertexAIPipelines />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialHierarchy />
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default DataHub;
