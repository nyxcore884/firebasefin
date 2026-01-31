import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Brain, TrendingUp, Zap, Clock } from 'lucide-react';

const performanceData = [
    { name: 'Jan', accuracy: 85, latency: 120 },
    { name: 'Feb', accuracy: 88, latency: 115 },
    { name: 'Mar', accuracy: 87, latency: 110 },
    { name: 'Apr', accuracy: 92, latency: 105 },
    { name: 'May', accuracy: 94, latency: 98 },
    { name: 'Jun', accuracy: 95, latency: 96 },
    { name: 'Jul', accuracy: 98.4, latency: 94 },
];

export const LearningDashboard = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Model Confidence', value: '98.4%', icon: Brain, color: 'text-indigo-500', trend: '+1.2%' },
                    { label: 'Avg Latency', value: '94ms', icon: Zap, color: 'text-amber-500', trend: '-12%' },
                    { label: 'Learning Epochs', value: '1,250', icon: TrendingUp, color: 'text-emerald-500', trend: 'Stable' },
                    { label: 'Last Training', value: '2h ago', icon: Clock, color: 'text-primary', trend: 'Success' }
                ].map((stat, i) => (
                    <Card key={i} className="glass-vivid border-primary/10">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-2 rounded-lg bg-background/50 border border-white/5 ${stat.color}`}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                                <Badge variant="outline" className="text-[8px] font-black">{stat.trend}</Badge>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                <p className="text-xl font-black">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="glass-vivid border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase italic tracking-widest">Accuracy vs. Latency Over Time</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/60">Historical Performance Metrics from Vertex AI Logs</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#ffffff40"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#ffffff40"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[80, 100]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '10px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="accuracy"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAcc)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-vivid border-primary/10">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase italic">Model Training Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[
                            { epoch: 1250, loss: 0.0024, accuracy: 0.984, status: 'Completed' },
                            { epoch: 1200, loss: 0.0031, accuracy: 0.979, status: 'Completed' },
                            { epoch: 1150, loss: 0.0045, accuracy: 0.962, status: 'Completed' }
                        ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-mono text-muted-foreground">E-{log.epoch}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold">Accuracy: {(log.accuracy * 100).toFixed(1)}%</span>
                                        <span className="text-[9px] text-muted-foreground uppercase">Loss: {log.loss}</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-[8px] uppercase text-emerald-500 border-emerald-500/20">{log.status}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
