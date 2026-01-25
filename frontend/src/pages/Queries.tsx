import { useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  History,
  Save,
  Share2,
  Play,
  Table as TableIcon,
  BarChart,
  Terminal,
  Sparkles,
  ChevronRight,
  Loader2,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/use-app-state';
import { speakResponse } from '@/components/ai/VoiceInterface';

const recentQueries = [
  { id: 'Q-982', query: 'Variance > 5% in Region B for Q3 Personnel', date: '1 hour ago' },
  { id: 'Q-981', query: 'Top 5 cost centers by OPEX growth', date: '3 hours ago' },
  { id: 'Q-980', query: 'Actuals vs Budget for IT Infrastructure 2025', date: 'Yesterday' },
];

const quickPrompts = [
  'Show variance > 10%',
  'Top 5 cost centers by spend',
  'Q3 2024 forecast summary',
  'Region A actuals vs budget',
  'Personnel costs by department',
  'Marketing ROI analysis'
];

interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  summary: string;
  chartData?: { name: string; value: number; status?: string }[];
}

const Queries = () => {
  const { selectedCompany, selectedPeriod, currency } = useAppState();
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const executeQuery = async (customQuery?: string) => {
    const query = customQuery || queryText;
    if (!query.trim()) {
      toast.warning('Please enter a query first.');
      return;
    }

    if (customQuery) setQueryText(customQuery);
    setLoading(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: selectedCompany,
          period: selectedPeriod,
          query: query
        })
      });

      if (res.ok) {
        const data = await res.json();
        const snapshot = data.source_snapshot || {};
        const metrics = snapshot.metrics || {};
        const variance = snapshot.variance || {};

        const rows = Object.entries(metrics).map(([key, value]) => {
          const varInfo = variance[key as keyof typeof variance];
          return {
            article: key,
            budget: 0,
            actual: Number(value),
            variance: (varInfo as any)?.variance || 0,
            status: (varInfo as any)?.variance < 0 ? 'warning' : 'success'
          };
        });

        const transformedResults: QueryResult = {
          summary: data.answer || "No narration provided.",
          columns: ['Metric', 'Reference Truth', 'Variance', 'Status'],
          rows: rows,
          chartData: rows.map(r => ({ name: r.article, value: r.actual, status: r.status }))
        };

        setResults(transformedResults);
        toast.success(`Analysis complete.`);
        if (customQuery) speakResponse(transformedResults.summary);
      } else {
        throw new Error('Query failed');
      }
    } catch (err) {
      toast.error('AI Service Unavailable');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-rose-500 bg-rose-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      case 'success': return 'text-emerald-500 bg-emerald-500/10';
      default: return 'text-muted-foreground bg-muted/20';
    }
  };

  return (
    <div className="space-y-8 pb-12 w-full p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow">Ad-Hoc Queries</h1>
          <p className="text-muted-foreground mt-1">Explore financial data using natural language or structured SQL-like filters.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2"><History className="h-4 w-4" /> History</Button>
          <Button variant="outline" size="sm" className="gap-2"><Save className="h-4 w-4" /> Saved</Button>
        </div>
      </div>

      <Card className="glass-card bg-primary/5 border-primary/20 overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Assisted Data Explorer</span>
          </div>
          <div className="relative group">
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Ask anything..."
              className="w-full bg-background/50 border border-border/50 rounded-xl pl-12 pr-4 py-4 min-h-[120px] text-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <Button size="sm" className="gap-2" onClick={() => executeQuery()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {loading ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {quickPrompts.map((p) => (
              <button key={p} onClick={() => setQueryText(p)} className="px-3 py-1 rounded-full bg-muted/30 border border-border/50 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-all">
                {p}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><History className="h-4 w-4" /> Recent</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-0">
              {recentQueries.map((q) => (
                <button key={q.id} onClick={() => setQueryText(q.query)} className="w-full text-left p-4 hover:bg-muted/30 transition-all border-b border-border/50 last:border-0">
                  <p className="text-xs font-medium line-clamp-2">{q.query}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="glass-card min-h-[500px]">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div><CardTitle>Analysis Results</CardTitle><CardDescription>{results?.summary || 'Enter a query above'}</CardDescription></div>
                {results && (
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'chart')} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="table">Table</TabsTrigger><TabsTrigger value="chart">Chart</TabsTrigger></TabsList>
                  </Tabs>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="text-sm">Analyzing...</p></div>
              ) : results ? (
                viewMode === 'table' ? (
                  <Table>
                    <TableHeader><TableRow>{results.columns.map(c => <TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>
                      {results.rows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.article}</TableCell>
                          <TableCell>{r.actual?.toLocaleString()}</TableCell>
                          <TableCell className={r.variance < 0 ? 'text-rose-500' : 'text-emerald-500'}>{r.variance}</TableCell>
                          <TableCell><Badge className={getStatusColor(r.status)}>{r.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={results.chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {results.chartData?.map((e, i) => <Cell key={i} fill={e.value > 0 ? '#22c55e' : '#ef4444'} />)}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 opacity-50"><Search className="h-12 w-12 mb-4" /><p>No active analysis</p></div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Queries;
