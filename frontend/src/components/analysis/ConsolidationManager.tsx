import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    ArrowRightLeft,
    RefreshCw,
    Building2,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '@/hooks/use-app-state';

interface ConsolidationResult {
    status: string;
    original_count: number;
    eliminated_count: number;
    elimination_total_gel: number;
    data: any[];
    logs: string[];
}

export default function ConsolidationManager() {
    const { selectedCompany } = useAppState();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ConsolidationResult | null>(null);

    const runConsolidation = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/process-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'consolidation',
                    company_id: selectedCompany, // Should likely be 'GLOBAL' or parent entity for real consolidation
                    period: '2023-11' // Hardcoded for demo or use selectedPeriod
                })
            });
            const data = await res.json();

            if (data.status === 'success') {
                setResult(data);
                toast.success(`Consolidation Complete. Eliminated ${data.eliminated_count} records.`);
            } else {
                toast.error('Consolidation failed');
            }
        } catch (e) {
            console.error('Consolidation error:', e);
            toast.error('Failed to run consolidation');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        const symbol = '₾'; // Backend returns GEL currently
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Intercompany Elimination</h2>
                    <p className="text-muted-foreground">Automated detection and removal of internal transfers for consolidated reporting.</p>
                </div>
                <Button onClick={runConsolidation} disabled={loading} className="shadow-lg shadow-indigo-500/20">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Processing...' : 'Run Elimination'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{result ? result.original_count + result.eliminated_count : '-'}</div>
                        <p className="text-xs text-muted-foreground">Including eliminations</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Eliminated Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{result ? result.eliminated_count : '-'}</div>
                        <p className="text-xs text-muted-foreground">Intercompany matches found</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Eliminated Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">
                            {result ? formatCurrency(result.elimination_total_gel) : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">Total volume removed</p>
                    </CardContent>
                </Card>
            </div>

            {result && (
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-indigo-400" />
                            Consolidation Audit Log
                        </CardTitle>
                        <CardDescription>Review of automated elimination decisions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 space-y-2">
                            {result.logs.map((log, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {log}
                                </div>
                            ))}
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Entity / Dept</TableHead>
                                    <TableHead className="text-right">Amount (GEL)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.data.filter(tx => tx.is_elimination).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No eliminations generated.</TableCell>
                                    </TableRow>
                                ) : (
                                    result.data.filter(tx => tx.is_elimination).map((tx, idx) => (
                                        <TableRow key={idx} className="bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                                            <TableCell>
                                                <Badge variant="outline" className="border-rose-500/30 text-rose-500">Elimination</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{tx.description}</TableCell>
                                            <TableCell className="text-muted-foreground">{tx.department || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-mono text-rose-500">{formatCurrency(tx.amount_gel)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {!result && !loading && (
                <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-muted-foreground bg-accent/5">
                    <ArrowRightLeft className="h-12 w-12 mb-4 opacity-20" />
                    <p>Run elimination to detect and remove intercompany transactions.</p>
                </Card>
            )}
        </div>
    );
}
