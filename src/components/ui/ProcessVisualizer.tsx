import React from 'react';
import { CheckCircle2, Circle, Loader2, Sparkles, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ProcessStep {
    id: string;
    label: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    detail?: string;
}

interface ProcessVisualizerProps {
    steps: ProcessStep[];
    isExpanded?: boolean;
}

export function ProcessVisualizer({ steps, isExpanded = true }: ProcessVisualizerProps) {
    if (!isExpanded && steps.every(s => s.status === 'pending')) return null;

    return (
        <Card className="bg-slate-950/50 border-slate-800/50 backdrop-blur-sm shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="py-3 px-4 border-b border-slate-800/50 bg-slate-900/50 flex flex-row items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm font-mono text-slate-300">SYSTEM_PROCESS_LOG</CardTitle>
                {steps.some(s => s.status === 'running') && (
                    <span className="flex h-2 w-2 relative ml-auto">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className={cn(
                                "flex items-start gap-4 p-4 border-l-2 transition-all duration-300",
                                step.status === 'running' ? "bg-cyan-950/10 border-cyan-500" :
                                    step.status === 'completed' ? "bg-emerald-950/5 border-emerald-500/50" :
                                        step.status === 'failed' ? "bg-rose-950/10 border-rose-500" : "border-transparent text-slate-600"
                            )}
                        >
                            <div className="mt-0.5 flex-shrink-0">
                                {step.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                                {step.status === 'running' && <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />}
                                {step.status === 'failed' && <Circle className="h-5 w-5 text-rose-500" />}
                                {step.status === 'pending' && <Circle className="h-5 w-5 text-slate-700" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className={cn("text-sm font-medium",
                                    step.status === 'running' ? "text-cyan-200" :
                                        step.status === 'completed' ? "text-slate-300" : "text-slate-500"
                                )}>
                                    {step.label}
                                </p>
                                {step.detail && step.status !== 'pending' && (
                                    <p className="text-xs font-mono text-slate-500 animate-in fade-in transition-opacity">
                                        {'>'} {step.detail}
                                    </p>
                                )}
                            </div>
                            {step.status === 'running' && <Sparkles className="h-4 w-4 text-cyan-400/50 animate-pulse" />}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
