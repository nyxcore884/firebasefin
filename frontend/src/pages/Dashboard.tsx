import { useState, useEffect } from 'react';
import { useAppState } from '@/hooks/use-app-state';
import {
  TrendingUp, Activity, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Zap, Target,
  Layers, Thermometer
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// --- Components ---

// 1. Glowing Metric Card
const GlowingCard = ({ title, value, trend, subtext, icon: Icon, color }: any) => (
  <div className={cn(
    "relative group overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:scale-[1.02]",
    "bg-slate-950/40 backdrop-blur-xl border-white/10 hover:border-white/20",
    "shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]"
  )}>
    {/* Glow Effect */}
    <div className={cn(
      "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40",
      color === 'blue' ? "bg-blue-500" :
        color === 'emerald' ? "bg-emerald-500" :
          color === 'amber' ? "bg-amber-500" : "bg-rose-500"
    )} />

    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg bg-white/5",
          color === 'blue' ? "text-blue-400" :
            color === 'emerald' ? "text-emerald-400" :
              color === 'amber' ? "text-amber-400" : "text-rose-400"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border bg-white/5",
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
    </div>
  </div>
);

// 2. Variance Heatmap (Grid Visualization)
const VarianceHeatmap = ({ data }: { data: any[] }) => {
  return (
    <Card className="col-span-1 lg:col-span-2 glass-card border-white/10 bg-slate-950/40">
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
  <Card className="col-span-1 lg:col-span-2 glass-card border-white/10 bg-slate-950/40">
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
  const { selectedCompany, selectedPeriod } = useAppState();
  const [metrics, setMetrics] = useState<any>(null);

  // Mock Data for "Futuristic" parts (until backend fully wired for these specific viz)
  const heatmapData = [
    { name: "IT Ops", variancePercent: 12.5 },
    { name: "Marketing", variancePercent: -4.2 },
    { name: "Logistics", variancePercent: 8.1 },
    { name: "HR", variancePercent: 1.5 },
    { name: "Sales", variancePercent: -8.5 },
    { name: "R&D", variancePercent: 2.1 },
    { name: "Legal", variancePercent: 15.2 },
    { name: "Admin", variancePercent: 0.5 },
  ];

  const forecastData = [
    { name: 'Wk 1', actual: 4000, forecast: 4100, Range: [3800, 4400] },
    { name: 'Wk 2', actual: 3000, forecast: 3200, Range: [2900, 3500] },
    { name: 'Wk 3', actual: 2000, forecast: 2400, Range: [2100, 2700] },
    { name: 'Wk 4', actual: 2780, forecast: 2900, Range: [2600, 3200] },
    { name: 'Wk 5', actual: 1890, forecast: 2100, Range: [1800, 2400] },
    { name: 'Wk 6', actual: 2390, forecast: 2500, Range: [2200, 2800] },
    { name: 'Wk 7', forecast: 3600, Range: [3300, 3900] },
    { name: 'Wk 8', forecast: 4100, Range: [3700, 4500] },
  ];

  useEffect(() => {
    // Fetch Real Metrics
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/process_transaction/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'metrics', company_id: selectedCompany, period: selectedPeriod })
        });
        const data = await res.json();
        if (data.status === 'success') setMetrics(data.metrics);
      } catch (e) {
        console.error("Dashboard Fetch Error", e);
        // toast.error("Live stream interrupted. Using cached data.");
      }
    };
    fetchMetrics();
  }, [selectedCompany, selectedPeriod]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 animate-pulse">LIVE CONNECTED</Badge>
            <span className="text-xs text-muted-foreground font-mono">LATENCY: 24ms</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Financial Command
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Real-time telemetry for {selectedCompany} // {selectedPeriod}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2">
            <Layers className="h-4 w-4" /> Customize View
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
            <Zap className="h-4 w-4 mr-2 fill-current" /> Auto-Optimize
          </Button>
        </div>
      </div>

      {/* 2. Key Vital Signs (Glowing Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlowingCard
          title="Total Revenue"
          value={metrics ? `₾${metrics.revenue?.toLocaleString()}` : "Loading..."}
          trend={5.2}
          subtext="vs last month"
          icon={TrendingUp}
          color="blue"
        />
        <GlowingCard
          title="Net Profit"
          value={metrics ? `₾${metrics.net_income?.toLocaleString()}` : "Loading..."}
          trend={metrics?.net_income > 0 ? 2.4 : -1.5}
          subtext="Margin compliance: High"
          icon={Activity}
          color="emerald"
        />
        <GlowingCard
          title="Burn Rate"
          value={metrics ? `₾${metrics.burn_rate?.toLocaleString()}` : "Loading..."}
          trend={-0.8}
          subtext="Monthly Avg"
          icon={AlertTriangle}
          color="amber"
        />
        <GlowingCard
          title="Runway"
          value={metrics ? `${metrics.cash_runway} Months` : "Loading..."}
          trend={0}
          subtext="Conservative Estimate"
          icon={Target}
          color="rose"
        />
      </div>

      {/* 3. Advanced Grid (Charts & Heatmaps) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ForecastDriftExplorer data={forecastData} />
        <VarianceHeatmap data={heatmapData} />
      </div>

      {/* 4. Bottom Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insight Feed */}
        <Card className="col-span-1 glass-card border-white/10 bg-indigo-950/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" /> Neural Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300">
              "Revenue pattern matches 'Q3 Growth' trajectory with 89% similarity. Suggest allocation of surplus to R&D."
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300">
              "Variance in 'Logistics' expenses detected. 3 vendors are charging 15% above baseline."
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-2 glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Generate Report', 'Audit Ledger', 'Run Scenario', 'Contact CFO'].map((action) => (
              <Button key={action} variant="outline" className="h-20 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-indigo-500/50 transition-all">
                <Activity className="h-5 w-5 text-indigo-400" />
                <span className="text-xs">{action}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
