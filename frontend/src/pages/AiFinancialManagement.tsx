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

// Re-adjusting import if needed (assuming @/components/ui/select)
import {
    Select as SelectUI,
    SelectContent as SelectContentUI,
    SelectItem as SelectItemUI,
    SelectTrigger as SelectTriggerUI,
    SelectValue as SelectValueUI
} from "@/components/ui/select";

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
    const [algorithm, setAlgorithm] = useState('isolation-forest');
    const [nEstimators, setNEstimators] = useState([100]);
    const [contamination, setContamination] = useState([0.05]);
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const { selectedCompany, selectedPeriod } = useAppState();

    useEffect(() => {
        const fetchAnomalies = async () => {
            try {
                const res = await fetch('/api/anomalies/detect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entity: selectedCompany, period: selectedPeriod })
                });
                if (res.ok) {
                    const data = await res.json();
                    setAnomalies(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error("Anomaly fetch failed", e);
            }
        };
        fetchAnomalies();
    }, [selectedCompany, selectedPeriod]);

    return (
        <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-glow uppercase italic"><AIText>AI-Driven Financial Management</AIText></h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 mt-1">
                        <Activity className="h-3 w-3" /> <AIText>Education, Tuning, and Performance Monitoring</AIText>
                    </p>
                </div>
                <GuidedTour />
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="dashboard">Dashboard & Tuning</TabsTrigger>
                    <TabsTrigger value="resilience">Resilience</TabsTrigger>
                    <TabsTrigger value="education">Learning Center</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="glass-vivid">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base font-black italic uppercase"><Info className="h-5 w-5" /> AI Concepts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <h3 className="font-semibold text-sm">Isolation Forest</h3>
                                    <p className="text-xs text-muted-foreground">Unsupervised learning algorithm that identifies anomalies by isolating outliers.</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <h3 className="font-semibold text-sm">Z-Score</h3>
                                    <p className="text-xs text-muted-foreground">Statistical measurement describing relationship to the mean.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-vivid">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base font-black italic uppercase"><Settings2 className="h-5 w-5" /> Hyperparameter Tuning</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <SelectUI value={algorithm} onValueChange={setAlgorithm}>
                                    <SelectTriggerUI><SelectValueUI /></SelectTriggerUI>
                                    <SelectContentUI>
                                        <SelectItemUI value="isolation-forest">Isolation Forest</SelectItemUI>
                                        <SelectItemUI value="z-score">Z-Score Analysis</SelectItemUI>
                                    </SelectContentUI>
                                </SelectUI>
                                <Button className="w-full bg-indigo-600" onClick={() => toast.success("Vertex AI Job Submitted")}>Apply Configuration</Button>
                            </CardContent>
                        </Card>

                        <Card className="glass-vivid lg:col-span-2">
                            <CardHeader><CardTitle className="text-base font-black uppercase italic">Anomaly Feed</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Severity</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {anomalies.map((a, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-xs font-bold">{a.type}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{a.description}</TableCell>
                                                <TableCell className="text-right"><Badge variant="destructive">{a.severity}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AiFinancialManagement;
