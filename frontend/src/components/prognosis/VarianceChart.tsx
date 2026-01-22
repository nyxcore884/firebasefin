import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VarianceDataPoint {
    category: string;
    budget: number;
    actual: number;
    variance: number;
}

interface VarianceChartProps {
    data: VarianceDataPoint[];
    title?: string;
}

export function VarianceChart({ data, title = "Budget vs Actual Variance" }: VarianceChartProps) {
    return (
        <Card className="h-full glass-premium overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg font-medium tracking-wide text-gradient-cyan">{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="category" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                            formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                        />
                        <Legend />
                        <Bar dataKey="budget" fill="#3B82F6" name="Budget" />
                        <Bar dataKey="actual" fill="#10B981" name="Actual" />
                        <Bar dataKey="variance" fill="#EF4444" name="Variance (Act - Bud)" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
