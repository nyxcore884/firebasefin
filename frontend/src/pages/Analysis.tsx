import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Plus,
  Download,
  Filter,
  MoreHorizontal,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Server,
  Database
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState, translations } from '@/hooks/use-app-state';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import { BudgetArticleTree } from '@/components/analysis/BudgetArticleTree';

export interface VarianceDataItem {
  id: string;
  article: string;
  budget: number;
  actual: number;
  variance: number;
  pct: number;
  status: string;
  category?: string;
}

interface ExportDataItem {
  'Budget Article': string;
  'Planned Budget': string;
  'Actual Amount': string;
  'Variance': string;
  'Variance %': string;
  'Status': string;
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

// --- Internal Components for Logical Connectivity ---

function DataMappingTable({ data }: { data: VarianceDataItem[] }) {
  // Mapping Table showing simplified view for connectivity check
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
          <Database className="h-4 w-4" /> Data Mapping
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Data Mapping Source</DialogTitle>
          <DialogDescription>
            Mapping between GL Accounts and Budget Articles.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="font-medium">{item.article}</TableCell>
                  <TableCell>{item.budget}</TableCell>
                  <TableCell>{item.actual}</TableCell>
                  <TableCell className={item.variance < 0 ? "text-rose-500" : "text-emerald-500"}>
                    {item.variance}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SystemIntegrationCard({ integrationStatus }: { integrationStatus: string | { status: string, connectedSystems: string } }) {
  const statusStr = typeof integrationStatus === 'string' ? integrationStatus : integrationStatus.status;
  const systemsStr = typeof integrationStatus === 'string' ? 'ERP, Banking, Vertex AI' : integrationStatus.connectedSystems;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
          <Server className="h-4 w-4" /> System: {statusStr}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">System Integration</h4>
            <p className="text-sm text-muted-foreground">
              Integration Status: <span className="font-medium text-foreground">{statusStr}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Connected Systems: <span className="font-medium text-foreground">{systemsStr}</span>
            </p>
          </div>
          <div className="grid gap-2 border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">ERP (SAP/Oracle)</span>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Banking Feeds</span>
              <Badge variant="success">Synced</Badge>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ----------------------------------------------------------------------

const Analysis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [varianceData, setVarianceData] = useState<VarianceDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false); // New State
  const { language, currency } = useAppState();
  const t = translations[language];

  const handleDownload = (format: 'CSV' | 'Excel' | 'PDF') => {
    toast.info(`Exporting analysis data as ${format}...`);

    const dataToExport: ExportDataItem[] = filteredData.map(item => ({
      'Budget Article': item.article,
      'Planned Budget': formatCurrency(item.budget),
      'Actual Amount': formatCurrency(item.actual),
      'Variance': formatCurrency(item.variance),
      'Variance %': `${item.pct.toFixed(1)}%`,
      'Status': item.status,
    }));

    if (dataToExport.length === 0) {
      toast.info("No data to export.");
      return;
    }

    if (format === 'CSV') {
      const headers = Object.keys(dataToExport[0]) as Array<keyof ExportDataItem>;
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(h => `"${row[h]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'analysis_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV export complete!');
    } else if (format === 'Excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Analysis Data');
      XLSX.writeFile(workbook, 'analysis_data.xlsx');
      toast.success('Excel export complete!');
    } else if (format === 'PDF') {
      const doc = new jsPDF() as jsPDFWithAutoTable;
      doc.text('Budget vs Actual Analysis', 14, 20);
      doc.autoTable({
        head: [['Budget Article', 'Planned Budget', 'Actual Amount', 'Variance', 'Variance %', 'Status']],
        body: dataToExport.map(d => [d['Budget Article'], d['Planned Budget'], d['Actual Amount'], d['Variance'], d['Variance %'], d['Status']]),
        startY: 25,
      });
      doc.save('analysis_data.pdf');
      toast.success('PDF export complete!');
    }
  };

  useEffect(() => {
    const fetchVarianceData = async () => {
      try {
        setLoading(true);
        // Using local Firebase Emulator endpoint
        const response = await fetch('http://127.0.0.1:5001/firebasefin-main/us-central1/process_transaction/data');
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        // Map backend data to frontend structure if needed, or use directly
        // Backend now returns the correct structure, so we just ensure types
        const processedData: VarianceDataItem[] = data.map((item: any) => ({
          id: item.id,
          article: item.article || item.itemName, // Fallback
          budget: item.budget,
          actual: item.actual,
          variance: item.variance,
          pct: item.pct,
          status: item.status,
          category: item.category || 'General'
        }));

        setVarianceData(processedData);
      } catch (error) {
        console.error("Failed to fetch variance data:", error);
        toast.error('Failed to connect to Financial Engine. Loading demo data.');

        // Fallback demo data if backend is not running
        setVarianceData([
          { id: 'OPEX-001', article: 'Office Supplies', budget: 5000, actual: 4890, variance: 110, pct: 2.2, status: 'success', category: 'Operating Expenses' },
          { id: 'OPEX-002', article: 'Software Licensing', budget: 12000, actual: 12500, variance: -500, pct: -4.2, status: 'warning', category: 'Operating Expenses' },
          { id: 'CAPEX-001', article: 'New Laptops', budget: 25000, actual: 23800, variance: 1200, pct: 4.8, status: 'success', category: 'Capital Expenditures' },
          { id: 'MKTG-001', article: 'Social Media Campaign', budget: 8000, actual: 9200, variance: -1200, pct: -15.0, status: 'critical', category: 'Marketing & Research' },
          { id: 'RSRCH-001', article: 'Market Research Study', budget: 15000, actual: 14500, variance: 500, pct: 3.3, status: 'success', category: 'Marketing & Research' },
          { id: 'HR-001', article: 'Employee Training', budget: 10000, actual: 11000, variance: -1000, pct: -10.0, status: 'critical', category: 'Human Resources' },
          { id: 'OPEX-003', article: 'Travel Expenses', budget: 7500, actual: 6000, variance: 1500, pct: 20.0, status: 'success', category: 'Operating Expenses' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchVarianceData();
  }, []);

  const formatCurrency = (val: number) => {
    const rate = 2.7;
    const amount = currency === 'GEL' ? val * rate : val;
    const symbol = currency === 'GEL' ? '₾' : '$';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(Math.abs(amount)).replace(currency, symbol);
  };

  const filteredData = varianceData.filter(item =>
    item.article.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const summaryStats = varianceData.reduce((acc, item) => {
    acc.totalBudget += item.budget;
    acc.totalActual += item.actual;
    return acc;
  }, { totalBudget: 0, totalActual: 0, netVariance: 0 });

  summaryStats.netVariance = summaryStats.totalBudget - summaryStats.totalActual;


  return (
    <div className="space-y-8 pb-12 w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow">{t.analysis}</h1>
          <p className="text-muted-foreground mt-1">Comparative study of Budget vs Actual performance across cost centers.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Integrated Data Mapping & System Status */}
          <DataMappingTable data={varianceData} />
          <SystemIntegrationCard integrationStatus="Connected" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload('CSV')}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('Excel')}>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('PDF')}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Budget
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Summary Stats */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardHeader className="pb-2">
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-28 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalBudget)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Planned for FY 2026</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Total Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalActual)}</div>
                <div className={cn("flex items-center gap-1.5 mt-1", summaryStats.totalActual > summaryStats.totalBudget ? "text-rose-500" : "text-emerald-500")}>
                  <ArrowDownRight className="h-3 w-3" />
                  <span className={summaryStats.totalActual > summaryStats.totalBudget ? "text-rose-500 font-medium" : "text-emerald-500 font-medium"}>
                    {(((summaryStats.totalActual - summaryStats.totalBudget) / summaryStats.totalBudget) * 100).toFixed(1)}%
                    {summaryStats.totalActual > summaryStats.totalBudget ? ' Over Budget' : ' Under Budget'}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Net Variance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", summaryStats.netVariance < 0 ? "text-rose-500" : "text-emerald-500")}>
                  {summaryStats.netVariance < 0 ? '-' : ''}{formatCurrency(summaryStats.netVariance)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{summaryStats.netVariance < 0 ? 'Unfavorable' : 'Favorable'} gap detected</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Forecast Drift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">0.8%</div>
                <p className="text-[10px] text-muted-foreground mt-1">Within confidence interval</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Budget Articles Detailed Comparison</CardTitle>
              <CardDescription>Line-by-line actual vs budget variance breakdown.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter articles..."
                  className="pl-9 w-64 bg-muted/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant={expanded ? "secondary" : "outline"}
                size="sm"
                className="gap-2 hidden sm:flex transition-all"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ArrowDownRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                {expanded ? 'Collapse' : 'Expand'} Detailed View
              </Button>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto p-1">
          {expanded && (
            <div className="p-4 bg-background/50 border-b border-border/50">
              <BudgetArticleTree data={varianceData} expanded={true} />
            </div>
          )}

          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[200px] md:w-[250px]">Budget Article</TableHead>
                <TableHead className="text-right">Planned Budget</TableHead>
                <TableHead className="text-right">Actual Amount</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-center">Variance %</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 float-right" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 float-right" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 float-right" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="font-semibold">{item.article}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(item.budget)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(item.actual)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-semibold",
                      item.variance < 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {item.variance < 0 ? '-' : '+'}{formatCurrency(item.variance)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.pct > 0 ? (
                          <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-rose-500" />
                        )}
                        <span className={item.pct < 0 ? "text-rose-500 font-medium" : "text-emerald-500 font-medium"}>
                          {Math.abs(item.pct).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        item.status === 'success' ? 'success' :
                          item.status === 'warning' ? 'warning' : 'destructive'
                      } className="capitalize">{item.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2">
                            <ArrowRight className="h-4 w-4" /> View Transactions
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Search className="h-4 w-4" /> Drill Down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-500 gap-2">
                            Flag Anomaly
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Analysis;
