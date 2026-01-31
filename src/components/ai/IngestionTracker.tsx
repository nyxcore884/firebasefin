import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Database, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';

const STAGES = [
    { id: 1, label: 'Cloud Ingestion', icon: <Database size={16} />, description: 'Loading 30MB+ binary stream to BigQuery Staging' },
    { id: 2, label: 'Neural Mapping', icon: <Cpu size={16} />, description: 'Deterministic schema discovery and field alignment' },
    { id: 3, label: 'Forensic Scan', icon: <ShieldAlert size={16} />, description: 'Running AI.DETECT_ANOMALIES across universal ledger' }
];

export const IngestionTracker = ({ currentStep, progress }: { currentStep: number, progress: number }) => {
    return (
        <div className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-8">Data Ingestion Pipeline</h3>

            <div className="space-y-8">
                {STAGES.map((stage) => {
                    const isActive = stage.id === currentStep;
                    const isCompleted = stage.id < currentStep;

                    return (
                        <div key={stage.id} className={cn("relative flex gap-6 text-left", !isActive && !isCompleted && "opacity-30")}>
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500",
                                isCompleted ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" :
                                    isActive ? "bg-primary animate-pulse" : "bg-white/5"
                            )}>
                                {isCompleted ? <CheckCircle2 size={20} className="text-white" /> :
                                    isActive ? <Loader2 size={20} className="text-white animate-spin" /> :
                                        stage.icon}
                            </div>

                            <div className="flex-grow">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{stage.label}</span>
                                    {isActive && <span className="text-[10px] font-black text-primary font-mono">{progress}%</span>}
                                </div>
                                <p className="text-[9px] text-white/40 font-bold uppercase leading-relaxed">{stage.description}</p>

                                {isActive && (
                                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
