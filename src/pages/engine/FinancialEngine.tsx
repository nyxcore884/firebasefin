import React, { useState } from 'react';
import {
    Cpu,
    RefreshCw,
    ShieldCheck,
    ArrowRightLeft,
    Settings,
    Database,
    Calculator,
    Zap,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const FinancialEngine: React.FC = () => {
    const [activeCycle, setActiveCycle] = useState('consolidation');

    const cycles = [
        { id: 'consolidation', label: 'Consolidation Logic', icon: Cpu, desc: 'Deterministic aggregation of multi-entity sub-ledgers.' },
        { id: 'elimination', label: 'IC Elimination', icon: ArrowRightLeft, desc: 'Automated removal of intercompany revenue and COGS nodes.' },
        { id: 'translation', label: 'FX Translation', icon: RefreshCw, desc: 'Precision conversion based on historical, average, and closing rates.' },
        { id: 'governance', label: 'Integrity Shield', icon: ShieldCheck, desc: 'Active monitoring of consolidation quality and audit trails.' }
    ];

    return (
        <div className="p-8 max-w-[1800px] mx-auto animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20 shadow-lg shadow-indigo-600/5">
                            <Calculator size={32} className="text-indigo-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter text-glow-vivid">Financial Intelligence Engine</h1>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">Deterministic Core Active</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-12 px-6 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase text-[10px] tracking-widest">
                        Audit Trail
                    </Button>
                    <Button className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest shadow-vivid">
                        Trigger Cycle
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Cycle Selection Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div className="nyx-card p-6 border-white/10 bg-black/40 backdrop-blur-3xl">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-8">Processing Cycles</h3>
                        <div className="space-y-4">
                            {cycles.map((cycle) => (
                                <button
                                    key={cycle.id}
                                    onClick={() => setActiveCycle(cycle.id)}
                                    className={cn(
                                        "w-full text-left p-6 rounded-[2rem] border transition-all duration-500 group",
                                        activeCycle === cycle.id
                                            ? "bg-indigo-600 border-indigo-500 shadow-vivid text-white"
                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex items-center gap-5 mb-3">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                                            activeCycle === cycle.id ? "bg-white/20 scale-110" : "bg-white/5 group-hover:bg-white/10"
                                        )}>
                                            <cycle.icon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-tight">{cycle.label}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", activeCycle === cycle.id ? "text-white/60" : "text-white/20")}>
                                                    Operational
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className={cn("text-[9px] font-bold leading-relaxed uppercase opacity-80", activeCycle === cycle.id ? "text-white/90" : "text-white/30")}>
                                        {cycle.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="nyx-card p-8 border-white/10 bg-indigo-600 text-white relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6">System Health</h3>
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-4xl font-black">99.9<span className="text-white/40">%</span></span>
                                <p className="text-[9px] font-black uppercase tracking-widest mt-1">Deterministic Reliability</p>
                            </div>
                            <Activity size={40} className="opacity-20 translate-y-2" />
                        </div>
                    </div>
                </div>

                {/* Main Cycle Content */}
                <div className="col-span-12 lg:col-span-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCycle}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="nyx-card min-h-[700px] border-white/10 bg-black/20 overflow-hidden flex flex-col"
                        >
                            <div className="p-8 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">{activeCycle} Engine</h3>
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Real-time logic visualization</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">Synced</span>
                                    <Settings size={20} className="text-white/20" />
                                </div>
                            </div>

                            <div className="flex-grow p-10 flex flex-col items-center justify-center text-center">
                                {activeCycle === 'consolidation' && (
                                    <div className="w-full space-y-12">
                                        <div className="flex justify-center items-center gap-12">
                                            <div className="space-y-4">
                                                <div className="h-20 w-32 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-2">
                                                    <Database size={24} className="text-amber-500" />
                                                    <span className="text-[8px] font-black uppercase text-white/40">SGG Tbilis</span>
                                                </div>
                                                <div className="h-20 w-32 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-2">
                                                    <Database size={24} className="text-blue-500" />
                                                    <span className="text-[8px] font-black uppercase text-white/40">SGP Retail</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-32 h-1 bg-white/5 relative overflow-hidden">
                                                    <motion.div
                                                        animate={{ x: [-128, 128] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                        className="absolute top-0 left-0 w-12 h-full bg-indigo-500 shadow-vivid"
                                                    />
                                                </div>
                                                <div className="h-40 w-40 rounded-full border-2 border-indigo-500/50 flex items-center justify-center relative">
                                                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
                                                    <div className="h-32 w-32 rounded-full bg-indigo-600 flex flex-col items-center justify-center shadow-vivid border-4 border-black/20">
                                                        <Zap size={40} className="text-white mb-2" />
                                                        <span className="text-[10px] font-black uppercase">Core Engaged</span>
                                                    </div>
                                                </div>
                                                <div className="w-32 h-1 bg-white/5 relative overflow-hidden">
                                                    <motion.div
                                                        animate={{ x: [-128, 128] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
                                                        className="absolute top-0 left-0 w-12 h-full bg-emerald-500 shadow-vivid"
                                                    />
                                                </div>
                                            </div>

                                            <div className="h-48 w-48 rounded-[3rem] bg-emerald-600/10 border-2 border-emerald-500/30 flex flex-col items-center justify-center gap-4">
                                                <CheckCircle2 size={48} className="text-emerald-500" />
                                                <div className="text-center">
                                                    <span className="text-xl font-black text-white">CONSOLIDATED</span>
                                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">SOCAR MASTER ARRAY</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                                            {[
                                                { label: 'Ingestion Accuracy', value: '100%' },
                                                { label: 'Matching Nodes', value: '14,204' },
                                                { label: 'Variance Detected', value: '0%' }
                                            ].map((stat, i) => (
                                                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <span className="text-[8px] font-black text-white/20 uppercase block mb-1">{stat.label}</span>
                                                    <span className="text-lg font-black text-white">{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeCycle !== 'consolidation' && (
                                    <div className="opacity-40 flex flex-col items-center">
                                        <Settings size={64} className="animate-spin-slow mb-6" />
                                        <h4 className="text-xl font-black uppercase tracking-widest mb-2">Cycle Configuration</h4>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Calibrating logic for {activeCycle}...</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
