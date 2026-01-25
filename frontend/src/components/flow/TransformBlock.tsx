import { Handle, Position } from '@xyflow/react';
import { FastForward, Settings, ArrowRight } from 'lucide-react';
import { TransformBlockData } from '@/types/flow';
import { cn } from '@/lib/utils';

export const TransformBlock = ({ data, selected }: { data: TransformBlockData, selected?: boolean }) => {
    return (
        <div className={cn(
            "min-w-[220px] shadow-premium rounded-xl bg-slate-900 border border-violet-900/50 transition-all overflow-hidden",
            selected && "ring-2 ring-violet-500 border-violet-500/50"
        )}>
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-violet-500 !w-3 !h-3 !border-slate-900 !-top-1.5"
            />

            {/* Header */}
            <div className="bg-violet-950/20 px-3 py-2 border-b border-violet-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FastForward className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[10px] font-black uppercase tracking-tight text-violet-100">{data.label}</span>
                </div>
                <div className="text-[8px] font-bold text-violet-400/50 uppercase tracking-widest">{data.operation}</div>
            </div>

            {/* Body */}
            <div className="px-3 py-3 space-y-3">
                {/* Simplified preview of transformation */}
                <div className="flex items-center justify-center gap-3 bg-black/30 p-2 rounded-lg border border-violet-900/20">
                    <div className="text-[9px] text-slate-500 font-bold">IN</div>
                    <ArrowRight className="h-3 w-3 text-violet-500" />
                    <div className="text-[9px] text-violet-300 font-black tracking-widest uppercase">{data.operation.replace('_', ' ')}</div>
                    <ArrowRight className="h-3 w-3 text-violet-500" />
                    <div className="text-[9px] text-slate-500 font-bold">OUT</div>
                </div>

                {data.preview?.count !== undefined && (
                    <div className="flex justify-between items-center text-[9px] font-bold px-1">
                        <span className="text-slate-500 uppercase">Processed</span>
                        <span className="text-violet-400">{data.preview.count.toLocaleString()} items</span>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <div className="relative h-4 bg-violet-950/10 border-t border-violet-900/20 flex items-center justify-center">
                <span className="text-[7px] font-black text-violet-600 tracking-[0.2em] uppercase">Dataset</span>
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!bg-violet-500 !w-3 !h-3 !border-slate-900 !-bottom-1.5"
                />
            </div>
        </div>
    );
};
