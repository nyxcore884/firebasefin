import { Handle, Position } from '@xyflow/react';
import { Send, Bell, Layout, BookOpen, ShieldCheck, ExternalLink } from 'lucide-react';
import { OutputBlockData } from '@/types/flow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const OutputBlock = ({ data, selected }: { data: OutputBlockData, selected?: boolean }) => {
    const navigate = useNavigate();

    const handleOpenTarget = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data.target === 'executive_alert') {
            navigate('/reports');
        } else if (data.target === 'dashboard') {
            navigate('/dashboard');
        }
        // Add other routing as needed
    };

    const Icon = data.target === 'executive_alert' ? Bell :
        data.target === 'dashboard' ? Layout :
            data.target === 'ai_knowledge_base' ? BookOpen : ShieldCheck;

    const targetColor = data.target === 'executive_alert' ? 'text-rose-400' :
        data.target === 'dashboard' ? 'text-blue-400' :
            data.target === 'ai_knowledge_base' ? 'text-emerald-400' : 'text-amber-400';

    return (
        <div className={cn(
            "min-w-[200px] shadow-premium rounded-xl bg-slate-900 border border-slate-700 transition-all overflow-hidden",
            selected && "ring-2 ring-primary border-primary/50"
        )}>
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-slate-500 !w-3 !h-3 !border-slate-900 !-top-1.5"
            />

            {/* Header */}
            <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-200">{data.label}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-slate-500/10 text-slate-500/40 hover:text-slate-400"
                    onClick={handleOpenTarget}
                >
                    <ExternalLink className="h-3 w-3" />
                </Button>
            </div>

            {/* Body */}
            <div className="px-3 py-3 space-y-3">
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-slate-800/50">
                    <Icon className={cn("h-4 w-4", targetColor)} />
                    <div className="flex-1">
                        <div className="text-[7px] text-slate-500 uppercase font-black">Target Sink</div>
                        <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{data.target.replace('_', ' ')}</div>
                    </div>
                </div>

                {data.preview?.lastRunAt && (
                    <div className="flex justify-between items-center text-[8px] font-bold px-1">
                        <span className="text-slate-500 uppercase">Last Sync</span>
                        <span className="text-slate-400">{data.preview.lastRunAt}</span>
                    </div>
                )}
            </div>

            {/* Terminal Base */}
            <div className="h-2 bg-slate-800/40" />
        </div>
    );
};
