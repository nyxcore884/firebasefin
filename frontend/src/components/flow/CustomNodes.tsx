import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
    Database,
    HardDrive,
    FileText,
    Zap,
    Activity,
    Brain,
    ShieldCheck,
    BarChart3,
    AlertTriangle,
    ScrollText,
    Server,
    Maximize2,
    X,
    Settings,
    UploadCloud,
    MessageSquare,
    Sparkles,
    Cpu,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- STYLES ---
const nodeBaseClass = "bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl overflow-hidden min-w-[280px] transition-all hover:border-slate-600";
const getDisabledClass = (disabled?: boolean) => disabled ? "opacity-30 grayscale pointer-events-none scale-[0.98]" : "";
const nodeHeaderClass = "px-4 py-3 border-b border-slate-800 flex items-center justify-between";
const nodeBodyClass = "p-4 space-y-4";
const labelClass = "text-[11px] font-black uppercase tracking-widest";

// --- COMPONENT: DATA LAYER NODE ---
export const DataLayerNode = ({ data, selected }: any) => (
    <div className={cn(nodeBaseClass, selected && "ring-2 ring-emerald-500 border-emerald-500", getDisabledClass(data.disabled))}>
        <div className={cn(nodeHeaderClass, "bg-emerald-950/40")}>
            <div className="flex items-center gap-2">
                <div className="relative">
                    {data.status === 'active' && <div className="absolute inset-0 bg-emerald-500 blur-sm animate-pulse rounded-full opacity-50" />}
                    {data.subType === 'storage' ? <HardDrive className="h-4 w-4 text-emerald-400 relative" /> : <Database className="h-4 w-4 text-emerald-400 relative" />}
                </div>
                <span className={cn(labelClass, "text-emerald-100 uppercase tracking-[0.2em]")}>{data.label || 'Data Source'}</span>
            </div>
            <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-emerald-600 animate-pulse" />
            </div>
        </div>
        <div className={nodeBodyClass}>
            <div className="bg-slate-900/40 rounded-xl p-3 border border-emerald-500/10 space-y-2 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Path</span>
                    <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[150px]">{data.path}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Records</span>
                    <span className="text-[10px] font-mono text-white font-bold">{data.recordCount?.toLocaleString() || '12.4k'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-emerald-500/5 pt-2 mt-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Sync Mode</span>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 rounded uppercase tracking-widest">Live Flow</span>
                </div>
            </div>
        </div>
        <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-3 !h-3 !border-slate-900" />
        <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-3 !h-3 !border-slate-900" />
    </div>
);

// --- COMPONENT: TRUTH ENGINE NODE ---
export const TruthEngineNode = ({ data, selected }: any) => (
    <div className={cn(
        nodeBaseClass,
        "border-blue-500/20 bg-slate-950/80 shadow-[0_0_20px_rgba(59,130,246,0.05)]",
        selected && "ring-2 ring-blue-500 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]",
        getDisabledClass(data.disabled)
    )}>
        <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-3 !h-3 !border-slate-900" />
        <div className={cn(nodeHeaderClass, "bg-blue-950/40")}>
            <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-500/10 border border-blue-500/30">
                    <Zap className="h-4 w-4 text-blue-400" />
                </div>
                <span className={cn(labelClass, "text-blue-100 uppercase tracking-[0.2em]")}>{data.label || 'Truth Engine'}</span>
            </div>
            <div className="flex gap-1">
                <div className="h-1 w-3 bg-blue-500/40 rounded-full" />
                <div className="h-1 w-3 bg-blue-500/20 rounded-full" />
            </div>
        </div>
        <div className={nodeBodyClass}>
            <div className="bg-slate-900/40 rounded-xl p-3 border border-blue-500/10 space-y-3 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-blue-400 uppercase px-2 py-0.5 bg-blue-500/15 rounded-full border border-blue-500/20 tracking-widest">
                        {data.functionId || 'CORE_LOGIC'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-black">Latency</span>
                        <span className="text-[11px] text-blue-300 font-mono font-bold">{data.batchTime || '14ms'}</span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                        <span className="text-[8px] text-slate-500 block uppercase font-black">Reliability</span>
                        <span className="text-[11px] text-emerald-400 font-mono font-bold">99.9%</span>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-500/5">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Logic Status</span>
                    <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-mono text-emerald-500 tracking-widest uppercase">SYMMETRIC</span>
                    </div>
                </div>
            </div>
        </div>
        <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-3 !h-3 !border-slate-900" />
    </div>
);

// --- COMPONENT: AI COGNITIVE NODE ---
export const AiCognitiveNode = ({ data, selected }: any) => (
    <div className={cn(
        nodeBaseClass,
        "border-purple-500/30 bg-slate-950/80 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
        selected && "ring-2 ring-purple-500 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]",
        getDisabledClass(data.disabled)
    )}>
        <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-3 !h-3 !border-slate-900" />
        <div className={cn(nodeHeaderClass, "bg-purple-950/40")}>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-sm animate-pulse rounded-full" />
                    <Brain className="h-4 w-4 text-purple-400 relative" />
                </div>
                <span className={cn(labelClass, "text-purple-100 uppercase tracking-[0.2em]")}>{data.label || 'AI Model'}</span>
            </div>
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
        </div>
        <div className={nodeBodyClass}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", data.status === 'thinking' ? "bg-amber-400 animate-ping" : "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]")} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{data.status}</span>
                </div>
                <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase">{data.modelId}</span>
            </div>

            {data.lastIdea && (
                <div className="bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 p-2.5 rounded-xl backdrop-blur-sm">
                    <p className="text-[10px] text-purple-200/90 italic leading-relaxed font-medium">"{data.lastIdea}"</p>
                </div>
            )}

            <div className="flex gap-1 flex-wrap mt-2">
                {data.toolRegistry?.map((tool: string) => (
                    <span key={tool} className="text-[8px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        {tool}
                    </span>
                ))}
            </div>
        </div>
        <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-3 !h-3 !border-slate-900" />
    </div>
);

// --- COMPONENT: SYSTEM ZONE NODE (GROUP) ---
export const SystemZoneNode = ({ data, selected }: any) => {
    const colorMap = {
        emerald: 'border-emerald-500/30 bg-emerald-950/10',
        blue: 'border-blue-500/30 bg-blue-950/10',
        purple: 'border-purple-500/30 bg-purple-950/10',
        amber: 'border-amber-500/30 bg-amber-950/10'
    };
    const style = colorMap[data.zoneColor as keyof typeof colorMap] || colorMap.blue;

    return (
        <div className={cn("rounded-3xl border-2 transition-all p-6 min-w-[300px] min-h-[300px]", style, selected && "ring-2 ring-white/20")}>
            <div className="absolute -top-4 left-6 bg-[#020617] px-3 py-1 rounded-full border border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {data.label}
                </span>
            </div>
        </div>
    );
};

// --- COMPONENT: AI INTENT NODE ---
export const AiIntentNode = ({ data, selected }: any) => (
    <div className={cn("bg-[#0f172a] border border-purple-500/50 rounded-full px-4 py-2 shadow-xl flex items-center gap-3 min-w-[200px]", selected && "ring-2 ring-purple-500", getDisabledClass(data.disabled))}>
        <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-2 !h-2" />
        <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-purple-400" />
        </div>
        <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase block">Intent Detected</span>
            <span className="text-[11px] font-black text-white">{data.label}</span>
        </div>
        <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-2 !h-2" />
    </div>
);

// --- COMPONENT: AI TOOL NODE ---
export const AiToolExecutionNode = ({ data, selected }: any) => (
    <div className={cn("bg-[#0f172a] border border-blue-400/50 rounded-lg px-3 py-2 shadow-xl flex items-center gap-3 min-w-[220px]", selected && "ring-2 ring-blue-500", getDisabledClass(data.disabled))}>
        <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />
        <div className="h-6 w-6 rounded bg-blue-500/20 flex items-center justify-center">
            <Settings className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Tool Execution</span>
                <span className="text-[8px] font-mono text-emerald-400">{data.duration || '120ms'}</span>
            </div>
            <span className="text-[10px] font-mono text-blue-100 block truncate">{data.toolName}</span>
        </div>
        <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-2 !h-2" />
    </div>
);

// --- COMPONENT: AI MODEL NODE ---
export const AiModelNode = ({ data, selected }: any) => (
    <div className={cn(nodeBaseClass, selected && "ring-2 ring-purple-500 border-purple-500", getDisabledClass(data.disabled))}>
        <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-3 !h-3 !border-slate-900" />
        <div className={cn(nodeHeaderClass, "bg-purple-950/30")}>
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className={cn(labelClass, "text-purple-100")}>{data.label}</span>
            </div>
            <div className={cn("h-2 w-2 rounded-full", data.status === 'streaming' ? "bg-emerald-500 animate-pulse" : "bg-purple-500")} />
        </div>
        <div className={nodeBodyClass}>
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Model</span>
                <span className="text-[10px] font-mono text-white">{data.model}</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800/50">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 uppercase">Token Usage</span>
                    <span className="text-[10px] font-mono text-purple-400">{data.tokenUsage}</span>
                </div>
            </div>
        </div>
        <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-3 !h-3 !border-slate-900" />
    </div>
);

// --- COMPONENT: GOVERNANCE NODE ---
export const GovernanceNode = ({ data, selected }: any) => (
    <div className={cn(nodeBaseClass, selected && "ring-2 ring-amber-500 border-amber-500", getDisabledClass(data.disabled))}>
        <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-3 !h-3 !border-slate-900" />
        <div className={cn(nodeHeaderClass, "bg-amber-950/30")}>
            <div className="flex items-center gap-2">
                {data.type === 'dashboard' ? <BarChart3 className="h-4 w-4 text-amber-500" /> : <ShieldCheck className="h-4 w-4 text-amber-500" />}
                <span className={cn(labelClass, "text-amber-100")}>{data.label || 'Governance'}</span>
            </div>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        </div>
        <div className={nodeBodyClass}>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 flex items-center justify-between">
                <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Target ID</span>
                    <span className="text-[10px] text-white font-mono">{data.targetId}</span>
                </div>
                <div className="text-right">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Alerts</span>
                    <span className="text-lg font-black text-amber-500">{data.alertCount || 0}</span>
                </div>
            </div>
            <div className="flex items-center justify-between px-1">
                <span className="text-[9px] text-slate-600 font-bold uppercase">Last Audit</span>
                <span className="text-[9px] text-slate-400">{data.lastAuditAt || 'Pending'}</span>
            </div>
        </div>
    </div>
);
