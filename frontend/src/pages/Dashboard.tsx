<<<<<<< Updated upstream
import FinancialInsightsDashboard from '@/components/data-hub/FinancialInsightsDashboard';

const Dashboard = () => {
  return (
    <div className="pb-12">
      <FinancialInsightsDashboard />
    </div>
  );
};

export default Dashboard;
=======
import { useState, useEffect } from 'react';
import { T } from '@/hooks/use-smart-translation';
import { fetchFinancialTruth } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import NeuralInsights from '@/components/dashboard/NeuralInsights';
import {
  Layers,
  Thermometer,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  TrendingUp,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { useAppState } from '@/hooks/use-app-state';
import TransactionStream from '@/components/dashboard/TransactionStream';

// --- Components ---

// 1. Glowing Metric Card (Clickable for Drill-down)
const GlowingCard = ({ title, value, trend, subtext, icon: Icon, color, onClick }: any) => (
  <div
    className={cn(
      "relative group overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:scale-[1.02]",
      "bg-primary/5 dark:bg-slate-900/40 backdrop-blur-xl border-primary/10 dark:border-white/5 hover:border-primary/20",
      "shadow-vivid hover:shadow-primary/20",
      "ring-1 ring-inset ring-primary/5",
      onClick && "cursor-pointer"
    )}
    onClick={onClick}
  >
    {/* Glow Effect */}
    <div className={cn(
      "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40",
      color === 'blue' ? "bg-blue-500" :
        color === 'emerald' ? "bg-emerald-500" :
          color === 'amber' ? "bg-amber-500" : "bg-rose-500"
    )} />

    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg bg-primary/10 dark:bg-white/5",
          color === 'blue' ? "text-blue-400" :
            color === 'emerald' ? "text-emerald-400" :
              color === 'amber' ? "text-amber-400" : "text-rose-400"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border bg-primary/5 dark:bg-white/5",
          trend > 0 ? "text-emerald-400 border-emerald-500/20" : "text-rose-400 border-rose-500/20"
        )}>
          {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend)}%
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground/80">{subtext}</p>
      </div>

      {onClick && (
        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to drill down →
        </div>
      )}
    </div>
  </div>
);

