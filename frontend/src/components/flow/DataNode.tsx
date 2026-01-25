import { Handle, Position } from '@xyflow/react';
import { Database, Info, ExternalLink } from 'lucide-react';
import { DataBlockData } from '@/types/flow';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const DataBlock = ({ data, selected }: { data: DataBlockData, selected?: boolean }) => {
    const navigate = useNavigate();
    const hasError = !!data.preview?.error;

    const handleOpenDataHub = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('/datahub');
    };

    return (
        <div style={{ width: 200, height: 120 }}>
            <div className={cn(
                "min-w-[200px] shadow-premium rounded-xl bg-slate-900 border border-slate-700 transition-all overflow-hidden",
                selected && "ring-2 ring-primary border-primary/50",
                hasError && "border-rose-500 ring-1 ring-rose-500"
            )}>
                {/* Header */}
                <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-200">{data.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-blue-500/10 text-blue-500/40 hover:text-blue-400"
                            onClick={handleOpenDataHub}
                        >
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                        {hasError && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-3.5 w-3.5 text-rose-500" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-rose-950 border-rose-500 text-rose-100 text-[10px]">
                                        {data.preview?.error}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="px-3 py-3 space-y-2">
                    <div className="flex items-center justify-between text-[9px]">
                        <span className="text-slate-500 uppercase font-bold">Source</span>
                        <span className="text-blue-400 font-mono">{data.collection}</span>
                    </div>

                    {data.preview && (
                        <div className="bg-black/20 rounded-lg p-2 border border-slate-800/50">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] text-slate-500 uppercase font-black">Output Preview</span>
                                <span className="text-[8px] text-emerald-500 font-bold">{data.preview.count?.toLocaleString()} rows</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                {[1, 2, 3].map(i => <div key={i} className="h-0.5 rounded-full bg-slate-700" />)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Output Handle */}
                <div className="relative h-4 bg-slate-800/20 border-t border-slate-800/50 flex items-center justify-center">
                    <span className="text-[7px] font-black text-slate-600 tracking-[0.2em] uppercase">Output</span>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        className="!bg-blue-500 !w-3 !h-3 !border-slate-900 !-bottom-1.5"
                    />
                </div>
            </div>
        </div>
    );
};
