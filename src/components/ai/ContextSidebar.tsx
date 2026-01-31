import React from 'react';
import {
    Cpu, Microscope, Shield, Clock,
    Sparkles, FileText, Presentation,
    MapPin, Briefcase, Zap, Database,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ContextSidebarProps {
    activeEngine: string;
    onEngineChange: (engine: any) => void;
    onExport: (format: 'pdf' | 'ppt') => void;
    selectedCompany?: string;
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
    activeEngine,
    onEngineChange,
    onExport,
    selectedCompany = "SOCAR GROUP"
}) => {
    const engines = [
        { id: 'general', label: 'General IQ', icon: Sparkles, desc: 'Balance reasoning' },
        { id: 'forensic', label: 'Forensic Lab', icon: Microscope, desc: 'Outlier detection' },
        { id: 'risk', label: 'Risk Shield', icon: Shield, desc: 'Compliance audit' },
        { id: 'forecast', label: 'Temporal Hub', icon: Clock, desc: 'Time-series prediction' },
    ];

    return (
        <div className="w-[320px] h-full bg-background/40 backdrop-blur-3xl border-r border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-left duration-700">
            {/* Header: Neural Context */}
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <h6 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3 mb-4">
                    <Cpu size={16} />
                    Neural Context
                </h6>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/50 transition-all cursor-pointer">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">{selectedCompany}</p>
                            <p className="text-[8px] text-white/30 uppercase mt-0.5">Primary Entity</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Briefcase size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">FY 2026 Target</p>
                            <p className="text-[8px] text-white/30 uppercase mt-0.5">Active Fiscal Node</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body: Engine Directives */}
            <div className="flex-grow p-8 space-y-8 overflow-y-auto scrollbar-none">
                <div>
                    <h6 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-6">Engine Directives</h6>
                    <div className="space-y-3">
                        {engines.map((engine) => (
                            <button
                                key={engine.id}
                                onClick={() => onEngineChange(engine.id)}
                                className={cn(
                                    "w-full p-4 rounded-2xl border transition-all flex items-center gap-4 group text-left",
                                    activeEngine === engine.id
                                        ? "bg-primary border-primary shadow-lg shadow-primary/20"
                                        : "bg-white/5 border-white/5 hover:border-white/20"
                                )}
                            >
                                <engine.icon className={cn(
                                    "shrink-0",
                                    activeEngine === engine.id ? "text-white" : "text-primary group-hover:scale-110 transition-transform"
                                )} size={18} />
                                <div className="flex-grow overflow-hidden">
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-widest truncate",
                                        activeEngine === engine.id ? "text-white" : "text-white/80"
                                    )}>{engine.label}</p>
                                    <p className={cn(
                                        "text-[8px] uppercase mt-0.5 truncate",
                                        activeEngine === engine.id ? "text-white/60" : "text-white/20"
                                    )}>{engine.desc}</p>
                                </div>
                                {activeEngine === engine.id && <Zap size={10} className="text-white animate-pulse" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Linked Entities */}
                <div>
                    <h6 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-6">Linked Entities</h6>
                    <div className="flex flex-wrap gap-2">
                        {['SOCAR_PETROLEUM', 'SOCAR_GAS', 'SOCAR_TRADING', 'GEORGIAN_CORP'].map((entity) => (
                            <div key={entity} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-white/40 uppercase tracking-widest hover:text-primary hover:border-primary/30 transition-all cursor-crosshair">
                                {entity}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer: Intelligence Actions */}
            <div className="p-8 border-t border-white/5 bg-black/20">
                <h6 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-6 font-display">Intelligence Actions</h6>
                <div className="grid grid-cols-1 gap-3">
                    <Button
                        onClick={() => onExport('pdf')}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest flex items-center justify-between px-6 group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-primary group-hover:scale-110 transition-transform" />
                            <span>Export Intel PDF</span>
                        </div>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Button>

                    <Button
                        onClick={() => onExport('ppt')}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest flex items-center justify-between px-6 group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Presentation size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span>Generate Slide Array</span>
                        </div>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
