import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { AIText } from '@/components/common/AIText';

interface WaterfallItem {
    name: string;
    value: number;
}

interface WaterfallChartProps {
    data: WaterfallItem[];
    budgetLabel?: string;
    actualLabel?: string;
    budgetTotal?: number;
    actualTotal?: number;
}

const WaterfallChart = ({
    data,
    budgetLabel = "Budget",
    actualLabel = "Actual",
    budgetTotal = 0,
    actualTotal = 0
}: WaterfallChartProps) => {

    // Process data for waterfall logic
    let cumulative = budgetTotal;

    // We use a stacked bar chart to simulate waterfall
    // Bar 1: Transparent base
    // Bar 2: The visible variance
    const chartData = [
        {
            name: budgetLabel,
            base: 0,
            val: budgetTotal,
            display: budgetTotal,
            isTotal: true,
            color: '#6366f1'
        },
        ...data.map(item => {
            const start = cumulative;
            cumulative += item.value;

            // If expense increase (item.value > 0), bar goes UP from 'start'
            // If expense decrease (item.value < 0), bar goes DOWN from 'start'
            const isFavorable = item.value < 0; // Assuming expense focus

            return {
                name: item.name,
                base: Math.min(start, cumulative),
                val: Math.abs(item.value),
                display: item.value,
                isTotal: false,
                color: isFavorable ? '#10b981' : '#f87171' // Green for favorable, Red for adverse
            };
        }),
        {
            name: actualLabel,
            base: 0,
            val: actualTotal,
            display: actualTotal,
            isTotal: true,
            color: '#3b82f6'
        }
    ];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-background/95 backdrop-blur-md border border-primary/20 p-3 rounded-lg shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{item.name}</p>
                    <p className="text-sm font-black italic mt-1">
                        {item.isTotal ? '' : (item.display > 0 ? '+' : '')}
                        {item.display.toLocaleString()} GEL
                    </p>
                    {!item.isTotal && (
                        <p className={`text-[8px] font-bold uppercase mt-1 ${item.display < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.display < 0 ? 'Favorable Impact' : 'Adverse Impact'}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                        tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />

                    {/* The Transparent Base */}
                    <Bar dataKey="base" stackId="a" fill="transparent" />

                    {/* The Visible Bar */}
                    <Bar dataKey="val" stackId="a">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-[8px] font-black uppercase text-muted-foreground"><AIText>Total Base/Result</AIText></span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-[8px] font-black uppercase text-muted-foreground"><AIText>Adverse Impact</AIText></span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-[8px] font-black uppercase text-muted-foreground"><AIText>Favorable Impact</AIText></span>
                </div>
            </div>
        </div>
    );
};

export default WaterfallChart;
