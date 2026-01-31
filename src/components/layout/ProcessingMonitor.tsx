import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Cloud, Database, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProcessStage = 'INITIALIZING' | 'UPLOADING' | 'CLOUD_INGESTION' | 'NEURAL_MAPPING' | 'BIGQUERY_FINALIZE' | 'SUCCESS' | 'ERROR';

interface ProcessingState {
    stage: ProcessStage;
    progress: number;
    message: string;
    isActive: boolean;
}

export const ProcessingMonitor: React.FC = () => {
    const [state, setState] = useState<ProcessingState>({
        stage: 'INITIALIZING',
        progress: 0,
        message: 'System Idle',
        isActive: false
    });

    // Handle global custom events for processing
    useEffect(() => {
        const handleStart = (e: any) => {
            setState({
                stage: 'UPLOADING',
                progress: 10,
                message: e.detail?.message || 'Ingesting data stream...',
                isActive: true
            });
        };

        const handleUpdate = (e: any) => {
            setState(prev => ({
                ...prev,
                ...e.detail
            }));
        };

        const handleStop = () => {
            setTimeout(() => {
                setState(prev => ({ ...prev, isActive: false }));
            }, 3000); // Keep success message for 3s
        };

        window.addEventListener('nyx-process-start', handleStart);
        window.addEventListener('nyx-process-update', handleUpdate);
        window.addEventListener('nyx-process-stop', handleStop);

        return () => {
            window.removeEventListener('nyx-process-start', handleStart);
            window.removeEventListener('nyx-process-update', handleUpdate);
            window.removeEventListener('nyx-process-stop', handleStop);
        };
    }, []);

    const getStageIcon = () => {
        switch (state.stage) {
            case 'UPLOADING': return <Activity size={20} className="text-indigo-400 animate-pulse" />;
            case 'CLOUD_INGESTION': return <Cloud size={20} className="text-blue-400 animate-bounce" />;
            case 'NEURAL_MAPPING': return <Sparkles size={20} className="text-purple-400" />;
            case 'BIGQUERY_FINALIZE': return <Database size={20} className="text-amber-400" />;
            case 'SUCCESS': return <CheckCircle size={20} className="text-emerald-400" />;
            case 'ERROR': return <AlertCircle size={20} className="text-rose-400" />;
            default: return <Loader2 size={20} className="animate-spin text-slate-500" />;
        }
    };

    const getStageColor = () => {
        switch (state.stage) {
            case 'SUCCESS': return 'border-emerald-500/50 shadow-emerald-500/20';
            case 'ERROR': return 'border-rose-500/50 shadow-rose-500/20';
            default: return 'border-indigo-500/50 shadow-indigo-500/20';
        }
    };

    return (
        <AnimatePresence>
            {state.isActive && (
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.9 }}
                    className={cn(
                        "fixed bottom-8 right-8 z-[100] w-80 p-5 rounded-3xl backdrop-blur-3xl bg-black/60 border shadow-2xl transition-colors duration-500",
                        getStageColor()
                    )}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                            {getStageIcon()}
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <h4 className="font-black text-xs uppercase tracking-tighter text-white/90 truncate">
                                {state.stage.replace('_', ' ')}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {state.message}
                            </p>
                        </div>
                    </div>

                    <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_0_10px_#6366f1]"
                            initial={{ width: 0 }}
                            animate={{ width: `${state.progress}%` }}
                            transition={{ ease: "easeOut", duration: 0.5 }}
                        />
                    </div>

                    <div className="mt-3 flex justify-between items-center text-[9px] font-black text-slate-500 uppercase">
                        <span>Latency: 24ms</span>
                        <span>{state.progress}% Complete</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
