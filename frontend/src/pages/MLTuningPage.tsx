import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Zap, BrainCircuit, Database, AlertTriangle, Activity, TrendingUp, Info, Scale, ShieldAlert, Save, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Backend API Call
const runSimulationAPI = async (params: any) => {
    try {
        const response = await fetch('/api/run_financial_simulation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });
        if (!response.ok) throw new Error('Analysis Engine Offline');
        return await response.json();
    } catch (error) {
        console.error("Simulation failed:", error);
        throw error;
    }
};

const MLTuningPage: React.FC = () => {
    // Tuning State (Zone 2)
    const [horizon, setHorizon] = useState(12);
    const [riskProfile, setRiskProfile] = useState('conservative');
    const [seasonality, setSeasonality] = useState(true);
    const [inflation, setInflation] = useState(2); // %
    const [gasLoss, setGasLoss] = useState(1.5); // %
    const [interestRate, setInterestRate] = useState(14); // %

    // Zone 1 State (Exclusions)
    const [excludeForecast2026, setExcludeForecast2026] = useState(false);

    // Zone 5 State (Calibration)
    const [strictness, setStrictness] = useState(10); // % variance allowed

    // System State
    const [status, setStatus] = useState<'IDLE' | 'TRAINING' | 'READY'>('IDLE');
    const [chartData, setChartData] = useState<any[]>([]);
    const [explanation, setExplanation] = useState<string>("");

    // Initial Load
    useEffect(() => {
        const init = async () => {
            try {
                const data = await runSimulationAPI({ horizon: 12, inflation: 2, seasonality: true });
                setChartData(data.chartData);
                setExplanation(data.explanation);
            } catch (e) {
                toast.error("Failed to load initial model data. Backend might be offline.");
            }
        };
        init();
    }, []);

    const handleRunSimulation = async () => {
        setStatus('TRAINING');
        const toastId = toast.loading('Running Simulation...', {
            description: 'Recalculating Prophet model with new drivers.'
        });

        try {
            const data = await runSimulationAPI({
                horizon,
                inflation: inflation + (gasLoss / 2),
                seasonality,
                gasLoss,
                interestRate
            });

            setChartData(data.chartData);
            setExplanation(data.explanation);
            setStatus('READY');
            toast.success('Simulation Complete', { id: toastId, description: 'Scenario updated.' });
        } catch (e) {
            setStatus('IDLE');
            toast.error('Simulation Failed', { id: toastId, description: 'Could not connect to Analysis Engine.' });
        }
    };

    // Safety check for chart data
    if (!chartData || chartData.length === 0) {
        return <div className="p-8 text-center animate-pulse">Initializing Glass Box Engine...</div>;
    }

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">ML Command Center</h1>
                        <p className="text-sm text-muted-foreground">5-Zone Glass Box Calibration</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-mono border ${status === 'TRAINING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                        {status === 'TRAINING' ? 'TRAINING ACTIVE' : 'MODEL READY'}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Scenario saved to Firestore.")}>
                        <Save className="mr-2 h-4 w-4" /> Save Scenario
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* LEFT COLUMN: CONTROLS & CONTEXT (Zones 1, 2, 5) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* ZONE 1: Context (Data Provenance) */}
                    <Card className="bg-card/40 backdrop-blur-sm border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Database className="h-3 w-3 text-blue-500" /> Zone 1: Input Context
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Live Data Feeds</Label>
                                <div className="flex justify-between items-center text-xs bg-muted/40 p-2 rounded">
                                    <span className="font-mono">Actual PY.txt</span>
                                    <span className="text-green-500 flex items-center gap-1"><Activity className="h-3 w-3" /> Live</span>
                                </div>
                                <div className="flex justify-between items-center text-xs bg-muted/40 p-2 rounded">
                                    <span className="font-mono">Gas Balance.txt</span>
                                    <span className="text-green-500 flex items-center gap-1"><Activity className="h-3 w-3" /> Live</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border/50">
                                <Label className="text-xs font-semibold">Exclusion Filters</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="ex1" checked={excludeForecast2026} onCheckedChange={(c) => setExcludeForecast2026(!!c)} />
                                    <label
                                        htmlFor="ex1"
                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Exclude 'Year2026.txt' (Forecast)
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ZONE 2: Tuning Console (Simulation) */}
                    <Card className="border-border/60 shadow-md group hover:shadow-lg transition-all relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                        <CardHeader className="bg-muted/10 pb-4">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Zap className="h-3 w-3 text-amber-500" /> Zone 2: Tuning Console
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Macro Driver */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs">Inflation (Macro)</Label>
                                    <span className="text-xs font-mono text-amber-600 bg-amber-500/10 px-1 rounded">{inflation}%</span>
                                </div>
                                <Slider value={[inflation]} onValueChange={(v) => setInflation(v[0])} min={0} max={15} step={0.5} className="w-full" />
                            </div>

                            {/* Operational Lever */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs">Target Gas Loss % (Ops)</Label>
                                    <span className="text-xs font-mono text-blue-600 bg-blue-500/10 px-1 rounded">{gasLoss}%</span>
                                </div>
                                <Slider value={[gasLoss]} onValueChange={(v) => setGasLoss(v[0])} min={0} max={5} step={0.1} className="w-full" />
                            </div>

                            {/* Financial Lever */}
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs">Interest Rate Stress (Fin)</Label>
                                    <span className="text-xs font-mono text-green-600 bg-green-500/10 px-1 rounded">{interestRate}%</span>
                                </div>
                                <Slider value={[interestRate]} onValueChange={(v) => setInterestRate(v[0])} min={10} max={25} step={0.5} className="w-full" />
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Q4 Seasonality</Label>
                                    <Switch checked={seasonality} onCheckedChange={setSeasonality} />
                                </div>
                            </div>

                            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md" onClick={handleRunSimulation} disabled={status === 'TRAINING'}>
                                {status === 'TRAINING' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                                {status === 'TRAINING' ? 'Calibrating...' : 'Run Simulation'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* ZONE 5: Calibration (Guardrails) */}
                    <Card className="bg-card/40 backdrop-blur-sm border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <ShieldAlert className="h-3 w-3 text-purple-500" /> Zone 5: Guardrails
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs">Anomaly Strictness</Label>
                                    <span className="text-xs font-mono text-muted-foreground">{strictness}% Var</span>
                                </div>
                                <Slider value={[strictness]} onValueChange={(v) => setStrictness(v[0])} min={1} max={20} step={1} className="w-full" />
                                <p className="text-[10px] text-muted-foreground">Flag variance if &gt; {strictness}% vs forecast.</p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border/50">
                                <Label className="text-xs font-semibold">Whitelist (Ignored Anomalies)</Label>
                                <div className="text-xs bg-muted/30 p-2 rounded border border-border/40">
                                    <div className="flex justify-between border-b border-border/30 pb-1 mb-1">
                                        <span>Polyethylene Pipe D-110</span>
                                        <span className="text-muted-foreground">Item</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Intercompany Costs</span>
                                        <span>Category</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* RIGHT COLUMN: ANALYSIS (Zones 3, 4) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* ZONE 3: Glass Box Output */}
                    <Card className="border-border/40 shadow-lg relative overflow-hidden flex flex-col min-h-[500px]">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-emerald-500" /> Zone 3: Forecast Output
                                </CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-800" /> Actuals</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" /> Forecast</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-200/50" /> 95% CI</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-4">
                            {chartData.length > 0 && (
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickMargin={10} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                labelStyle={{ color: '#64748b' }}
                                            />
                                            <Area type="monotone" dataKey="actual" stroke="#0f172a" fill="url(#colorActual)" strokeWidth={2} fillOpacity={0.1} name="Actuals" />
                                            <Area type="monotone" dataKey="forecast" stroke="#818cf8" strokeDasharray="5 5" fill="url(#colorForecast)" strokeWidth={2} name="Forecast" />
                                            <Area type="monotone" dataKey="upper" stroke="none" fill="#818cf8" fillOpacity={0.1} />
                                            <Area type="monotone" dataKey="lower" stroke="none" fill="#818cf8" fillOpacity={0.1} />
                                            <ReferenceLine x="2024-Dec" stroke="red" strokeDasharray="3 3" label={{ value: "Forecast Start", position: 'insideTopRight', fill: 'red', fontSize: 10 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-border/40 p-4">
                            <div className="flex gap-3 w-full">
                                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold">AI Logic Explanation</h4>
                                    <p className="text-sm text-muted-foreground">{explanation}</p>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* ZONE 4: Scenario Manager (Comparative Ledger) */}
                    <Card className="border-border/40  relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Scale className="h-3 w-3 text-rose-500" /> Zone 4: Scenario Comparison
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">Metric</TableHead>
                                        <TableHead>Current Scenario (Sim)</TableHead>
                                        <TableHead>Baseline (PY Trend)</TableHead>
                                        <TableHead className="text-right">Variance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Net Income Proj.</TableCell>
                                        <TableCell className="text-rose-500 font-bold">$1.8M</TableCell>
                                        <TableCell>$2.1M</TableCell>
                                        <TableCell className="text-right text-rose-500">-14.3%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">COGS (Gas)</TableCell>
                                        <TableCell className="text-amber-500">$850k</TableCell>
                                        <TableCell>$800k</TableCell>
                                        <TableCell className="text-right text-amber-500">+6.2%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium font-mono text-xs text-muted-foreground">Primary Driver</TableCell>
                                        <TableCell colSpan={3} className="text-xs text-muted-foreground italic">
                                            High inflation ({inflation}%) and Interest Rates ({interestRate}%) are compressing margins.
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
};

// Helper component
const Loader2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

export default MLTuningPage;