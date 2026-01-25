import { Handle, Position } from '@xyflow/react';
import { Table, Database, User, ShieldCheck } from 'lucide-react';
import { TableNodeData } from '@/types/flow';

export const TableNode = ({ data }: { data: TableNodeData }) => {
    return (
        <div className="px-0 py-0 shadow-premium rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-64 overflow-hidden group hover:border-slate-400 dark:hover:border-slate-600 transition-all">
            <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2 !border-0" />

            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Table className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-black uppercase tracking-tight text-foreground truncate">{data.label}</span>
            </div>

            <div className="p-0">
                {data.schema.slice(0, 5).map((field, i) => (
                    <div key={i} className="px-4 py-1.5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                        <span className="text-[10px] font-medium text-foreground">{field.field}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 dark:bg-slate-800 px-1 rounded">
                            {field.type}
                        </span>
                    </div>
                ))}
                {data.schema.length > 5 && (
                    <div className="px-4 py-1 text-center bg-slate-50/50 dark:bg-slate-800/20">
                        <span className="text-[8px] font-black text-slate-400 uppercase">+{data.schema.length - 5} more fields</span>
                    </div>
                )}
            </div>

            <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <User className="h-2.5 w-2.5 text-slate-400" />
                    <span className="text-[8px] font-bold text-slate-500 uppercase">{data.owner || 'System'}</span>
                </div>
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2 !border-0" />
        </div>
    );
};
