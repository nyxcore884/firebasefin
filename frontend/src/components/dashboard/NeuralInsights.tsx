
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/use-app-state';
import { toast } from 'sonner';

interface Anomaly {
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    amount?: number;
    rule?: string;
}

export default function NeuralInsights() {
    const { selectedCompany, selectedPeriod } = useAppState();
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/truth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity: selectedCompany,
                    period: selectedPeriod
                })
            });
            const data = await res.json();

            if (data.anomalies) {
                // Ensure severity is typed correctly or fallback
                const safeAnomalies = data.anomalies.map((a: any) => ({
                    ...a,
                    severity: ['low', 'medium', 'high', 'critical'].includes(a.severity) ? a.severity : 'medium'
                }));
                setAnomalies(safeAnomalies);
            }
        } catch (e) {
            console.error("Failed to fetch neural insights", e);
            toast.error("Failed to sync Neural Insights");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [selectedCompany, selectedPeriod]);

    return (
        <Card className="glass-card h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">Neural Insights</CardTitle>
                            <CardDescription className="text-xs">Live anomaly detection stream</CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={fetchInsights}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {anomalies.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                        <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                        <span className="text-xs">No anomalies detected</span>
                    </div>
                )}

                {anomalies.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "group p-3 rounded-lg border backdrop-blur-sm transition-all hover:scale-[1.02] cursor-pointer",
                            item.severity === 'critical' ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50" :
                                item.severity === 'high' ? "bg-orange-950/20 border-orange-500/30 hover:border-orange-500/50" :
                                    "bg-slate-900/40 border-white/10 hover:border-white/20"
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] px-1.5 py-0 border-0",
                                    item.severity === 'critical' ? "bg-rose-500/20 text-rose-400" :
                                        item.severity === 'high' ? "bg-orange-500/20 text-orange-400" :
                                            "bg-blue-500/20 text-blue-400"
                                )}
                            >
                                {item.severity.toUpperCase()}
                            </Badge>
                            <span className="text-[10px] text-slate-500">Just now</span>
                        </div>

                        <p className="text-sm font-medium text-slate-200 leading-tight">
                            {item.description}
                        </p>

                        {item.amount && (
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500">Impact</span>
                                <span className="text-xs font-mono text-slate-300">
                                    ₾{item.amount.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
