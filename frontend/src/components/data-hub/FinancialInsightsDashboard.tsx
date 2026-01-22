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
    Activity, TrendingUp, AlertTriangle, ArrowUpRight,
    PieChart, BarChart3, BrainCircuit,
    Wand2, Search, FileText, FileSpreadsheet, Loader2,
    Building2, DollarSign, Globe, X
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
    const [loading, setLoading] = useState(true);


    const config = VIEW_CONFIG[view];

    // CFO-Grade Truth Engine Fetcher
    const fetchTruth = async () => {
        setLoading(true);
        try {
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

            if (!response.ok) throw new Error("Truth Engine Failure");

            const result = await response.json();
            if (result.status === 'success') {
                setMetrics(result.metrics);
                setDrillThroughMap(result.drill_through);
                setIsReconciled(result.reconciliation.is_balanced);
                setReconStatus(result.reconciliation.equation);
            } else {
                setMetrics(null);
                setIsReconciled(false);
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
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border-l pl-2 ml-2 border-border/50">
                        <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')} className="gap-2 text-xs">
                            <FileText className="h-4 w-4 text-rose-500" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload('excel')} className="gap-2 text-xs">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Excel
                        </Button>
                    </div>
                </div>
            </div>

            {/* ERROR / SUCCESS FEEDBACK */}
            {/* Simple toast logic or state can go here, for now using browser alert for simplicity if needed, but fetch handles it */}

            {/* Dynamic Drill-Through Section (Full Width) */}
            {activeDrillDown && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                    <Card className="glass-card border-primary/20">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Search className="h-4 w-4 text-primary" />
                                Traceable Ledger Entries: {activeDrillDown.toUpperCase()} (Based on Deterministic Rules)
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setActiveDrillDown(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-white/5 overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-white/5 hover:bg-white/5">
                                        <TableRow className="hover:bg-transparent border-white/10">
                                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground w-[100px]">Date</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Entity</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">GL Account</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground min-w-[300px]">Description</TableHead>
                                            <TableHead className="text-[10px] uppercase font-bold text-muted-foreground text-right">Amount (₾)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions
                                            .filter(t => drillThroughMap[activeDrillDown]?.includes(t.id))
                                            .map((txn) => (
                                                <TableRow key={txn.id} className="hover:bg-white/5 border-white/5 transition-colors group">
                                                    <TableCell className="text-xs font-medium font-mono text-muted-foreground">{txn.date}</TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] uppercase font-bold">
                                                            {txn.company_id}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs font-mono text-muted-foreground">{txn.gl_account}</TableCell>
                                                    <TableCell className="text-xs">{txn.description}</TableCell>
                                                    <TableCell className={cn("text-xs font-bold text-right", txn.amount_gel >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                                        ₾ {Math.abs(txn.amount_gel).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
            }

            {/* EBITDA Performance */}
            <Card className="glass-card border-white/5 overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                        EBITDA Performance
                        <Globe className="h-3 w-3" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-bold tracking-tight">₾{(metrics?.ebitda || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">Operational Profit</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-blue-400">86.4%</p>
                            <p className="text-[10px] text-muted-foreground">Efficiency Index</p>
                        </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Margin Quality</span>
                            <span className="font-medium text-blue-400">High</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[86%]" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Balance Sheet Snapshot */}
            <Card
                className={cn("glass-card border-white/5 overflow-hidden cursor-pointer transition-all hover:border-primary/50", activeDrillDown === 'assets' && "ring-2 ring-primary/50")}
                onClick={() => setActiveDrillDown(activeDrillDown === 'assets' ? null : 'assets')}
            >
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                        Balance Sheet Snapshot
                        <Building2 className="h-3 w-3" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-bold tracking-tight">₾{(metrics?.assets || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">Total Assets</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-emerald-500">₾{(metrics?.liabilities || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground text-emerald-400">Liabilities</p>
                        </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Equity</span>
                            <span className="font-medium text-purple-400">₾{(metrics?.equity || 0).toLocaleString()}</span>
                        </div>
                        <Progress value={isReconciled ? 100 : 80} className={cn("h-1", isReconciled ? "bg-emerald-500/20" : "bg-red-500/20")} />
                    </div>
                </CardContent>
            </Card>

            {/* Income Overview */}
            <Card
                className={cn("glass-card border-white/5 overflow-hidden cursor-pointer transition-all hover:border-primary/50", activeDrillDown === 'revenue' && "ring-2 ring-primary/50")}
                onClick={() => setActiveDrillDown(activeDrillDown === 'revenue' ? null : 'revenue')}
            >
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                        Income / KPI Overview
                        <DollarSign className="h-3 w-3" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-bold tracking-tight">₾{(metrics?.revenue || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-emerald-400">Actual Revenue</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-red-400">₾{(metrics?.cogs || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">COGS</p>
                        </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Net Profit</span>
                            <span className="font-medium text-emerald-400">₾{(metrics?.netIncome || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-1 h-1">
                            <div className="flex-1 bg-emerald-500/40 rounded-full" />
                            <div className="w-1/3 bg-white/10 rounded-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* CARD 3: AI Anomaly Detection */}
            <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
                        Real-Time Anomalies
                        <Activity className="h-4 w-4 text-amber-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                        <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Unusual Spike Logic
                        </h4>
                        <p className="text-xs text-amber-900/80 leading-relaxed">
                            {view === 'department'
                                ? "Detected a +12% variance in 'Cost of Social Gas' (GL: 5-5001) vs Standard."
                                : "Detected a +4.2% increase in 'Gas Transportation Cost' (GL: 5-5003) vs trailing 3-month average."
                            }
                        </p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Impact</span>
                            <span className="font-medium text-rose-500">+ ₾ 10,000</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 border-b border-dashed">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium text-foreground">98.2%</span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full text-xs h-8 border-amber-500/30 text-amber-600 hover:bg-amber-50 hover:text-amber-700">Investigate Anomaly</Button>
                </CardContent>
            </Card>

            {/* CARD 4: AI Revenue Forecast (Prophet) */}
            <Card className="lg:col-span-2 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                AI Forecast ({view === 'finance' ? 'Expenses' : (view === 'department' ? 'Sales' : 'Revenue')})
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                                Prophet Model (95% CI)
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-8 max-w-[200px] relative">
                                <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-muted-foreground" />
                                <input
                                    className="h-full w-full pl-8 pr-3 text-xs border rounded-md bg-background"
                                    placeholder="Item Code (e.g. MSFT)"
                                    value={forecastItem}
                                    onChange={(e) => setForecastItem(e.target.value)}
                                />
                            </div>
                            <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
                                <Wand2 className="h-3 w-3 mr-1.5" /> Generate
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="upper" stroke="none" fill="#3b82f6" fillOpacity={0.05} />
                            <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" fillOpacity={0.1} />
                            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Actual" />
                            <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Projected" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* CARD 5 & 6: Transactions & Advice Stack */}
            <div className="space-y-6">
                {/* Recent Transactions */}
                <Card className="shadow-sm">
                    <CardHeader className="py-3 bg-muted/20 border-b">
                        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Latest Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {transactions.slice(0, 5).map((txn, idx) => (
                                <div key={txn.id || idx} className="p-3 flex justify-between items-center hover:bg-muted/10 transition-colors cursor-pointer">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium truncate max-w-[150px]">{txn.description || txn.account || 'Transaction'}</span>
                                        <span className="text-[10px] text-muted-foreground">{txn.date || 'No Date'}</span>
                                    </div>
                                    <span className={cn("text-sm font-bold", txn.entry_type === 'Debit' ? "text-rose-600" : "text-emerald-600")}>
                                        {txn.entry_type === 'Debit' ? '-' : '+'} ₾ {txn.amount_gel?.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            {transactions.length === 0 && !loading && (
                                <div className="p-6 text-center text-muted-foreground text-xs uppercase tracking-widest italic opacity-50">
                                    No transactions found
                                </div>
                            )}
                        </div>
                        <div className="p-2 border-t text-center">
                            <button className="text-[10px] text-primary hover:underline">View All Log</button>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Advice */}
                <Card className="bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800">
                    <CardHeader className="py-3">
                        <CardTitle className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-2">
                            <BrainCircuit className="h-3.5 w-3.5" /> Generative Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                        <p className="text-xs text-foreground/80 leading-snug">
                            <span className="font-semibold text-foreground">Insight:</span> {config.advice}
                        </p>
                        <Button size="sm" variant="outline" className="w-full text-xs h-7 border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                            View Full Report
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
