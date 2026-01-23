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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const executeQuery = async () => {
    if (!queryText.trim()) {
      toast.warning('Please enter a query first.');
      return;
    }

    setLoading(true);
    try {
      // Connect to AI Query backend
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        toast.success(`Analysis complete. Found ${data.rows?.length || 0} results.`);
      } else {
        throw new Error('Query failed');
      }
    } catch (err) {
      console.error('Query Error:', err);
      // Demo fallback data for development
      setResults({
        summary: `AI Analysis for: "${queryText}"`,
        columns: ['Article', 'Budget', 'Actual', 'Variance', 'Status'],
        rows: [
          { article: 'Personnel - Salaries', budget: 150000, actual: 162000, variance: -12000, status: 'critical' },
          { article: 'IT Infrastructure', budget: 80000, actual: 75000, variance: 5000, status: 'success' },
          { article: 'Marketing Campaigns', budget: 45000, actual: 48500, variance: -3500, status: 'warning' },
          { article: 'Travel & Entertainment', budget: 20000, actual: 18000, variance: 2000, status: 'success' },
          { article: 'Office Supplies', budget: 8000, actual: 9200, variance: -1200, status: 'warning' },
        ],
        chartData: [
          { name: 'Personnel', value: 12000, status: 'critical' },
          { name: 'IT', value: -5000, status: 'success' },
          { name: 'Marketing', value: 3500, status: 'warning' },
          { name: 'Travel', value: -2000, status: 'success' },
          { name: 'Office', value: 1200, status: 'warning' },
        ]
      });
      toast.info('Using demo data (API unavailable)');
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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow">Ad-Hoc Queries</h1>
          <p className="text-muted-foreground mt-1">Explore financial data using natural language or structured SQL-like filters.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" /> History
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" /> Saved
          </Button>
        </div>
      </div>

      {/* Query Bar */}
      <Card className="glass-card bg-primary/5 border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Assisted Data Explorer</span>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ask anything: 'Show me all articles in Personnel with variance exceeding 10% in June...'"
                className="w-full bg-background/50 border border-border/50 rounded-xl pl-12 pr-4 py-4 min-h-[120px] text-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    executeQuery();
                  }
                }}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground hidden sm:inline">Ctrl+Enter to run</span>
                <Button
                  size="sm"
                  className="gap-2 shadow-lg shadow-primary/30"
                  onClick={executeQuery}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {loading ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold self-center mr-2">Quick Prompts:</span>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setQueryText(prompt)}
                  className="px-3 py-1 rounded-full bg-muted/30 border border-border/50 text-[10px] font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: History & Discovery */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Recent Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {recentQueries.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setQueryText(q.query)}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-all border-b border-border/50 last:border-0 group"
                >
                  <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{q.query}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{q.date}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Discovery Index</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['Personnel', 'Operating Costs', 'IT Infra', 'Marketing', 'Travel'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setQueryText(`Show all ${cat} expenses with variance`)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-all group"
                >
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">{cat}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
          <Card className="glass-card min-h-[500px] flex flex-col">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analysis Results</CardTitle>
                  <CardDescription>
                    {results ? results.summary : 'Synthesized from 12,450 records in Detailed Budget'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'chart')} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/20">
                      <TabsTrigger value="table" className="text-xs"><TableIcon className="h-3 w-3 mr-1" /> Table</TabsTrigger>
                      <TabsTrigger value="chart" className="text-xs"><BarChart className="h-3 w-3 mr-1" /> Chart</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">Analyzing your query...</p>
                </div>
              ) : results ? (
                viewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {results.columns.map((col) => (
                            <TableHead key={col} className="text-xs font-bold">{col}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.rows.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm">{row.article}</TableCell>
                            <TableCell className="text-sm">${row.budget?.toLocaleString()}</TableCell>
                            <TableCell className="text-sm">${row.actual?.toLocaleString()}</TableCell>
                            <TableCell className={cn("text-sm font-bold", row.variance < 0 ? 'text-rose-500' : 'text-emerald-500')}>
                              {row.variance > 0 ? '+' : ''}{row.variance?.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("text-[10px]", getStatusColor(row.status))}>
                                {row.status?.toUpperCase()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={results.chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border) / 0.3)" />
                        <XAxis type="number" tickFormatter={(v) => `$${Math.abs(v / 1000)}K`} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => [`$${Math.abs(v).toLocaleString()}`, 'Variance']} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {results.chartData?.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.value > 0 ? '#ef4444' : '#22c55e'}
                            />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">No active analysis</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Enter a query above to explore the financial dataset. Our AI engine will normalize data across sheets and provide high-precision insights.
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-lg">
                    <div className="p-4 rounded-xl bg-muted/10 border border-border/50 text-left">
                      <Badge variant="outline" className="mb-2 text-[9px] uppercase font-bold text-primary border-primary/20">Tip</Badge>
                      <p className="text-xs text-muted-foreground">Try asking for year-over-year comparisons for specific cost centers.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/10 border border-border/50 text-left">
                      <Badge variant="outline" className="mb-2 text-[9px] uppercase font-bold text-primary border-primary/20">Security</Badge>
                      <p className="text-xs text-muted-foreground">All ad-hoc queries are subject to RBAC and audit logging.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Queries;
