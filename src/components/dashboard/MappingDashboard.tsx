import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    TextField,
    Box,
    Alert,
    CircularProgress,
    IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface MappingSuggestion {
    raw_item: string;
    suggested_keyword: string;
    confidence: number;
}

export const MappingDashboard: React.FC = () => {
    const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            // Adjust proxy/URL if needed
            const res = await fetch('http://localhost:8000/api/v1/auto-clean/suggestions');
            const data = await res.json();
            setSuggestions(data);
        } catch (err) {
            setError('Failed to load suggestions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const handleConfirm = async (index: number, raw: string, keyword: string) => {
        try {
            await fetch('http://localhost:8000/api/v1/auto-clean/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_item: raw, keyword: keyword })
            });
            // Optimistic update
            setSuggestions(prev => prev.filter((_, i) => i !== index));
        } catch (err) {
            alert("Error saving mapping");
        }
    };

    return (
        <Card sx={{ mt: 3, maxHeight: 600, overflow: 'auto' }}>
            <CardHeader
                title={
                    <Box display="flex" alignItems="center">
                        <AutoFixHighIcon color="primary" sx={{ mr: 1 }} />
                        Mapping Suggestions (Auto-Clean)
                    </Box>
                }
                action={
                    <Button size="small" onClick={fetchSuggestions} disabled={loading}>
                        Refresh
                    </Button>
                }
            />
            <CardContent>
                {loading && <CircularProgress size={24} />}
                {error && <Alert severity="error">{error}</Alert>}

                {!loading && suggestions.length === 0 && !error && (
                    <Alert severity="success">No unmapped items found needing review.</Alert>
                )}

                <List>
                    {suggestions.map((item, idx) => (
                        <ListItem
                            key={idx}
                            secondaryAction={
                                <Button
                                    variant="contained"
                                    color="success"
                                    endIcon={<CheckCircleIcon />}
                                    onClick={() => handleConfirm(idx, item.raw_item, item.suggested_keyword)}
                                >
                                    Confirm
                                </Button>
                            }
                            disablePadding
                            sx={{ mb: 1, borderBottom: '1px solid #eee', pb: 1 }}
                        >
                            <ListItemText
                                primary={<Typography variant="subtitle1">Raw: <b>{item.raw_item}</b></Typography>}
                                secondary={
                                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                        <Typography variant="body2" color="text.secondary">Suggested:</Typography>
                                        <TextField
                                            size="small"
                                            variant="outlined"
                                            defaultValue={item.suggested_keyword}
                                            // In real app, update state on change
                                            InputProps={{ readOnly: true, sx: { bgcolor: '#f5f5f5' } }}
                                        />
                                        <Typography variant="caption" color={item.confidence > 0.7 ? 'success.main' : 'warning.main'}>
                                            {Math.round(item.confidence * 100)}% Match
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};
