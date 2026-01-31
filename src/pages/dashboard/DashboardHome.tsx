
import React, { useState } from 'react';
import {
  Upload, MessageSquare, FileText,
  RefreshCw, MoreVertical, ExternalLink, ArrowUpRight,
  Activity, Clock, AlertCircle, TrendingUp, TrendingDown, LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

// Hooks
import { useRealTimeFinancialData } from '../../hooks/useRealTimeFinancialData';
import { useRealTimeAlerts } from '../../hooks/useRealTimeAlerts';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

// Components
import { LiveKPICard } from '../../components/dashboard/LiveKPICard';
import { LiveRevenueChart } from '../../components/dashboard/LiveRevenueChart';
import { LiveVarianceAnalysis } from '../../components/dashboard/LiveVarianceAnalysis';
import { PipelineHealth } from '../../components/dashboard/PipelineHealth';
import { AiAccuracyChart } from '../../components/dashboard/AiAccuracyChart';
import { Button } from '@/components/ui/button';
import { InlineUpload } from '../../components/data/InlineUpload';
import { financialService } from '../../services/financialService';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const orgId = currentCompany?.org_id || 'SGG';
  const orgName = currentCompany?.org_name || 'SOCAR GROUP';

  const { data: dashboardData, isLive } = useRealTimeFinancialData({
    orgId,
    dataType: 'actual'
  });

  const { data: aggregatedMetrics, loading: metricsLoading } = useDashboardMetrics(orgId);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleIngestClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Ingesting data nodes...');

    try {
      await financialService.uploadFinancialData(file);
      setUploadMessage('Synthesis complete. Cards updated.');
      setTimeout(() => {
        setUploadMessage(null);
        setIsUploading(false);
      }, 3000);
    } catch (err: any) {
      setUploadMessage('Ingestion failed: ' + err.message);
      setTimeout(() => {
        setUploadMessage(null);
        setIsUploading(false);
      }, 3000);
    }
  };

  const { newAlertsCount } = useRealTimeAlerts({ orgId, severity: ['high', 'critical'] });

  const displayKpis = {
    revenue: aggregatedMetrics?.metrics?.total_revenue?.current || 0,
    revenueChange: aggregatedMetrics?.metrics?.total_revenue?.growth_percentage || 0,
    revenueTrend: (aggregatedMetrics?.metrics?.total_revenue?.growth_percentage || 0) >= 0 ? 'up' as const : 'down' as const,
    ebitda: aggregatedMetrics?.metrics?.ebitda?.current || 0,
    ebitdaChange: aggregatedMetrics?.metrics?.ebitda?.growth_percentage || 0,
    ebitdaTrend: (aggregatedMetrics?.metrics?.ebitda?.growth_percentage || 0) >= 0 ? 'up' as const : 'down' as const,
    netMargin: aggregatedMetrics?.metrics?.profit_margin?.current || 0,
    netMarginChange: aggregatedMetrics?.metrics?.profit_margin?.growth_percentage || 0,
    netMarginTrend: (aggregatedMetrics?.metrics?.profit_margin?.growth_percentage || 0) >= 0 ? 'up' as const : 'down' as const
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto space-y-6 min-h-screen relative overflow-hidden bg-background">
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-mesh" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-mesh" style={{ animationDelay: '-5s' }} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-border gap-4 relative z-10">
        <div className="space-y-1">
          <span className="text-primary font-black tracking-[0.4em] block text-[10px] uppercase text-glow">
            Intelligence Center
          </span>
          <div className="flex items-center gap-4">
            <h1 className="font-black text-foreground font-display uppercase tracking-tighter text-4xl lg:text-5xl text-glow">
              {orgName} <span className="text-primary">Core</span>
            </h1>
            <div className="px-3 py-1 bg-accent/10 rounded-full border border-border text-[10px] text-primary font-black flex items-center gap-2 tracking-[0.2em] uppercase backdrop-blur-md">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
              {isLive ? 'Neural Active' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-border bg-card/5 hover:bg-accent/10 text-foreground font-black uppercase text-[10px] tracking-widest h-10 px-6 backdrop-blur-md" onClick={() => navigate('/reports/generate')}>
            Intelligence Report
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-[0_0_30px_rgba(37,99,235,0.4)] h-10 px-6"
            onClick={handleIngestClick}
            disabled={isUploading}
          >
            {isUploading ? <RefreshCw className="mr-2 animate-spin" size={16} /> : <Upload size={16} className="mr-2" />}
            {isUploading ? 'Processing...' : 'Ingest Data'}
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <LiveKPICard title="Revenue" value={displayKpis.revenue} change={displayKpis.revenueChange} trend={displayKpis.revenueTrend} format="currency" icon="💰" className="gradient-revenue" />
        <LiveKPICard title="EBITDA" value={displayKpis.ebitda} change={displayKpis.ebitdaChange} trend={displayKpis.ebitdaTrend} format="currency" icon="📊" className="gradient-ops" />
        <LiveKPICard title="Net Margin" value={displayKpis.netMargin} change={displayKpis.netMarginChange} trend={displayKpis.netMarginTrend} format="percentage" icon="💹" className="gradient-ai" />
        <LiveKPICard title="Risk Alerts" value={newAlertsCount} severity="warning" format="number" icon="🚨" className="gradient-risk" />
      </div>

      {/* INFRASTRUCTURE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <div className="nyx-card p-6 bg-gradient-to-br from-white/5 to-transparent">
          <PipelineHealth />
        </div>
        <div className="nyx-card p-6 bg-gradient-to-br from-white/5 to-transparent">
          <AiAccuracyChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        <div className="lg:col-span-8 space-y-6">

          <div className="nyx-card p-8 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-white font-display uppercase tracking-widest text-xs flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgb(37,99,235)]" />
                Performance Trajectory
              </h2>
            </div>
            <LiveRevenueChart
              data={dashboardData}
              entities={['SGG', 'Gas Imereti']}
              dateRange={{ start: new Date(), end: new Date() }}
            />
          </div>

          <div className="nyx-card bg-transparent border-none">
            <div className="p-4 flex justify-between items-center mb-2">
              <h2 className="font-black text-white font-display uppercase tracking-widest text-xs">Variance Deep-Dive</h2>
              <button className="text-primary hover:text-white transition-colors text-[10px] font-black tracking-widest uppercase italic">Full Audit</button>
            </div>
            <div className="nyx-card p-2 bg-white/[0.02]">
              <LiveVarianceAnalysis actual={dashboardData} budget={dashboardData} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="nyx-card p-6 border-primary/20 bg-primary/5">
            <h3 className="font-black text-white font-display uppercase text-xs tracking-widest mb-6 italic">Neural Pulse</h3>
            <ul className="space-y-3">
              {[
                { label: 'Ingestion Engine', status: 'Optimal', time: '1s ago', color: 'text-emerald-500' },
                { label: 'AI Inference', status: 'Processing', time: 'Active', color: 'text-primary' },
                { label: 'Cloud Sync', status: 'Encrypted', time: 'Real-time', color: 'text-cyan-500' }
              ].map((l, i) => (
                <li key={i} className="flex justify-between items-center p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.05] transition-all">
                  <div>
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{l.label}</p>
                    <p className={cn("text-xs font-black uppercase tracking-tight", l.color)}>{l.status}</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground opacity-50">{l.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="nyx-card p-1 bg-white/[0.02] border-white/5">
            <InlineUpload />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {uploadMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-vivid z-[100] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {uploadMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
