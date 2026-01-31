import React, { useMemo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { FinancialRecord } from '../../hooks/useRealTimeFinancialData';

interface LiveVarianceAnalysisProps {
    actual: FinancialRecord[];
    budget: FinancialRecord[];
}

export const LiveVarianceAnalysis: React.FC<LiveVarianceAnalysisProps> = ({
    actual,
    budget
}) => {
    const variances = useMemo(() => {
        // Calculate variances in real-time
        return actual.map(actualRecord => {
            const budgetRecord = budget.find(
                b => b.account_id === actualRecord.account_id &&
                    b.entity_id === actualRecord.entity_id &&
                    b.period_id === actualRecord.period_id
            );

            if (!budgetRecord) return null;

            const variance = actualRecord.metrics.amount - budgetRecord.metrics.amount;
            const amount = budgetRecord.metrics.amount;
            const variancePct = amount !== 0 ? (variance / amount) * 100 : 0;

            return {
                account_name: actualRecord.account.account_name,
                actual: actualRecord.metrics.amount,
                budget: budgetRecord.metrics.amount,
                variance,
                variancePct,
                isFavorable: actualRecord.account.account_type === 'revenue'
                    ? variance > 0
                    : variance < 0
            };
        }).filter(Boolean) as any[]; // casting for simplicity in filtering
    }, [actual, budget]);

    // Sort by absolute variance
    const sortedVariances = useMemo(() => {
        return [...variances].sort((a, b) =>
            Math.abs(b.variancePct) - Math.abs(a.variancePct)
        ).slice(0, 10);  // Top 10
    }, [variances]);

    return (
        <div className="w-full">
            <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Account</th>
                            <th className="px-4 py-3 text-right">Actual</th>
                            <th className="px-4 py-3 text-right">Budget</th>
                            <th className="px-4 py-3 text-right rounded-tr-lg">Variance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedVariances.map((row, index) => (
                            <tr
                                key={index}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                            >
                                <td className="px-4 py-3 font-medium text-slate-200">{row.account_name}</td>
                                <td className="px-4 py-3 text-right text-slate-300 font-mono">
                                    ₾{row.actual.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-300 font-mono">
                                    ₾{row.budget.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {row.variancePct > 0 ? (
                                            <ArrowUp className="text-emerald-400 w-4 h-4" />
                                        ) : (
                                            <ArrowDown className="text-rose-400 w-4 h-4" />
                                        )}
                                        <span className={`font-bold font-mono ${row.isFavorable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {row.variancePct.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
