import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

    useEffect(() => {
        const fetchAnomalies = async () => {
            try {
                // Local function URL - change for production
                const res = await fetch('/api/process_transaction/anomalies');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setAnomalies(data.map((d: any, i: number) => ({
                            id: d.id || i,
                            type: d.type || 'ML',
                            description: d.explanation || d.name,
                            severity: 'High'
                        })));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch anomalies", e);
            }
        };
        fetchAnomalies();
    }, []);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 p-6">

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">AI-Driven Financial Management</h1>
                        <p className="text-sm text-muted-foreground">Education, Tuning, and Performance Monitoring</p>
                    </div>
                </div>
                {/* Guided Tour Trigger */}
                <GuidedTour />
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="dashboard">Dashboard & Tuning</TabsTrigger>
                    <TabsTrigger value="education">Learning Center</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* 1. AI Education/Understanding Card (Quick View) */}
                        <Card className="shadow-md border-l-4 border-l-blue-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Info className="h-5 w-5 text-blue-500" />
                                    Understanding AI in Finance
                                </CardTitle>
                                <CardDescription>Key concepts driving our anomaly detection engine.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                        <Card className="shadow-md border-l-4 border-l-purple-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Settings2 className="h-5 w-5 text-purple-500" />
                                    Model Hyperparameter Tuning
                                </CardTitle>
                                <CardDescription>Adjust sensitivity and complexity of the models.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
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
                                            const res = await fetch('/api/process_transaction/vertex/tune', {
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
                        <Card className="shadow-md border-l-4 border-l-rose-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                                    Live Anomaly Feed
                                </CardTitle>
                                <CardDescription>Real-time detection based on current model settings.</CardDescription>
                            </CardHeader>
                            <CardContent>
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
                        <Card className="shadow-md border-l-4 border-l-emerald-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    Model Performance Overview
                                </CardTitle>
                                <CardDescription>
                                    Accuracy: <span className="font-bold text-foreground">98.4%</span>
                                    <span className="mx-2 text-muted-foreground">|</span>
                                    Improvement: <span className="font-bold text-emerald-500">+2.1%</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
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
