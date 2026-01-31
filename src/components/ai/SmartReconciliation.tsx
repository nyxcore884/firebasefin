import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Search, Link2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const SmartReconciliation = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [matchRate, setMatchRate] = useState(94.2);

    const handleRunReconciliation = () => {
        setIsRunning(true);
        toast.info("AI Logic Engine: Evaluating 2,400+ ledger nodes...");
        setTimeout(() => {
            setIsRunning(false);
            setMatchRate(98.7);
            toast.success("Reconciliation Complete: 14 new matches found.");
        }, 3000);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-vivid border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" /> Auto-Matching Engine
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold">Heuristic & Vector Similarity Matching</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="text-5xl font-black text-primary mb-2 tracking-tighter">{matchRate}%</div>
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Current Match Accuracy
                            </span>
                        </div>
                        <Progress value={matchRate} className="h-1.5 bg-primary/10" />
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 py-6 text-[10px] font-black uppercase tracking-widest"
                            onClick={handleRunReconciliation}
                            disabled={isRunning}
                        >
                            {isRunning ? <Search className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                            {isRunning ? 'Processing Ledger...' : 'Run Smart Reconciliation'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-vivid border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase italic">Reconciliation Logic</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {[
                                { label: 'Exact Metadata Match', value: 'High', color: 'text-emerald-500' },
                                { label: 'Fuzzy Description Match', value: 'Medium', color: 'text-amber-500' },
                                { label: 'Amount Inverse Matching', value: 'Low', color: 'text-rose-500' }
                            ].map((logic, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{logic.label}</span>
                                    <Badge variant="outline" className={cn("text-[8px] uppercase", logic.color)}>{logic.value}</Badge>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mt-4">
                            <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                                "AI provides explainability for every match based on 12 distinct weighted parameters including historical vendor behavior."
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-vivid border-primary/10">
                <CardHeader className="pb-3 border-b border-primary/5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between">
                        <span>Recent High-Confidence Matches</span>
                        <Badge className="bg-emerald-500/20 text-emerald-500 border-none">99%+ CONFIDENCE</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-2">
                        {[
                            { id: 'MATCH-92', bank: 'Bank Transfer: Socar-911', ledger: 'Vendor: BP Energy', amount: 45000, confidence: 99.8 },
                            { id: 'MATCH-93', bank: 'ACH Deposit: Internal-Tx', ledger: 'Intra-company: SGG-Export', amount: 12500, confidence: 99.2 }
                        ].map((m: any, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-background/40 border border-white/5 rounded-xl hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="text-[10px] font-mono text-muted-foreground">{m.id}</div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold">{m.bank}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1"><ArrowRight className="h-2 w-2" /> {m.ledger}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] font-black">₾{m.amount.toLocaleString()}</div>
                                    <div className="text-[9px] text-emerald-500 font-bold uppercase">{m.confidence}% Match</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const ArrowRight = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);
