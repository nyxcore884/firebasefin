import React, { useMemo } from 'react';
import { useRealTimeFinancialData } from '../../hooks/useRealTimeFinancialData';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Mock utils if not present yet
const formatCurrency = (val: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);
const formatPercentage = (val: any) => `${Number(val || 0).toFixed(2)}%`;
const getPeriodName = (id: string) => id; // Placeholder

interface FinancialTableProps {
    orgId: string;
    entityIds: string[];
    accountIds: string[];
    periodIds: string[];
    showCalculations?: boolean;
}

export const FinancialTable: React.FC<FinancialTableProps> = ({
    orgId,
    entityIds,
    accountIds,
    periodIds,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    showCalculations = true
}) => {
    // Real-time data from Firestore
    const { data, loading, error } = useRealTimeFinancialData({
        orgId,
        entityIds,
        accountIds,
        periodIds
    });

    const columns = useMemo(() => [
        {
            id: 'account_name',
            header: 'Account',
            width: '300px',
            align: 'left',
            cell: (row: any) => (
                <div
                    style={{ paddingLeft: `${(row.account?.hierarchy_level || 0) * 20}px` }}
                    className="flex items-center gap-2"
                >
                    {row.account?.is_calculated && <span className="text-xs">📊</span>}
                    <span className={cn(row.account?.is_calculated && "font-bold text-indigo-400")}>
                        {row.account?.account_name || 'Unknown'}
                    </span>
                </div>
            )
        },
        ...periodIds.map(periodId => ({
            id: `amount_${periodId}`,
            header: getPeriodName(periodId),
            width: '150px',
            align: 'right',
            cell: (row: any) => formatCurrency(row.metrics?.amount || 0)
        })),
        {
            id: 'ytd',
            header: 'YTD',
            width: '150px',
            align: 'right',
            cell: (row: any) => formatCurrency(row.derived?.ytd_amount)
        },
        {
            id: 'yoy_growth',
            header: 'YoY %',
            width: '100px',
            align: 'right',
            cell: (row: any) => {
                const val = row.derived?.yoy_growth_pct;
                return (
                    <span className={cn(
                        val > 0 ? 'text-emerald-500' : val < 0 ? 'text-rose-500' : 'text-slate-400'
                    )}>
                        {formatPercentage(val)}
                    </span>
                );
            }
        },
        {
            id: 'variance_to_budget',
            header: 'Budget Var %',
            width: '120px',
            align: 'right',
            cell: (row: any) => {
                const val = row.derived?.variance_to_budget_pct;
                return (
                    <span className={cn(
                        val > 0 ? 'text-emerald-500' : val < 0 ? 'text-rose-500' : 'text-slate-400'
                    )}>
                        {formatPercentage(val)}
                    </span>
                );
            }
        }
    ], [periodIds]);

    if (loading) return <div className="p-4 text-slate-400 animate-pulse">Loading financial data...</div>;
    if (error) return <div className="p-4 text-rose-500 bg-rose-500/10 rounded-lg">Error: {error.message}</div>;

    return (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-950/50 backdrop-blur-sm">
            <Table>
                <TableHeader className="bg-slate-900 border-b border-white/10">
                    <TableRow className="hover:bg-slate-900 border-white/10">
                        {columns.map((col: any) => (
                            <TableHead
                                key={col.id}
                                style={{ width: col.width }}
                                className={cn(
                                    "text-slate-400 font-medium whitespace-nowrap",
                                    col.align === 'right' && "text-right"
                                )}
                            >
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row: any) => (
                        <TableRow
                            key={row.id}
                            className={cn(
                                "border-white/5 hover:bg-white/5 transition-colors",
                                row.account?.is_calculated && "bg-indigo-500/5 hover:bg-indigo-500/10"
                            )}
                        >
                            {columns.map((col: any) => (
                                <TableCell
                                    key={`${row.id}-${col.id}`}
                                    className={cn(
                                        "py-2 font-medium text-slate-300",
                                        col.align === 'right' && "text-right"
                                    )}
                                >
                                    {col.cell ? col.cell(row) : row[col.id]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
