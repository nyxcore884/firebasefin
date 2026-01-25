import { useEffect, useState, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Zap,
    Brain,
    Activity,
    ShieldCheck,
    Settings2,
    Database,
    Search,
    RefreshCw,
    Play,
    Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFlowStore } from '@/hooks/useFlowStore';
import { useAppState } from '@/hooks/use-app-state';
import { FinSightNode, FinSightEdge, FinSightNodeData } from '@/types/flow';
import { cn } from '@/lib/utils';

// --- SYSTEM STUDIO COMPONENTS ---
import { TimelineScrubber } from '@/components/flow/TimelineScrubber';
import {
    DataLayerNode,
    TruthEngineNode,
    AiCognitiveNode, // Keep generic one if needed
    GovernanceNode,
    SystemZoneNode,
    AiIntentNode,
    AiToolExecutionNode,
    AiModelNode
} from '@/components/flow/CustomNodes';

import { SmartLineEdge } from '@/components/flow/CustomEdges';
import { InspectorPanel } from '@/components/flow/InspectorPanel';

const nodeTypes = {
    data: DataLayerNode,
    truthEngine: TruthEngineNode,
    ai: AiCognitiveNode,
    governance: GovernanceNode,
    systemZone: SystemZoneNode,
    aiIntent: AiIntentNode,
    aiToolExecution: AiToolExecutionNode,
    aiModel: AiModelNode
};

const edgeTypes = {
    smartLine: SmartLineEdge
};

const defaultEdgeOptions = {
    type: 'smartLine',
    animated: true,
};

const mockV2Nodes: FinSightNode[] = [
    // ZONES
    { id: 'zone-data', type: 'systemZone', position: { x: -50, y: 50 }, data: { kind: 'systemZone', label: 'Data & Memory Layer', zoneColor: 'emerald' }, style: { width: 350, height: 400 }, zIndex: -1 },
    { id: 'zone-truth', type: 'systemZone', position: { x: 350, y: 50 }, data: { kind: 'systemZone', label: 'Truth Engines', zoneColor: 'blue' }, style: { width: 350, height: 400 }, zIndex: -1 },
    { id: 'zone-ai', type: 'systemZone', position: { x: 750, y: 50 }, data: { kind: 'systemZone', label: 'AI Cognitive Layer', zoneColor: 'purple' }, style: { width: 550, height: 400 }, zIndex: -1 },
    { id: 'zone-gov', type: 'systemZone', position: { x: 1350, y: 50 }, data: { kind: 'systemZone', label: 'Governance & Output', zoneColor: 'amber' }, style: { width: 300, height: 400 }, zIndex: -1 },
    // NODES
    { id: 'fire-storage', type: 'data', position: { x: 20, y: 120 }, data: { kind: 'data', label: 'Ingestion Blobs', subType: 'storage', path: 'gs://ingestion', status: 'active' }, parentNode: 'zone-data', extent: 'parent' } as any,
    { id: 'fn-ledger', type: 'truthEngine', position: { x: 380, y: 280 }, data: { kind: 'truthEngine', label: 'Ledger Expansion', functionId: 'double_entry', status: 'running' } as any },
    { id: 'ai-intent', type: 'aiIntent', position: { x: 780, y: 150 }, data: { kind: 'aiIntent', label: 'Metric Analysis', confidence: 0.98, status: 'active' } },
    { id: 'ai-model', type: 'aiModel', position: { x: 1150, y: 150 }, data: { kind: 'aiModel', label: 'Gemini 1.5 Pro', model: 'vertex-ai', tokenUsage: 405, status: 'streaming' } }
];

