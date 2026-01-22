
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ForecastDataPoint {
    month: string;
    baseline: number;
    optimistic: number;
    pessimistic: number;
}

interface ScenarioChartProps {
    data: ForecastDataPoint[];
    title?: string;
}

export function ScenarioChart({ data, title = "Revenue Forecast (GEL)" }: ScenarioChartProps) {
    return (
        <Card className="h-full glass-premium overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="text-lg font-medium tracking-wide text-gradient-cyan">{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="optimistic"
                            stroke="#10B981"
                            name="Optimistic (+15%)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="baseline"
                            stroke="#3B82F6"
                            name="Baseline"
                            strokeWidth={3}
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="pessimistic"
                            stroke="#EF4444"
                            name="Pessimistic (-15%)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
