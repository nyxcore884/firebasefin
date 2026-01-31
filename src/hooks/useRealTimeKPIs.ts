import { useState, useEffect } from 'react';
import { useRealTimeFinancialData } from './useRealTimeFinancialData';

interface UseRealTimeKPIsProps {
    orgId: string;
    dateRange?: any;
    entities?: string[];
}

export const useRealTimeKPIs = ({ orgId, entities }: UseRealTimeKPIsProps) => {
    // Leverage the main financial data hook to get raw data first
    const { data, isLive, lastUpdate } = useRealTimeFinancialData({
        orgId,
        entityIds: entities,
        // in a real scenario we'd pass account IDs for specific KPIs (Revenue, EBITDA)
    });

    const [kpis, setKpis] = useState({
        revenue: 0,
        revenueChange: 0,
        revenueTrend: 'stable' as 'up' | 'down' | 'stable',
        ebitda: 0,
        ebitdaChange: 0,
        ebitdaTrend: 'stable' as 'up' | 'down' | 'stable',
        netMargin: 0,
        netMarginChange: 0,
        netMarginTrend: 'stable' as 'up' | 'down' | 'stable'
    });

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Simple client-side aggregation logic for demo purposes
        // In production, this might be pre-calculated by backend or more robust

        let totalRevenue = 0;
        let totalEbitda = 0;

        data.forEach(record => {
            // Basic logic: check account type or name
            if (record.account?.account_type === 'revenue' || record.account?.account_name?.toLowerCase().includes('revenue')) {
                totalRevenue += record.metrics.amount || 0;
            }
            if (record.account?.account_name?.toLowerCase().includes('ebitda')) {
                totalEbitda += record.metrics.amount || 0;
            }
        });

        // Mocking 'change' and 'trend' as we don't have historical comparison readily available in this simple view
        // In a full impl, we'd fetch previous period data too.

        setKpis({
            revenue: totalRevenue,
            revenueChange: 5.2, // Mocked for demo visualization
            revenueTrend: 'up',
            ebitda: totalEbitda,
            ebitdaChange: -1.1,
            ebitdaTrend: 'down',
            netMargin: totalRevenue > 0 ? (totalEbitda / totalRevenue) * 100 : 0,
            netMarginChange: 0.5,
            netMarginTrend: 'stable'
        });

    }, [data]);

    return { kpis, lastUpdated: lastUpdate };
};
