import { Handle, Position } from '@xyflow/react';
import { Workflow, ShieldAlert, BellRing, CheckSquare } from 'lucide-react';
import { WorkflowNodeData } from '@/types/flow';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const WorkflowNode = ({ data }: { data: WorkflowNodeData }) => {
    const navigate = useNavigate();

    const handleOpenAlerts = () => {
        navigate('/reports'); // Mapping to reports for now as per instructions (executive_alerts source)
    };

    const Icon = data.workflowType === 'anomaly_alert' ? BellRing :
        data.workflowType === 'approval' ? CheckSquare : Workflow;

    const statusColor = data.status === 'running' ? 'text-emerald-500 bg-emerald-500/10' :
        data.status === 'failed' ? 'text-rose-500 bg-rose-500/10' :
            data.status === 'disabled' ? 'text-slate-500 bg-slate-500/10' :
                'text-indigo-500 bg-indigo-500/10';

    return (
        <div className="px-5 py-4 shadow-premium rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-indigo-500/20 w-64 backdrop-blur-xl group hover:border-indigo-500/40 transition-all">
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-500 rounded-full" />

            <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-2 !h-2 !border-0" />

            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Operational Workflow</p>
                    <p className="text-xs font-bold text-foreground truncate">{data.label}</p>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center text-[9px] font-bold">
                    <span className="text-muted-foreground/60 uppercase">Status</span>
                    <span className={cn("px-1.5 py-0.5 rounded uppercase", statusColor)}>
                        {data.status || 'Idle'}
                    </span>
                </div>

                <div className="p-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center justify-between">
                    <span className="text-[9px] font-black text-muted-foreground/60 tracking-wider">GUARDRAIL</span>
                    <ShieldAlert className="h-3 w-3 text-indigo-500" />
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={handleOpenAlerts}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-[10px] font-black uppercase tracking-widest flex-1 gap-1.5 border-indigo-500/10 hover:bg-indigo-500/5"
                >
                    <BellRing className="h-3 w-3" /> View Alerts
                </Button>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-2 !h-2 !border-0" />
        </div>
    );
};
