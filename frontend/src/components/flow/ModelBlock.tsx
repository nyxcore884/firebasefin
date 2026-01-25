import { Handle, Position } from '@xyflow/react';
import { BrainCircuit, Sparkles, Sliders, ExternalLink } from 'lucide-react';
import { ModelBlockData } from '@/types/flow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ModelBlock = ({ data, selected }: { data: ModelBlockData, selected?: boolean }) => {
    const navigate = useNavigate();

    const handleOpenTuning = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/ml-tuning');
    };

    return (
        <div style={{ width: 240, height: 140 }}>
            <div className={cn(
                "min-w-[240px] shadow-premium rounded-xl bg-slate-900 border border-indigo-900/50 transition-all overflow-hidden relative",
                selected && "ring-2 ring-indigo-500 border-indigo-500/50"
            )}>
                {/* AI Glow Effect */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

                <Handle
                    type="target"
                    position={Position.Top}
                    className="!bg-indigo-500 !w-3 !h-3 !border-slate-900 !-top-1.5"
                />

                {/* Header */}
                <div className="bg-indigo-950/20 px-3 py-2 border-b border-indigo-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-tight text-indigo-100">{data.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-indigo-500/10 text-indigo-500/40 hover:text-indigo-400"
                            onClick={handleOpenTuning}
                        >
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Sparkles className="h-3 w-3 text-indigo-500/40" />
                    </div>
                </div>

                {/* Body */}
                <div className="px-3 py-3 space-y-3">
                    <div className="bg-indigo-500/5 rounded-xl p-3 border border-indigo-500/10">
                        <p className="text-[10px] text-slate-300 italic line-clamp-2 leading-relaxed tracking-tight">
                            "{data.explanation || 'Cognitive synthesis active. Analyzing data patterns for strategic insights...'}"
                        </p>
                    </div>

                    <div className="flex gap-2 text-[8px] font-black uppercase text-slate-500 tracking-widest px-1 items-center">
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-pulse" /> Active</span>
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {data.toolName}</span>
                        <div className="flex-1" />
                        <Sliders className="h-3 w-3 text-slate-700" />
                    </div>
                </div>

                {/* Output Handle */}
                <div className="relative h-4 bg-indigo-950/10 border-t border-indigo-900/20 flex items-center justify-center">
                    <span className="text-[7px] font-black text-indigo-600 tracking-[0.2em] uppercase">Intelligence</span>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        className="!bg-indigo-500 !w-3 !h-3 !border-slate-900 !-bottom-1.5"
                    />
                </div>
            </div>
        </div>
    );
};
