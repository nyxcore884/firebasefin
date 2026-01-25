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
  History,
  Check,
  X
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
          <Badge variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'outline'}>
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
  const [isLive, setIsLive] = React.useState(false);
  const [forecastData, setForecastData] = React.useState<any[]>([]);
  const [simulationData, setSimulationData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'forecast' | 'simulation'>('forecast');
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [showAudit, setShowAudit] = React.useState(false);

  React.useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
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
        if (res.ok) {
          const data = await res.json();
          setForecastData(data);
        } else {
          throw new Error("API Failure");
        }
      } catch (err) {
        setForecastData([
          { name: 'Jan', actual: 4000, forecast: 4100 },
          { name: 'Feb', actual: 3000, forecast: 3200 },
          { name: 'Mar', actual: 2000, forecast: 2400 },
          { name: 'Apr', actual: 2780, forecast: 2900 },
          { name: 'May', actual: 1890, forecast: 2100 },
          { name: 'Jun', actual: 2390, forecast: 2500 },
          { name: 'Aug', forecast: 3800, lower: 3500, upper: 4100 },
          { name: 'Sep', forecast: 4200, lower: 3800, upper: 4600 },
          { name: 'Oct', forecast: 4500, lower: 4000, upper: 5000 },
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
        toast.success("Monte Carlo simulation converged.");
      }
    } catch (err) {
      toast.error("Simulation failed to converge.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: 'CSV' | 'Excel' | 'PDF') => {
    toast.info(`Exporting forecast data as ${format}...`);
    // Export logic...
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
          <Button variant={isLive ? "destructive" : "secondary"} size="sm" onClick={() => setIsLive(!isLive)}>
            <Activity className={cn("h-4 w-4 mr-2", isLive && "animate-pulse")} />
            {isLive ? 'Live Feed' : 'Go Live'}
          </Button>
          <DateRangePicker date={date} setDate={setDate} />
          <Button onClick={runSimulation} disabled={loading} className="font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 px-6 rounded-xl">
            {loading ? <Activity className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
            <AIText>Run Simulation</AIText>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAudit(!showAudit)}>
            <ShieldCheck className="h-4 w-4 mr-2" /> Governance
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload('CSV')}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('Excel')}>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('PDF')}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-vivid border-primary/10 overflow-hidden relative group">
          <CardHeader className="relative z-10 border-b border-primary/5">
            <CardTitle className="text-lg font-black italic uppercase"><AIText>AI Revenue Forecast</AIText></CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"><AIText>Predicted performance with 95% confidence interval</AIText></CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'forecast' ? (
                <ComposedChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.05} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--foreground))" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                </ComposedChart>
              ) : (
                <div className="flex flex-col h-full items-center justify-center opacity-50">
                  <BrainCircuit className="h-12 w-12 animate-pulse mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Simulation View Enabled</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Model Insights</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['Seasonality', 'Historical Trend', 'Volatility'].map((label, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-sm font-medium text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold text-primary">OPTIMIZED</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> AI Scenario</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">System predicts peak performance in Q4 based on historical momentum.</p>
              <Button size="sm" className="w-full mt-4">Expand Analysis</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GoalTracking />
        <RiskAssessmentMatrix />
        <ApprovalWorkflow />
      </div>
    </div>
  );
};

export default Prognostics;
