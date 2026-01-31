import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BrainCircuit, FileText, CheckCircle2, Clock, Play } from 'lucide-react';
import { toast } from 'sonner';

export const DocumentIntelligence = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const simulateOCR = () => {
        setIsProcessing(true);
        toast.info("Vertex AI: Initiating OCR pipeline on staged documents...");
        setTimeout(() => {
            setIsProcessing(false);
            toast.success("Extraction Complete: $14,250.00 identified in Socar-911 Receipt.");
        }, 4000);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-vivid border-primary/20 bg-background/20 group cursor-pointer hover:bg-primary/5 transition-all">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase italic">Ingestion Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-8 border-2 border-dashed border-primary/10 rounded-2xl flex flex-col items-center justify-center bg-primary/5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
                            <BrainCircuit className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1 text-center">Drag & Drop Financial Documents</span>
                            <span className="text-[8px] text-muted-foreground/40 uppercase font-bold">PDF, JPG, PNG (Max 10MB)</span>
                        </div>
                        <Button className="w-full bg-indigo-600 shadow-lg shadow-indigo-500/20 py-5" onClick={simulateOCR} disabled={isProcessing}>
                            {isProcessing ? 'Vertex AI Processing...' : 'Process Pending Queue'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-vivid border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase italic flex justify-between items-center">
                            <span>Recent Extractions</span>
                            <Badge variant="outline" className="text-[8px]">LIVE STATUS</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { name: 'Socar-Gas-Invoice_92.pdf', status: 'Processed', confidence: 98.4, type: 'Invoice' },
                                { name: 'Terminal-Entry-Log.png', status: 'Processing', confidence: 0, type: 'Log' },
                                { name: 'Vendor-BP-Receipt.jpg', status: 'Processed', confidence: 99.1, type: 'Receipt' }
                            ].map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-primary/60" />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold truncate max-w-[150px]">{doc.name}</span>
                                            <span className="text-[8px] text-muted-foreground uppercase font-black">{doc.type}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {doc.status === 'Processing' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 w-12 bg-primary/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary animate-progress-indefinite" />
                                                </div>
                                                <span className="text-[9px] font-bold text-primary animate-pulse italic">Analysing</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <Badge className="bg-emerald-500/20 text-emerald-500 border-none text-[8px] h-4 uppercase">{doc.status}</Badge>
                                                <span className="text-[8px] text-muted-foreground mt-1 font-mono">{doc.confidence}% Confidence</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-vivid border-emerald-500/20 bg-emerald-500/5">
                <CardHeader>
                    <CardTitle className="text-emerald-500 text-sm font-black uppercase italic flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Extraction Confidence Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-1 h-32">
                        {[45, 67, 89, 92, 78, 95, 88, 99, 94, 98].map((h, i) => (
                            <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-sm hover:bg-emerald-500/40 transition-all cursor-crosshair relative group" style={{ height: `${h}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/20 px-1 rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between text-[10px] uppercase font-black opacity-50">
                        <span>Last 10 Batches</span>
                        <span>Current Avg: 93.4%</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
