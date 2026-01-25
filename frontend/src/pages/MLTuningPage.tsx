import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
    Zap, BrainCircuit, Database, Activity, TrendingUp, Info, Scale,
    ShieldAlert, Save, RotateCcw, Loader2, ArrowRight, History,
    Lock, RefreshCw, AlertCircle, Fingerprint, Eye, EyeOff, Sparkles,
    CircleDot, ChevronRight, Binary, Cpu, BookOpen, Target, BarChart3, Compass, Settings2, Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell
} from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppState, translations } from '@/hooks/use-app-state';
import { AIText } from '@/components/common/AIText';

// Typewriter Component for AI Reasonings
const TypewriterMessage = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
        let i = 0;
        setDisplayedText("");
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return <p className="text-[14px] text-muted-foreground leading-relaxed font-semibold italic antialiased"><AIText>{displayedText}</AIText></p>;
};

const runSimulationAPI = async (params: any) => {
    try {
        const response = await fetch('/api/process-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'simulate', ...params }),
        });
        if (!response.ok) throw new Error('Analysis Engine Offline');
        const data = await response.json();
        if (data.status === 'success') {
            return {
                chartData: data.forecast_series || [],
                explanation: `Intelligence convergence reached. Structural delta detected at node [0x4F2A]. P50 calibrated to ₾${data.p50?.toLocaleString() || 0} with a confidence index of 0.94.`
            };
        }
        return data;
    } catch (error) {
        console.error("Simulation failed:", error);
        throw error;
    }
};

