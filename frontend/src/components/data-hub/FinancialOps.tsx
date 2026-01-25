import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Lock, Unlock, CheckCircle2, AlertCircle,
    Calendar, ShieldCheck, FileText, ArrowRight,
    RefreshCcw, Landmark
} from 'lucide-react';
import { toast } from 'sonner';
import { AIText } from '@/components/common/AIText';

const FinancialOps = () => {
    const [lockedPeriods, setLockedPeriods] = useState<string[]>(['2025-10', '2025-11']);
    const [isClosing, setIsClosing] = useState(false);

    const toggleLock = async (period: string) => {
        const isCurrentlyLocked = lockedPeriods.includes(period);
        try {
            const res = await fetch('/api/truth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'manage_locks',
                    period: period,
                    locked: !isCurrentlyLocked
                })
            });
            if (!res.ok) throw new Error("Persistence failed");

            if (isCurrentlyLocked) {
                setLockedPeriods(prev => prev.filter(p => p !== period));
                toast.success(`Period ${period} unlocked for adjustments`);
            } else {
                setLockedPeriods(prev => [...prev, period]);
                toast.success(`Period ${period} finalized and locked`);
            }
        } catch (e) {
            toast.error("Cloud Sync Failed: Governance state not persisted.");
        }
    };

    const runMonthEnd = () => {
        setIsClosing(true);
        toast.info("Initiating Month-End Close Protocol...");
        setTimeout(() => {
            setIsClosing(false);
            toast.success("Consolidation & Elimination Complete. Period Ready for Lock.");
        }, 2500);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 1. Period Governance */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="glass-vivid border-primary/20 shadow-vivid relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Landmark className="h-24 w-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" /> <AIText>Ledger Governance & Period Control</AIText>
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-tight">
                            <AIText>Authorize and Finalize Financial Periods for SOCAR Group Consolidations.</AIText>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { period: '2025-12', status: 'In Progress', items: 1420 },
                            { period: '2025-11', status: 'Closed', items: 2150 },
                            { period: '2025-10', status: 'Closed', items: 1980 }
                        ].map((p) => (
                            <div key={p.period} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-white/5 hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black italic">{p.period}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{p.items} Fact Records • System-Verified</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={lockedPeriods.includes(p.period) ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                                        {lockedPeriods.includes(p.period) ? 'LOCKED' : 'OPEN'}
                                    </Badge>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-primary/20 rounded-full"
                                        onClick={() => toggleLock(p.period)}
                                    >
                                        {lockedPeriods.includes(p.period) ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 2. Month-End Protocol */}
                <Card className="glass-vivid border-primary/10">
                    <CardHeader>
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary"><AIText>Active Month-End Protocol</AIText></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { task: 'Intercompany Elimination', status: 'Done', color: 'text-emerald-500' },
                                { task: 'FX Revaluation', status: 'Done', color: 'text-emerald-500' },
                                { task: 'Statutory Adjustments', status: 'Pending', color: 'text-amber-500' },
                                { task: 'Truth Engine Materialization', status: 'Current', color: 'text-blue-500' }
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-white/5">
                                    <CheckCircle2 className={`h-4 w-4 ${step.status === 'Done' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-tight">{step.task}</p>
                                        <p className={`text-[8px] font-bold uppercase ${step.color}`}>{step.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            className="w-full h-12 bg-primary hover:bg-primary/80 text-white text-[10px] font-black uppercase tracking-widest gap-2 shadow-vivid"
                            onClick={runMonthEnd}
                            disabled={isClosing}
                        >
                            {isClosing ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            <AIText>{isClosing ? 'Processing Close...' : 'Initiate Full Consolidation'}</AIText>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Audit Logging (Sidebar) */}
            <div className="space-y-6">
                <Card className="glass-vivid border-primary/20 h-full">
                    <CardHeader>
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> <AIText>Operational Audit Log</AIText>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[
                            { user: 'N. Tsereteli (CFO)', action: 'Unlocked Period 2025-11', time: '2h ago' },
                            { user: 'System (AI)', action: 'Identified 12 Eliminations', time: '4h ago' },
                            { user: 'B. Ivanishvili (Group)', action: 'Finalized Q4 Forecast', time: '1d ago' }
                        ].map((log, i) => (
                            <div key={i} className="relative pl-6 border-l border-primary/20 pb-6 last:pb-0">
                                <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-primary" />
                                <p className="text-[10px] font-black uppercase text-white">{log.user}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{log.action}</p>
                                <p className="text-[8px] italic text-muted-foreground/40 mt-1">{log.time}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FinancialOps;
