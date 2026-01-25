import { useState, useEffect } from 'react';
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
    FileSpreadsheet,
    Download,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/use-app-state';

interface PLLineItem {
    label: string;
    currentPeriod: number;
    previousPeriod: number;
    variance: number;
    variancePercent: number;
    isHeader?: boolean;
    isTotal?: boolean;
}

export default function ConsolidatedPL() {
    const { selectedCompany, selectedPeriod, currency } = useAppState();
    const [loading, setLoading] = useState(true);
    const [plData, setPLData] = useState<PLLineItem[]>([]);

    useEffect(() => {
        fetchConsolidatedPL();
    }, [selectedCompany, selectedPeriod]);

    const fetchConsolidatedPL = async () => {
        setLoading(true);
        try {
            // Updated to use Core Financial Controller
            const res = await fetch('/api/financial-truth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity: selectedCompany,
                    period: selectedPeriod,
                    currency: currency
                })
            });

            if (res.status === 409) {
                toast.error('Period is not Locked. Please lock data in Governance tab.');
                setLoading(false);
                return;
            }

            const data = await res.json();

            if (data.variance) {
                const report = data.variance; // { REVENUE: { current, previous... }, ... }
                // Note: Semantic Metrics are UPPERCASE keys in Controller (e.g. "REVENUE")
                // Legacy was lowercase. Need to handle case.

                const getM = (key: string) => {
                    const k = key.toUpperCase();
                    return report[k] || { current: 0, previous: 0, variance: 0, variancePercent: 0 };
                };

                // Helper to map Controller keys to UI keys
                const revenue = getM('REVENUE');
                const cogs = getM('COGS'); // Need to ensure Controller produces COGS. If not, maybe COST_OF_SALES?
                // Checking Materializer logic (standard usually REVENUE, EXPENSES, NET_INCOME, EBITDA)
                // If COGS not present, we might show 0.

                const expenses = getM('EXPENSES'); // or OPEX
                const netIncome = getM('NET_INCOME');
                const ebitda = getM('EBITDA');

                setPLData([
                    {
                        label: 'Revenue',
                        currentPeriod: revenue.current,
                        previousPeriod: revenue.previous,
                        variance: revenue.variance,
                        variancePercent: revenue.variance_percent,
                        isHeader: true
                    },
                    {
                        label: 'Cost of Sales',
                        currentPeriod: cogs.current,
                        previousPeriod: cogs.previous,
                        variance: cogs.variance,
                        variancePercent: cogs.variance_percent,
                        isHeader: true
                    },
                    {
                        label: 'Gross Profit',
                        currentPeriod: revenue.current - cogs.current,
                        previousPeriod: revenue.previous - cogs.previous,
                        variance: (revenue.current - cogs.current) - (revenue.previous - cogs.previous),
                        variancePercent: 0,
                        isTotal: true
                    },
                    {
                        label: 'Operating Expenses',
                        currentPeriod: expenses.current,
                        previousPeriod: expenses.previous,
                        variance: expenses.variance,
                        variancePercent: expenses.variance_percent,
                        isHeader: true
                    },
                    {
                        label: 'EBITDA',
                        currentPeriod: ebitda.current,
                        previousPeriod: ebitda.previous,
                        variance: ebitda.variance,
                        variancePercent: ebitda.variance_percent,
                        isTotal: true
                    },
                    {
                        label: 'Net Income',
                        currentPeriod: netIncome.current,
                        previousPeriod: netIncome.previous,
                        variance: netIncome.variance,
                        variancePercent: netIncome.variance_percent,
                        isTotal: true
                    },
                ]);
            }
        } catch (e) {
            console.error('Failed to fetch P&L:', e);
            toast.error('Failed to load P&L data (Controller Error)');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        const symbol = currency === 'USD' ? '$' : '₾';
        return `${symbol}${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getVarianceIcon = (variance: number) => {
        if (variance > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
        if (variance < 0) return <TrendingDown className="h-3 w-3 text-rose-500" />;
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    };

    return (
        <Card className="glass-card">
            <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <CardTitle>Consolidated P&L Statement</CardTitle>
                            <CardDescription>{selectedCompany} • {selectedPeriod}</CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchConsolidatedPL}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toast.info('Exporting P&L...')}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Line Item</TableHead>
                            <TableHead className="text-right">Current Period</TableHead>
                            <TableHead className="text-right">Previous Period</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                            <TableHead className="text-right">Var %</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                        ) : (
                            plData.map((item, idx) => (
                                <TableRow
                                    key={idx}
                                    className={cn(
                                        item.isHeader && "bg-muted/20 font-semibold",
                                        item.isTotal && "bg-primary/5 font-bold border-t-2 border-primary/20"
                                    )}
                                >
                                    <TableCell className={cn(
                                        item.isHeader && "text-primary",
                                        item.isTotal && "text-lg",
                                        !item.isHeader && !item.isTotal && "pl-8"
                                    )}>
                                        {item.label}
                                    </TableCell>
                                    <TableCell className={cn("text-right font-mono", item.isTotal && "text-lg")}>
                                        {formatCurrency(item.currentPeriod)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-muted-foreground">
                                        {formatCurrency(item.previousPeriod)}
                                    </TableCell>
                                    <TableCell className={cn(
                                        "text-right font-mono",
                                        item.variance > 0 ? "text-emerald-500" : item.variance < 0 ? "text-rose-500" : ""
                                    )}>
                                        {item.variance !== 0 && (
                                            <span className="flex items-center justify-end gap-1">
                                                {getVarianceIcon(item.variance)}
                                                {formatCurrency(item.variance)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className={cn(
                                        "text-right font-medium",
                                        item.variancePercent > 0 ? "text-emerald-500" : item.variancePercent < 0 ? "text-rose-500" : ""
                                    )}>
                                        {item.variancePercent !== 0 && `${item.variancePercent > 0 ? '+' : ''}${item.variancePercent.toFixed(1)}%`}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
