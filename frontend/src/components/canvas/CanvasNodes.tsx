import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Metric Node Component
export const MetricNode = memo(({ data }: { data: any }) => {
    return (
        <Card className="min-w-[200px] border-none shadow-sm bg-background/50 hover:bg-background transition-colors">
            <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {data.label}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="text-3xl font-bold text-foreground">{data.value}</div>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${data.trend === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        {data.trend === 'up' ? '↑' : '↓'} {data.subtext}
                    </span>
                </div>
            </CardContent>
            {/* Hidden handles for potential future connections, but invisible for "Report" look */}
            <Handle type="source" position={Position.Right} className="opacity-0 w-0 h-0" />
            <Handle type="target" position={Position.Left} className="opacity-0 w-0 h-0" />
        </Card>
    );
});

// Chart Node Component
export const ChartNode = memo(({ data }: { data: any }) => {
    return (
        <Card className="w-[450px] h-[320px] border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="p-4 py-3 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">{data.title}</CardTitle>
                <div className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
                    Live Data
                </div>
            </CardHeader>
            <CardContent className="p-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#888888' }} dy={10} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} tick={{ fill: '#888888' }} />
                        <Tooltip
                            cursor={{ fill: 'var(--muted)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
            <Handle type="target" position={Position.Left} className="opacity-0 w-0 h-0" />
            <Handle type="source" position={Position.Right} className="opacity-0 w-0 h-0" />
        </Card>
    );
});
