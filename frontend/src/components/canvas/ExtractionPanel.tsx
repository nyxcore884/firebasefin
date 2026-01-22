import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, GripVertical, CheckCircle2, AlertCircle, Library } from 'lucide-react';

const extractedEntities = [
    { id: '1', type: 'kpi', label: 'Total Revenue', value: '$4.2M', confidence: 0.98 },
    { id: '2', type: 'kpi', label: 'Gas Loss Rate', value: '1.2%', confidence: 0.95 },
    { id: '3', type: 'kpi', label: 'EBITDA (Proj)', value: '$1.1M', confidence: 0.89 },
    { id: '4', type: 'chart', label: 'Monthly Variance', description: 'Gas Balance vs Budget', confidence: 0.92 },
    { id: '5', type: 'chart', label: 'OpEx Distribution', description: 'By Cost Center', confidence: 0.96 },
];

const ExtractionPanel = ({ onDragStart }: { onDragStart: (event: React.DragEvent, nodeType: string, payload: any) => void }) => {
    return (
        <div className="w-80 h-full border-r bg-background flex flex-col">
            <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Library className="h-4 w-4 text-primary" />
                    Report Assets
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Available Insights from <span className="font-medium text-foreground">Financial Engine</span></p>
                <div className="mt-2 text-[10px] flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded w-fit">
                    <CheckCircle2 className="h-3 w-3" /> 5 Insights Ready
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KPIs & Metrics</h4>
                        {extractedEntities.filter(e => e.type === 'kpi').map((entity) => (
                            <div
                                key={entity.id}
                                draggable
                                onDragStart={(event) => onDragStart(event, 'metricNode', entity)}
                                className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-grab active:cursor-grabbing transition-colors shadow-sm"
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium leading-none">{entity.label}</p>
                                    <p className="text-xs font-bold mt-1 text-primary">{entity.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visualizations</h4>
                        {extractedEntities.filter(e => e.type === 'chart').map((entity) => (
                            <div
                                key={entity.id}
                                draggable
                                onDragStart={(event) => onDragStart(event, 'chartNode', entity)}
                                className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-grab active:cursor-grabbing transition-colors shadow-sm"
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium leading-none">{entity.label}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{entity.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default ExtractionPanel;