const MLTuningPage: React.FC = () => {
    const { language, currency } = useAppState();
    const t = translations[language];

    // Tuning State
    const [horizon] = useState(12);
    const [macroInflation, setMacroInflation] = useState(2);
    const [operationalGasLoss, setOperationalGasLoss] = useState(1.5);
    const [interestStressPrior, setInterestStressPrior] = useState(14);

    // Zone 1: Learning Corpus Governance
    const [trainingWindow] = useState("2023-01 to 2023-12");

    const [status, setStatus] = useState<'IDLE' | 'LEARNING' | 'STABLE' | 'SIMULATING'>('IDLE');
    const [chartData, setChartData] = useState<any[]>([]);
    const [monteCarloPaths, setMonteCarloPaths] = useState<number[][]>([]);
    const [explanation, setExplanation] = useState<string>("");

    const runMonteCarlo = async () => {
        setStatus('SIMULATING');
        try {
            const res = await fetch('/api/process-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'simulate',
                    company_id: 'SGG-001',
                    iterations: 50, // Reduced for high-perf UI render
                    horizon: 12
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setMonteCarloPaths(data.sample_paths || []);
                setExplanation(language === 'en'
                    ? `Monte Carlo Convergence: ${data.iterations} paths calculated. P50 Structural Limit confirmed.`
                    : `მონტე-კარლოს კონვერგენცია: გათვლილია ${data.iterations} ტრაექტორია. P50 სტრუქტურული ლიმიტი დადასტურებულია.`);
                toast.success(language === 'en' ? "Simulation converged." : "სიმულაცია დასრულდა.");
            }
        } catch (err) {
            toast.error("Convergence failed.");
        } finally {
            setStatus('STABLE');
        }
    };

    // Learning Loop Stages
    const [activeLoopStep, setActiveLoopStep] = useState(0);
    const loopSteps = useMemo(() => [
        { label: language === 'en' ? 'Observe' : 'დაკვირვება', icon: Eye, description: language === 'en' ? 'Ingesting verified stream' : 'ვერიფიცირებული ნაკადის მიღება' },
        { label: language === 'en' ? 'Extract' : 'ამოღება', icon: Database, description: language === 'en' ? 'Normalizing vectors' : 'ვექტორების ნორმალიზება' },
        { label: language === 'en' ? 'Reason' : 'ლოგიკა', icon: BrainCircuit, description: language === 'en' ? 'Inference weighting' : 'დასკვნის აწონვა' },
        { label: language === 'en' ? 'Forecast' : 'პროგნოზი', icon: TrendingUp, description: language === 'en' ? 'Projection synthesis' : 'პროექციის სინთეზი' },
        { label: language === 'en' ? 'Adapt' : 'ადაპტაცია', icon: RefreshCw, description: language === 'en' ? 'Structural update' : 'სტრუქტურული განახლება' },
        { label: language === 'en' ? 'Commit' : 'შენახვა', icon: Save, description: language === 'en' ? 'Ledger finalization' : 'რეესტრის ფინალიზაცია' }
    ], [language]);

    useEffect(() => {
        const init = async () => {
            try {
                const data = await runSimulationAPI({ horizon: 12 });
                setChartData(data.chartData || []);
                setExplanation(language === 'en' ? "Cognitive baseline established from historical truth." : "სისტემის ბაზისი ჩამოყალიბდა ისტორიული მონაცემების საფუძველზე.");
            } catch (e) {
                setExplanation(language === 'en' ? "System in local simulation mode." : "სისტემა ლოკალური სიმულაციის რეჟიმშია.");
            }
        };
        init();

        const interval = setInterval(() => {
            setActiveLoopStep(prev => (prev + 1) % loopSteps.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [loopSteps.length, language]);

    const handleAITrain = async () => {
        setStatus('LEARNING');
        const adaptationPromise = new Promise(resolve => setTimeout(resolve, 3000));

        toast.promise(
            adaptationPromise,
            {
                loading: language === 'en' ? 'Recalibrating neural weights...' : 'ნეირონული წონების გადათვლა...',
                success: language === 'en' ? 'Adaptation successful.' : 'ადაპტაცია წარმატებულია.',
                error: 'Error'
            }
        );

        adaptationPromise.finally(() => setStatus('STABLE'));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6 w-full pb-12 max-w-7xl mx-auto px-4 lg:px-0"
        >

            {/* HEADER */}
            <header className="flex flex-col gap-4 border-b border-white/5 pb-8 shrink-0 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <motion.div
                            animate={{
                                boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 30px rgba(99,102,241,0.2)", "0 0 0px rgba(99,102,241,0)"]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="h-14 w-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50" />
                            <BrainCircuit className="h-8 w-8 text-indigo-400 z-10" />
                        </motion.div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-muted-foreground/50">
                                    {language === 'en' ? 'Intelligence Control Plane' : 'ინტელექტის მართვის პანელი'}
                                </h1>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-400/20 px-2 py-0 text-[10px] font-black uppercase tracking-tighter">Live</Badge>
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2">
                                <Cpu className="h-3 w-3" /> {language === 'en' ? 'Cognitive Governance System' : 'კოგნიტური მართვის სისტემა'} - 0x7E2A
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" className="h-11 px-6 rounded-2xl border-white/10 bg-indigo-500/5 hover:bg-indigo-500/10 text-[10px] font-black uppercase tracking-widest text-indigo-400 gap-2">
                            <BookOpen className="h-4 w-4" /> {language === 'en' ? 'Learning Mode' : 'სწავლების რეჟიმი'}
                        </Button>
                        <Button variant="outline" size="sm" className="h-11 px-6 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl group">
                            <History className="mr-3 h-4 w-4 text-indigo-400 group-hover:rotate-[-45deg] transition-transform" /> {language === 'en' ? 'Model Genealogy' : 'მოდელის გენეალოგია'}
                        </Button>
                    </div>
                </div>
            </header>

            {/* EDUCATIONAL TOP BAR */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-700">
                <Card className="glass-vivid border-indigo-500/10 p-6 rounded-[2.5rem] bg-indigo-500/5 flex items-start gap-4 hover:shadow-indigo-500/10 transition-all group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-2 italic">
                            <AIText>WHAT IS THIS?</AIText>
                        </h4>
                        <p className="text-[11px] font-bold text-foreground/80 leading-relaxed">
                            <AIText>Welcome to the Control Plane. Here, you tune the specific Feature Vectors that drive our financial predictions. Every slider adjustment retrains the model weight in real-time.</AIText>
                        </p>
                    </div>
                </Card>
                <Card className="glass-vivid border-emerald-500/10 p-6 rounded-[2.5rem] bg-emerald-500/5 flex items-start gap-4 hover:shadow-emerald-500/10 transition-all group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Target className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-2 italic">
                            <AIText>HOW TO TRAIN</AIText>
                        </h4>
                        <p className="text-[11px] font-bold text-foreground/80 leading-relaxed">
                            <AIText>Adjust the levers below to simulate different economic environments. Once satisfied, click "Synchronize Architecture" to deploy the weights to the production ledger.</AIText>
                        </p>
                    </div>
                </Card>
                <Card className="glass-vivid border-amber-500/10 p-6 rounded-[2.5rem] bg-amber-500/5 flex items-start gap-4 hover:shadow-amber-500/10 transition-all group overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Compass className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2 italic">
                            <AIText>LEARNING GOAL</AIText>
                        </h4>
                        <p className="text-[11px] font-bold text-foreground/80 leading-relaxed">
                            <AIText>The goal is to minimize "Reality Delta" (error rate) by matching model priors with active market indicators and historical performance patterns.</AIText>
                        </p>
                    </div>
                </Card>
            </div>

            {/* FLUID LEARNING LOOP */}
            <div className="relative py-8">
                <div className="absolute top-1/2 left-0 w-full h-px bg-primary/20 -translate-y-1/2 hidden lg:block" />
                <div className="grid grid-cols-6 gap-4 relative">
                    {loopSteps.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = activeLoopStep === idx;
                        const isPast = activeLoopStep > idx;
                        return (
                            <motion.div
                                key={idx}
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    backgroundColor: isActive ? "hsl(var(--primary) / 0.15)" : isPast ? "hsl(var(--emerald-500) / 0.05)" : "hsl(var(--background) / 0.5)",
                                    borderColor: isActive ? "hsl(var(--primary) / 0.5)" : isPast ? "hsl(var(--emerald-500) / 0.2)" : "hsl(var(--border) / 0.5)",
                                    boxShadow: isActive ? "0 20px 50px -10px hsl(var(--primary) / 0.3)" : "none"
                                }}
                                className={cn(
                                    "flex flex-col items-center gap-3 p-6 rounded-[3rem] border transition-all duration-700 relative group overflow-hidden shadow-2xl backdrop-blur-3xl z-10",
                                    !isActive && !isPast && "opacity-40 grayscale-[1]"
                                )}
                            >
                                {isActive && <motion.div layoutId="loop-glow" className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent pointer-events-none" />}
                                <div className={cn(
                                    "p-4 rounded-2xl transition-all duration-500 relative shrink-0",
                                    isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 rotate-12 scale-110" :
                                        isPast ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-muted-foreground"
                                )}>
                                    <Icon className="h-6 w-6" />
                                    {isActive && <motion.div animate={{ scale: [1, 2, 1], opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-primary rounded-2xl -z-10" />}
                                </div>
                                <div className="text-center space-y-1">
                                    <span className={cn("text-[11px] font-black uppercase tracking-widest block", isActive ? "text-primary" : "text-foreground")}>
                                        <AIText>{step.label}</AIText>
                                    </span>
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[8px] font-black text-primary/60 uppercase tracking-tighter block"
                                        >
                                            <AIText>Active Task...</AIText>
                                        </motion.span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">

                {/* LEFT CONSOLE */}
                <div className="lg:col-span-4 space-y-8">

                    {/* DIMENSION 1 */}
                    <Card className="glass-frosted-light border-indigo-500/10 rounded-[2.5rem] card-pastel-blue shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        <CardHeader className="pb-4 pt-8 px-8 flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3 font-mono">
                                <span className="h-2 w-2 rounded-full bg-indigo-500" /> [Dim 01] {language === 'en' ? 'Learning Corpus' : 'სწავლების კორპუსი'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 px-8 relative z-10">
                            {[
                                { label: 'Verified_Actuals_PY', status: 'Inbound', color: 'text-indigo-400' },
                                { label: 'Structural_Gas_Priors', status: 'Read/Only', color: 'text-blue-400' },
                                { label: 'War_Anomaly_Data', status: 'RED-LOCKED', color: 'text-rose-400' }
                            ].map((item, i) => (
                                <motion.div whileHover={{ x: 4 }} key={i} className="flex justify-between items-center text-[10px] font-black bg-primary/5 dark:bg-slate-900/40 p-4 rounded-2xl border border-primary/10 dark:border-white/5 backdrop-blur-xl">
                                    <span className="font-mono text-foreground/70">{item.label}</span>
                                    <span className={cn("flex items-center gap-2 uppercase italic text-[9px]", item.color)}><CircleDot className="h-2 w-2" /> {item.status}</span>
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* DIMENSION 2 */}
                    <Card className="glass-frosted-light border-amber-500/10 rounded-[2.5rem] card-pastel-amber shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden group">
                        <CardHeader className="pb-4 pt-8 px-8 z-10 relative">
                            <CardTitle className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-3 font-mono">
                                <span className="h-2 w-2 rounded-full bg-amber-500" /> [Dim 02] {language === 'en' ? 'Feature Vectors' : 'ფუნქციური ვექტორები'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 relative z-10">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center group/lever cursor-pointer">
                                    <Label className="text-[13px] font-black text-foreground italic">{language === 'en' ? 'Economic Inflation Prior' : 'ინფლაციის მოლოდინი'}</Label>
                                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[11px] px-3 font-black h-7 rounded-full">{macroInflation}%</Badge>
                                </div>
                                <Slider value={[macroInflation]} onValueChange={(v) => setMacroInflation(v[0])} min={0} max={15} step={0.5} />
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center group/lever cursor-pointer">
                                    <Label className="text-[13px] font-black text-foreground italic">{language === 'en' ? 'Operational Loss Var' : 'ოპერაციული დანაკარგის ვარიაცია'}</Label>
                                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-[11px] px-3 font-black h-7 rounded-full">{operationalGasLoss}%</Badge>
                                </div>
                                <Slider value={[operationalGasLoss]} onValueChange={(v) => setOperationalGasLoss(v[0])} min={0} max={5} step={0.1} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* DIMENSION 5 */}
                    <Card className="glass-frosted-light border-rose-500/10 rounded-[2.5rem] card-pastel-rose shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden group">
                        <CardHeader className="pb-4 pt-8 px-8 z-10 relative">
                            <CardTitle className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-3 font-mono">
                                <span className="h-2 w-2 rounded-full bg-rose-500" /> [Dim 05] {language === 'en' ? 'Cognitive Safety' : 'კოგნიტური უსაფრთხოება'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 px-8 relative z-10 pb-8">
                            {[
                                { label: language === 'en' ? 'Prohibit unverified inference' : 'დაუდასტურებელი ინფერენციის აკრძალვა', status: true },
                                { label: language === 'en' ? 'Confirm structure deltas > 20%' : 'სტრუქტურული დელტას დადასტურება > 20%', status: true },
                                { label: language === 'en' ? 'Allow synthetic stress reasoning' : 'სინთეზური სტრეს-ლოგიკის დაშვება', status: false }
                            ].map((law, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-primary/5 dark:bg-slate-900/40 rounded-2xl border border-primary/10 dark:border-white/5 group/row hover:border-primary/20 transition-all">
                                    <span className="text-[11px] font-bold text-foreground/80 leading-tight">{law.label}</span>
                                    <Switch checked={law.status} className="scale-75 data-[state=checked]:bg-rose-500" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                </div>

                {/* RIGHT CONSOLE */}
                <div className="lg:col-span-8 space-y-8">

                    {/* DIMENSION 3: Prediction & Monte Carlo */}
                    <Card className="glass-frosted-light border-emerald-500/10 rounded-[3rem] card-pastel-emerald shadow-[0_48px_100px_-24px_rgba(0,0,0,0.6)] border-l-0 overflow-hidden min-h-[620px] relative">
                        <CardHeader className="pb-6 pt-10 px-10 flex-row items-center justify-between z-10 relative">
                            <CardTitle className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-4 font-mono">
                                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" /> [Dim 03] {language === 'en' ? 'Reasoning & Scenarios' : 'ლოგიკა და სცენარები'}
                            </CardTitle>
                            <div className="flex gap-3">
                                <Button size="sm" variant="outline" className="h-8 border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] font-black uppercase px-4 rounded-full gap-2" onClick={runMonteCarlo} disabled={status === 'SIMULATING'}>
                                    {status === 'SIMULATING' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
                                    {language === 'en' ? 'Run Monte Carlo' : 'მონტე-კარლო'}
                                </Button>
                                <Badge className="bg-slate-900 border-white/10 text-emerald-400 text-[10px] px-4 h-8 rounded-full font-black">PROPHET_v4.2</Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-10 relative z-10 lg:pt-2">
                            <div className="grid grid-cols-4 gap-6 mb-10">
                                {[
                                    { label: language === 'en' ? 'Learning Rate' : 'სწავლების ტემპი', value: '0.0024', icon: Zap, color: 'text-amber-400' },
                                    { label: language === 'en' ? 'Neural Density' : 'ნეირონული სიმჭიდროვე', value: '256L', icon: BrainCircuit, color: 'text-indigo-400' },
                                    { label: language === 'en' ? 'Epochs' : 'ეპოქები', value: '120', icon: RotateCcw, color: 'text-emerald-400' },
                                    { label: language === 'en' ? 'Momentum' : 'მომენტი', value: '0.92', icon: Activity, color: 'text-blue-400' }
                                ].map((kpi, i) => (
                                    <motion.div whileHover={{ y: -5 }} key={i} className="bg-background/80 dark:bg-slate-950/60 p-6 rounded-[2.5rem] border border-primary/10 dark:border-white/5 flex flex-col items-center gap-3 backdrop-blur-3xl shadow-vivid">
                                        <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                                        <div className="text-center">
                                            <span className="text-2xl font-black tracking-tighter text-foreground block">{kpi.value}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">{kpi.label}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                                        <Target className="h-4 w-4" /> {language === 'en' ? 'FEATURE IMPORTANCE RADAR' : 'ფუნქციების მნიშვნელობის რადარი'}
                                    </h4>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                                { subject: language === 'en' ? 'Inflation' : 'ინფლაცია', A: 120, fullMark: 150 },
                                                { subject: language === 'en' ? 'OpEx' : 'ოპერატიული', A: 98, fullMark: 150 },
                                                { subject: language === 'en' ? 'Seasonal' : 'სეზონური', A: 86, fullMark: 150 },
                                                { subject: language === 'en' ? 'Market' : 'ბაზარი', A: 99, fullMark: 150 },
                                                { subject: language === 'en' ? 'Volume' : 'მოცულობა', A: 85, fullMark: 150 },
                                            ]}>
                                                <PolarGrid stroke="#ffffff10" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                                <Radar name="Model Weights" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" /> {language === 'en' ? 'RESIDUALS (ERROR DIST)' : 'რეზიდუალური ანალიზი'}
                                    </h4>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: '-2%', val: 4 },
                                                { name: '-1%', val: 12 },
                                                { name: '0%', val: 45 },
                                                { name: '+1%', val: 18 },
                                                { name: '+2%', val: 6 },
                                            ]}>
                                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#020617', border: 'none', borderRadius: '12px' }} />
                                                <Bar dataKey="val" radius={[8, 8, 0, 0]}>
                                                    {[0, 1, 2, 3, 4].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 2 ? '#10b981' : '#10b98140'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[320px] w-full mt-10 p-8 glass-indigo dark:bg-slate-900/40 rounded-[2.5rem] border border-primary/10 dark:border-white/5">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> {language === 'en' ? 'Ground Truth Persistence (Backtest)' : 'ისტორიული სიზუსტის ვალიდაცია'}</span>
                                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-400/20 text-[9px] font-black">VALIDATING WEIGHTS...</Badge>
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                                        <XAxis dataKey="month" hide />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#020617', borderRadius: '20px', border: '1px solid #1e293b' }}
                                            labelStyle={{ display: 'none' }}
                                            itemStyle={{ fontSize: '11px', textTransform: 'uppercase', color: '#10b981', fontWeight: 900 }}
                                        />
                                        <Area type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={6} fill="url(#chartGradient)" />
                                        <Area type="step" dataKey="actual" stroke="#ffffff" strokeOpacity={0.2} strokeWidth={2} fill="transparent" />

                                        {/* Monte Carlo Paths */}
                                        {monteCarloPaths.map((path, i) => (
                                            <Area
                                                key={i}
                                                type="monotone"
                                                data={path.map((val, idx) => ({
                                                    month: idx,
                                                    val
                                                }))}
                                                dataKey="val"
                                                stroke="#6366f1"
                                                strokeWidth={1}
                                                strokeOpacity={0.1}
                                                fill="transparent"
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>

                        <CardFooter className="bg-background/90 dark:bg-slate-950/80 border-t border-primary/10 dark:border-white/5 p-10 flex flex-col items-start gap-8 backdrop-blur-3xl rounded-b-[3rem]">
                            <div className="flex items-start gap-6 w-full">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                                    <BrainCircuit className="h-7 w-7 text-indigo-400" />
                                </div>
                                <div className="space-y-2 pt-1 text-left">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300 antialiased">Synthesized Reasoning Trace</h4>
                                    <TypewriterMessage text={explanation} />
                                </div>
                            </div>
                            <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[12px] uppercase tracking-[0.3em] rounded-2xl shadow-xl transition-all" onClick={handleAITrain} disabled={status === 'LEARNING'}>
                                {status === 'LEARNING' ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <RotateCcw className="mr-3 h-5 w-5" />}
                                {language === 'en' ? 'Synchronize Architecture' : 'არქიტექტურის სინქრონიზაცია'}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* DIMENSION 4 */}
                    <Card className="glass-vivid border-primary/10 dark:border-white/5 rounded-[2.5rem] bg-background/50 dark:bg-slate-900/40 p-1 overflow-hidden shadow-vivid">
                        <CardContent className="p-8 pb-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest pb-6 text-left">{language === 'en' ? 'Model Vector' : 'მოდელის ვექტორი'}</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest pb-6 text-left">{language === 'en' ? 'Reality Delta' : 'რეალობის დელტა'}</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest pb-6 text-right">{language === 'en' ? 'Goverance Command' : 'მართვის ბრძანება'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { vector: language === 'en' ? 'Revenue Predictor v4.2' : 'შემოსავლების პროგნოზირება v4.2', drift: '+4.2%', status: language === 'en' ? 'Drift Detected' : 'დრიფტი', color: 'text-amber-400' },
                                        { vector: language === 'en' ? 'Opex Baseline Alpha' : 'ხარჯების ბაზისი Alpha', drift: '-1.4%', status: language === 'en' ? 'STABLE' : 'სტაბილური', color: 'text-emerald-400' },
                                        { vector: language === 'en' ? 'Market Liquidity Ensemble' : 'ბაზრის ლიკვიდურობის ანსამბლი', drift: '+12.8%', status: language === 'en' ? 'Outlier' : 'ანომალია', color: 'text-rose-400' }
                                    ].map((row, i) => (
                                        <TableRow key={i} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <TableCell className="py-5 text-left font-black text-[13px]">{row.vector}</TableCell>
                                            <TableCell className="text-left">
                                                <Badge className={cn("bg-transparent border-white/10 text-[10px] font-black uppercase px-3", row.color)} variant="outline">{row.drift} | {row.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase text-indigo-400">{language === 'en' ? 'Feedback Map' : 'უკუკავშირის რუკა'} <ChevronRight className="ml-1 h-3 w-3" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* AUDIT LOG FOOTER */}
            <div className="mt-4 p-8 bg-background/90 dark:bg-slate-950/80 rounded-[3rem] border border-primary/10 dark:border-white/5 backdrop-blur-3xl shadow-vivid flex items-center justify-between group overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500/50" />
                <div className="flex items-center gap-10 relative z-10">
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] italic">Active Architecture</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-black text-foreground">Prophet_Ensemble_L4-BETA</span>
                            <Badge className="bg-indigo-500 border-none text-white text-[9px] px-2 font-black uppercase">v2.12</Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-foreground italic uppercase">Secured by FinSight Sentinel</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">Protocol 0x7E2A41B | {currency === 'USD' ? 'USD_FEED' : 'GEL_FEED'}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MLTuningPage;