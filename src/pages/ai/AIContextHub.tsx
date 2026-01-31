
import React, { useState, useEffect } from 'react';
import {
    Database,
    BrainCircuit,
    Zap,
    Settings,
    CheckCircle2,
    AlertCircle,
    FileJson,
    History,
    Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const AIContextHub: React.FC = () => {
    const [tuningStatus, setTuningStatus] = useState<'idle' | 'running' | 'completed'>('idle');
    const [progress, setProgress] = useState(0);

    const stats = [
        { label: 'Ground Truth Dataset', value: '1,240 pairs', icon: Database, color: 'text-blue-500' },
        { label: 'Model Accuracy (Pro)', value: '98.4%', icon: Target, color: 'text-green-500' },
        { label: 'Latency (Avg)', value: '2.4s', icon: Zap, color: 'text-yellow-500' },
        { label: 'Pending Corrections', value: '12', icon: AlertCircle, color: 'text-red-500' },
    ];

    const handleStartTuning = () => {
        setTuningStatus('running');
        setProgress(0);
    };

    useEffect(() => {
        if (tuningStatus === 'running' && progress < 100) {
            const timer = setTimeout(() => setProgress(prev => prev + 5), 500);
            return () => clearTimeout(timer);
        } else if (progress >= 100) {
            setTuningStatus('completed');
        }
    }, [tuningStatus, progress]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Learning Studio</h1>
                    <p className="text-slate-500 mt-1">Manage training data and fine-tune Vertex AI Models</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <FileJson className="w-4 h-4" /> Export Dataset
                    </Button>
                    <Button
                        onClick={handleStartTuning}
                        disabled={tuningStatus === 'running'}
                        className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    >
                        <BrainCircuit className="w-4 h-4" /> {tuningStatus === 'running' ? 'Tuning...' : 'Run Fine-Tuning'}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-slate-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tuning Status */}
            {tuningStatus !== 'idle' && (
                <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <div className="flex items-center gap-2 text-indigo-700 font-semibold uppercase tracking-wider">
                                <History className="w-4 h-4 animate-spin" />
                                Model Fine-Tuning in Progress (Gemini 1.5 Pro)
                            </div>
                            <span className="text-indigo-600">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-slate-500 italic">
                            Uploading financial context pairs to Vertex AI Learning Studio for period-specific tuning...
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Logs */}
                <Card className="lg:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500" />
                            Ground-Truth Correction Queue
                        </CardTitle>
                        <CardDescription>Review AI reasoning and provide corrections to teach the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-lg border border-slate-100 hover:border-indigo-100 transition-colors">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Query: "Why is EBITDA high in TelavGas?"</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-100 text-yellow-700 font-bold uppercase">Awaiting Review</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            AI Reasoned: "EBITDA growth driven by 20% reduction in direct costs."
                                            <span className="text-indigo-600 ml-1 italic underline cursor-pointer">Verify logic?</span>
                                        </p>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="h-8 text-xs text-green-600 hover:text-green-700 bg-green-50">Approve logic</Button>
                                            <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:text-red-700 bg-red-50">Correct System</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Model Config */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-500" />
                            Model Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Primary Reasoning Model</label>
                            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                                <span className="text-sm font-semibold text-indigo-800">Gemini 1.5 Pro</span>
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Intent Router (ML)</label>
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                                <span className="text-sm font-semibold text-emerald-800">MLIntentClassifier (v2.1)</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500 uppercase font-bold">Training Set Saturation</span>
                                <span className="text-indigo-600 font-bold">82%</span>
                            </div>
                            <Progress value={82} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AIContextHub;
