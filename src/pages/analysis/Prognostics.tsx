
import React, { useState } from 'react';
import {
    TrendingUp, TrendingDown, Calendar, Target,
    Zap, Info, Download, Filter, RefreshCw, BarChart2
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';

const MOCK_DATA = [
    { month: 'Jan', actual: 950000, forecast: 950000 },
    { month: 'Feb', actual: 980000, forecast: 980000 },
    { month: 'Mar', actual: 1065000, forecast: 1065000 },
    { month: 'Apr', actual: null, forecast: 1100000, optimistic: 1150000, pessimistic: 1050000 },
    { month: 'May', actual: null, forecast: 1150000, optimistic: 1250000, pessimistic: 1080000 },
    { month: 'Jun', actual: null, forecast: 1210000, optimistic: 1350000, pessimistic: 1120000 },
    { month: 'Jul', actual: null, forecast: 1180000, optimistic: 1380000, pessimistic: 1050000 },
    { month: 'Aug', actual: null, forecast: 1250000, optimistic: 1480000, pessimistic: 1100000 },
];

export const Prognostics: React.FC = () => {
    const [scenario, setScenario] = useState<'neutral' | 'optimistic' | 'pessimistic'>('neutral');
    const [showConfidence, setShowConfidence] = useState(true);

    const handleScenarioChange = (value: string) => {
        if (value) setScenario(value as 'neutral' | 'optimistic' | 'pessimistic');
    };

    const getActiveDataKey = () => {
        if (scenario === 'optimistic') return 'optimistic';
        if (scenario === 'pessimistic') return 'pessimistic';
        return 'forecast';
    };

    const currentScenarioColor = () => {
        if (scenario === 'optimistic') return 'var(--primary)';
        if (scenario === 'pessimistic') return '#f43f5e';
        return 'var(--primary)';
    };

    return (
        <div className="p-4 md:p-6 max-w-[1800px] mx-auto space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end pb-4 border-b border-border gap-4">
                <div className="space-y-1">
                    <span className="text-primary font-black tracking-[0.3em] block text-[9px] uppercase italic">
                        Predictive Intelligence
                    </span>
                    <div className="flex items-center gap-3">
                        <Zap size={32} className="text-primary" />
                        <h1 className="text-3xl font-black text-foreground font-display uppercase tracking-tighter">
                            Advanced Prognostics
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg font-bold uppercase text-[9px] h-8 tracking-widest">
                        <Download size={14} className="mr-1.5" /> Export
                    </Button>
                    <Button size="sm" className="rounded-lg px-4 font-bold uppercase text-[9px] h-8 tracking-widest shadow-lg shadow-primary/20">
                        <RefreshCw size={14} className="mr-1.5" /> Re-Scan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Scenario Controls */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="nyx-card p-4 space-y-6">
                        <h2 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Scenario Analysis</h2>

                        <div className="space-y-4">
                            <div>
                                <span className="text-foreground text-[10px] font-black uppercase mb-2 block">Growth Strategy</span>
                                <ToggleGroup
                                    type="single"
                                    value={scenario}
                                    onValueChange={handleScenarioChange}
                                    className="bg-accent/20 rounded-lg p-1 border border-border"
                                >
                                    <ToggleGroupItem value="pessimistic" className="flex-1 text-[9px] font-bold uppercase py-1 data-[state=on]:bg-rose-500/20 data-[state=on]:text-rose-500 border-none">MIN</ToggleGroupItem>
                                    <ToggleGroupItem value="neutral" className="flex-1 text-[9px] font-bold uppercase py-1 data-[state=on]:bg-primary/20 data-[state=on]:text-primary border-none">BASE</ToggleGroupItem>
                                    <ToggleGroupItem value="optimistic" className="flex-1 text-[9px] font-bold uppercase py-1 data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-500 border-none">MAX</ToggleGroupItem>
                                </ToggleGroup>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase">
                                        <span className="text-muted-foreground">Gas Price Index</span>
                                        <span className="text-primary">+4.2%</span>
                                    </div>
                                    <Slider defaultValue={[4.2]} step={0.1} min={-10} max={10} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase">
                                        <span className="text-muted-foreground">Operational Risk</span>
                                        <span className="text-rose-500">Low</span>
                                    </div>
                                    <Slider defaultValue={[15]} step={5} min={0} max={100} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <Switch id="show-confidence" checked={showConfidence} onCheckedChange={setShowConfidence} />
                                <Label htmlFor="show-confidence" className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer">Confidence Intervals</Label>
                            </div>
                        </div>

                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex gap-2">
                            <Info size={14} className="text-primary mt-0.5" />
                            <div className="text-[8px] font-bold uppercase text-primary/80 leading-tight">
                                Prophet-v2 Engine<br />Conf: 89.4%<br />Trained: 2h ago
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Visualization */}
                <div className="lg:col-span-3">
                    <div className="nyx-card p-6 h-[400px] flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-sm font-black text-foreground uppercase tracking-tight">Revenue Projection (2026)</h2>
                                <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">Predictive flow based on deep seasonal cycles</p>
                            </div>
                            <div className="flex gap-4 text-right">
                                <div>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase">Target</p>
                                    <p className="text-sm font-black text-primary uppercase">₾ 1.52M</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase">Range</p>
                                    <p className="text-sm font-black text-foreground uppercase italic">1.4M - 1.7M</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={MOCK_DATA}>
                                    <defs>
                                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={currentScenarioColor()} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={currentScenarioColor()} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: 'currentColor' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: 'currentColor' }} tickFormatter={(val) => `₾${val / 1000}k`} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }} />
                                    <Area type="monotone" dataKey="actual" stroke="var(--foreground)" strokeWidth={2} fill="none" name="Actual" />
                                    <Area type="monotone" dataKey={getActiveDataKey()} stroke={currentScenarioColor()} strokeWidth={2} fill="url(#colorArea)" name="Forecast" strokeDasharray="5 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Lower Panels */}
                <div className="lg:col-span-2">
                    <div className="nyx-card p-4 h-full">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                            <BarChart2 size={14} className="text-primary" /> Key Performance Drivers
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { name: 'Industrial Consumption', impact: '+12.4%', trend: 'up' },
                                { name: 'Tariff Regularization', impact: '+4.1%', trend: 'up' },
                                { name: 'Import Gas Volatility', impact: '-2.8%', trend: 'down' },
                                { name: 'New Connections', impact: '+1.5%', trend: 'up' }
                            ].map((driver, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border border-border/50">
                                    <span className="text-[10px] font-bold text-foreground uppercase">{driver.name}</span>
                                    <div className={cn("flex items-center gap-1 font-mono text-xs font-black", driver.trend === 'up' ? 'text-emerald-500' : 'text-rose-500')}>
                                        {driver.impact}
                                        {driver.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <div className="nyx-card p-4 border-primary/20 bg-primary/5 space-y-2">
                        <Target className="text-primary" size={24} />
                        <p className="text-2xl font-black text-foreground">₾1.95M</p>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">2026 Target</p>
                        <Progress value={54} className="h-1 bg-accent" />
                    </div>
                    <div className="nyx-card p-4 border-emerald-500/20 bg-emerald-500/5 space-y-2">
                        <Calendar className="text-emerald-500" size={24} />
                        <p className="text-2xl font-black text-foreground">32.4%</p>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">EBITDA Margin</p>
                        <div className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full inline-block uppercase">Optimized</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
