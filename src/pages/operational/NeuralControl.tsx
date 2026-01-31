import React, { useState, useEffect } from 'react';
import { DimensionalCard } from '@/components/neural/DimensionalCard';
import { Button } from '@/components/ui/button';
import {
    Activity,
    Cpu,
    Zap,
    Shield,
    RefreshCw,
    ArrowUpRight,
    Brain,
    Globe,
    Database,
    CloudLightning
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const NeuralControl: React.FC = () => {
    const [heartbeat, setHeartbeat] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeartbeat(prev => (prev + 1) % 100);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 space-y-8 min-h-screen bg-transparent relative overflow-hidden lowercase-all">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/80">system context: active</span>
                    </div>
                    <h1 className="text-4xl font-medium tracking-tighter text-white">operational pulse</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="glass-panel px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">latency</span>
                            <span className="text-xs font-mono text-cyan-400">12ms</span>
                        </div>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">load</span>
                            <span className="text-xs font-mono text-violet-400">2.4%</span>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-xs px-6 py-4 h-auto">
                        <RefreshCw className="mr-2 h-3 w-3 animate-spin-slow" />
                        recalibrate
                    </Button>
                </div>
            </header>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <DimensionalCard glowColor="teal" className="group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 group-hover:scale-110 transition-transform">
                            <Cpu className="h-5 w-5 text-cyan-400" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm text-zinc-400">cognitive processing</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">12.4 t-flops</span>
                            <span className="text-[10px] font-bold text-emerald-400">+1.2%</span>
                        </div>
                    </div>
                    <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 w-[65%] shadow-[0_0_10px_#06b6d4]" />
                    </div>
                </DimensionalCard>

                <DimensionalCard glowColor="violet" className="group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 group-hover:scale-110 transition-transform">
                            <Brain className="h-5 w-5 text-violet-400" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm text-zinc-400">reasoning yield</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">99.82%</span>
                            <span className="text-[10px] font-bold text-emerald-400">optimal</span>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-1 h-1">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className={cn("flex-1 rounded-full bg-violet-500/20", i < 10 && "bg-violet-500 shadow-[0_0_5px_#8b5cf6]")} />
                        ))}
                    </div>
                </DimensionalCard>

                <DimensionalCard glowColor="magenta" pulse className="group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 group-hover:scale-110 transition-transform">
                            <Shield className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="flex gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                            <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm text-zinc-400">security parity</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">stable</span>
                            <span className="text-[10px] font-bold text-zinc-500">last scan: 2m ago</span>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-zinc-500">
                        <span>encryption: phase 4</span>
                        <span>integrity: 100%</span>
                    </div>
                </DimensionalCard>
            </div>

            {/* Main Operational Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
                <DimensionalCard className="lg:col-span-3 h-[400px] flex flex-col justify-between" glowColor="teal">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium text-white">neural connectivity map</h3>
                            <p className="text-xs text-zinc-500">real-time routing visualizer</p>
                        </div>
                        <div className="flex gap-2">
                            {['edge', 'core', 'mesh'].map(m => (
                                <button key={m} className="px-3 py-1 rounded-full border border-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors">
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative py-12">
                        {/* Visualizer Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <div className="w-[300px] h-[300px] border border-cyan-500/20 rounded-full animate-pulse-slow" />
                            <div className="absolute w-[200px] h-[200px] border border-violet-500/20 rounded-full animate-float" />
                            <div className="absolute w-[100px] h-[100px] border border-cyan-500/40 rounded-full animate-pulse" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <Brain className="h-12 w-12 text-white/80 mb-4 animate-float" />
                            <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                processing neural stream...
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 grid grid-cols-4 gap-4">
                        {[
                            { icon: Globe, label: 'Geo-mesh', value: 'Active' },
                            { icon: Database, label: 'Locker', value: 'Secured' },
                            { icon: CloudLightning, label: 'Direct', value: '98%' },
                            { icon: Zap, label: 'Power', value: 'Opt' }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col gap-1 items-center">
                                <stat.icon className="h-3 w-3 text-zinc-500" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </DimensionalCard>

                <div className="space-y-6">
                    <DimensionalCard glowColor="violet" className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-violet-400 mb-4">system health</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Uptime', value: '42d 12h' },
                                { label: 'Integrity', value: '99.9%' },
                                { label: 'Efficiency', value: '1.2x' }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                    <span className="text-xs text-zinc-500">{item.label}</span>
                                    <span className="text-xs font-mono text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </DimensionalCard>

                    <Button className="w-full rounded-[2.0rem] bg-gradient-to-r from-cyan-600 to-violet-600 text-white font-black uppercase tracking-[0.3em] py-8 text-xs shadow-2xl hover:scale-[1.02] transition-all group overflow-hidden relative">
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            sync neural system
                            <Zap className="h-4 w-4 text-yellow-300" />
                        </span>
                    </Button>

                    <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Network Node B-4</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-400">
                            Deterministic consolidation logic is currently synchronizing across all satellite nodes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
