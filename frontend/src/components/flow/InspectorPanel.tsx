import { X, Activity, Database, Brain, ShieldCheck, Play, Save, History, Braces, Terminal, Sliders, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface InspectorPanelProps {
    element: any; // Can be Node or Edge
    type: 'node' | 'edge';
    onClose: () => void;
    onUpdate?: (id: string, data: any) => void;
}

export function InspectorPanel({ element, type, onClose, onUpdate }: InspectorPanelProps) {
    if (!element) return null;

    const { data } = element;

    const renderHeader = () => {
        if (type === 'edge') {
            return (
                <div className="flex items-center gap-3 mb-1">
                    <Zap className="h-5 w-5 text-slate-400 rotate-90" />
                    <div>
                        <h2 className="text-lg font-bold text-white leading-none">Data Contract</h2>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">SYSTEM EDGE</p>
                    </div>
                </div>
            );
        }

        let icon = <Activity className="h-5 w-5 text-slate-400" />;
        let color = "text-slate-400";

        switch (data.kind || element.type) {
            case 'data':
                icon = <Database className="h-5 w-5 text-emerald-400" />;
                color = "text-emerald-400";
                break;
            case 'truthEngine':
                icon = <Terminal className="h-5 w-5 text-blue-400" />;
                color = "text-blue-400";
                break;
            case 'aiIntent':
            case 'ai':
                icon = <Brain className="h-5 w-5 text-purple-400" />;
                color = "text-purple-400";
                break;
            case 'governance':
                icon = <ShieldCheck className="h-5 w-5 text-amber-400" />;
                color = "text-amber-400";
                break;
        }

        return (
            <div className="flex items-center gap-3 mb-1">
                {icon}
                <div>
                    <h2 className="text-lg font-bold text-white leading-none">{data.label || 'Node Inspector'}</h2>
                    <p className={`text-[10px] font-mono uppercase tracking-wider ${color}`}>{data.kind || element.type} NODE</p>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-950/95 border-l border-slate-800 backdrop-blur-xl shadow-2xl w-[400px] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-start justify-between">
                {renderHeader()}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500 hover:text-white">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden min-h-0">
                <Tabs defaultValue="status" className="h-full flex flex-col">
                    <div className="px-4 pt-4">
                        <TabsList className="w-full grid grid-cols-3 bg-slate-900/50">
                            <TabsTrigger value="status" className="text-xs">Status</TabsTrigger>
                            <TabsTrigger value="config" className="text-xs">Tuning</TabsTrigger>
                            <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <TabsContent value="status" className="mt-0 space-y-4">
                            {/* GOVERNANCE ACTIONS */}
                            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-4 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Governance Control</h3>
                                    <Badge variant="outline" className="text-[10px] bg-slate-950 border-slate-800 uppercase px-2 py-0">Admin Lock</Badge>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10 transition-all hover:bg-red-500/10">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-red-400 uppercase tracking-tight">Deactivate Logic</p>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-medium">Bypass engine in path</p>
                                        </div>
                                        <Switch checked={data.disabled} onCheckedChange={(val) => onUpdate?.(element.id, { disabled: val })} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 transition-all hover:bg-amber-500/10">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-amber-400 uppercase tracking-tight">Lock Deterministic</p>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-medium">Force specific Truth path</p>
                                        </div>
                                        <Switch checked={data.locked} onCheckedChange={(val) => onUpdate?.(element.id, { locked: val })} />
                                    </div>
                                </div>
                            </div>

                            {/* DEEP METRICS & TRACES */}
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Terminal className="h-3 w-3" /> Runtime Analysis
                                </h3>

                                {type === 'edge' ? (
                                    <div className="space-y-3">
                                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                            <span className="text-[9px] text-slate-500 block uppercase font-black mb-2 tracking-widest">Data Flow Contract</span>
                                            <div className="font-mono text-[10px] text-emerald-400 space-y-1">
                                                <div className="flex justify-between"><span>Method:</span> <span>STOCHASTIC_GRPC</span></div>
                                                <div className="flex justify-between"><span>Frequency:</span> <span>Push Event</span></div>
                                                <div className="flex justify-between"><span>Integrity:</span> <span>CRC-64 Verified</span></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                                <span className="text-[8px] text-slate-500 block uppercase font-black">Latency</span>
                                                <span className="text-xs font-mono text-emerald-400 font-bold">{data.latency || '24ms'}</span>
                                            </div>
                                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                                <span className="text-[8px] text-slate-500 block uppercase font-black">Reliability</span>
                                                <span className="text-xs font-mono text-blue-400 font-bold">99.9%</span>
                                            </div>
                                        </div>

                                        {/* REASONING TRACE (AI NODES) */}
                                        {(data.kind === 'ai' || data.kind === 'aiIntent') && (
                                            <div className="bg-purple-950/20 rounded-xl p-3 border border-purple-500/20">
                                                <h4 className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">Neural Reasoning Trace</h4>
                                                <div className="text-[10px] text-purple-200/80 leading-relaxed font-medium italic border-l-2 border-purple-500/40 pl-3">
                                                    "Analyzing financial vector across {data.modelId}. Priority: High Variance Detection. Detected anomaly in Kakheti expansion ledger..."
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="config" className="mt-0 space-y-4">
                            {/* SCHEMA & TEMPLATE EXHIBITOR */}
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Technical Blueprint</span>
                                    <Braces className="h-3 w-3 text-slate-600" />
                                </div>
                                <div className="p-4 font-mono text-[10px] text-blue-300 leading-relaxed max-h-[300px] overflow-auto whitespace-pre">
                                    {type === 'edge' ? (
                                        JSON.stringify({
                                            payload_schema: {
                                                entity_id: "string",
                                                ledger_vector: "array<float>",
                                                timestamp: "iso8601"
                                            },
                                            policy: "retry_exponential_10",
                                            trigger: data.trigger || "EVENT_DRIVEN"
                                        }, null, 2)
                                    ) : (
                                        JSON.stringify({
                                            logic_hash: "0x892af2",
                                            entry_point: "py://engines/ledger.py",
                                            input_schema: { q: "string", opt: "boolean" },
                                            ...data
                                        }, null, 2)
                                    )}
                                </div>
                            </div>

                            {/* TUNING AREA */}
                            <div className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Confidence Threshold</label>
                                        <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30 text-purple-400">{(data.confidenceThreshold || 0.85) * 100}%</Badge>
                                    </div>
                                    <Slider defaultValue={[85]} max={100} step={1} className="w-full" />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="logs" className="mt-0">
                            <div className="space-y-2">
                                {['Processing request...', 'Validating schema schema_v2', 'Cache miss, fetching from origin', 'Transformation complete (24ms)'].map((log, i) => (
                                    <div key={i} className="flex gap-2 text-[10px] font-mono border-b border-slate-800/50 pb-2 last:border-0">
                                        <span className="text-slate-500">{new Date().toLocaleTimeString()}</span>
                                        <span className={i === 2 ? "text-amber-400" : "text-slate-300"}>{log}</span>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                    </ScrollArea>
                </Tabs>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="h-8 text-xs border-slate-700 hover:bg-slate-800 hover:text-white">
                    <History className="h-3.5 w-3.5 mr-2" /> History
                </Button>
                <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-white">
                    <Play className="h-3.5 w-3.5 mr-2" /> Re-Run
                </Button>
            </div>
        </div>
    );
}
