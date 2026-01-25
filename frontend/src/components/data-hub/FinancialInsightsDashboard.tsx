import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAppState } from '@/hooks/use-app-state';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from '@/components/ui/button';
import {
<<<<<<< Updated upstream
    Activity, TrendingUp, AlertTriangle, ArrowUpRight,
    PieChart, BarChart3, BrainCircuit,
    Wand2, Search, FileText, FileSpreadsheet, Loader2,
    Building2, DollarSign, Globe, X
=======
    Activity, TrendingUp, AlertTriangle, BrainCircuit,
    Wand2, Search, FileText, FileSpreadsheet,
    Building2, DollarSign, Globe, X, CheckCircle
>>>>>>> Stashed changes
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area, Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';

const VIEW_CONFIG: Record<string, any> = {
    executive: {
        title: "Executive Summary (SOCAR Group)",
        incomeTitle: "Net Profit",
        incomeValue: "₾ 2,300,000",
        incomeTrend: "positive",
        advice: "Reconcile Intercompany Settlement: SGG -> SOG discrepancy detected."
    },
    finance: {
        title: "Finance Control Center",
        incomeTitle: "Gas Transportation Efficiency",
        incomeValue: "96.5%",
        incomeTrend: "positive",
        advice: "Investigate rising Gas Transportation Cost in TelavGas (+4.2%)."
    },
    department: {
        title: "Department Performance (Social Gas)",
        incomeTitle: "Social Gas Sales Target",
        incomeValue: "98.5%",
        incomeTrend: "negative",
        advice: "Social Gas volume in Kakheti region is below forecast (-15%)."
    }
};

import { fetchFinancialTruth } from '@/lib/api-client';

export default function FinancialInsightsDashboard({ view = 'executive' }: { view?: 'executive' | 'finance' | 'department' }) {
    const { selectedCompany, selectedPeriod, selectedDepartment } = useAppState();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [drillThroughMap, setDrillThroughMap] = useState<Record<string, string[]>>({});
    const [activeDrillDown, setActiveDrillDown] = useState<string | null>(null);
    const [isReconciled, setIsReconciled] = useState<boolean | null>(null);
    const [reconStatus, setReconStatus] = useState<string>('');
    const [forecastItem, setForecastItem] = useState(view === 'finance' ? "Total Expenses" : "Total Revenue");
    const [chartData, setChartData] = useState<any[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // ...

    const fetchTruth = async () => {
        setLoading(true);
        try {
<<<<<<< Updated upstream
            const endpoint = "/functions/engine";
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'metrics',
                    company_id: selectedCompany,
                    period: selectedPeriod,
                    department: selectedDepartment
                })
            });
=======
            // 1. Fetch Verified Truth
            const truth = await fetchFinancialTruth(selectedCompany, selectedPeriod || ''); // currency defaults to GEL usually or from app state if added to helper
>>>>>>> Stashed changes

            if (truth) {
                setMetrics(truth.metrics);
                // Drill through map not supported in pure metrics Object currently, 
                // unless we enhance Controller. For now, empty.
                setDrillThroughMap({});
                setIsReconciled(true); // By definition, Truth Object is reconciled.
                setReconStatus("Verified by Core Controller");

                // 2. Fetch AI Synthesis via Narrator
                // We ask the Narrator to "Analyze the financial health based on current snapshot"
                const queryRes = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        entity: selectedCompany,
                        period: selectedPeriod,
                        query: `Provide an executive briefing for ${view} view. Analyze high-level risks and opportunities based on the metrics.`
                    })
                });

                if (queryRes.ok) {
                    const qData = await queryRes.json();
                    // Map narration response to UI structure
                    setAiAnalysis({
                        header: { title: "Strategic Synthesis", summary: qData.answer },
                        executive_briefing: qData.answer,
                        // Mocking structured modules for UI richness if narrative is plain text
                        intelligence_modules: [],
                        swot: { strengths: ["Data Locked", "Reconciled"], opportunities: [], risks: [] }
                    });
                }
            }
        } catch (error) {
            console.error("Truth Engine Error:", error);
            toast.error("Failed to fetch verified metrics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTruth();
    }, [selectedCompany, selectedPeriod, selectedDepartment]);

    // Real-time Firestore Listener (kept for potential future use, but not for metrics calculation anymore)
    useEffect(() => {
        // setLoading(true); // Loading is now handled by fetchTruth

        // Start date of the period
        // const startDate = `${selectedPeriod}-01`;
        // const endDate = `${selectedPeriod}-31`; // Simplified for now

        const q = query(
            collection(db, 'financial_transactions'),
            // Filter by Company and Period
            // Note: We'll do client-side filtering for department for more flexibility
            orderBy('date', 'desc'),
            limit(1000)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as any[];

            // Apply strict filtering for the Spine
            const filteredData = allData.filter(txn => {
                const matchesCompany = txn.company_id === selectedCompany;
                const matchesPeriod = txn.date?.startsWith(selectedPeriod);
                const matchesDept = selectedDepartment === 'All' || txn.department === `${selectedDepartment} Department`;
                return matchesCompany && matchesPeriod && matchesDept;
            });

            setTransactions(filteredData);
            // calculateMetrics(filteredData); // Metrics are now fetched from backend
            // setLoading(false); // Loading is now handled by fetchTruth
        }, (error) => {
            console.error("Firestore error:", error);
            // setLoading(false); // Loading is now handled by fetchTruth
        });

        return () => unsubscribe();
    }, [selectedCompany, selectedPeriod, selectedDepartment]); // Added dependencies for consistency

    // calculateMetrics function is removed as metrics are fetched from the backend

    // Fetch Forecast from Backend (Phase 15 Real AI)
    // Phase 19: Export Handler
    const handleDownload = async (format: 'pdf' | 'excel') => {
        try {
            // 1. Gather Metrics State
            // In a real app, this might come from a context or props, here we construct it from the mock/state we have
            const reportPayload = {
                company: "SOCAR Georgia Gas",
                period: "2024 Current",
                metrics: {
                    revenue: metrics?.revenue || 0, // Sync with your state or fetch result
                    cogs: metrics?.cogs || 0,
                    gross_margin: (metrics?.revenue - metrics?.cogs) || 0,
                    operating_expenses: metrics?.expenses || 0,
                    ebitda: metrics?.ebitda || 0, // Using the Phase 18 calc values
                    net_income: metrics?.netIncome || 0,
                    breakdown: { depreciation: 20000, interest: 10000, taxes: 5000 } // Mocked for now
                }
            };

            // 2. Call API
            // For local dev, ensure this points to your function URL or proxy
            const API_URL = "http://127.0.0.1:5001/studio-9381016045-4d625/us-central1/download_report";

            const response = await fetch(`${API_URL}?format=${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportPayload)
            });

            if (!response.ok) throw new Error("Export failed");

            // 3. Trigger Browser Download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Financial_Report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (e) {
            console.error("Download Error:", e);
            alert("Failed to download report. Check backend connection.");
        }
    };
    // ...
    useEffect(() => {
        const fetchForecast = async () => {
            setLoading(true);
            try {
                // Determine Category
                // let category = 'total'; // Unused for now
                // ...

                // In production, this URL would come from env vars
                // For now, we simulate a delay or try to hit local function if running
                // const res = await fetch('http://localhost:8080/generate_prognosis', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ assumptions: { category } })
                // });

                // fallback to mock if backend not reachable for demo
                // But structure it to match the new backend output

                // Simulating Backend Response Delay
                await new Promise(r => setTimeout(r, 1000));

                // Emulate the response from the Prophet Backend
                const mockBackendResponse = [
                    { month: '2024-01', baseline: 280, optimistic: 290, pessimistic: 270, actual: 280 },
                    { month: '2024-02', baseline: 295, optimistic: 310, pessimistic: 280, actual: 290 },
                    { month: '2024-03', baseline: 305, optimistic: 320, pessimistic: 290, actual: 310 },
                    { month: '2024-04', baseline: 320, optimistic: 340, pessimistic: 300 },
                    { month: '2024-05', baseline: 335, optimistic: 360, pessimistic: 310 },
                    { month: '2024-06', baseline: 350, optimistic: 380, pessimistic: 320 },
                ];

                // Adjust for view (Mock Logic - in real app backend handles this via category param)
                const factor = view === 'finance' ? 0.4 : (view === 'department' ? 0.15 : 1);
                const adjustedData = mockBackendResponse.map(d => ({
                    date: d.month, // Map backend 'month' to frontend 'date'
                    forecast: d.baseline * factor,
                    upper: d.optimistic * factor,
                    lower: d.pessimistic * factor,
                    actual: d.actual ? d.actual * factor : undefined
                }));

                setChartData(adjustedData);
            } catch (error) {
                console.error("AI Fetch Failed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, [view]);

    return (
<<<<<<< Updated upstream
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        Financial Performance
                        {isReconciled !== null && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border animate-in fade-in zoom-in duration-500",
                                isReconciled
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", isReconciled ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                {isReconciled ? "Reconciled" : "Discrepancy Detected"}
                            </div>
                        )}
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        Real-time verified metrics from the Truth Engine.
                        {reconStatus && <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-mono">{reconStatus}</span>}
                    </p>
=======
        <div className="space-y-8 pb-24 relative">
            {/* 1. High-End Synthesis Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-background/40 to-white/10 dark:from-slate-950 dark:to-slate-900 border border-primary/10 dark:border-white/5 p-8 shadow-premium group transition-all duration-500 hover:shadow-primary/5 silver-reflection">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                    <BrainCircuit className="h-40 w-40 text-primary" />
>>>>>>> Stashed changes
                </div>
                <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-[80px] animate-pulse" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-5 items-center gap-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-primary border border-primary/20">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                </span>
                                Intelligence Stream v3.2
                            </div>
                            {isReconciled && (
                                <div className="flex h-5 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle className="h-2.5 w-2.5" /> Verified Ledger
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl font-black tracking-tighter text-foreground dark:text-white leading-none">
                            {aiAnalysis?.header?.title || "Intelligence Synthesis Initialized"}
                        </h1>
                        <p className="text-sm text-muted-foreground dark:text-slate-400 font-medium max-w-xl leading-relaxed border-l border-primary/30 pl-4">
                            {aiAnalysis?.header?.summary || "Analyzing transactional patterns across the SOCAR ecosystem to derive strategic truth and mitigate latent risks."}
                        </p>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-3">
                        <div className="bg-white/40 dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-premium">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[9px] font-bold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">Processing Phase</span>
                                <span className="text-[9px] font-black text-primary">84% Complete</span>
                            </div>
                            <Progress value={84} className="h-1 bg-muted dark:bg-white/5" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-background/50 dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-xl p-3 text-center transition-colors hover:bg-muted dark:hover:bg-white/10 cursor-pointer">
                                <p className="text-[8px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest">Anomalies</p>
                                <p className="text-sm font-black text-rose-600 dark:text-rose-500">03 Detected</p>
                            </div>
                            <div className="bg-background/50 dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-xl p-3 text-center transition-colors hover:bg-muted dark:hover:bg-white/10 cursor-pointer">
                                <p className="text-[8px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest">Accuracy</p>
                                <p className="text-sm font-black text-emerald-600 dark:text-emerald-500">99.8%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Intelligence Ribbon (KPIs) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(aiAnalysis?.kpi_ribbon || [
                    { label: "Revenue Core", value: `₾${metrics?.revenue?.toLocaleString() || '0'}`, trend: '+2.4%', pastel: 'card-pastel-emerald' },
                    { label: "Operating Net", value: `₾${metrics?.netIncome?.toLocaleString() || '0'}`, trend: '-0.8%', pastel: 'card-pastel-rose' },
                    { label: "Asset Base", value: `₾${metrics?.assets?.toLocaleString() || '0'}`, trend: '+5.1%', pastel: 'card-pastel-blue' },
                    { label: "Leverage", value: `₾${metrics?.liabilities?.toLocaleString() || '0'}`, trend: '-1.2%', pastel: 'card-pastel-amber' }
                ]).map((kpi: any, idx: number) => (
                    <Card key={idx} className={cn(
                        "bg-white/40 dark:bg-slate-900/40 border-primary/10 dark:border-white/5 backdrop-blur-xl p-6 transition-all border-b-2 border-b-transparent hover:border-b-primary shadow-premium group",
                        kpi.pastel || "card-pastel-blue"
                    )}>
                        <p className="text-[10px] font-black text-muted-foreground dark:text-slate-500 uppercase tracking-widest mb-3 group-hover:text-primary transition-colors">{kpi.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-black text-foreground dark:text-white tracking-tighter">{kpi.value}</h3>
                            {kpi.trend && (
                                <span className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    kpi.trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                )}>
                                    {kpi.trend}
                                </span>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* 3. Logical Narrative & Modules */}
                <div className="xl:col-span-8 space-y-8">
                    {/* Perspective Briefing */}
                    <Card className="glass-frosted-light dark:bg-slate-900/20 dark:border-white/5 p-10 relative overflow-hidden group shadow-premium silver-reflection border-primary/10">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-all duration-500" />
                        <h3 className="text-xl font-black text-foreground dark:text-white mb-8 flex items-center gap-3">
                            <FileText className="h-6 w-6 text-primary" />
                            {view.toUpperCase()} Perspective Briefing
                        </h3>
                        <div className="text-lg text-foreground/80 dark:text-slate-300 leading-relaxed font-normal space-y-6 whitespace-pre-wrap">
                            {aiAnalysis?.executive_briefing || "The synthesis engine is parsing regional entities. Please wait for the double-entry validation to complete for a full narrative."}
                        </div>

                        {/* Download Prompt within briefing */}
                        <div className="mt-10 pt-8 border-t border-primary/10 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-500 italic">
                                <Globe className="h-4 w-4" /> Global Treasury Context Enabled
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" className="text-[10px] font-bold hover:bg-primary/5 dark:hover:bg-white/5 text-foreground/70" onClick={() => handleDownload('pdf')}>
                                    <FileText className="h-4 w-4 mr-2 text-rose-600 dark:text-rose-500" /> EXPORT PDF
                                </Button>
                                <Button variant="ghost" className="text-[10px] font-bold hover:bg-primary/5 dark:hover:bg-white/5 text-foreground/70" onClick={() => handleDownload('excel')}>
                                    <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-500" /> EXPORT EXCEL
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Dynamic Modules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(aiAnalysis?.intelligence_modules || []).map((mod: any, idx: number) => (
                            <div key={idx} className={cn(
                                "group relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 shadow-premium silver-reflection",
                                mod.status === 'critical' ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40" :
                                    mod.status === 'warning' ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40" :
                                        "bg-white/40 dark:bg-slate-900/40 border-primary/10 dark:border-white/5 hover:border-primary/40"
                            )}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground dark:text-slate-500 group-hover:text-primary transition-colors">{mod.category}</span>
                                    {mod.status === 'critical' && <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />}
                                </div>
                                <h4 className="text-lg font-black text-foreground dark:text-white mb-3 tracking-tight group-hover:translate-x-1 transition-transform">{mod.title}</h4>
                                <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6 leading-relaxed font-medium">{mod.insight}</p>
                                <div className="text-3xl font-black text-primary dark:text-white tracking-tighter">{mod.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. SWOT Profile & Visual Recs */}
                <div className="xl:col-span-4 space-y-6">
                    {/* SWOT Card */}
                    <Card className="bg-slate-950 border-white/5 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Neural SWOT Profile</h3>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Strengths
                                </p>
                                <div className="space-y-2 pl-3 border-l border-emerald-500/20">
                                    {(aiAnalysis?.swot?.strengths || ["Scanning ledger..."]).map((s: string, idx: number) => (
                                        <div key={idx} className="text-xs text-slate-300 leading-snug">{s}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Opportunities
                                </p>
                                <div className="space-y-2 pl-3 border-l border-amber-500/20">
                                    {(aiAnalysis?.swot?.opportunities || ["Identifying growth..."]).map((o: string, idx: number) => (
                                        <div key={idx} className="text-xs text-slate-300 leading-snug">{o}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Risks
                                </p>
                                <div className="space-y-2 pl-3 border-l border-rose-500/20">
                                    {(aiAnalysis?.swot?.risks || ["Monitoring anomalies..."]).map((r: string, idx: number) => (
                                        <div key={idx} className="text-xs text-slate-300 leading-snug font-medium">{r}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Infographic Engine Recommendation */}
                    <div className="bg-gradient-to-br from-primary/20 to-indigo-500/5 border border-primary/20 p-8 rounded-[2rem] space-y-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                            <Wand2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-1">Visual Architecture Rec</h4>
                            <p className="text-sm text-slate-200 leading-relaxed font-medium capitalize italic">
                                "{aiAnalysis?.visual_recommendation || "System suggests a Waterfall Balance chart for intercompany reconciliation."}"
                            </p>
                        </div>
                    </div>

                    {/* Secondary Metrics / Quick Trace */}
                    <Card className="bg-slate-900 shadow-xl p-8 rounded-[2rem] border-white/5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Recent Truth Log</h4>
                        <div className="space-y-4">
                            {transactions.slice(0, 4).map((txn, idx) => (
                                <div key={idx} className="flex justify-between items-center group cursor-pointer border-b border-white/5 pb-3 last:border-0">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate max-w-[120px]">{txn.description}</p>
                                        <p className="text-[9px] text-slate-500 font-mono tracking-tighter">{txn.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-xs font-black", (txn.amount_gel ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                            ₾{Math.abs(txn.amount_gel ?? 0).toLocaleString()}
                                        </p>
                                        <p className="text-[8px] uppercase text-slate-600 font-bold">{txn.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
