import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    BrainCircuit,
    ThumbsUp,
    ThumbsDown,
    Save,
    MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/use-app-state';

interface Correction {
    id: string;
    query: string;
    originalResponse: string;
    correctedResponse: string;
    status: 'pending' | 'applied' | 'rejected';
    timestamp: string;
}

export default function LearningMode() {
    const { selectedCompany } = useAppState();
    const [corrections, setCorrections] = useState<Correction[]>([
        {
            id: 'corr-1',
            query: 'Show IT budget variance',
            originalResponse: 'IT budget is over by 5%',
            correctedResponse: 'IT budget is over by 12.5% due to cloud migration costs',
            status: 'applied',
            timestamp: '2 days ago'
        },
        {
            id: 'corr-2',
            query: 'Explain marketing anomaly',
            originalResponse: 'No anomaly detected',
            correctedResponse: 'Campaign X exceeded budget by 25% - approved by CFO',
            status: 'pending',
            timestamp: '1 hour ago'
        }
    ]);

    const [newCorrection, setNewCorrection] = useState({
        query: '',
        correctedResponse: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitCorrection = async () => {
        if (!newCorrection.query.trim() || !newCorrection.correctedResponse.trim()) {
            toast.warning('Please provide both query and correction');
            return;
        }

        setIsSubmitting(true);
        try {
            // In production, this would call the backend to store the correction
            const res = await fetch('/api/process-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ml_config',
                    sub_action: 'update',
                    company_id: selectedCompany,
                    config: {
                        corrections: [{
                            query: newCorrection.query,
                            correction: newCorrection.correctedResponse,
                            timestamp: new Date().toISOString()
                        }]
                    }
                })
            });

            const newEntry: Correction = {
                id: `corr-${Date.now()}`,
                query: newCorrection.query,
                originalResponse: 'AI Response',
                correctedResponse: newCorrection.correctedResponse,
                status: 'pending',
                timestamp: 'Just now'
            };

            setCorrections([newEntry, ...corrections]);
            setNewCorrection({ query: '', correctedResponse: '' });
            toast.success('Correction submitted for training');
        } catch (e) {
            toast.error('Failed to submit correction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const applyCorrection = (id: string) => {
        setCorrections(prev => prev.map(c =>
            c.id === id ? { ...c, status: 'applied' } : c
        ));
        toast.success('Correction applied to model');
    };

    const rejectCorrection = (id: string) => {
        setCorrections(prev => prev.map(c =>
            c.id === id ? { ...c, status: 'rejected' } : c
        ));
        toast.info('Correction rejected');
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <BrainCircuit className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                            <CardTitle>Learning Mode</CardTitle>
                            <CardDescription>Train MURTAZI by correcting AI responses</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* New Correction Form */}
                    <div className="space-y-4 p-4 rounded-lg border border-white/10 bg-white/5">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Submit a Correction
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Query or Context</label>
                                <Textarea
                                    placeholder="What was the query or context?"
                                    value={newCorrection.query}
                                    onChange={(e) => setNewCorrection(prev => ({ ...prev, query: e.target.value }))}
                                    className="bg-muted/20 resize-none h-20"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Correct Response</label>
                                <Textarea
                                    placeholder="What should the AI have said?"
                                    value={newCorrection.correctedResponse}
                                    onChange={(e) => setNewCorrection(prev => ({ ...prev, correctedResponse: e.target.value }))}
                                    className="bg-muted/20 resize-none h-20"
                                />
                            </div>
                            <Button
                                onClick={submitCorrection}
                                disabled={isSubmitting}
                                className="w-full"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Submit for Training
                            </Button>
                        </div>
                    </div>

                    {/* Corrections History */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Correction History</h4>
                        {corrections.map((correction) => (
                            <div
                                key={correction.id}
                                className={cn(
                                    "p-4 rounded-lg border transition-colors",
                                    correction.status === 'applied' ? "border-emerald-500/20 bg-emerald-500/5" :
                                        correction.status === 'rejected' ? "border-rose-500/20 bg-rose-500/5" :
                                            "border-white/10 bg-white/5"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{correction.query}</p>
                                        <p className="text-xs text-muted-foreground line-through">{correction.originalResponse}</p>
                                        <p className="text-xs text-emerald-400">{correction.correctedResponse}</p>
                                    </div>
                                    <Badge
                                        variant={
                                            correction.status === 'applied' ? 'default' :
                                                correction.status === 'rejected' ? 'destructive' : 'secondary'
                                        }
                                        className="capitalize"
                                    >
                                        {correction.status}
                                    </Badge>
                                </div>

                                {correction.status === 'pending' && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 h-8"
                                            onClick={() => applyCorrection(correction.id)}
                                        >
                                            <ThumbsUp className="h-3 w-3 mr-1" />
                                            Apply
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="flex-1 h-8 text-rose-400"
                                            onClick={() => rejectCorrection(correction.id)}
                                        >
                                            <ThumbsDown className="h-3 w-3 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                )}

                                <p className="text-[10px] text-muted-foreground mt-2">{correction.timestamp}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
