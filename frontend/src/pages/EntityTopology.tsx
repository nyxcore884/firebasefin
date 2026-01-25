import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    Node,
    Edge,
    Connection,
    addEdge,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    ZoomIn,
    ZoomOut,
    Maximize,
    Briefcase,
    Building2,
    Factory,
    RefreshCw
} from 'lucide-react';
import { useAppState, translations } from '@/hooks/use-app-state';
import { toast } from 'sonner';

// Custom Node Types
const EntityNode = ({ data }: { data: any }) => (
    <div className={`px-4 py-3 shadow-lg rounded-xl border-2 min-w-[180px] bg-card/90 backdrop-blur-md transition-all duration-300 hover:scale-105 ${data.isRoot ? 'border-primary shadow-primary/20' : 'border-border'
        }`}>
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${data.type === 'HQ' ? 'bg-primary/20 text-primary' :
                data.type === 'Subsidiary' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-emerald-500/20 text-emerald-500'
                }`}>
                {data.type === 'HQ' ? <Building2 size={16} /> :
                    data.type === 'Subsidiary' ? <Briefcase size={16} /> :
                        <Factory size={16} />}
            </div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{data.type}</div>
                <div className="font-bold text-sm">{data.label}</div>
            </div>
        </div>

        {/* Metrics Badge */}
        {data.metric && (
            <div className="mt-2 flex justify-between items-center bg-muted/50 p-1.5 rounded text-xs">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-mono font-bold">₾{data.metric}M</span>
            </div>
        )}

        {/* Status Indicator */}
        <div className="absolute -top-1 -right-1">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
        </div>

        <div className="mt-2 flex gap-1 justify-end">
            <Badge variant="outline" className="text-[10px] h-5">ID: {data.id}</Badge>
        </div>
    </div>
);

const nodeTypes = {
    entity: EntityNode,
};

const EntityTopology = () => {
    const { language, selectedCompany } = useAppState();
    const t = translations[language];
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHierarchy = async () => {
            setLoading(true);
            try {
                // Fetch data for all companies
                const res = await fetch('/api/process-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'companies' })
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const text = await res.text();
                // If empty body, use empty object (which fails the check below gracefully)
                const data = text ? JSON.parse(text) : {};

                if (data.status === 'success' && data.companies) {
                    const companies = data.companies;

                    // Build parent node
                    const parentNode: Node = {
                        id: 'PARENT',
                        type: 'entity',
                        position: { x: 400, y: 50 },
                        data: {
                            id: 'SGG-GROUP',
                            label: 'SOCAR Global Group',
                            revenue: companies.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0),
                            flux: companies.reduce((sum: number, c: any) => sum + (c.flux || 0), 0),
                            isParent: true,
                            isRoot: true,
                            type: 'HQ'
                        },
                    };

                    // Build child nodes
                    const childNodes: Node[] = companies.map((company: any, idx: number) => ({
                        id: company.id,
                        type: 'entity',
                        position: { x: 100 + (idx * 300), y: 250 },
                        data: {
                            id: company.id,
                            label: company.name || company.id,
                            revenue: company.revenue || Math.floor(Math.random() * 10000000),
                            flux: company.flux || Math.floor((Math.random() - 0.3) * 500000),
                            isParent: false,
                            metric: (company.revenue / 1000000).toFixed(1),
                            type: 'Subsidiary'
                        },
                    }));

                    // Build edges
                    const newEdges: Edge[] = companies.map((company: any) => ({
                        id: `e-parent-${company.id}`,
                        source: 'PARENT',
                        target: company.id,
                        animated: true,
                        style: { stroke: '#6366f1', strokeWidth: 2 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
                    }));

                    setNodes([parentNode, ...childNodes]);
                    setEdges(newEdges);
                }
            } catch (error) {
                console.error("Failed to fetch topology:", error);
                toast.error("Failed to load entity topology");
            } finally {
                setLoading(false);
            }
        };

        fetchHierarchy();
    }, []);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="h-full w-full">
            <Card className="h-full border-0 bg-transparent shadow-none relative">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                        {nodes.length} Active Nodes
                    </Badge>
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-emerald-500 border-emerald-500/20">
                        <Activity size={12} className="mr-1" /> Live Sync
                    </Badge>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-4">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Mapping Corporate Topology...</p>
                        </div>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-slate-50 dark:bg-slate-950/50"
                    >
                        <Background color="#94a3b8" gap={20} size={1} className="opacity-5" />
                        <Controls />
                        <MiniMap
                            nodeStrokeColor={(n) => {
                                if (n.type === 'input') return '#0041d0';
                                if (n.type === 'output') return '#ff0072';
                                if (n.type === 'default') return '#1a192b';
                                return '#eee';
                            }}
                            nodeColor={(n) => {
                                if (n.style?.background) return n.style.background as string;
                                return '#fff';
                            }}
                            nodeBorderRadius={2}
                            className="bg-background border-border"
                            maskColor="rgba(0, 0, 0, 0.1)"
                        />
                        <Panel position="top-right" className="bg-background/80 backdrop-blur rounded-lg border p-2 shadow-sm">
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toast.info("Zoom in")}>
                                    <ZoomIn size={16} />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toast.info("Zoom out")}>
                                    <ZoomOut size={16} />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toast.info("Fit view")}>
                                    <Maximize size={16} />
                                </Button>
                            </div>
                        </Panel>
                    </ReactFlow>
                )}
            </Card>
        </div>
    );
};

export default EntityTopology;
