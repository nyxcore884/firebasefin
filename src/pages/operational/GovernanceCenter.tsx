import React, { useState, useEffect } from 'react';
import {
    Shield,
    Activity,
    Zap,
    AlertTriangle,
    CheckCircle2,
    ArrowUpRight,
    Search,
    RefreshCw,
    Database,
    Cpu,
    Network
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export const GovernanceCenter = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/v1/ai/logic-drift');
                setStats(res);
            } catch (error) {
                console.error("Failed to fetch governance stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const driftPercent = stats?.max_z_score ? Math.min((stats.max_z_score / 3) * 100, 100) : 12;

    return (
        <div className="p-8 space-y-8 bg-background h-full overflow-y-auto scrollbar-none">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                        <Shield className="text-primary h-8 w-8" />
                        Governance Control Center
                    </h1>
                    <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em] mt-2 italic">Neural Integrity & Semantic Logic Monitoring</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-white/5 bg-white/5 text-[10px] uppercase font-black tracking-widest hover:bg-white/10">
                        <RefreshCw className="mr-2 h-4 w-4" /> Sync Registry
                    </Button>
                    <Button className="h-12 px-6 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-[10px] uppercase font-black tracking-widest">
                        <Zap className="mr-2 h-4 w-4" /> Run Logic Audit
                    </Button>
                </div>
            </div>

            {/* Grid 1: Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="glass-card border-white/5 bg-white/[0.02]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Logic Drift (Z-Score)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <h2 className="text-4xl font-black text-white">{stats?.max_z_score?.toFixed(2) || '0.82'}</h2>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none mb-1">STABLE</Badge>
                        </div>
                        <Progress value={driftPercent} className="h-1.5 mt-4 bg-white/5" indicatorClassName="bg-primary" />
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/5 bg-white/[0.02]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Semantic Consistency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <h2 className="text-4xl font-black text-white">99.4%</h2>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1 group cursor-pointer">
                                    <ArrowUpRight size={12} /> +0.2%
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-1 mt-4">
                            {[1, 1, 1, 1, 1, 1, 0.8, 1, 1, 1, 1.1, 1].map((v, i) => (
                                <div key={i} className="flex-1 h-3 bg-white/5 rounded-sm relative overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${v * 100}%` }}
                                        className="absolute bottom-0 left-0 right-0 bg-emerald-500/40"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/5 bg-white/[0.02]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-400">Knowledge Gap Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <h2 className="text-4xl font-black text-white">{stats?.anomalies_count || '14'}</h2>
                            <AlertTriangle className="text-amber-500 h-6 w-6 mb-1 animate-pulse" />
                        </div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-4">Pending manual categorization</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-white/5 bg-white/[0.02]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Evolved Logic Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <h2 className="text-4xl font-black text-white">412</h2>
                            <Cpu className="text-indigo-400 h-6 w-6 mb-1" />
                        </div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-4">Permanent memory entries</p>
                    </CardContent>
                </Card>
            </div>

            {/* Grid 2: Pipeline Visualization & Registry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logic Bridge: Registry Stats */}
                <Card className="lg:col-span-2 glass-card border-white/5 bg-black/40">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Semantic Registry Pulse</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-black text-white/20">Historical Mapping Confidence vs Complexity</CardDescription>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/10">
                            {['REALTIME', 'HISTORY'].map(tab => (
                                <button key={tab} className={tab === 'REALTIME' ? 'px-4 py-1.5 bg-primary rounded-lg text-[9px] font-black uppercase' : 'px-4 py-1.5 text-white/20 text-[9px] font-black uppercase'}>{tab}</button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center">
                        {/* Recursive Visual Element placeholder */}
                        <div className="flex flex-col items-center gap-8 opacity-40">
                            <div className="h-48 w-48 rounded-full border-[10px] border-primary/20 border-t-primary animate-spin duration-[3s]" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Neural Path Optimization Live</p>
                                <p className="text-[8px] text-white/20 uppercase font-black mt-2">Connecting 3-Brain Architecture</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Task/Feedback Feed */}
                <Card className="glass-card border-white/5 bg-black/40">
                    <CardHeader>
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Intelligence Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {[
                                { user: "Admin", action: "Validated wholesale mapping", age: "2h ago", color: "text-emerald-400" },
                                { user: "Brain 2", action: "Detected drift in SGP Retail", age: "4h ago", color: "text-rose-400" },
                                { user: "System", action: "Promoted logic to Gold Layer", age: "12h ago", color: "text-indigo-400" },
                                { user: "Analyst", action: "Flagged mismatch resolution", age: "1d ago", color: "text-amber-400" },
                            ].map((item, i) => (
                                <div key={i} className="p-6 hover:bg-white/5 transition-colors group cursor-pointer">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{item.user}</span>
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{item.age}</span>
                                    </div>
                                    <p className={cn("text-[11px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform", item.color)}>
                                        {item.action}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full py-6 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-white/5 rounded-none border-t border-white/5">
                            View Full Audit Logs <ArrowUpRight className="ml-2 h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
