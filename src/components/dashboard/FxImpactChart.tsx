import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const data = [
    { date: '2025-01-09', net_fx_impact_gel: 6 },
    { date: '2025-01-23', net_fx_impact_gel: 113 },
    { date: '2025-01-31', net_fx_impact_gel: 1295917 },
];

export const FxImpactChart: React.FC = () => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Net Foreign Exchange (FX) Impact Trend - January 2025
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Shows the surge in FX expenses at month-end, impacting Wholesale margins.
                </Typography>

                <Box sx={{ height: 300, width: '100%' }}>
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
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()} GEL`, "Net FX Impact"]} />
                            <ReferenceLine y={0} stroke="#000" />
                            <Bar dataKey="net_fx_impact_gel" fill="#ff7043" name="Net FX Impact (GEL)" />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};
