
import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Search,
    RefreshCw,
    Info,
    ArrowRightLeft,
    Shield
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { intercompanyService, IntercompanyTransaction } from '@/services/intercompanyDetectionService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const IntercompanyReview: React.FC = () => {
    const [transactions, setTransactions] = useState<IntercompanyTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const { records } = useSelector((state: RootState) => state.financial);
    const { entities } = useSelector((state: RootState) => state.entities);

    const runDetection = async () => {
        setLoading(true);
        try {
            const orgId = 'SOCAR_GROUP';
            const period = '2025-12';
            const detected = await intercompanyService.detect(orgId, period, records as any);
            setTransactions(detected);
        } catch (error) {
            console.error("Detection failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runDetection();
    }, [records]);

    const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
        setTransactions(prev => prev.map(tx =>
            tx.id === id ? { ...tx, eliminationStatus: status } : tx
        ));
    };

    const getEntityName = (id: string) => {
        return entities.find(e => e.id === id)?.name || id;
    };

    const totalPotential = transactions.reduce((acc, tx) => acc + tx.amount, 0);

    return (
        <div className="p-4 md:p-6 max-w-[1800px] mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-end pb-4 border-b border-border gap-4">
                <div className="space-y-1">
                    <span className="text-primary font-black tracking-[0.3em] block text-[9px] uppercase italic">
                        Cross-Entity Reconciliation
                    </span>
                    <div className="flex items-center gap-3">
                        <Shield size={24} className="text-white" />
                        <h1 className="text-3xl font-black text-foreground font-display uppercase tracking-tighter">
                            Intercompany Review
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={runDetection}
                        disabled={loading}
                        className="rounded-lg font-bold uppercase text-[9px] h-8 tracking-widest"
                    >
                        <RefreshCw size={14} className={cn("mr-1.5", loading && "animate-spin")} />
                        Re-scan
                    </Button>
                    <Button
                        size="sm"
                        className="rounded-lg px-4 font-bold uppercase text-[9px] h-8 tracking-widest shadow-lg shadow-primary/20"
                    >
                        Approve High Confidence
                    </Button>
                </div>
            </div>

            {/* Summary Stats: Compacted */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Detected', val: transactions.length, color: 'text-foreground' },
                    { label: 'Potential Elimination', val: `₾ ${totalPotential.toLocaleString()}`, color: 'text-emerald-500' },
                    { label: 'High Confidence', val: transactions.filter(t => t.matchConfidence >= 0.9).length, color: 'text-primary' },
                    { label: 'Sync Status', val: 'Ready', color: 'text-primary' }
                ].map((stat, i) => (
                    <div key={i} className="nyx-card p-4">
                        <div className="text-muted-foreground text-[8px] font-black uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className={cn("text-2xl font-black", stat.color)}>{stat.val}</div>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="w-full h-1 bg-accent rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-primary animate-[progress_1s_ease-in-out_infinite]" style={{ width: '50%' }} />
                </div>
            )}

            {!loading && transactions.length === 0 ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 text-primary p-4 flex items-center gap-3 text-xs font-bold">
                    <Info size={18} />
                    <span>No transactions detected for the selected period.</span>
                </div>
            ) : (
                <div className="nyx-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-accent/10 border-b border-border">
                                <tr>
                                    <th className="p-3 font-black text-muted-foreground uppercase tracking-widest">Source Entity</th>
                                    <th className="p-3 font-black text-muted-foreground uppercase tracking-widest">Target Entity</th>
                                    <th className="p-3 font-black text-muted-foreground uppercase tracking-widest text-right">Amount</th>
                                    <th className="p-3 font-black text-muted-foreground uppercase tracking-widest text-center">Confidence</th>
                                    <th className="p-3 font-black text-muted-foreground uppercase tracking-widest text-center">Status</th>
                                    <th className="p-3 font-black text-muted-foreground uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-border/50 hover:bg-accent/5 transition-colors group">
                                        <td className="p-3 font-bold text-foreground">
                                            {getEntityName(tx.entityFromId)}
                                        </td>
                                        <td className="p-3 font-medium text-muted-foreground">
                                            {getEntityName(tx.entityToId)}
                                        </td>
                                        <td className="p-3 font-black text-foreground text-right">
                                            ₾ {tx.amount.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex flex-col items-center gap-1 mx-auto w-20">
                                                <span className="text-[8px] font-black uppercase text-muted-foreground">
                                                    {(tx.matchConfidence * 100).toFixed(0)}%
                                                </span>
                                                <div className="h-1 w-full bg-accent rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-1000", tx.matchConfidence >= 0.9 ? 'bg-emerald-500' : 'bg-amber-500')}
                                                        style={{ width: `${tx.matchConfidence * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={cn(
                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                                tx.eliminationStatus === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                                                    tx.eliminationStatus === 'rejected' ? "bg-rose-500/10 text-rose-500" :
                                                        "bg-amber-500/10 text-amber-500"
                                            )}>
                                                {tx.eliminationStatus}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => handleStatusChange(tx.id, 'approved')}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(tx.id, 'rejected')}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                                                >
                                                    <Search size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* AI Insight Footer: Compacted */}
            <div className="p-4 nyx-card bg-primary/5 border-primary/10 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Shield size={20} />
                </div>
                <div>
                    <h4 className="font-black text-foreground text-xs uppercase tracking-tight">Trust Assurance Layer</h4>
                    <p className="text-muted-foreground text-[10px] font-medium leading-relaxed mt-0.5">
                        Detection Engine has verified {transactions.length} pairings. Approving matches above 85% is recommended for automated rollout.
                    </p>
                </div>
            </div>
        </div>
    );
};
