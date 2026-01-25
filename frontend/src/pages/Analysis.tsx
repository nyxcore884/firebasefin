import { useState, useEffect } from 'react';
import { fetchFinancialTruth } from '@/lib/api-client';
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
  Download,
  Filter,
  MoreHorizontal,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Server,
  Database,
  TrendingUp,
  Activity
} from 'lucide-react';
import ConsolidationManager from '@/components/analysis/ConsolidationManager';
import WaterfallChart from '@/components/analytics/WaterfallChart';
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
import { AIText } from '@/components/common/AIText';
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

export default function Analysis() {
  const { selectedCompany, selectedPeriod, selectedDepartment, currency } = useAppState();
  const [viewMode, setViewMode] = useState<'entity' | 'department' | 'consolidation'>('entity');
  const [loading, setLoading] = useState(false);
  const [truth, setTruth] = useState<any>(null);
  const [varianceData, setVarianceData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(false);
  const { language } = useAppState();
  const t = translations[language];

  useEffect(() => {
    if (viewMode === 'consolidation') return;
    const fetchVarianceData = async () => {
      try {
        setLoading(true);
        const truthData = await fetchFinancialTruth(selectedCompany, selectedPeriod || '', currency, selectedDepartment);
        setTruth(truthData);
        if (truthData && truthData.breakdown) {
          const processedData = truthData.breakdown.map((item: any, idx: number) => {
            const budget = item.budget || 0;
            const actual = item.actual || 0;
            let computedVar = budget - actual;
            if (item.semantic_key === 'REVENUE') computedVar = actual - budget;
            const pct = budget > 0 ? ((computedVar / budget) * 100) : 0;
            return {
              id: `article-${idx}`,
              article: item.article,
              budget, actual, variance: computedVar, pct,
              status: computedVar < 0 ? 'destructive' : 'success',
              category: item.semantic_key
            };
          });
          setVarianceData(processedData);
        }
      } catch (error) {
        toast.error('Failed to connect to Financial Engine.');
      } finally {
        setLoading(false);
      }
    };
    fetchVarianceData();
  }, [selectedCompany, selectedPeriod, selectedDepartment, viewMode, currency]);

  const summaryStats = varianceData.reduce((acc, item) => {
    acc.totalBudget += item.budget;
    acc.totalActual += item.actual;
    return acc;
  }, { totalBudget: 0, totalActual: 0 });

  const netVariance = summaryStats.totalBudget - summaryStats.totalActual;
  const filteredData = varianceData.filter(item => item.article.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatCurrency = (val: number) => {
    const rate = currency === 'GEL' ? 2.7 : 1;
    const symbol = currency === 'GEL' ? '₾' : '$';
    return `${symbol}${Math.abs(val * rate).toLocaleString()}`;
  };

  return (
    <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-glow uppercase italic"><AIText>Financial Analysis</AIText></h1>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 mt-1">
            <Activity className="h-3 w-3" /> {selectedCompany} • {selectedPeriod}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-primary/5 p-1 rounded-lg border border-primary/10">
            <button onClick={() => setViewMode('entity')} className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md", viewMode === 'entity' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Budget vs Actual</button>
            <button onClick={() => setViewMode('consolidation')} className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md", viewMode === 'consolidation' ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>Consolidation</button>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Exporting...")}><Download className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </div>

      {viewMode === 'consolidation' ? <ConsolidationManager /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="glass-vivid">
              <CardHeader className="pb-2"><CardTitle className="text-[9px] uppercase font-black italic">Total Budget</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-black">{formatCurrency(summaryStats.totalBudget)}</div></CardContent>
            </Card>
            <Card className="glass-vivid">
              <CardHeader className="pb-2"><CardTitle className="text-[9px] uppercase font-black italic">Total Actual</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-black">{formatCurrency(summaryStats.totalActual)}</div></CardContent>
            </Card>
            <Card className="glass-vivid">
              <CardHeader className="pb-2"><CardTitle className="text-[9px] uppercase font-black italic">Net Variance</CardTitle></CardHeader>
              <CardContent><div className={cn("text-2xl font-black", netVariance < 0 ? "text-rose-500" : "text-emerald-500")}>{formatCurrency(netVariance)}</div></CardContent>
            </Card>
            <Card className="glass-vivid">
              <CardHeader className="pb-2"><CardTitle className="text-[9px] uppercase font-black italic">Forecast Drift</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-black text-emerald-500">0.8%</div></CardContent>
            </Card>
          </div>

          {!loading && truth?.waterfall?.length > 0 && <WaterfallChart data={truth.waterfall} budgetTotal={summaryStats.totalBudget} actualTotal={summaryStats.totalActual} />}

          <Card className="glass-vivid">
            <CardHeader className="border-b border-primary/10 bg-primary/5">
              <div className="flex justify-between items-center">
                <div><CardTitle className="text-sm font-black uppercase italic">Budget Articles</CardTitle></div>
                <div className="flex gap-3">
                  <Input placeholder="Filter articles..." className="w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : 'Expand'}</Button>
                </div>
              </div>
            </CardHeader>
            <div className="p-1">
              {expanded && <BudgetArticleTree data={varianceData} expanded={true} />}
              <Table>
                <TableHeader><TableRow><TableHead>Article</TableHead><TableHead className="text-right">Budget</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Variance</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold">{item.article}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.budget)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(item.actual)}</TableCell>
                      <TableCell className={cn("text-right font-semibold", item.variance < 0 ? "text-rose-500" : "text-emerald-500")}>{formatCurrency(item.variance)} ({item.pct.toFixed(1)}%)</TableCell>
                      <TableCell className="text-center"><Badge variant={item.status === 'success' ? 'default' : 'destructive'}>{item.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
