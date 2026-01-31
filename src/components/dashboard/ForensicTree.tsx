import React from 'react';
import { ChevronDown, CornerDownRight, ShieldAlert, DollarSign, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ForensicData {
    finance_concept: string;
    product: string;
    total_revenue: number;
    net_margin: number;
    margin_pct: number;
    root_cause_category: string;
    fx_leakage_lari: number;
    fx_responsibility_ratio: number;
}

export const ForensicTree = ({ data }: { data: ForensicData }) => {
    if (!data) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity size={120} />
            </div>

            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                <Activity size={16} /> Recursive Root Cause Path
            </h3>

            <div className="space-y-6 relative z-10">
                {/* Level 1: Revenue Segment */}
                <div className="flex items-center gap-4 group">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 ring-2 ring-emerald-500/10 group-hover:ring-emerald-500/30 transition-all"><DollarSign size={14} /></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Financial Concept</span>
                        <span className="text-sm font-bold text-white uppercase tracking-wider">{data.finance_concept} <span className="text-white/40 ml-2">(₾ {data.total_revenue.toLocaleString()})</span></span>
                    </div>
                </div>

                {/* Level 2: Product Margin */}
                <div className="ml-8 flex items-center gap-4 border-l-2 border-dashed border-white/10 pl-6 py-4">
                    <CornerDownRight size={14} className="text-white/20" />
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Product Level Analysis</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-white">{data.product}</span>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-2",
                                data.net_margin < 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            )}>
                                {data.net_margin < 0 ? <ShieldAlert size={12} /> : <CheckCircle2 size={12} />}
                                {data.net_margin < 0 ? '🔴 Erosion' : '🟢 Profitable'} (Margin: {data.net_margin.toLocaleString()})
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level 3: Atomic Driver (Account 8220) */}
                {data.root_cause_category === 'FOREX_DRIVEN' && (
                    <div className="ml-16 flex items-center gap-4 border-l-2 border-dashed border-rose-500/10 pl-6 py-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        <CornerDownRight size={14} className="text-rose-500" />
                        <div className="p-5 bg-rose-500/5 border border-rose-500/30 rounded-2xl flex items-center gap-4 w-full shadow-[0_0_30px_-5px_rgba(244,63,94,0.1)]">
                            <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                <ShieldAlert size={18} className="text-rose-500" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-wide block mb-1">Critical Leakage Origin</span>
                                <p className="text-xs font-bold text-white uppercase">Account 8220 (FX Loss)</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Responsibility</span>
                                <span className="text-lg font-black text-rose-400">{(data.fx_responsibility_ratio * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

import { CheckCircle2 } from 'lucide-react';
