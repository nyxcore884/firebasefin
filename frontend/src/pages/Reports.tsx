import { useState } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Eye,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileBarChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Report {
  id: string;
  name: string;
  type: 'Standard' | 'Custom' | 'AI Generated';
  date: string;
  status: 'Ready' | 'Processing' | 'Archived';
  size: string;
}

const initialReports: Report[] = [
  { id: 'R-001', name: 'Monthly Financial Summary', type: 'Standard', date: 'Oct 2023', status: 'Ready', size: '2.4 MB' },
  { id: 'R-002', name: 'Budget vs Actuals - Q3', type: 'Standard', date: 'Sep 2023', status: 'Ready', size: '1.8 MB' },
  { id: 'R-003', name: 'Variance Breakdown - Region A', type: 'Custom', date: 'Oct 12, 2023', status: 'Processing', size: '450 KB' },
  { id: 'R-004', name: 'Annual Prognostics 2026', type: 'AI Generated', date: 'Oct 10, 2023', status: 'Ready', size: '5.2 MB' },
  { id: 'R-005', name: 'CAPEX Allocation Report', type: 'Standard', date: 'Aug 2023', status: 'Archived', size: '3.1 MB' },
  { id: 'R-006', name: 'Operational Efficiency KPI', type: 'AI Generated', date: 'Oct 05, 2023', status: 'Ready', size: '1.2 MB' },
];

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter logic
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || report.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDownload = (reportName: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `Downloading ${reportName}...`,
        success: `${reportName} downloaded successfully`,
        error: 'Download failed',
      }
    );
  };

  const handleGenerateAIReport = () => {
    setIsGenerating(true);
    toast.promise(
      new Promise((resolve) => setTimeout(() => {
        const newReport: Report = {
          id: `R-00${reports.length + 1}`,
          name: 'AI Strategic Synthesis - Q4',
          type: 'AI Generated',
          date: 'Just now',
          status: 'Ready',
          size: '1.5 MB'
        };
        setReports([newReport, ...reports]);
        resolve(true);
      }, 3000)),
      {
        loading: 'AI is analyzing latest financial data...',
        success: 'New Strategic Synthesis Report generated!',
        error: 'Generation failed',
      }
    );
    setTimeout(() => setIsGenerating(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">Access standardized compliance reports and AI-generated insights.</p>
        </div>
        <Button size="sm" className="gap-2 shadow-lg shadow-primary/20" onClick={() => toast.info('Custom report builder opening...')}>
          <FileText className="h-4 w-4" /> Request Custom Report
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports by name or ID..."
                className="pl-9 bg-muted/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" /> {filterType === 'All' ? 'All Types' : filterType}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterType('All')}>All Types</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('Standard')}>Standard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('Custom')}>Custom</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('AI Generated')}>AI Generated</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="sm" className="gap-2" onClick={() => toast.success('List refreshed')}>
                <Clock className="h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center border transition-colors",
                      report.type === 'AI Generated' ? "bg-purple-500/10 border-purple-500/20 text-purple-500" : "bg-primary/10 border-primary/20 text-primary"
                    )}>
                      {report.type === 'AI Generated' ? <Sparkles className="h-5 w-5" /> : <FileBarChart className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{report.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">{report.id}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{report.date}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <Badge variant="outline" className={cn(
                          "text-[9px] py-0 h-4",
                          report.type === 'AI Generated' ? "bg-purple-500/10 text-purple-600 border-purple-200" : "bg-muted/30"
                        )}>
                          {report.type}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">File Size</span>
                      <span className="text-xs">{report.size}</span>
                    </div>
                    <div className="flex items-center gap-2 w-24 justify-end">
                      {report.status === 'Ready' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </Badge>
                      ) : report.status === 'Processing' ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processing
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <AlertCircle className="h-3 w-3" /> Archived
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => toast.info(`Previewing ${report.name}...`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        disabled={report.status !== 'Ready'}
                        onClick={() => handleDownload(report.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>No reports found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Report Automation</CardTitle>
            <CardDescription>Scheduled report generation tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Weekly Performance', nextRun: 'Mon, 08:00 AM', active: true },
              { label: 'Monthly Variance', nextRun: '1st of Month', active: true },
              { label: 'Annual Forecast', nextRun: 'Jan 1st', active: false },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50">
                <div>
                  <p className="text-sm font-semibold">{task.label}</p>
                  <p className="text-xs text-muted-foreground">Next run: {task.nextRun}</p>
                </div>
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  task.active ? "bg-emerald-500 animate-glow" : "bg-muted-foreground/30"
                )} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Report Insights
            </CardTitle>
            <CardDescription>Synthesized summaries of latest data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our AI has analyzed the last 3 reports and detected a pattern of <span className="text-foreground font-semibold">positive efficiency gains</span> in IT Infrastructure. We recommend a budget reallocation study for Q1 2026.
            </p>
            <Button
              size="sm"
              className={cn("w-full mt-4 gap-2", isGenerating ? "bg-muted text-muted-foreground" : "bg-purple-600 hover:bg-purple-700 text-white")}
              onClick={handleGenerateAIReport}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Synthesizing Data...' : 'Generate Synthesis Report'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
