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
  AlertCircle,
  Calendar as CalendarIcon,
  Download,
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import React from 'react';
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Area,
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
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Strategic Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium">{goal.name}</span>
              <span className="text-muted-foreground">
                {goal.current} / {goal.target} {goal.unit}
              </span>
            </div>
            <Progress value={(goal.current / goal.target) * 100} className="h-2" />
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

function CompanyFilter({ selected, setSelected }: { selected: string, setSelected: (v: string) => void }) {
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
  const { language, currency } = useAppState();
  const t = translations[language];
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2023, 0, 20),
    to: addDays(new Date(2023, 0, 20), 20),
  });
  const [company, setCompany] = React.useState<string>("Globex Corp");
  const [isLive, setIsLive] = React.useState(false);
  const [forecastData, setForecastData] = React.useState<any[]>([]);
  const [, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const url = '/api/prognostics';

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: company,
            assumptions: {}
          })
        });
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
  }, [company]);

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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow">{t.prognostics}</h1>
          <p className="text-muted-foreground mt-1">High-precision forecasting models powered by Prophet and Scikit-learn.</p>
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
          <CompanyFilter selected={company} setSelected={setCompany} />

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
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Revenue Forecast</CardTitle>
                <CardDescription>Predicted performance with 95% confidence interval</CardDescription>
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
              <ComposedChart data={forecastData}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value, currency)}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine x="Jul" stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ position: 'top', value: 'Present', fill: 'hsl(var(--primary))', fontSize: 10, fontWeight: 'bold' }} />

                {/* Confidence Interval */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.05}
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />

                {/* Actual Line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--foreground))' }}
                  activeDot={{ r: 6 }}
                />

                {/* Forecast Line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </ComposedChart>
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
    </div>
  );
};

export default Prognostics;
