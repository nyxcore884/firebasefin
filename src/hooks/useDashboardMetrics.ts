import { useState, useEffect } from 'react';
import { financialService } from '../services/financialService';

export interface DashboardMetrics {
    current_period: string;
    previous_period: string;
    metrics: {
        total_revenue: MetricValue;
        total_cogs: MetricValue;
        gross_profit: MetricValue;
        total_expenses: MetricValue;
        ebitda: MetricValue;
        profit_margin: MetricValue;
    };
    top_products: TopItem[];
    top_expenses: TopItem[];
    revenue_trend: TrendItem[];
}

interface MetricValue {
    current: number;
    previous: number;
    growth_percentage?: number;
}

interface TopItem {
    name?: string;
    category?: string;
    revenue?: number;
    amount?: number;
    quantity?: number;
}

interface TrendItem {
    period: string;
    revenue: number;
}

export const useDashboardMetrics = (orgId: string, period: 'current_month' | 'current_quarter' | 'current_year' = 'current_month') => {
    const [data, setData] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchMetrics = async () => {
        if (!orgId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const metrics = await financialService.getDashboardMetrics(orgId, period);
            setData(metrics);
            setLastUpdate(new Date());
        } catch (err) {
            console.error('Failed to fetch dashboard metrics:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch metrics');

            // Fallback to mock data
            setData(generateMockData(period));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();

        // Auto-refresh every 2 minutes
        const interval = setInterval(fetchMetrics, 120000);

        return () => clearInterval(interval);
    }, [orgId, period]);

    return {
        data,
        loading,
        error,
        lastUpdate,
        refresh: fetchMetrics
    };
};

// Mock data generator for fallback
function generateMockData(period: string): DashboardMetrics {
    const now = new Date();
    const currentPeriod = now.toISOString().substring(0, 7);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const previousPeriod = previousMonth.toISOString().substring(0, 7);

    return {
        current_period: currentPeriod,
        previous_period: previousPeriod,
        metrics: {
            total_revenue: {
                current: 12500000,
                previous: 11200000,
                growth_percentage: 11.6
            },
            total_cogs: {
                current: 8500000,
                previous: 7800000,
                growth_percentage: 9.0
            },
            gross_profit: {
                current: 4000000,
                previous: 3400000,
                growth_percentage: 17.6
            },
            total_expenses: {
                current: 2100000,
                previous: 1950000,
                growth_percentage: 7.7
            },
            ebitda: {
                current: 1900000,
                previous: 1450000,
                growth_percentage: 31.0
            },
            profit_margin: {
                current: 32.0,
                previous: 30.4,
                growth_percentage: 5.3
            }
        },
        top_products: [
            { name: 'Euro Regular', revenue: 4500000, quantity: 2000000 },
            { name: 'Diesel', revenue: 3200000, quantity: 1500000 },
            { name: 'Premium', revenue: 2800000, quantity: 900000 },
            { name: 'Euro Diesel', revenue: 1500000, quantity: 650000 },
            { name: 'Super', revenue: 500000, quantity: 180000 }
        ],
        top_expenses: [
            { category: 'Operating Expenses', amount: 950000 },
            { category: 'Administrative', amount: 650000 },
            { category: 'Marketing', amount: 320000 },
            { category: 'IT & Technology', amount: 110000 },
            { category: 'Other', amount: 70000 }
        ],
        revenue_trend: Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (11 - i));
            return {
                period: date.toISOString().substring(0, 7),
                revenue: 9000000 + Math.random() * 4000000
            };
        })
    };
}
