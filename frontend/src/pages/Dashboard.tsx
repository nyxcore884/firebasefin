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

const GlowingCard = ({ title, value, trend, subtext, icon: Icon, color, onClick }: any) => (
  <div
    className={cn(
      "relative group overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:scale-[1.02]",
      "bg-primary/5 dark:bg-slate-900/40 backdrop-blur-xl border-primary/10 dark:border-white/5 hover:border-primary/20",
      "shadow-vivid hover:shadow-primary/20",
      "ring-1 ring-inset ring-primary/5 cursor-pointer"
    )}
    onClick={onClick}
  >
    <div className={cn(
      "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20",
      color === 'blue' ? "bg-blue-500" : color === 'emerald' ? "bg-emerald-500" : color === 'amber' ? "bg-amber-500" : "bg-rose-500"
    )} />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg bg-primary/10",
          color === 'blue' ? "text-blue-400" : color === 'emerald' ? "text-emerald-400" : color === 'amber' ? "text-amber-400" : "text-rose-400"
        )}><Icon className="h-5 w-5" /></div>
        <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border",
          trend > 0 ? "text-emerald-400 border-emerald-500/20" : "text-rose-400 border-rose-500/20"
        )}>{trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(trend)}%</div>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground/80">{subtext}</p>
      </div>
    </div>
  </div>
);

const VarianceHeatmap = ({ data }: { data: any[] }) => (
  <Card className="col-span-1 lg:col-span-2 glass-vivid border-primary/10 bg-background/50">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2"><Thermometer className="h-4 w-4 text-rose-500" /> Variance Heatmap</CardTitle>
        <Badge variant="outline" className="text-[10px]">Live Monitor</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {data.map((item, idx) => (
          <div key={idx} className={cn(
            "h-24 rounded-lg flex flex-col justify-center items-center p-2 border border-transparent",
            item.variancePercent > 10 ? "bg-rose-500/20" : item.variancePercent > 5 ? "bg-amber-500/20" : item.variancePercent < -5 ? "bg-emerald-500/20" : "bg-slate-500/10"
          )}>
            <span className="text-xs font-bold text-center mb-1">{item.name}</span>
            <span className={cn("text-lg font-bold", item.variancePercent > 5 ? "text-rose-400" : "text-emerald-400")}>{item.variancePercent}%</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ForecastDriftExplorer = ({ data }: { data: any[] }) => (
  <Card className="col-span-1 lg:col-span-2 glass-vivid border-primary/10 bg-background/50">
    <CardHeader>
      <CardTitle className="text-sm font-bold flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" /> Forecast Drift Explorer</CardTitle>
    </CardHeader>
    <CardContent className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)' }} />
          <Area type="monotone" dataKey="forecast" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
          <Area type="monotone" dataKey="actual" stroke="#10b981" fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { selectedCompany, selectedPeriod, currency, selectedDepartment } = useAppState();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [feedMode, setFeedMode] = useState<'transactions' | 'insights'>('insights');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const truth = await fetchFinancialTruth(selectedCompany, selectedPeriod || '', currency, selectedDepartment);
        if (truth) {
          setMetrics(truth.metrics);
          if (truth.breakdown) {
            setHeatmapData(truth.breakdown.slice(0, 8).map((item: any) => ({
              name: item.article.toUpperCase(),
              variancePercent: item.budget > 0 ? parseFloat(((item.actual - item.budget) / item.budget * 100).toFixed(1)) : 0
            })));
          }
          if (truth.forecast) setForecastData(truth.forecast);
        } else {
          setMetrics({ revenue: 0, net_income: 0, burn_rate: 0, cash_runway: 0 });
        }
      } catch (e) {
        setMetrics({ revenue: 0, net_income: 0, burn_rate: 0, cash_runway: 0 });
      }
    };
    loadDashboardData();
  }, [selectedCompany, selectedPeriod, selectedDepartment, currency]);

  return (
    <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow"><T>Financial Command</T></h1>
          <p className="text-muted-foreground mt-1"><T>Real-time telemetry for</T> {selectedCompany} // {selectedPeriod}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Customizer active")}><Layers className="h-4 w-4 mr-2" /> Views</Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => toast.success("AI Briefing Sent")}><Zap className="h-4 w-4 mr-2 fill-current" /> Auto-Optimize</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlowingCard title="Revenue" value={metrics ? `${currency === 'USD' ? '$' : '₾'}${metrics.revenue?.toLocaleString()}` : '...'} trend={5.2} icon={TrendingUp} color="blue" onClick={() => navigate('/analysis?category=Revenue')} />
        <GlowingCard title="Net Profit" value={metrics ? `${currency === 'USD' ? '$' : '₾'}${metrics.net_income?.toLocaleString()}` : '...'} trend={2.4} icon={Activity} color="emerald" onClick={() => navigate('/analysis?category=Revenue')} />
        <GlowingCard title="Burn Rate" value={metrics ? `${currency === 'USD' ? '$' : '₾'}${metrics.burn_rate?.toLocaleString()}` : '...'} trend={-0.8} icon={AlertTriangle} color="amber" onClick={() => navigate('/analysis?category=Expenses')} />
        <GlowingCard title="Runway" value={metrics ? `${metrics.cash_runway} Months` : '...'} trend={0} icon={Target} color="rose" onClick={() => navigate('/prognostics')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ForecastDriftExplorer data={forecastData} />
        <VarianceHeatmap data={heatmapData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 h-[400px] flex flex-col gap-2">
          <div className="flex gap-2 p-1 bg-primary/5 rounded-lg border border-primary/10">
            <Button variant={feedMode === 'insights' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFeedMode('insights')} className="flex-1 text-xs h-7">Neural Insights</Button>
            <Button variant={feedMode === 'transactions' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFeedMode('transactions')} className="flex-1 text-xs h-7">Live Stream</Button>
          </div>
          {feedMode === 'insights' ? <NeuralInsights /> : <TransactionStream />}
        </div>
        <Card className="col-span-2 glass-vivid border-primary/10">
          <CardHeader><CardTitle className="text-sm font-bold">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Generate Report', 'Audit Ledger', 'Run Scenario', 'Contact CFO'].map((label, i) => (
              <Button key={label} variant="outline" className="h-20 flex flex-col gap-2" onClick={() => label === 'Run Scenario' ? navigate('/prognostics') : toast.info(label)}>
                <Activity className="h-5 w-5 text-indigo-400" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
