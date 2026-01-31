import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { FinancialRecord } from '../../hooks/useRealTimeFinancialData';

interface LiveRevenueChartProps {
    data: FinancialRecord[];
    entities: string[];
    dateRange: any; // Using any for simplicity in prototype, ideally specific type
}

const getPeriodName = (period: number) => `M${period}`; // Helper

export const LiveRevenueChart: React.FC<LiveRevenueChartProps> = ({
    data,
    entities,
    dateRange
}) => {
    // Transform data for chart
    const chartData = useMemo(() => {
        if (!data.length) return [];

        // Group by period
        const grouped = data.reduce((acc, record) => {
            // Logic assumes record.period structure from Updated Hook
            const period = record.period.month;
            if (!acc[period]) {
                acc[period] = { period: getPeriodName(period), periodIndex: period };
            }

            // Add entity data
            const entityName = record.entity.entity_name || record.entity_id;
            if (!acc[period][entityName]) {
                acc[period][entityName] = 0;
            }

            acc[period][entityName] += record.metrics.amount;

            return acc;
        }, {} as Record<string, any>);

        // Sort by period
        return Object.values(grouped).sort((a: any, b: any) => a.periodIndex - b.periodIndex);
    }, [data]);

    const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b']; // Violet, Cyan, Pink, Emerald, Amber

    if (!chartData.length) {
        return (
            <div className="flex justify-center items-center h-[350px]">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[450px]">
            <h3 className="text-lg font-bold text-foreground mb-4 tracking-wide font-display">
                Revenue by Entity (Live)
            </h3>

            <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="period"
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            tickFormatter={(value) => `₾${(value / 1000000).toFixed(1)}M`}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)',
                                color: '#fff',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ color: '#e2e8f0' }}
                            formatter={(value: any) =>
                                [`₾${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 'Revenue']
                            }
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {entities.map((entity, index) => (
                            <Line
                                key={entity} // Use entity ID or name
                                type="monotone"
                                dataKey={entity} // This needs to match the key in processed data (entityName)
                                stroke={colors[index % colors.length]}
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                animationDuration={1500}
                            />
                        ))}

                        <ReferenceLine
                            y={100000000}
                            stroke="#f43f5e"
                            strokeDasharray="3 3"
                            label={{ value: "Budget Target", fill: "#f43f5e", fontSize: 10 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
