import { Handle, Position } from '@xyflow/react';
import { BrainCircuit, Settings2, Sliders } from 'lucide-react';
import { AiToolNodeData } from '@/types/flow';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const AiToolNode = ({ data }: { data: AiToolNodeData }) => {
    const navigate = useNavigate();

    const handleOpenMLTuning = () => {
        navigate('/ml-tuning');
    };

    return (
        <div className="px-5 py-5 shadow-premium rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-primary/20 w-72 backdrop-blur-xl relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
                <BrainCircuit className="h-16 w-16 text-primary" />
            </div>

            <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2 !border-0" />

            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <BrainCircuit className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">AI Intelligence</p>
                    <p className="text-xs font-bold text-foreground truncate">{String(data.label || data.toolName)}</p>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                    {data.intents.slice(0, 2).map((intent, i) => (
                        <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 uppercase">
                            {intent}
                        </span>
                    ))}
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 bg-muted/30 p-2 rounded-xl border border-border/10 text-center">
                        <p className="text-[7px] uppercase font-black text-muted-foreground mb-1">Error Rate</p>
                        <p className="text-[10px] font-bold text-rose-500">{data.errorRate ? `${data.errorRate}%` : '0.0%'}</p>
                    </div>
                    <div className="flex-1 bg-muted/30 p-2 rounded-xl border border-border/10 text-center">
                        <p className="text-[7px] uppercase font-black text-muted-foreground mb-1">Last Run</p>
                        <p className="text-[10px] font-bold text-primary truncate max-w-[80px]">
                            {data.lastUsedAt || 'Never'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={handleOpenMLTuning}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest flex-1 gap-1.5 border-primary/10 hover:bg-primary/5 shadow-sm"
                >
                    <Sliders className="h-3 w-3" /> ML Tuning
                </Button>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2 !border-0" />
        </div>
    );
};
