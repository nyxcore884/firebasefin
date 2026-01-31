
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Oct', accuracy: 72 },
    { name: 'Nov', accuracy: 78 },
    { name: 'Dec', accuracy: 88 },
    { name: 'Jan', accuracy: 94 },
];

export const AiAccuracyChart: React.FC = () => {
    return (
        <div className="nyx-card p-4">
            <h2 className="text-[9px] font-black font-display uppercase tracking-[0.2em] text-muted-foreground mb-4 italic">Accuracy Curve</h2>
            <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'currentColor', fontSize: 8, fontWeight: 700 }}
                            className="text-muted-foreground"
                        />
                        <YAxis
                            hide
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            dot={{ fill: 'var(--primary)', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-between items-center border-t border-border pt-2">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-muted-foreground uppercase">Base</span>
                    <span className="text-xs font-black text-foreground">72%</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[8px] font-black text-primary uppercase">Optimized</span>
                    <span className="text-xs font-black text-primary">94.8%</span>
                </div>
            </div>
        </div>
    );
};
