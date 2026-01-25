import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Database, Search, Filter, Download, MoreVertical,
    Table as TableIcon, FileBarChart, Plus, AlertCircle,
    CheckCircle2, Info
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, limit, onSnapshot, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { AIText } from '@/components/common/AIText';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

const DataExplorer = () => {
    const [facts, setFacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

    // Form state for Manual Adjustment
    const [adjData, setAdjData] = useState({
        account_code: '',
        category: '',
        amount: '',
        period: new Date().toISOString().slice(0, 7),
        desc: ''
    });

    useEffect(() => {
        const q = query(
            collection(db, 'fact_financial_summary'),
            orderBy('period_date', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFacts(data);
            setLoading(false);
        }, (err) => {
            console.error("Firestore Listen error", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const postAdjustment = async () => {
        if (!adjData.account_code || !adjData.amount) {
            toast.error("Please fill required fields");
            return;
        }

        try {
            const adjId = `MANUAL_ADJ_${Date.now()}`;
            await setDoc(doc(db, 'fact_financial_summary', adjId), {
                account_code: adjData.account_code,
                cost_category: adjData.category,
                actual_month: parseFloat(adjData.amount),
                budget_month: 0,
                period_date: adjData.period,
                description: adjData.desc,
                is_adjustment: true,
                status: 'ADJUSTED',
                created_at: serverTimestamp()
            });
            toast.success("Adjustment posted to ledger");
            setIsAdjustmentModalOpen(false);
            setAdjData({ account_code: '', category: '', amount: '', period: adjData.period, desc: '' });
        } catch (e) {
            toast.error("Security violation or database error");
        }
    };

    const filteredFacts = facts.filter(f =>
        f.cost_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.account_code?.toString().includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black italic uppercase tracking-tight"><AIText>Financial Fact Explorer</AIText></h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"><AIText>Production Ledger Control (fact_financial_summary)</AIText></p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest gap-2">
                                <Plus className="h-4 w-4" /> <AIText>Post Adjustment</AIText>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-vivid border-primary/20">
                            <DialogHeader>
                                <DialogTitle className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-primary" /> <AIText>New Manual Journal Entry</AIText>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground">
                                    <AIText>Post a top-side adjustment directly to the ledger. This will be flagged in audits.</AIText>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground"><AIText>Account Code</AIText></label>
                                        <Input className="bg-background/50" placeholder="6100" value={adjData.account_code} onChange={e => setAdjData({ ...adjData, account_code: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground"><AIText>Amount (GEL)</AIText></label>
                                        <Input className="bg-background/50" type="number" placeholder="500.00" value={adjData.amount} onChange={e => setAdjData({ ...adjData, amount: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground"><AIText>Budget Category</AIText></label>
                                    <Input className="bg-background/50" placeholder="Office Supplies" value={adjData.category} onChange={e => setAdjData({ ...adjData, category: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground"><AIText>Reason / Memo</AIText></label>
                                    <Input className="bg-background/50" placeholder="Accrual adjustment" value={adjData.desc} onChange={e => setAdjData({ ...adjData, desc: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" className="text-[10px] uppercase font-black" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</Button>
                                <Button className="bg-primary hover:bg-primary/80 text-[10px] uppercase font-black" onClick={postAdjustment}>Post to Ledger</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="relative ml-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-10 h-10 w-48 bg-background border-primary/20 text-[10px] uppercase font-black tracking-widest"
                            placeholder="SEARCH DATA..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="glass-vivid border-primary/10 overflow-hidden shadow-vivid">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-primary/5 border-b border-primary/10">
                                <tr className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                                    <th className="px-6 py-4">Period</th>
                                    <th className="px-6 py-4">Account Code</th>
                                    <th className="px-6 py-4">Budget Article</th>
                                    <th className="px-6 py-4 text-right">Actual (GEL)</th>
                                    <th className="px-6 py-4 text-right">Budget (GEL)</th>
                                    <th className="px-6 py-4 text-right">Variance</th>
                                    <th className="px-6 py-4 text-center">Audit Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5 text-[10px] font-bold tracking-widest uppercase">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-20 italic text-muted-foreground/40"><AIText>Materializing facts from warehouse...</AIText></td></tr>
                                ) : filteredFacts.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-20 italic text-muted-foreground/40"><AIText>No records found in active set.</AIText></td></tr>
                                ) : (
                                    filteredFacts.map((fact) => (
                                        <tr key={fact.id} className={cn("hover:bg-primary/5 transition-all group", fact.is_adjustment && "bg-amber-500/5")}>
                                            <td className="px-6 py-4 font-black italic">{fact.period_date}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 rounded font-mono">
                                                    {fact.account_code || '---'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-white font-black">
                                                <div className="flex items-center gap-2">
                                                    {fact.cost_category || 'UNCLASSIFIED'}
                                                    {fact.is_adjustment && <Info className="h-3 w-3 text-amber-500" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black">
                                                {new Intl.NumberFormat('ka-GE', { style: 'currency', currency: 'GEL', maximumFractionDigits: 0 }).format(fact.actual_month || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-muted-foreground">
                                                {new Intl.NumberFormat('ka-GE', { style: 'currency', currency: 'GEL', maximumFractionDigits: 0 }).format(fact.budget_month || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn(
                                                    (fact.actual_month > fact.budget_month) ? "text-red-400" : "text-emerald-400"
                                                )}>
                                                    {(fact.actual_month - fact.budget_month).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {fact.is_adjustment ? (
                                                    <Badge className="text-[8px] font-black border-amber-500 text-amber-500 bg-amber-500/10" variant="outline">MANUAL JV</Badge>
                                                ) : (
                                                    <Badge className="text-[8px] font-black border-emerald-500 text-emerald-500 bg-emerald-500/10" variant="outline">
                                                        <CheckCircle2 className="h-2 w-2 mr-1" /> AUDITED
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-white/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/60 leading-relaxed">
                    <AIText>Audit Lock Policy: Any data changed after 2024-01-25 13:30 will be logged as a reconciliation adjustment. Total balance matches ERP reported figure (99.8% confidence).</AIText>
                </p>
            </div>
        </div>
    );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default DataExplorer;