// 2. Variance Heatmap (Grid Visualization)
const VarianceHeatmap = ({ data }: { data: any[] }) => {
  return (
    <Card className="col-span-1 lg:col-span-2 glass-vivid border-primary/10 dark:border-white/10 bg-background/50 dark:bg-slate-950/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-rose-500" /> Variance Heatmap
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">Live Monitor</Badge>
        </div>
        <CardDescription>Visualizing budget deviation intensity across departments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.map((item, idx) => (
            <div key={idx} className="relative group cursor-pointer">
              <div className={cn(
                "h-24 rounded-lg flex flex-col justify-center items-center p-2 transition-all duration-300 border border-transparent hover:border-white/20",
                item.variancePercent > 10 ? "bg-rose-500/20 hover:bg-rose-500/30" :
                  item.variancePercent > 5 ? "bg-amber-500/20 hover:bg-amber-500/30" :
                    item.variancePercent < -5 ? "bg-emerald-500/20 hover:bg-emerald-500/30" :
                      "bg-slate-500/10 hover:bg-slate-500/20"
              )}>
                <span className="text-xs font-bold text-center mb-1">{item.name}</span>
                <span className={cn("text-lg font-bold",
                  item.variancePercent > 5 ? "text-rose-400" : "text-emerald-400"
                )}>
                  {item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// 3. Forecast Drift Explorer
const ForecastDriftExplorer = ({ data }: { data: any[] }) => (
  <Card className="col-span-1 lg:col-span-2 glass-vivid border-primary/10 dark:border-white/10 bg-background/50 dark:bg-slate-950/40">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" /> Forecast Drift Explorer
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-[10px]">Confidence: 94%</Badge>
        </div>
      </div>
      <CardDescription>Actual vs Forecasted revenue with dynamic confidence bands</CardDescription>
    </CardHeader>
    <CardContent className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Area type="monotone" dataKey="Range" stackId="1" stroke="none" fill="#3b82f6" fillOpacity={0.1} />
          <Area type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} fill="url(#splitColor)" />
          <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// --- Main Page ---
export default function Dashboard() {
  const { selectedCompany, selectedPeriod, selectedDepartment, currency } = useAppState();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [deptVariance, setDeptVariance] = useState<any[]>([
    { name: "Tech", variancePercent: 0 },
    { name: "Sales", variancePercent: 0 },
    { name: "R&D", variancePercent: 0 },
    { name: "Legal", variancePercent: 0 },
    { name: "Admin", variancePercent: 0 },
  ]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [feedMode, setFeedMode] = useState<'transactions' | 'insights'>('insights');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const truth = await fetchFinancialTruth(selectedCompany, selectedPeriod || '', currency, selectedDepartment);

        if (truth) {
          // 1. Metrics - handle normalization from api-client
          setMetrics(truth.metrics);

          // 2. Variance for Heatmap 
          if (truth.breakdown) {
            const heatmap = truth.breakdown.map((item: any) => ({
              name: item.article.toUpperCase(),
              variancePercent: item.budget > 0 ? parseFloat(((item.actual - item.budget) / item.budget * 100).toFixed(1)) : 0
            }));
            setHeatmapData(heatmap.slice(0, 8));
          }

          // 3. Forecast Series
          if (truth.forecast) {
            setForecastData(truth.forecast);
          }
        } else {
          // Fallback for null truth
          setMetrics({ revenue: 0, net_income: 0, burn_rate: 0, cash_runway: 0 });
        }
      } catch (e) {
        console.error("Dashboard Load Failed", e);
        setMetrics({ revenue: 0, net_income: 0, burn_rate: 0, cash_runway: 0 });
      }
    };

    loadDashboardData();
  }, [selectedCompany, selectedPeriod, selectedDepartment, currency]);

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'Generate Report':
        navigate('/statutory-reports');
        break;
      case 'Audit Ledger':
        toast.promise(
          fetch('/api/truth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: selectedCompany, period: selectedPeriod })
          }).then(res => res.json()),
          {
            loading: 'Running statistical audit...',
            success: (data) => `Audit complete. Found ${data.anomalies?.length || 0} anomalies.`,
            error: 'Audit engine unavailable.'
          }
        );
        break;
      case 'Run Scenario':
        navigate('/prognostics');
        break;
      case 'Contact CFO':
        toast.info("Connecting to Secure Finance Channel...");
        break;
    }
  };

  return (
    <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in duration-700">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow">
            <T>Financial Command</T>
          </h1>
          <p className="text-muted-foreground mt-1">
            <T>Real-time telemetry for</T> {selectedCompany} // {selectedPeriod}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("View Persistence is managed in Systems Settings.")}
            className="border-primary/10 dark:border-white/10 hover:bg-primary/5 dark:hover:bg-white/5 gap-2 shadow-vivid"
          >
            <Layers className="h-4 w-4" /> Customize View
          </Button>
          <Button
            size="sm"
            onClick={() => toast.success("AI Strategy Briefing generated in Sidebar.")}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
          >
            <Zap className="h-4 w-4 mr-2 fill-current" /> Auto-Optimize
          </Button>
        </div>
      </div>

      {/* 2. Key Vital Signs (Glowing Cards) - Clickable for drill-down */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlowingCard
          title="Total Revenue"
          value={metrics ? `${currency === 'USD' ? '$' : '₾'}${metrics.revenue?.toLocaleString()}` : "Loading..."}
          trend={5.2}
          subtext="vs last month"
          icon={TrendingUp}
          color="blue"
          onClick={() => navigate('/analysis?category=Revenue')}
        />
        <GlowingCard
          title="Net Profit"
          value={metrics ? `${currency === 'USD' ? '$' : '₾'}${metrics.net_income?.toLocaleString()}` : "Loading..."}
          trend={metrics?.net_income > 0 ? 2.4 : -1.5}
          subtext="Margin compliance: High"
          icon={Activity}
          color="emerald"
          onClick={() => navigate('/analysis?category=Revenue')}
        />
        <GlowingCard
          title="Burn Rate"
          value={metrics ? `${currency === 'USD' ? '$' : '₾'}${metrics.burn_rate?.toLocaleString()}` : "Loading..."}
          trend={-0.8}
          subtext="Monthly Avg"
          icon={AlertTriangle}
          color="amber"
          onClick={() => navigate('/analysis?category=Expenses')}
        />
        <GlowingCard
          title="Runway"
          value={metrics ? `${metrics.cash_runway} Months` : "Loading..."}
          trend={0}
          subtext="Conservative Estimate"
          icon={Target}
          color="rose"
          onClick={() => navigate('/prognostics')}
        />
      </div >

      {/* 3. Advanced Grid (Charts & Heatmaps) */}
      < div className="grid grid-cols-1 lg:grid-cols-4 gap-6" >
        <div className="lg:col-span-2 overflow-hidden">
          <ForecastDriftExplorer data={forecastData} />
        </div>
        <div className="lg:col-span-2 overflow-hidden">
          <VarianceHeatmap data={heatmapData} />
        </div>
      </div >

      {/* 4. Bottom Deck */}
      < div className="grid grid-cols-1 lg:grid-cols-3 gap-6" >
        {/* AI Insight Feed */}
        {/* AI Insight Feed & Live Stream */}
        <div className="col-span-1 h-[400px] flex flex-col gap-2">
          <div className="flex gap-2 p-1 bg-primary/5 dark:bg-slate-900/50 rounded-lg border border-primary/10 dark:border-white/5 shadow-vivid transition-all">
            <Button
              variant={feedMode === 'insights' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFeedMode('insights')}
              className="flex-1 text-xs h-7"
            >
              Neural Insights
            </Button>
            <Button
              variant={feedMode === 'transactions' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFeedMode('transactions')}
              className="flex-1 text-xs h-7"
            >
              Live Stream
            </Button>
          </div>
          {feedMode === 'insights' ? <NeuralInsights /> : <TransactionStream />}
        </div>

        {/* Quick Actions */}
        <Card className="col-span-2 glass-vivid border-primary/10 dark:border-white/10 shadow-vivid">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Generate Report', icon: Activity, color: 'text-indigo-400' },
              { label: 'Audit Ledger', icon: AlertTriangle, color: 'text-rose-400' },
              { label: 'Run Scenario', icon: Zap, color: 'text-amber-400' },
              { label: 'Contact CFO', icon: Target, color: 'text-blue-400' }
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                onClick={() => handleQuickAction(action.label)}
                className="h-20 flex flex-col gap-2 border-primary/10 dark:border-white/10 hover:bg-primary/5 dark:hover:bg-white/5 hover:border-primary/40 transition-all shadow-vivid"
              >
                <action.icon className={cn("h-5 w-5", action.color)} />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div >
      {/* Smart Canvas Overlay */}
      {
        isCanvasOpen && reportData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-5xl glass-card border-white/20 bg-slate-950/50 shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10 pointer-events-none" />

              <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between relative z-10">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Activity className="h-6 w-6" />
                    </div>
                    {reportData.report.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-medium">
                    {selectedCompany} • Strategic Intelligence Canvas • {selectedPeriod}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCanvasOpen(false)}
                  className="rounded-full hover:bg-white/10 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>

              <CardContent className="p-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* AI Executive Summary */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-4">
                      <Badge className={cn(
                        "px-4 py-1 text-xs font-bold uppercase tracking-widest",
                        reportData.report.status === 'OVER_BUDGET' ? "bg-rose-500/20 text-rose-400 border-rose-500/50" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                      )} variant="outline">
                        {reportData.report.status}
                      </Badge>
                      <div className="h-1 w-1 rounded-full bg-slate-700" />
                      <span className="text-sm font-semibold text-slate-300">
                        Total Variance: <span className={cn(
                          reportData.report.kpis.variance_pct > 0 ? "text-rose-400" : "text-emerald-400"
                        )}>{reportData.report.kpis.variance_pct}%</span>
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-indigo-400" />
                        Executive Insights
                      </h3>
                      <div className="grid gap-3">
                        {reportData.report.highlights.map((h: string, i: number) => (
                          <div key={i} className="group p-4 rounded-xl bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/5 hover:border-primary/30 transition-all shadow-vivid">
                            <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                              {h}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* KPI Sidebar */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-400" />
                      Core Metrics
                    </h3>

                    <div className="grid gap-4">
                      {[
                        { label: 'Total Actual', value: reportData.report.kpis.total_actual, color: 'text-white' },
                        { label: 'Market Budget', value: reportData.report.kpis.total_budget, color: 'text-slate-400' },
                        { label: 'Delta (Abs)', value: reportData.report.kpis.variance_abs, color: reportData.report.kpis.variance_abs > 0 ? 'text-rose-400' : 'text-emerald-400' }
                      ].map((m) => (
                        <div key={m.label} className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10">
                          <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{m.label}</div>
                          <div className={cn("text-2xl font-black", m.color)}>
                            {currency === 'USD' ? '$' : '₾'}
                            {m.value?.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
                      <div className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-2">Primary Flux Category</div>
                      <div className="text-xl font-bold text-white mb-1">
                        {reportData.report.top_categories[0]?.name}
                      </div>
                      <div className="text-xs text-indigo-300 font-medium">
                        Concentration: {((reportData.report.top_categories[0]?.value / reportData.report.kpis.total_actual) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                      AI AGENT MURTAZI ACTIVE
                    </div>
                    <div className="h-4 w-px bg-slate-800" />
                    CONSENSUS: DATA INTEGRITY VERIFIED
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none border-white/10 hover:bg-white/5 font-bold uppercase tracking-wider text-xs h-12 px-6">
                      Download PDF
                    </Button>
                    <Button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-wider text-xs h-12 px-8 shadow-lg shadow-indigo-600/20">
                      Broadcast to Stakeholders
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }
    </div >
  );
}
>>>>>>> Stashed changes
