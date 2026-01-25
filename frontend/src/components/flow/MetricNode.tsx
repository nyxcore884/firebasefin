import { Handle, Position } from '@xyflow/react';
import { Calculator, TrendingUp, ExternalLink } from 'lucide-react';
import { MetricBlockData } from '@/types/flow';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const MetricBlock = ({ data, selected }: { data: MetricBlockData, selected?: boolean }) => {
    const navigate = useNavigate();

    const handleOpenAnalysis = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/analysis?metric=${data.key}`);
    };

    return (
        <div style={{ width: 200, height: 100 }}>
            <div className={cn(
                "min-w-[200px] shadow-premium rounded-xl bg-slate-900 border border-emerald-900/50 transition-all overflow-hidden",
                selected && "ring-2 ring-emerald-500 border-emerald-500/50"
            )}>
                <Handle
                    type="target"
                    position={Position.Top}
                    className="!bg-emerald-500 !w-3 !h-3 !border-slate-900 !-top-1.5"
                />

                {/* Header */}
                <div className="bg-emerald-950/20 px-3 py-2 border-b border-emerald-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-tight text-emerald-100">{data.label}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-emerald-500/10 text-emerald-500/40 hover:text-emerald-400"
                        onClick={handleOpenAnalysis}
                    >
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </div>

                {/* Body */}
                <div className="px-3 py-4 text-center">
                    <div className="text-[8px] text-emerald-500/60 uppercase font-black mb-1">{data.key}</div>
                    <div className="text-xl font-black text-white tracking-tighter">
                        {data.currentValue !== undefined ? `₾${data.currentValue.toLocaleString()}` : '—'}
                    </div>
                    {data.trend && (
                        <div className={cn(
                            "text-[9px] font-bold mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
                            data.trend === 'up' ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
                        )}>
                            <TrendingUp className={cn("h-2.5 w-2.5", data.trend === 'down' && "rotate-180")} />
                            {data.trend === 'up' ? '+2.4%' : '-1.5%'}
                        </div>
                    )}
                </div>

                {/* Output Handle */}
                <div className="relative h-4 bg-emerald-950/10 border-t border-emerald-900/20 flex items-center justify-center">
                    <span className="text-[7px] font-black text-emerald-600 tracking-[0.2em] uppercase">Value Out</span>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        className="!bg-emerald-500 !w-3 !h-3 !border-slate-900 !-bottom-1.5"
                    />
                </div>
            </div>
        </div>
    );
};
