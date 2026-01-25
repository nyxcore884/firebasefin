import { useEffect, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    Panel,
} from '@xyflow/react';
import {
    Workflow,
    Save,
    Play,
    Settings2,
    RefreshCw,
    Search,
    LayoutDashboard,
    Database,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFlowStore } from '@/hooks/useFlowStore';
import { useAppState } from '@/hooks/use-app-state';

// Import custom nodes
import { DataBlock } from '@/components/flow/DataNode';
import { MetricBlock } from '@/components/flow/MetricNode';
import { AiToolNode } from '@/components/flow/AiToolNode';
import { WorkflowNode } from '@/components/flow/WorkflowNode';
import { TableNode } from '@/components/flow/TableNode';

const nodeTypes = {
    dataNode: DataBlock,
    metricNode: MetricBlock,
    aiToolNode: AiToolNode,
    workflowNode: WorkflowNode,
    tableNode: TableNode,
};

const ControllerPage = () => {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        saveFlow,
        loadFlow,
    } = useFlowStore();

    const {
        selectedCompany,
        selectedPeriod,
        selectedDepartment
    } = useAppState();

    const [mode, setMode] = useState<'controller' | 'data_model'>('controller');
    const [isSyncing, setIsSyncing] = useState(false);

    // Use global state
    const companyId = selectedCompany;
    const flowId = mode === 'controller' ? 'main-controller' : 'data-lineage';

    useEffect(() => {
        const unsubscribe = loadFlow(companyId, flowId);
        return () => unsubscribe();
    }, [loadFlow, companyId, flowId]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const truthEngineUrl = (import.meta as any).env?.VITE_TRUTH_ENGINE_URL || 'https://us-central1-studio-9381016045-4d625.cloudfunctions.net/process-transaction';
            const response = await fetch(`${truthEngineUrl}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'run_flow',
                    company_id: companyId,
                    flowId: flowId,
                    nodes: nodes,
                    edges: edges,
                    context: {
                        entityId: companyId,
                        period: selectedPeriod,
                        dept: selectedDepartment
                    }
                })
            });

            if (response.ok) {
                toast.success('Truth Engine Synchronized');
            } else {
                toast.error('Sync Failed');
            }
        } catch (error) {
            console.error('Flow sync error:', error);
            toast.error('Sync Failed');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] w-full">
            {/* TOOLBAR */}
            <div className="h-16 border-b border-primary/10 flex items-center justify-between px-6 bg-background/40 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary shadow-inner">
                        <Workflow className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-foreground">
                            {mode === 'controller' ? 'Flow Controller' : 'Data Lineage'}
                        </h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                            Visual Orchestration Layer v1.2
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/50">
                    <Button
                        variant={mode === 'controller' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn("h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2", mode === 'controller' && "bg-background shadow-sm")}
                        onClick={() => setMode('controller')}
                    >
                        <Zap className="h-3 w-3" /> Controller
                    </Button>
                    <Button
                        variant={mode === 'data_model' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn("h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2", mode === 'data_model' && "bg-background shadow-sm")}
                        onClick={() => setMode('data_model')}
                    >
                        <Database className="h-3 w-3" /> Data Model
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={saveFlow}
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-xl border-primary/10 bg-background/40 hover:bg-muted text-[10px] font-black uppercase tracking-widest gap-2"
                    >
                        <Save className="h-3.5 w-3.5" /> Save State
                    </Button>
                    <Button
                        size="sm"
                        className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
                        onClick={handleSync}
                        disabled={isSyncing}
                    >
                        {isSyncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Deploy Flow
                    </Button>
                </div>
            </div>

            {/* CANVAS */}
            <div className="flex-1 relative bg-silver-gradient dark:bg-slate-950/20 m-4 rounded-[2rem] border border-primary/10 overflow-hidden shadow-premium">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-transparent"
                >
                    <Background color="hsl(var(--primary))" variant={'dots' as any} gap={20} size={1} style={{ opacity: 0.1 } as any} />
                    <Controls className="bg-background/80 border-border rounded-xl overflow-hidden shadow-2xl" />

                    <Panel position="top-left" className="m-4">
                        <div className="bg-background/80 backdrop-blur-md p-1 rounded-xl border border-border shadow-lg flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/5">
                                <Search className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/5">
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </Panel>

                    {/* HUD OVERLAY */}
                    <Panel position="bottom-right" className="m-4">
                        <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-primary/10 shadow-2xl flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Truth Engine Online</span>
                            </div>
                            <div className="h-4 w-px bg-border" />
                            <div className="text-[10px] font-bold text-muted-foreground">Flow Latency: 12ms</div>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
};

export default ControllerPage;

