import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  BrainCircuit,
  Sparkles,
  AlertCircle,
  Calendar as CalendarIcon,
  Download,
  SlidersHorizontal,
  Activity,
  Globe,
  ShieldCheck,
  History
} from 'lucide-react';
import React from 'react';
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState, translations } from '@/hooks/use-app-state';
import { AIText } from '@/components/common/AIText';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface ExportDataItem {
  Month: string;
  Actual: number | undefined;
  Forecast: number | undefined;
  'Lower Bound': number | undefined;
  'Upper Bound': number | undefined;
}

function DateRangePicker({
  date,
  setDate
}: {
  date: DateRange | undefined,
  setDate: (date: DateRange | undefined) => void
}) {
  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "w-[240px] justify-start text-left font-normal gap-2",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function GoalTracking() {
  const goals = [
    { id: 1, name: "Revenue Growth", target: 5.5, current: 4.8, unit: "$M" },
    { id: 2, name: "Cost Reduction", target: 15, current: 8, unit: "%" },
    { id: 3, name: "Market Share", target: 25, current: 22, unit: "%" },
  ];

  return (
    <Card className="glass-vivid border-primary/10 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="relative z-10">
        <CardTitle className="text-sm font-black italic uppercase"><AIText>Strategic Goals</AIText></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-bold uppercase text-[10px]"><AIText>{goal.name}</AIText></span>
              <span className="text-[10px] font-black text-muted-foreground/60">
                {goal.current} / {goal.target} {goal.unit}
              </span>
            </div>
            <Progress value={(goal.current / goal.target) * 100} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RiskAssessmentMatrix() {
  const risks = [
    { id: 1, name: "Currency Fluctuation", prob: "High", impact: "High", mitigation: "Hedging Strategy" },
    { id: 2, name: "Supply Chain Disrupt", prob: "Med", impact: "High", mitigation: "Supplier Diversification" },
    { id: 3, name: "Regulatory Change", prob: "Low", impact: "Med", mitigation: "Compliance Audit" },
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Risk Assessment Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs">Risk Factor</TableHead>
              <TableHead className="h-8 text-xs">Prob</TableHead>
              <TableHead className="h-8 text-xs">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {risks.map((risk) => (
              <TableRow key={risk.id} className="h-8">
                <TableCell className="text-xs font-medium py-2">{risk.name}</TableCell>
                <TableCell className="text-xs py-2">
                  <Badge variant={risk.prob === 'High' ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0 h-4">
                    {risk.prob}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs py-2">{risk.impact}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ApprovalWorkflow() {
  const [status, setStatus] = React.useState<'pending' | 'approved' | 'rejected'>('pending');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Forecast Approval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Badge variant={status === 'approved' ? 'success' : status === 'rejected' ? 'destructive' : 'outline'}>
            {status.toUpperCase()}
          </Badge>
        </div>

        {status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => setStatus('approved')}>
              <Check className="h-3 w-3 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="destructive" className="w-full h-7 text-xs" onClick={() => setStatus('rejected')}>
              <X className="h-3 w-3 mr-1" /> Reject
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => setStatus('pending')}>
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

const CompanyFilter = ({ selected, setSelected }: { selected: string, setSelected: (v: string) => void }) => {
  const companies = ["Globex Corp", "Acme Inc", "Soylent Corp", "Massive Dynamic"];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {selected || 'Filter Entity'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {companies.map((c) => (
          <DropdownMenuItem key={c} onClick={() => setSelected(c)}>
            {c}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


const formatCurrency = (value: number, currency: 'USD' | 'GEL') => {
  const rate = 2.7;
  const amount = currency === 'GEL' ? value * rate : value;
  const symbol = currency === 'GEL' ? '₾' : '$';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount).replace(currency, symbol);
};

const Prognostics = () => {
  const { language, currency, selectedCompany } = useAppState();
  const t = translations[language];
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2023, 0, 20),
    to: addDays(new Date(2023, 0, 20), 20),
  });
  // No local state for company needed, using selectedCompany from global state
  const [isLive, setIsLive] = React.useState(false);
  const [forecastData, setForecastData] = React.useState<any[]>([]);
<<<<<<< Updated upstream
  const [loading, setLoading] = React.useState(false);
=======
  const [simulationData, setSimulationData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'forecast' | 'simulation'>('forecast');
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [showAudit, setShowAudit] = React.useState(false);
>>>>>>> Stashed changes

  React.useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
<<<<<<< Updated upstream
        // Using emulator URL for dev
        const url = new URL('http://127.0.0.1:5001/firebasefin-main/us-central1/process_transaction/forecast');
        if (company) url.searchParams.append('company_id', company);

        const res = await fetch(url.toString());
=======
        const url = '/api/process-transaction';

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'forecast',
            company_id: selectedCompany,
            assumptions: {}
          })
        });
>>>>>>> Stashed changes
        if (res.ok) {
          const data = await res.json();
          setForecastData(data);
        } else {
          console.error("API Error", res.statusText);
          toast.error("Failed to fetch forecast from AI engine.");
        }
      } catch (err) {
        console.error("Fetch Error", err);
        toast.warning("Using offline demo data");
        // Fallback to offline data if API fails to prevent white screen during dev
        setForecastData([
          { name: 'Jan', actual: 4000, forecast: 4100 },
          { name: 'Feb', actual: 3000, forecast: 3200 },
          { name: 'Mar', actual: 2000, forecast: 2400 },
          { name: 'Apr', actual: 2780, forecast: 2900 },
          { name: 'May', actual: 1890, forecast: 2100 },
          { name: 'Jun', actual: 2390, forecast: 2500 },
          { name: 'Jul', actual: 3490, forecast: 3600 },
          { name: 'Aug', forecast: 3800, lower: 3500, upper: 4100 },
          { name: 'Sep', forecast: 4200, lower: 3800, upper: 4600 },
          { name: 'Oct', forecast: 4500, lower: 4000, upper: 5000 },
          { name: 'Nov', forecast: 4800, lower: 4200, upper: 5400 },
          { name: 'Dec', forecast: 5200, lower: 4500, upper: 5900 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [selectedCompany]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/process-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate',
          company_id: selectedCompany,
          iterations: 1000,
          horizon: 12
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSimulationData(data);
        setViewMode('simulation');
        toast.success("Monte Carlo simulation converged. 1,000 paths calculated.");
        fetchAuditLogs(); // Refresh logs after run
      }
    } catch (err) {
      toast.error("Simulation failed to converge.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/process-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'audit', company_id: selectedCompany })
      });
      const data = await res.json();
      if (data.status === 'success') setAuditLogs(data.logs || []);
    } catch (e) { console.error("Audit log fetch error", e); }
  };

  React.useEffect(() => {
    fetchAuditLogs();
  }, [selectedCompany]);

  const handleDownload = (format: 'CSV' | 'Excel' | 'PDF') => {
    toast.info(`Exporting forecast data as ${format}...`);

    const dataToExport: ExportDataItem[] = forecastData.map(d => ({
      Month: d.name,
      Actual: d.actual,
      Forecast: d.forecast,
      'Lower Bound': d.lower,
      'Upper Bound': d.upper,
    }));

    if (format === 'CSV') {
      const headers = Object.keys(dataToExport[0]) as (keyof ExportDataItem)[];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(h => row[h]).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'forecast_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV export complete!');
    } else if (format === 'Excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Forecast Data');
      XLSX.writeFile(workbook, 'forecast_data.xlsx');
      toast.success('Excel export complete!');
    } else if (format === 'PDF') {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      doc.text('AI Revenue Forecast', 14, 20);
      doc.autoTable({
        head: [['Month', 'Actual', 'Forecast', 'Lower Bound', 'Upper Bound']],
        body: dataToExport.map(d => [d.Month, d.Actual, d.Forecast, d['Lower Bound'], d['Upper Bound']]),
        startY: 25,
      });
      doc.save('forecast_data.pdf');
      toast.success('PDF export complete!');
    }
  };

  return (
    <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-glow uppercase italic"><AIText>{t.prognostics}</AIText></h1>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 mt-1">
            <Activity className="h-3 w-3" /> <AIText>High-precision forecasting models powered by Prophet and Scikit-learn.</AIText>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "destructive" : "secondary"}
            size="sm"
            className="gap-2"
            onClick={() => setIsLive(!isLive)}
          >
            <Activity className={cn("h-4 w-4", isLive && "animate-pulse")} />
            {isLive ? 'Live Feed' : 'Go Live'}
          </Button>
          <DateRangePicker date={date} setDate={setDate} />
          <Button
            onClick={runSimulation}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 px-6 rounded-xl"
          >
            {loading ? <Activity className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
            <AIText>Run Simulation</AIText>
          </Button>
          <CompanyFilter selected={selectedCompany} setSelected={() => { /* No-op, managed globally */ }} />

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowAudit(!showAudit)}
          >
            <ShieldCheck className="h-4 w-4" /> Governance Audit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {/* ... menu items ... */}
              <DropdownMenuItem onClick={() => handleDownload('CSV')}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('Excel')}>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('PDF')}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-vivid border-primary/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative z-10 border-b border-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black italic uppercase"><AIText>AI Revenue Forecast</AIText></CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"><AIText>Predicted performance with 95% confidence interval</AIText></CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  Model: LSTM-v2
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'forecast' ? (
                <ComposedChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--foreground))" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                </ComposedChart>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-indigo-500/10 rounded flex items-center justify-center">
                        <Globe className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Market Intelligence Pulse</p>
                        <p className="text-xs text-slate-300 italic">"{simulationData.explanation?.market_context}"</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      Sentiment: {simulationData.explanation?.primary_driver}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="300">
                      <AreaChart data={simulationData.labels.map((label: string, i: number) => ({
                        name: label,
                        p10: simulationData.percentiles.p10,
                        p50: simulationData.percentiles.p50,
                        p90: simulationData.percentiles.p90,
                        ...simulationData.sample_paths.reduce((acc: any, path: number[], idx: number) => {
                          acc[`path_${idx}`] = path[i];
                          return acc;
                        }, {})
                      }))}>
                        {/* ... Recharts internals ... */}
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
                        {/* Sample Simulation Paths */}
                        {simulationData.sample_paths.map((_: any, i: number) => (
                          <Line key={i} type="monotone" dataKey={`path_${i}`} stroke="hsl(var(--primary))" strokeWidth={1} strokeOpacity={0.2} dot={false} connectNulls />
                        ))}
                        <ReferenceLine y={simulationData.percentiles.p50} stroke="#6366f1" strokeDasharray="3 3" />
                        <ReferenceLine y={simulationData.percentiles.p90} stroke="#10b981" strokeDasharray="3 3" />
                        <ReferenceLine y={simulationData.percentiles.p10} stroke="#f43f5e" strokeDasharray="3 3" label="Pessimistic" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Model Insights</CardTitle>
              <CardDescription>Factors driving the prognosis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Seasonality', value: 'High Impact', color: 'text-primary' },
                { label: 'Historical Trend', value: 'Bullish', color: 'text-emerald-500' },
                { label: 'Market Volatility', value: 'Medium', color: 'text-amber-500' },
                { label: 'Precision Score', value: '98.4%', color: 'text-primary' },
              ].map((insight, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">{insight.label}</span>
                  <span className={cn("text-sm font-bold", insight.color)}>{insight.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <BrainCircuit className="h-5 w-5" />
                <CardTitle className="text-lg">AI Scenario</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Based on current momentum, revenue is expected to reach <span className="text-foreground font-bold">$5.2M</span> by year-end. Primary risk factor: <span className="text-rose-500 font-semibold">Cost of energy in Q4</span>.
              </p>
              <Button size="sm" className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                Generate Full Scenario
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Projected Opex', value: 1200000, trend: 'down', icon: TrendingUp },
          { title: 'Cash Flow Forecast', value: 850000, trend: 'up', icon: CalendarIcon },
          { title: 'Risk Probability', value: '12%', trend: 'down', icon: AlertCircle },
        ].map((item, i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof item.value === 'number' ? formatCurrency(item.value, currency) : item.value}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Expected range: +/- 5%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Strategic Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GoalTracking />
        <RiskAssessmentMatrix />
        <ApprovalWorkflow />
      </div>
      {/* Governance Audit Side Panel */}
      {showAudit && (
        <div className="fixed top-16 right-0 bottom-0 w-96 glass-card border-l border-white/10 z-[40] animate-in slide-in-from-right duration-500 overflow-y-auto">
          <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                Governance Audit
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Immutable AI Decision Ledger</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowAudit(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6 space-y-4">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No audit logs found for this entity.</p>
              </div>
            ) : (
              auditLogs.map((log, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[8px] bg-indigo-500/10 text-indigo-400 border-indigo-500/10">
                      {log.action_type}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-200">
                    Decision logged with {log.input_params?.iterations || 'standard'} parameters.
                  </p>
                  <div className="flex gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">VERIFIED</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-white/5 text-muted-foreground rounded border border-white/10">IMMUTABLE</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Prognostics;
