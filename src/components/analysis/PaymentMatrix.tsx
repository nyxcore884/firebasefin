import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CreditCard,
    FileText,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Search,
    Download
} from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReconciliationItem {
    id: string;
    invoice_id: string;
    payment_id: string;
    invoice_amount: number;
    payment_amount: number;
    variance: number;
    status: 'matched' | 'unmatched' | 'partial';
    date: string;
    counterparty: string;
}

export default function PaymentMatrix() {
    const { selectedCompany, selectedPeriod, currency } = useAppState();
    const [items, setItems] = useState<ReconciliationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [summary, setSummary] = useState({
        matched: 0,
        unmatched: 0,
        partial: 0,
        totalInvoiced: 0,
        totalReceived: 0
    });

    useEffect(() => {
        const fetchReconciliation = async () => {
            setLoading(true);
            try {
                // Fetch transactions and compute reconciliation
                const res = await fetch('/api/process-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'metrics',
                        company_id: selectedCompany,
                        period: selectedPeriod
                    })
                });
                const data = await res.json();

                if (data.status === 'success') {
                    // Generate reconciliation items from metrics
                    // In production, this would call a dedicated reconciliation endpoint
                    const demoItems: ReconciliationItem[] = [
                        {
                            id: 'REC-001',
                            invoice_id: 'INV-2023-001',
                            payment_id: 'PAY-2023-001',
                            invoice_amount: data.metrics?.revenue ? data.metrics.revenue * 0.15 : 150000,
                            payment_amount: data.metrics?.revenue ? data.metrics.revenue * 0.15 : 150000,
                            variance: 0,
                            status: 'matched',
                            date: '2023-11-15',
                            counterparty: 'Vendor Alpha'
                        },
                        {
                            id: 'REC-002',
                            invoice_id: 'INV-2023-002',
                            payment_id: 'PAY-2023-002',
                            invoice_amount: data.metrics?.revenue ? data.metrics.revenue * 0.10 : 100000,
                            payment_amount: data.metrics?.revenue ? data.metrics.revenue * 0.08 : 80000,
                            variance: data.metrics?.revenue ? data.metrics.revenue * 0.02 : 20000,
                            status: 'partial',
                            date: '2023-11-18',
                            counterparty: 'Vendor Beta'
                        },
                        {
                            id: 'REC-003',
                            invoice_id: 'INV-2023-003',
                            payment_id: '',
                            invoice_amount: data.metrics?.expenses ? data.metrics.expenses * 0.12 : 45000,
                            payment_amount: 0,
                            variance: data.metrics?.expenses ? data.metrics.expenses * 0.12 : 45000,
                            status: 'unmatched',
                            date: '2023-11-20',
                            counterparty: 'Vendor Gamma'
                        },
                        {
                            id: 'REC-004',
                            invoice_id: 'INV-2023-004',
                            payment_id: 'PAY-2023-004',
                            invoice_amount: data.metrics?.revenue ? data.metrics.revenue * 0.08 : 80000,
                            payment_amount: data.metrics?.revenue ? data.metrics.revenue * 0.08 : 80000,
                            variance: 0,
                            status: 'matched',
                            date: '2023-11-22',
                            counterparty: 'Vendor Delta'
                        },
                        {
                            id: 'REC-005',
                            invoice_id: 'INV-2023-005',
                            payment_id: 'PAY-2023-005',
                            invoice_amount: data.metrics?.expenses ? data.metrics.expenses * 0.15 : 55000,
                            payment_amount: data.metrics?.expenses ? data.metrics.expenses * 0.15 : 55000,
                            variance: 0,
                            status: 'matched',
                            date: '2023-11-25',
                            counterparty: 'Vendor Epsilon'
                        }
                    ];

                    setItems(demoItems);

                    // Calculate summary
                    const matched = demoItems.filter(i => i.status === 'matched').length;
                    const unmatched = demoItems.filter(i => i.status === 'unmatched').length;
                    const partial = demoItems.filter(i => i.status === 'partial').length;
                    const totalInvoiced = demoItems.reduce((sum, i) => sum + i.invoice_amount, 0);
                    const totalReceived = demoItems.reduce((sum, i) => sum + i.payment_amount, 0);

                    setSummary({ matched, unmatched, partial, totalInvoiced, totalReceived });
                }
            } catch (e) {
                console.error('Reconciliation fetch error:', e);
                toast.error('Failed to load payment reconciliation data');
            } finally {
                setLoading(false);
            }
        };

        fetchReconciliation();
    }, [selectedCompany, selectedPeriod]);

    const formatCurrency = (amount: number) => {
        const symbol = currency === 'USD' ? '$' : '₾';
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'matched':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'unmatched':
                return <XCircle className="h-4 w-4 text-rose-500" />;
            case 'partial':
                return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            default:
                return null;
        }
    };

    const filteredItems = items.filter(item =>
        (item.counterparty || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoice_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchRate = items.length > 0 ? Math.round((summary.matched / items.length) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Payment Reconciliation Matrix</h2>
                    <p className="text-muted-foreground">Match invoices against payments for {selectedCompany}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast.info('Refreshing reconciliation...')}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info('Exporting to Excel...')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-medium">Matched</p>
                                <p className="text-2xl font-bold text-emerald-500">{summary.matched}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-medium">Partial</p>
                                <p className="text-2xl font-bold text-amber-500">{summary.partial}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-medium">Unmatched</p>
                                <p className="text-2xl font-bold text-rose-500">{summary.unmatched}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-medium">Invoiced</p>
                                <p className="text-lg font-bold">{formatCurrency(summary.totalInvoiced)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-medium">Received</p>
                                <p className="text-lg font-bold">{formatCurrency(summary.totalReceived)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Match Rate Bar */}
            <Card className="glass-card">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Reconciliation Match Rate</span>
                        <span className="text-sm font-bold">{matchRate}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${matchRate}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Reconciliation Table */}
            <Card className="glass-card">
                <CardHeader className="border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Reconciliation Details</CardTitle>
                            <CardDescription>Invoice to payment matching for the selected period</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by vendor or invoice..."
                                className="pl-9 bg-muted/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>Payment ID</TableHead>
                                <TableHead>Counterparty</TableHead>
                                <TableHead className="text-right">Invoiced</TableHead>
                                <TableHead className="text-right">Received</TableHead>
                                <TableHead className="text-right">Variance</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>AI Insight</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        Loading reconciliation data...
                                    </TableCell>
                                </TableRow>
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No matching records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/20">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(item.status)}
                                                <Badge
                                                    variant={item.status === 'matched' ? 'default' : item.status === 'partial' ? 'warning' : 'destructive'}
                                                    className="capitalize"
                                                >
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{item.invoice_id}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.payment_id || '—'}</TableCell>
                                        <TableCell className="font-medium">{item.counterparty}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(item.invoice_amount)}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(item.payment_amount)}</TableCell>
                                        <TableCell className={cn(
                                            "text-right font-mono font-semibold",
                                            item.variance > 0 ? "text-rose-500" : "text-emerald-500"
                                        )}>
                                            {item.variance === 0 ? '—' : formatCurrency(item.variance)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{item.date}</TableCell>
                                        <TableCell>
                                            {item.status === 'unmatched' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20"
                                                    onClick={async () => {
                                                        toast.promise(
                                                            async () => {
                                                                const { aiService } = await import('../../services/aiService');
                                                                const res = await aiService.queryIntelligence(`Explain the mismatch for counterparty ${item.counterparty} with invoice ${item.invoice_id} (Amount: ${item.invoice_amount}) vs payment ${item.payment_id || 'None'}`, {
                                                                    company_id: selectedCompany,
                                                                    period: selectedPeriod
                                                                });
                                                                return res.answer;
                                                            },
                                                            {
                                                                loading: 'Brain 2 analyzing mismatch...',
                                                                success: (data) => data,
                                                                error: 'Analysis failed'
                                                            }
                                                        );
                                                    }}
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Ask AI
                                                </Button>
                                            )}
                                            {item.status === 'partial' && (
                                                <span className="text-[10px] text-amber-500 italic">
                                                    Retention held (5%)
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
