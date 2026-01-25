import { useState } from 'react';
import { toast } from 'sonner';
import { AIText } from '@/components/common/AIText';
import {
  FileText,
  Download,
  Eye,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Sparkles,
  FileBarChart,
  CheckCircle,
  Layout,
  Presentation,
  Activity
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ConsolidatedPL from '@/components/reports/ConsolidatedPL';

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
  const [deck, setDeck] = useState<any>(null);
  const [showDeck, setShowDeck] = useState(false);
  const [showPL, setShowPL] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [automationTasks, setAutomationTasks] = useState([
    { id: 1, label: 'Weekly Performance', nextRun: 'Mon, 08:00 AM', active: true },
    { id: 2, label: 'Monthly Variance', nextRun: '1st of Month', active: true },
    { id: 3, label: 'Annual Forecast', nextRun: 'Jan 1st', active: false },
  ]);

  // Filter logic
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || report.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDownload = (reportName: string) => {
    toast.promise(
      new Promise((resolve) => {
        const blob = new Blob([`Dummy data for ${reportName}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName.replace(/\s+/g, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(resolve, 1500);
      }),
      {
        loading: `Preparing download: ${reportName}...`,
        success: `${reportName} downloaded successfully`,
        error: 'Export failed. Try again.',
      }
    );
  };

  const handlePreview = (report: Report) => {
    setActiveReport(report);
    setIsPreviewModalOpen(true);
  };

  const handleToggleAutomation = (taskId: number) => {
    setAutomationTasks(prev => prev.map(t => (t.id === taskId ? { ...t, active: !t.active } : t)));
    const task = automationTasks.find(t => t.id === taskId);
    toast.success(`${task?.label} schedule ${!task?.active ? 'activated' : 'deactivated'}`);
  };

  const handleCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCustomModalOpen(false);
    toast.success("Strategic data synthesis request queued. Our AI engine will notify you when the report is ready.");
  };

  const handleGenerateAIReport = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("AI Analyst is synthesizing executive data...");

    try {
      const res = await fetch('/api/process-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          company_id: 'SGG-001'
        })
      });

      const data = await res.json();

      if (data.status === 'success') {
        const newReport: Report = {
          id: `RMS-${Math.floor(Math.random() * 1000)}`,
          name: data.report.title || 'AI Strategic Synthesis',
          type: 'AI Generated',
          date: 'Just now',
          status: 'Ready',
          size: '1.2 MB'
        };
        setReports([newReport, ...reports]);
        toast.success("Strategic Report Generated!", { id: toastId });
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (e) {
      console.error("Report Gen Error", e);
      toast.error("Failed to generate report. AI busy.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDeck = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Synthesizing Boardroom Presentation...");
    try {
      const res = await fetch('/api/process-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'slides' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDeck(data.deck);
        setShowDeck(true);
        setCurrentSlide(0);
        toast.success("Presentation Ready for Executive Review", { id: toastId });
      }
    } catch (e) {
      toast.error("Failed to generate deck", { id: toastId });
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-glow flex items-center gap-2 uppercase italic">
            <AIText>Reporting Nexus</AIText>
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 mt-1">
            <Activity className="h-3 w-3" /> <AIText>Strategic Documentation & Compliance Repository</AIText>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateAIReport}
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-[0.3em] px-6 py-2 rounded-xl h-10 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2 text-indigo-100" />
            )}
            <AIText>Synthesize Report</AIText>
          </Button>
          <Button
            variant={showPL ? "secondary" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setShowPL(!showPL)}
          >
            <Layout className="h-4 w-4" /> {showPL ? "Hide P&L" : "Live P&L"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleGenerateDeck}>
            <Presentation className="h-4 w-4" /> Board Deck
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsCustomModalOpen(true)}>
            <FileText className="h-4 w-4" /> Custom
          </Button>
        </div>
      </div>

      {showPL && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-8">
          <ConsolidatedPL />
        </div>
      )}

      <Card className="glass-vivid border-primary/10 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="border-b border-border/50 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports by name or ID..."
                className="pl-9 bg-primary/5 dark:bg-muted/20 border-primary/10"
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
          <div className="divide-y divide-primary/10 dark:divide-border/50">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 hover:bg-primary/5 dark:hover:bg-muted/10 transition-colors group">
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
                          <CheckCircle className="h-3 w-3" /> Ready
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handlePreview(report)}>
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
        <Card className="glass-vivid border-primary/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-base font-black italic uppercase">
              <Layout className="h-4 w-4 text-primary" />
              <AIText>Report Automation</AIText>
            </CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>Scheduled report generation tasks</CardDescription>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-primary" onClick={() => setIsAutomationModalOpen(true)}>
                Configure
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {automationTasks.map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 dark:bg-muted/20 border border-primary/10 dark:border-border/50">
                <div>
                  <p className="text-sm font-semibold">{task.label}</p>
                  <p className="text-xs text-muted-foreground">Next run: {task.nextRun}</p>
                </div>
                <Switch
                  checked={task.active}
                  onCheckedChange={() => handleToggleAutomation(task.id)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-vivid border-purple-500/10 overflow-hidden relative group bg-purple-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-base font-black italic uppercase">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <AIText>AI Report Insights</AIText>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"><AIText>Synthesized summaries of latest data</AIText></CardDescription>
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

      {/* Custom Report Request Modal */}
      <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
        <DialogContent className="sm:max-w-[425px] glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>Request Custom Strategic Synthesis</DialogTitle>
            <DialogDescription className="text-muted-foreground/60 text-xs">
              Our AI engine will analyze raw data streams based on your parameters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCustomRequest} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Report Name</Label>
              <Input id="name" placeholder="e.g. Q4 Logistics Deep-Dive" className="bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="params" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Analysis Parameters</Label>
              <textarea
                id="params"
                className="flex min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                placeholder="Describe specific data points or anomalies to investigate..."
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] h-12 rounded-xl">Initialize Synthesis</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Automation Configuration Modal */}
      <Dialog open={isAutomationModalOpen} onOpenChange={setIsAutomationModalOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>Automation & Scheduling Nexus</DialogTitle>
            <DialogDescription className="text-muted-foreground/60 text-xs">
              Configure recurring data jobs and strategic reporting cycles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {automationTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-bold text-white">{task.label}</Label>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Runs: {task.nextRun}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" className="h-8 text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-white">
                    Edit
                  </Button>
                  <Switch checked={task.active} onCheckedChange={() => handleToggleAutomation(task.id)} />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full border-dashed border-white/20 hover:bg-white/5 h-12 rounded-xl text-[10px] uppercase font-black tracking-widest">
              + New Automation Trigger
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-[700px] glass-card border-white/10 h-[80vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold">{activeReport?.name}</DialogTitle>
                <DialogDescription className="font-mono text-[10px] uppercase tracking-widest text-primary/60">
                  {activeReport?.id} • {activeReport?.date} • {activeReport?.size}
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950/80">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 w-fit px-2 py-1 rounded">Executive Summary</h4>
              <p className="text-sm leading-relaxed text-slate-300 font-medium">
                Strategic analysis for {activeReport?.name} indicates a **98.4% data integrity score**.
                The primary cost drivers for this period are closely aligned with seasonal projections.
                Anomaly detection found **zero critical vulnerabilities** in the processed ledger entries.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Integrity', value: '98.4%', color: 'text-emerald-400' },
                { label: 'Txn Count', value: '4,281', color: 'text-blue-400' },
                { label: 'Risk Info', value: 'Level 1', color: 'text-primary' }
              ].map((m, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">{m.label}</p>
                  <p className={cn("text-xl font-black", m.color)}>{m.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 bg-indigo-500/5 w-fit px-2 py-1 rounded">Neural Insights</h4>
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-200 leading-relaxed italic">
                "Pattern analysis suggests a minor operational bottleneck in Regional Logistics. Recommended action: Synchronize procurement cycles with the updated Strategic Ledger baseline."
              </div>
            </div>
            <div className="h-48 bg-slate-900/50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-white/10 group">
              <div className="text-center space-y-3">
                <Layout className="h-8 w-8 mx-auto text-slate-600 group-hover:text-primary transition-colors duration-500" />
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Neural Visualization Engine Online</p>
                <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-500">Secure Feed Active</Badge>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-3">
            <Button variant="outline" className="h-10 rounded-xl px-6 border-white/10 hover:bg-white/5" onClick={() => handleDownload(activeReport?.name || 'Report')}>
              <Download className="h-4 w-4 mr-2" /> Export Strategic Copy
            </Button>
            <Button className="h-10 rounded-xl px-6 bg-primary hover:bg-primary/90 text-white font-bold" onClick={() => setIsPreviewModalOpen(false)}>
              Terminate Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Presentation Modal Overlay */}
      {showDeck && deck && (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <Button variant="ghost" size="icon" className="absolute top-8 right-8 rounded-full h-12 w-12 hover:bg-white/5" onClick={() => setShowDeck(false)}>
            <AlertCircle className="h-8 w-8 text-muted-foreground rotate-45" />
          </Button>

          <div className="w-full max-w-5xl aspect-video glass-card border-white/10 p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/30">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${((currentSlide + 1) / deck.slides.length) * 100}%` }}
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">
                <Presentation className="h-3 w-3" />
                {deck.presentation_title}
              </div>
              <h2 className="text-5xl font-bold tracking-tight text-glow slide-in-from-left duration-500">
                {deck.slides[currentSlide].title}
              </h2>
              <div className="text-xl text-muted-foreground leading-relaxed max-w-2xl slide-in-from-bottom duration-700">
                {Array.isArray(deck.slides[currentSlide].content)
                  ? deck.slides[currentSlide].content.join(" ")
                  : deck.slides[currentSlide].content}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-8">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                  {deck.slides[currentSlide].visualization}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Slide {currentSlide + 1} / {deck.slides.length}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  disabled={currentSlide === 0}
                  onClick={() => setCurrentSlide(s => s - 1)}
                  className="rounded-full h-12 w-12 border-white/10"
                >
                  ←
                </Button>
                <Button
                  onClick={() => currentSlide < deck.slides.length - 1 ? setCurrentSlide(s => s + 1) : setShowDeck(false)}
                  className="rounded-full px-8 h-12 bg-indigo-600 hover:bg-indigo-700 font-bold"
                >
                  {currentSlide === deck.slides.length - 1 ? "Finish Deck" : "Next Slide →"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-4">
            <span>Powered by CFO Nexus Strategic Suite</span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span>Executive Mode Active</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
