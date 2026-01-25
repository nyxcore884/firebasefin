import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuidedTour } from "@/components/education/GuidedTour";
import { InfoCard } from "@/components/education/InfoCard";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BrainCircuit, Activity, Settings2, BarChart2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import { useAppState } from '@/hooks/use-app-state';
import { AIText } from '@/components/common/AIText';

// Mock Data for Performance
const performanceData = [
    { name: 'Jan', accuracy: 85 },
    { name: 'Feb', accuracy: 88 },
    { name: 'Mar', accuracy: 87 },
    { name: 'Apr', accuracy: 92 },
    { name: 'May', accuracy: 94 },
    { name: 'Jun', accuracy: 96 },
    { name: 'Jul', accuracy: 98.4 },
];

const AiFinancialManagement = () => {
    // State for Tuning
    const [algorithm, setAlgorithm] = useState('isolation-forest');
    const [nEstimators, setNEstimators] = useState([100]);
    const [contamination, setContamination] = useState([0.05]);

    // Mock Anomalies (could fetch from API)
    const [anomalies, setAnomalies] = useState([
        { id: 1, type: 'Isolation Forest', description: 'Unusual vendor payment frequency detected for "Vendor X".', severity: 'High' },
        { id: 2, type: 'Z-Score', description: 'Revenue deviation > 2 SD in Region North.', severity: 'Medium' },
    ]);

    const { selectedCompany, selectedPeriod } = useAppState();

    useEffect(() => {
        const fetchAnomalies = async () => {
            try {
<<<<<<< Updated upstream
                // Local function URL - change for production
                const res = await fetch('http://127.0.0.1:5001/firebasefin-main/us-central1/process_transaction/anomalies');
=======
                // Real Anomaly Engine
                const res = await fetch('/api/anomalies/detect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        entity: selectedCompany,
                        period: selectedPeriod
                    })
                });
>>>>>>> Stashed changes
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'no_data') {
                        setAnomalies([]);
                        return;
                    }

                    if (Array.isArray(data)) {
                        setAnomalies(data);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch anomalies", e);
            }
        };
        fetchAnomalies();
    }, [selectedCompany, selectedPeriod]);

    return (
        <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between pb-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-glow uppercase italic"><AIText>AI-Driven Financial Management</AIText></h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 mt-1">
                        <Activity className="h-3 w-3" /> <AIText>Education, Tuning, and Performance Monitoring</AIText>
                    </p>
                </div>
                {/* Guided Tour Trigger */}
                <GuidedTour />
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="dashboard">Dashboard & Tuning</TabsTrigger>
                    <TabsTrigger value="resilience">Resilience & Health</TabsTrigger>
                    <TabsTrigger value="education">Learning Center</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* 1. AI Education/Understanding Card (Quick View) */}
                        <Card className="glass-vivid border-primary/10 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="relative z-10">
                                <CardTitle className="flex items-center gap-2 text-base font-black italic uppercase">
                                    <Info className="h-5 w-5 text-primary" />
                                    <AIText>Understanding AI in Finance</AIText>
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"><AIText>Key concepts driving our anomaly detection engine.</AIText></CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                                        <Activity className="h-4 w-4 text-emerald-500" /> Isolation Forest
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        An unsupervised learning algorithm that identifies anomalies by isolating outliers in the data.
                                        Points that are "easier to isolate" (require fewer splits) are considered anomalies.
                                        Ideal for spotting irregular vendor payments or fraud.
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                                        <BarChart2 className="h-4 w-4 text-amber-500" /> Z-Score (Standard Score)
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        A statistical measurement that describes a value's relationship to the mean of a group of values.
                                        Z-score = 0 is the mean. Z-score {'>'} 2 indicates a data point is significantly different from the norm.
                                        Best for tracking revenue trends.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Model Tuning Section */}
                        <Card className="glass-vivid border-purple-500/10 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="relative z-10">
                                <CardTitle className="flex items-center gap-2 text-base font-black italic uppercase">
                                    <Settings2 className="h-5 w-5 text-purple-400" />
                                    <AIText>Model Hyperparameter Tuning</AIText>
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"><AIText>Adjust sensitivity and complexity of the models.</AIText></CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Algorithm Selection</label>
                                    <Select value={algorithm} onValueChange={setAlgorithm}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Algorithm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="isolation-forest">Isolation Forest</SelectItem>
                                            <SelectItem value="z-score">Z-Score Analysis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {algorithm === 'isolation-forest' && (
                                    <>
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <label className="text-sm font-medium">Number of Estimators (Trees)</label>
                                                <span className="text-sm font-mono bg-muted px-2 rounded">{nEstimators[0]}</span>
                                            </div>
                                            <Slider
                                                value={nEstimators}
                                                onValueChange={setNEstimators}
                                                min={50}
                                                max={200}
                                                step={10}
                                                className="py-2"
                                            />
                                            <p className="text-[10px] text-muted-foreground">Higher values increase accuracy but slow down processing.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <label className="text-sm font-medium">Contamination (Expected Outliers)</label>
                                                <span className="text-sm font-mono bg-muted px-2 rounded">{contamination[0]}</span>
                                            </div>
                                            <Slider
                                                value={contamination}
                                                onValueChange={setContamination}
                                                min={0.01}
                                                max={0.1}
                                                step={0.01}
                                                className="py-2"
                                            />
                                            <p className="text-[10px] text-muted-foreground">The proportion of outliers in the data set.</p>
                                        </div>
                                    </>
                                )}

                                {algorithm === 'z-score' && (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 text-sm rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                                        Z-Score typically requires less tuning. Threshold is set to standard deviation &gt; 2.
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    onClick={async () => {
                                        try {
                                            const toastId = toast.loading("Starting Vertex AI Tuning Job...");
                                            const res = await fetch('http://127.0.0.1:5001/firebasefin-main/us-central1/process_transaction/vertex/tune', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    algorithm,
                                                    params: { nEstimators: nEstimators[0], contamination: contamination[0] }
                                                })
                                            });
                                            const data = await res.json();
                                            if (data.error) throw new Error(data.error);
                                            toast.success("Job Started: " + data.job_id, { id: toastId });
                                        } catch (e: any) {
                                            toast.error("Tuning failed: " + e.message);
                                        }
                                    }}
                                >
                                    Apply Configuration (Vertex AI)
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 3. Anomaly Detection Feed */}
                        <Card className="glass-vivid border-rose-500/10 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="relative z-10">
                                <CardTitle className="flex items-center gap-2 text-base font-black italic uppercase">
                                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                                    <AIText>Live Anomaly Feed</AIText>
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"><AIText>Real-time detection based on current model settings.</AIText></CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Severity</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {anomalies.map((anomaly) => (
                                            <TableRow key={anomaly.id}>
                                                <TableCell className="font-medium text-xs">{anomaly.type}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{anomaly.description}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold
                                                        ${anomaly.severity === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                            anomaly.severity === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                'bg-slate-100 text-slate-700'}
                                                    `}>
                                                        {anomaly.severity}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* 4. Performance Dashboard */}
                        <Card className="glass-vivid border-emerald-500/10 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="relative z-10">
                                <CardTitle className="flex items-center gap-2 text-base font-black italic uppercase">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    <AIText>Model Performance Overview</AIText>
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                    <AIText>Accuracy:</AIText> <span className="font-black text-foreground">98.4%</span>
                                    <span className="mx-2 text-muted-foreground">|</span>
                                    <AIText>Improvement:</AIText> <span className="font-black text-emerald-400">+2.1%</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                        <YAxis domain={[80, 100]} axisLine={false} tickLine={false} fontSize={12} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="accuracy" stroke="#10b981" fillOpacity={1} fill="url(#colorAccuracy)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                    </div>
                </TabsContent>

                <TabsContent value="resilience" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Model Drift Monitor */}
                        <Card className="shadow-md border-t-4 border-t-amber-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Activity className="h-5 w-5 text-amber-500" />
                                    Model Drift Monitor
                                </CardTitle>
                                <CardDescription>Tracking baseline stability over time.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <span className="text-xs font-semibold">Simulation Drift</span>
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Stable (0.2%)</Badge>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <span className="text-xs font-semibold">Anomaly Recall</span>
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Optimal (94.2%)</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                    * Managed by Vertex AI Model Monitoring. Automatic retraining triggered at 5% drift.
                                </p>
                            </CardContent>
                        </Card>

                        {/* 2. Explainable AI: Forecast Drivers */}
                        <Card className="shadow-md border-t-4 border-t-indigo-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <BarChart2 className="h-5 w-5 text-indigo-500" />
                                    Explainable AI: Sensitivity Analysis
                                </CardTitle>
                                <CardDescription>Attributing forecast spread to global drivers.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Market Volatility</span>
                                        <span className="font-bold">68%</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[68%]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Trend Momentum</span>
                                        <span className="font-bold">32%</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[32%]" />
                                    </div>
                                </div>
                                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                                    <p className="text-[10px] text-indigo-400 font-medium">
                                        Insight: Current forecasts are highly sensitive to market shocks. Volatility is the primary driver of the p90/p10 spread.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="education" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="col-span-full mb-4">
                            <h2 className="text-lg font-semibold">Educational Resources</h2>
                            <p className="text-sm text-muted-foreground">Master the concepts behind AI-driven finance.</p>
                        </div>

                        <InfoCard
                            title="Introduction to AI in Finance"
                            description="Essentials of ML in FinTech"
                            content="Artificial Intelligence (AI) is transforming financial management by providing predictive insights, automating processes, and detecting anomalies. Learn how algorithms like Prophet and Isolation Forest drive these insights."
                            icon={<BrainCircuit className="h-5 w-5 text-indigo-500" />}
                        />

                        <InfoCard
                            title="Vertex AI Basics"
                            description="Google Cloud's AI Platform"
                            content="Vertex AI is a unified platform for building, deploying, and managing ML models. Utilizing AutoML, we can train high-accuracy models without deep data science expertise, ensuring scalable deployment."
                            icon={<Activity className="h-5 w-5 text-emerald-500" />}
                        />

                        <InfoCard
                            title="Model Interpretability"
                            description="Transparency & Trust"
                            content="Our platform prioritizes 'Glass Box' AI, providing clear explanations for every prediction and anomaly. Understanding why a transaction was flagged is just as important as the flag itself."
                            icon={<Info className="h-5 w-5 text-blue-500" />}
                        />

                        <div className="col-span-full mt-6 p-6 bg-muted/20 border border-dashed rounded-xl text-center">
                            <h3 className="font-semibold mb-2">Need a guided walkthrough?</h3>
                            <p className="text-sm text-muted-foreground mb-4">Click the button in the top right to start the interactive platform tour.</p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AiFinancialManagement;
