import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Grid, Typography, Box, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface StageStatus {
    status: 'success' | 'warning' | 'error' | 'pending';
    last_run: string;
    message: string;
}

interface PipelineStatus {
    [key: string]: StageStatus;
}

export const PipelineMonitor: React.FC = () => {
    const [status, setStatus] = useState<PipelineStatus | null>(null);

    useEffect(() => {
        // Poll every 5s in demo, or fetch once
        const fetchStatus = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/analytics-engine/pipeline/status');
                const data = await res.json();
                setStatus(data);
            } catch (err) {
                console.error("Pipeline fetch error", err);
            }
        };
        fetchStatus();
    }, []);

    if (!status) return null;

    const renderIcon = (s: string) => {
        switch (s) {
            case 'success': return <CheckCircleIcon color="success" />;
            case 'warning': return <WarningIcon color="warning" />;
            case 'error': return <ErrorIcon color="error" />;
            default: return <AccessTimeIcon color="action" />;
        }
    };

    const stages = [
        { key: 'ingest', label: '1. Ingest' },
        { key: 'process', label: '2. Process' },
        { key: 'predict', label: '3. Predict' },
        { key: 'serve', label: '4. Serve' },
    ];

    return (
        <Card sx={{ mt: 3, mb: 3 }}>
            <CardHeader title="Pipeline Health Monitor" subheader="Real-time Data Flow Status" />
            <CardContent>
                <Grid container spacing={2}>
                    {stages.map((stage) => {
                        const data = status[stage.key];
                        if (!data) return null;
                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stage.key}>
                                <Box p={2} border={1} borderColor="divider" borderRadius={2} textAlign="center">
                                    <Box mb={1}>{renderIcon(data.status)}</Box>
                                    <Typography variant="h6" gutterBottom>{stage.label}</Typography>
                                    <Chip
                                        label={data.status.toUpperCase()}
                                        color={data.status === 'success' ? 'success' : data.status === 'warning' ? 'warning' : 'default'}
                                        size="small"
                                        sx={{ mb: 1 }}
                                    />
                                    <Typography variant="caption" display="block" color="textSecondary">
                                        Last Run: {data.last_run}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                        {data.message}
                                    </Typography>
                                </Box>
                            </Grid>
                        )
                    })}
                </Grid>
            </CardContent>
        </Card>
    );
};
