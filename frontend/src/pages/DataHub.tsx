import { useState } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, Workflow } from 'lucide-react';

// Sub-components
// PipelineMonitor Removed

// Sub-components
import DatasetRegistry from '@/components/data-hub/DatasetRegistry';
import MappingMatrix from '@/components/data-hub/MappingMatrix';
import AITrainingControls from '@/components/data-hub/AITrainingControls';

import { FinancialHierarchy } from '@/components/data-hub/FinancialHierarchy';
import { PaymentTree } from '@/components/data-hub/PaymentTree';
// Mock data removed
import { PrognosisDashboard } from '@/components/prognosis/PrognosisDashboard';
import StorageManager from '@/components/data-hub/StorageManager';
import FinancialInsightsDashboard from '@/components/data-hub/FinancialInsightsDashboard';

const DataHub = () => {
  const [dashboardView, setDashboardView] = useState<'executive' | 'finance' | 'department'>('executive');

  const handleIngestionSuccess = (data: any) => {
    // Switch to insights view to show the results in the main dashboard as well
    // slightly delayed to allow the user to see the success animation in the modal first
    console.log("Ingestion Success Triggered", data);

    // We could automatically switch tabs, but the user is viewing the dashboard inside the modal now.
    // So we just toast or update local state if needed.
    // For now, staying on the same tab is better UX as the modal handles the view.
    toast.info("Dashboard updated with new data");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <Tabs defaultValue="ingestion" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground/90 flex items-center gap-3">
              <span className="bg-primary/10 p-2 rounded-lg"><Upload className="h-6 w-6 text-primary" /></span>
              Data Hub
            </h1>
            <p className="text-muted-foreground text-lg">Central Command Console for Financial Data Intelligence.</p>
          </div>
          <TabsList className="bg-background/50 border border-white/5 p-1 h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="insights" className="text-xs px-3 bg-emerald-500/10 text-emerald-500 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 border border-emerald-500/20">Insights & Dashboards</TabsTrigger>
            <TabsTrigger value="ingestion" className="text-xs px-3">Ingestion Zone</TabsTrigger>
            <TabsTrigger value="datasets" className="text-xs px-3">Dataset Registry</TabsTrigger>
            <TabsTrigger value="hierarchy" className="text-xs px-3 flex gap-2"><Building2 className="h-3 w-3" /> Hierarchy</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs px-3 flex gap-2"><CreditCard className="h-3 w-3" /> Payments</TabsTrigger>
            <TabsTrigger value="mapping" className="text-xs px-3 flex gap-2"><Workflow className="h-3 w-3" /> Smart Mapping</TabsTrigger>
            <TabsTrigger value="ai-controls" className="text-xs px-3">AI Controls</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="insights" className="space-y-6">
          <div className="flex justify-end space-x-2 bg-muted/20 p-2 rounded-lg inline-flex self-end">
            <button
              onClick={() => setDashboardView('executive')}
              className={cn("text-xs px-3 py-1.5 rounded-md transition-all", dashboardView === 'executive' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-background/50 text-muted-foreground")}
            >
              Executive View
            </button>
            <button
              onClick={() => setDashboardView('finance')}
              className={cn("text-xs px-3 py-1.5 rounded-md transition-all", dashboardView === 'finance' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-background/50 text-muted-foreground")}
            >
              Finance Control
            </button>
            <button
              onClick={() => setDashboardView('department')}
              className={cn("text-xs px-3 py-1.5 rounded-md transition-all", dashboardView === 'department' ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-background/50 text-muted-foreground")}
            >
              Department
            </button>
          </div>

          <FinancialInsightsDashboard view={dashboardView} />
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
          <FinancialHierarchy data={[]} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <PaymentTree data={[]} />
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
            <div className="lg:col-span-2">
              <StorageManager />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Storage Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Used Space</span>
                        <span className="font-bold">245 MB</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Standard Tier. Auto-archiving enabled for files older than 90 days.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div >
  );
};

export default DataHub;