export function FlowControllerPage({ standalone = true }: { standalone?: boolean }) {
    const {
        nodes: storeNodes,
        edges: storeEdges,
        saveFlow,
        loadFlow,
    } = useFlowStore();

    const [nodes, setNodes, onNodesChange] = useNodesState<FinSightNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<FinSightEdge>([]);

    const { selectedCompany } = useAppState();
    const [isLive, setIsLive] = useState(true);

    const companyId = selectedCompany;
    const flowId = 'main-controller';

    const [rfInstance, setRfInstance] = useState<any>(null);

    // Sync state with store
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (storeNodes.length > 0) {
            setNodes(storeNodes);
            setEdges(storeEdges);
        } else {
            // Fallback/Debug: If no nodes after 2s, show a debug node
            timer = setTimeout(() => {
                if (storeNodes.length === 0) {
                    console.warn("Using Mock V2 Data due to connection failure");
                    setNodes(mockV2Nodes);
                    // Force Fit View
                    setTimeout(() => {
                        window.requestAnimationFrame(() => {
                            rfInstance?.fitView({ padding: 0.2, duration: 800 });
                        });
                    }, 100);
                }
            }, 1500);
        }
        return () => clearTimeout(timer);
    }, [storeNodes, storeEdges, setNodes, setEdges, rfInstance]); // Added rfInstance dep

    // Load Flow from Firestore
    useEffect(() => {
        if (!companyId) return;
        const unsubscribe = loadFlow(companyId, flowId);

        // Safety fallback: if store remains empty after 1.5s, inject Mock V2
        const timer = setTimeout(() => {
            if (storeNodes.length === 0) {
                console.warn("Using Mock V2 Data due to connection failure");
                setNodes(mockV2Nodes);
            }
        }, 1500);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [companyId, flowId, loadFlow, storeNodes.length]); // Added dependency on length

    // Handle Node Click -> Open Inspector
    const [selectedElement, setSelectedElement] = useState<{ element: any; type: 'node' | 'edge' } | null>(null);
    const [activePath, setActivePath] = useState<{ nodes: string[]; edges: string[] }>({ nodes: [], edges: [] });

    const onNodeClick = useCallback((event: any, node: any) => {
        setSelectedElement({ element: node, type: 'node' });
    }, []);

    const onEdgeClick = useCallback((event: any, edge: any) => {
        setSelectedElement({ element: edge, type: 'edge' });
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedElement(null);
    }, []);

    const handleTimelineChange = useCallback((event: any) => {
        if (event) {
            setActivePath({ nodes: event.activeNodes, edges: event.activeEdges });
        } else {
            setActivePath({ nodes: [], edges: [] });
        }
    }, []);

    const currentData = selectedElement?.element?.data as FinSightNodeData;

    return (
        <div className={cn(
            "flex flex-col h-full w-full overflow-hidden relative font-sans text-foreground",
            standalone ? "bg-background rounded-xl border border-border shadow-2xl" : "bg-transparent"
        )}>
            {/* TOP BAR: SYSTEM STUDIO HEADER */}
            {standalone && (
                <header className="h-16 border-b border-border bg-background/95 backdrop-blur-xl px-6 flex items-center justify-between z-10 shadow-sm shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold text-foreground tracking-wide">SYSTEM STUDIO</h1>
                                    <p className="text-[10px] text-muted-foreground font-mono">ORCHESTRATION & INTELLIGENCE LAYER V2.2</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/50 border border-slate-800">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span> Data Layer
                                <span className="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 ml-2"></span> Truth Engines
                                <span className="h-2 w-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 ml-2"></span> AI Cognitive
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant={isLive ? "default" : "outline"}
                            className={isLive ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/50" : "text-slate-400"}
                            onClick={() => setIsLive(!isLive)}
                        >
                            {isLive ? <><Activity className="h-3 w-3 mr-2 animate-pulse" /> SYSTEM LIVE</> : <><Pause className="h-3 w-3 mr-2" /> PAUSED</>}
                        </Button>
                    </div>
                </header>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full min-h-0">
                {/* FLOW CANVAS WRAPPER + INSPECTOR SIDEBAR */}
                <main className="flex-1 relative flex w-full h-full min-h-0">
                    <div className="flex-1 relative h-full min-h-0 bg-background/50">
                        <ReactFlow
                            nodes={nodes.map(n => ({
                                ...n,
                                selected: n.selected || activePath.nodes.includes(n.id)
                            }))}
                            edges={edges.map(e => ({
                                ...e,
                                selected: e.selected || activePath.edges.includes(e.id),
                                data: { ...e.data, active: activePath.edges.includes(e.id) }
                            }))}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onNodeClick={onNodeClick}
                            onEdgeClick={onEdgeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            defaultEdgeOptions={defaultEdgeOptions}
                            onInit={setRfInstance}
                            fitView
                            className="bg-transparent"
                            style={{ width: '100%', height: '100%' }}
                        >
                            <Background color="#334155" gap={24} size={1} className="opacity-10" />
                            <Controls className="bg-slate-800 border-slate-700 fill-slate-300" />
                        </ReactFlow>

                        {/* DOCKED TIMELINE SCRUBBER */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
                            <TimelineScrubber onEventChange={handleTimelineChange} />
                        </div>
                    </div>

                    {/* INSPECTOR PANEL SLIDEOUT */}
                    {selectedElement && (
                        <div className="z-10 h-full">
                            <InspectorPanel
                                element={selectedElement.element}
                                type={selectedElement.type}
                                onClose={() => setSelectedElement(null)}
                                onUpdate={(id, updateData) => {
                                    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...updateData } } : n));
                                }}
                            />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
