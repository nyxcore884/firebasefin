
import React, { useState } from 'react';
import {
  RefreshCw, Download, MessageSquare,
  AlertCircle, Zap, BrainCircuit, BarChart3,
  ChevronRight, ChevronDown, Grid as GridIcon, Maximize2,
  TrendingUp, TrendingDown, CheckCircle2, Loader2,
  Scale, Wallet, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, ArrowRight, Calendar, BarChart,
  X, Sparkles, Upload
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { aiService } from '@/services/aiService';
import { InlineUpload } from '../../components/data/InlineUpload';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- MOCK DATA ---
const plData = [
  { id: 'rev-total', name: 'Total Revenue', actual: 4250000, budget: 4000000, variance: 250000, varPct: 6.25, level: 0, expanded: true },
  { id: 'rev-prod', name: 'Product Revenue', actual: 3800000, budget: 3500000, variance: 300000, varPct: 8.57, level: 1 },
  { id: 'rev-serv', name: 'Service Revenue', actual: 450000, budget: 500000, variance: -50000, varPct: -10.0, level: 1 },
  { id: 'cogs-total', name: 'Total COGS', actual: 1800000, budget: 1750000, variance: 50000, varPct: 2.86, level: 0, expanded: true },
  { id: 'gp', name: 'Gross Profit', actual: 2450000, budget: 2250000, variance: 200000, varPct: 8.89, level: 0, isCalculated: true },
  { id: 'ebitda', name: 'EBITDA', actual: 1250000, budget: 1100000, variance: 150000, varPct: 13.64, level: 0, isCalculated: true },
];

const bsData = [
  { id: 'assets-curr', name: 'Current Assets', actual: 1500000, budget: 1400000, variance: 100000, varPct: 7.14, level: 0, expanded: true },
  { id: 'cash', name: 'Cash & Equivalents', actual: 800000, budget: 750000, variance: 50000, varPct: 6.67, level: 1 },
  { id: 'assets-fixed', name: 'Fixed Assets', actual: 2500000, budget: 2600000, variance: -100000, varPct: -3.85, level: 0, expanded: true },
  { id: 't-assets', name: 'Total Assets', actual: 4000000, budget: 4000000, variance: 0, varPct: 0.0, level: 0, isCalculated: true },
  { id: 'equity', name: 'Total Equity', actual: 3100000, budget: 3050000, variance: 50000, varPct: 1.64, level: 0, isCalculated: true },
];

const cfData = [
  { id: 'cf-ops', name: 'Operating Cash Flow', actual: 1200000, budget: 1100000, variance: 100000, varPct: 9.09, level: 0, expanded: true, isCalculated: true },
  { id: 'cf-net', name: 'Net Cash Flow', actual: 500000, budget: 300000, variance: 200000, varPct: 66.67, level: 0, isCalculated: true },
];

const initialInsights = [
  { id: 1, type: 'critical', title: 'COGS Spike Alert', desc: 'Raw material costs in Entity B rose 12% above budget last week due to energy price hikes.', icon: <AlertCircle size={14} />, color: '#ef4444' },
  { id: 2, type: 'important', title: 'Product Mix Opportunity', desc: 'SaaS renewals are performing 15% better than forecasted. Consider reallocating ad spend.', icon: <Zap size={14} />, color: '#f59e0b' },
  { id: 3, type: 'info', title: 'Cash Position Strong', desc: 'Operating cash flow is projected to hit $2M by EOM. Sufficient for Q1 expansion.', icon: <BrainCircuit size={14} />, color: '#3b82f6' },
];

export const LiveDashboardPage: React.FC = () => {
  const [statementTab, setStatementTab] = useState(0);
  const [aiInput, setAiInput] = useState('');
  const [aiFiles, setAiFiles] = useState<File[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [insights, setInsights] = useState(initialInsights);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const location = useLocation();
  const { currentCompany } = useSelector((state: RootState) => state.company);

  const getActiveData = () => {
    switch (statementTab) {
      case 1: return bsData;
      case 2: return cfData;
      case 3: return plData;
      default: return plData;
    }
  };

  const handleAskAi = async (overridePrompt?: string) => {
    const queryText = overridePrompt || aiInput;
    if (!queryText.trim() && aiFiles.length === 0) return;

    setIsAiThinking(true);
    if (!overridePrompt) setAiInput('');

    try {
      const context = {
        page: location.pathname,
        company: {
          org_id: currentCompany?.org_id || 'SOCAR_GROUP',
          org_name: currentCompany?.org_name || 'SOCAR Group',
        },
        dataset: currentCompany?.org_id === 'SGG' ? 'sgg_core' : 'socar_consolidated'
      };

      let result;
      if (aiFiles.length > 0) {
        result = await aiService.queryWithFiles(queryText, context, aiFiles);
      } else {
        result = await aiService.query(queryText, context);
      }

      setInsights((prev) => [{
        id: Date.now(),
        type: 'success',
        title: "Intelligence Captured",
        desc: result.answer,
        icon: <Sparkles size={14} />,
        color: "var(--primary)"
      }, ...prev]);

      setAiFiles([]);
    } catch (error: any) {
      console.error("AI Analysis failed", error);
      setInsights((prev) => [{
        id: Date.now(),
        type: 'critical',
        title: "Oracle Error",
        desc: error.message || "Failed to process query.",
        icon: <AlertCircle size={14} />,
        color: "#ef4444"
      }, ...prev]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSync = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatValue = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const currentData = getActiveData();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto space-y-6 min-h-screen relative overflow-hidden bg-grid-white">
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary/20 rounded-full blur-[100px] animate-mesh" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-emerald-500/10 rounded-full blur-[100px] animate-mesh" style={{ animationDelay: '-8s' }} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-white/10 gap-4 relative z-10">
        <div className="space-y-1">
          <span className="text-primary font-black tracking-[0.4em] block text-[10px] uppercase text-glow">
            Visual Intelligence
          </span>
          <div className="flex items-center gap-4">
            <BarChart3 size={32} className="text-primary" />
            <h1 className="text-4xl lg:text-5xl font-black text-white font-display uppercase tracking-tighter text-glow">
              Live Analysis
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            className="h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest px-6 backdrop-blur-md"
          >
            <RefreshCw size={16} className={cn("mr-2", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Syncing..." : "Force Sync"}
          </Button>
          <Button size="sm" className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            <Download size={16} className="mr-2" /> Export Array
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 relative z-10">
        {/* Main Section */}
        <div className="col-span-12 xl:col-span-9 space-y-6">

          {/* KPI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Revenue Target', val: '$4.25M', var: '+6.3%', color: 'text-white', icon: '💰', gradient: 'gradient-revenue' },
              { label: 'Operational EBITDA', val: '29.4%', var: '+2.1%', color: 'text-emerald-400', icon: '📊', gradient: 'gradient-ops' },
              { label: 'Net Alpha', val: '$950K', var: '+13.6%', color: 'text-white', icon: '💹', gradient: 'gradient-ai' },
              { label: 'Asset Liquidity', val: '$1.2M', var: '+9.1%', color: 'text-white', icon: '🏦', gradient: 'gradient-ops' }
            ].map((k, i) => (
              <div key={i} className={cn("nyx-card p-6 group", k.gradient)}>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/10 rounded-2xl text-2xl">{k.icon}</div>
                  <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">{k.var}</div>
                </div>
                <div className={cn("text-3xl font-black font-display tracking-tighter mb-1 mt-auto", k.color)}>{k.val}</div>
                <div className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="nyx-card overflow-hidden">
            {/* Functional Tabs */}
            <div className="flex border-b border-white/10 bg-white/[0.03] px-4 pt-4">
              {['P&L', 'Balance Sheet', 'Cash Flow', 'Consolidation'].map((t, idx) => (
                <button
                  key={t}
                  onClick={() => setStatementTab(idx)}
                  className={cn(
                    "px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 relative z-10",
                    statementTab === idx ? "border-primary text-primary bg-white/5" : "border-transparent text-white/40 hover:text-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 font-black text-white/60 uppercase tracking-widest">Account Intelligence Structure</th>
                    <th className="p-4 font-black text-white/60 uppercase tracking-widest text-right">Actual Array</th>
                    <th className="p-4 font-black text-white/60 uppercase tracking-widest text-right">Budget Array</th>
                    <th className="p-4 font-black text-white/60 uppercase tracking-widest text-center">Variance Capture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {currentData.map((row) => (
                    <tr key={row.id} className={cn(
                      "hover:bg-white/[0.02] transition-colors group",
                      row.isCalculated && "bg-primary/5"
                    )}>
                      <td className="p-4" style={{ paddingLeft: (row.level * 24) + 16 }}>
                        <div className="flex items-center gap-3">
                          {row.level === 0 && <ChevronDown size={14} className="text-primary" />}
                          <span className={cn(
                            "uppercase",
                            row.level === 0 ? "font-black text-white tracking-tight text-xs" : "font-bold text-white/60"
                          )}>{row.name}</span>
                        </div>
                      </td>
                      <td className={cn("p-4 text-right font-black text-xs", row.isCalculated ? "text-primary text-glow" : "text-white")}>
                        {formatValue(row.actual)}
                      </td>
                      <td className="p-4 text-right font-mono text-white/40 text-[10px]">
                        {formatValue(row.budget)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn("px-2 py-1 rounded-full text-[10px] font-black border", row.varPct >= 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                          {row.varPct > 0 ? '+' : ''}{row.varPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="col-span-12 xl:col-span-3 space-y-6">

          <div className="nyx-card p-1 bg-white/[0.02] border-white/5">
            <InlineUpload />
          </div>

          {/* AI Insights Area */}
          <div className="nyx-card p-6 space-y-6 bg-gradient-to-b from-white/5 to-transparent">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
              <BrainCircuit size={16} className="text-primary" /> Intelligence Pulse
            </h3>
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {insights.map(ins => (
                  <motion.div
                    key={ins.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: ins.color }} />
                    <div className="flex items-center gap-3 mb-2">
                      <span style={{ color: ins.color }}>{ins.icon}</span>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-tight">{ins.title}</h4>
                    </div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-tighter leading-tight">{ins.desc}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Input Area */}
          <div className="nyx-card p-6 bg-primary/10 border-primary/30 space-y-6 shadow-2xl shadow-primary/10">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic flex items-center gap-2">
                <Sparkles size={16} className="animate-pulse" /> Advanced Oracle
              </h3>
              <div className="px-2 py-1 bg-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-widest border border-primary/30">
                Active
              </div>
            </div>

            <div className="space-y-4">
              {aiFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aiFiles.map((file, idx) => (
                    <div key={idx} className="bg-white/10 border border-white/10 px-3 py-1 rounded-full text-[9px] font-black text-white flex items-center gap-2 uppercase">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button onClick={() => setAiFiles(aiFiles.filter((_, i) => i !== idx))} className="hover:text-rose-500"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <label className="shrink-0 cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && setAiFiles(Array.from(e.target.files))}
                  />
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 group-hover:text-primary group-hover:border-primary transition-all backdrop-blur-md">
                    <Upload size={20} />
                  </div>
                </label>

                <div className="relative flex-1">
                  <input
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 text-xs font-black text-white outline-none focus:border-primary transition-all uppercase tracking-tight placeholder:text-white/20 backdrop-blur-md"
                    placeholder="Ask Oracle Anything..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                  />
                  <button
                    onClick={() => handleAskAi()}
                    disabled={isAiThinking || (!aiInput.trim() && aiFiles.length === 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-white/10 rounded-xl disabled:opacity-30 transition-all shadow-xl"
                  >
                    {isAiThinking ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                {['Analysis', 'Risk Audit', 'Full Forecast'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAskAi(tag)}
                    className="text-[9px] font-black text-white/30 uppercase tracking-widest hover:text-primary transition-colors hover:scale-105"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
