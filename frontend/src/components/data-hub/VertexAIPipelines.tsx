import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Play, Loader2, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAppState } from '@/hooks/use-app-state';

export default function VertexAIPipelines() {
    const { selectedCompany } = useAppState();
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pipelineStatus, setPipelineStatus] = useState<'IDLE' | 'TRAINING' | 'COMPLETED'>('IDLE');

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/process-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ml_config', sub_action: 'get', company_id: selectedCompany })
            });
            const data = await res.json();
            if (data.status === 'success') setConfig(data.config);
        } catch (e) {
            console.error("ML Config Fetch Error", e);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, [selectedCompany]);

    const runPipeline = async () => {
        setLoading(true);
        setPipelineStatus('TRAINING');
        const toastId = toast.loading("Initiating Vertex AI Pipeline Job...");

        try {
            const res = await fetch('/api/process-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ml_config', sub_action: 'trigger', company_id: selectedCompany })
            });
            const data = await res.json();

            if (data.status === 'success') {
                toast.success("Pipeline Executed Successfully", { id: toastId });
                setPipelineStatus('COMPLETED');
                setConfig((prev: any) => ({
                    ...prev,
                    training_metrics: data.updated_metrics,
                    status: 'IDLE'
                }));
                setTimeout(() => setPipelineStatus('IDLE'), 3000);
            }
        } catch (e) {
            toast.error("Pipeline job failed to initiate.", { id: toastId });
            setPipelineStatus('IDLE');
        } finally {
            setLoading(false);
        }
    };

    const metrics = config?.training_metrics || {
        accuracy_score: 0.94,
        feature_importance: [
            { feature: "Historical Spend", weight: 0.45 },
            { feature: "Seasonality", weight: 0.30 },
            { feature: "Market Sentiment", weight: 0.15 },
            { feature: "Growth Trends", weight: 0.10 }
        ]
    };

    return (
        <Card className="glass-card border-indigo-500/20">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-400" />
                        <CardTitle className="text-lg">Vertex AI Pipelines (XAI)</CardTitle>
                    </div>
                    <Badge variant={pipelineStatus === 'TRAINING' ? 'default' : 'outline'} className={pipelineStatus === 'TRAINING' ? 'bg-indigo-500 animate-pulse' : ''}>
                        {pipelineStatus}
                    </Badge>
                </div>
                <CardDescription className="text-xs">Continuous Financial Learning & Managed Orchestration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {/* Pipeline Controls */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Managed Training Job</h4>
                        <p className="text-[10px] text-slate-400">Model: Finance-LMM-v4 (Optimized for Revenue)</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={runPipeline}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 h-8 gap-2"
                    >
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        Trigger Pipeline
                    </Button>
                </div>

                {/* XAI: Feature Attributions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3" />
                            XAI: Feature Attributions
                        </h4>
                        <span className="text-xs font-mono text-emerald-400">Score: {metrics.accuracy_score * 100}%</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {metrics.feature_importance.map((feat: any, i: number) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-300">{feat.feature}</span>
                                    <span className="text-muted-foreground font-mono">{(feat.weight * 100).toFixed(0)}%</span>
                                </div>
                                <Progress value={feat.weight * 100} className="h-1 bg-white/5" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg flex items-start gap-3">
                    <Info className="h-4 w-4 text-indigo-400 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                        <strong>Explainability Note:</strong> "Feature weights are recalculated after every pipeline run. High emphasis on 'Historical Spend' indicates the model is prioritizing verifiable audit trails over speculative projections."
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
