import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Alert,
    Button
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ValidationIssue {
    unknown_item: string;
    Amount_Gel: number;
    issue_type: string;
    recommendation: string;
}

export const ValidationDashboard: React.FC = () => {
    const [issues, setIssues] = useState<ValidationIssue[]>([]);
    const [loading, setLoading] = useState(false);

    // In a real app, this would likely be triggered by a specific upload or on page load for the "current" dataset.
    // For demo, we might trigger it manually or mock the call.
    // Assuming we have an API client setup.

    const runValidation = async () => {
        setLoading(true);
        try {
            // Replace with actual API call
            const response = await fetch('http://localhost:8000/api/v1/financial-ai/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table_id: 'studio-9381016045-4d625.financial_data.latest_upload' }) // Example table
            });
            const data = await response.json();
            if (data.issues) {
                setIssues(data.issues);
            }
        } catch (error) {
            console.error("Validation failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card sx={{ mt: 3, mb: 3 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" display="flex" alignItems="center">
                        <WarningAmberIcon color="warning" sx={{ mr: 1 }} />
                        Data Validation & Mapping Status
                    </Typography>
                    <Button variant="outlined" onClick={runValidation} disabled={loading}>
                        {loading ? 'Checking...' : 'Run Validation'}
                    </Button>
                </Box>

                {issues.length === 0 ? (
                    <Alert severity="success">All products in the active dataset are correctly mapped.</Alert>
                ) : (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {issues.length} items found with missing mappings. These will be categorized as "Other" or excluded from margin calculations.
                        </Alert>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Unknown Item</TableCell>
                                    <TableCell>Amount (GEL)</TableCell>
                                    <TableCell>Issue</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {issues.map((issue, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{issue.unknown_item}</TableCell>
                                        <TableCell>{issue.Amount_Gel?.toLocaleString()}</TableCell>
                                        <TableCell>{issue.issue_type}</TableCell>
                                        <TableCell>{issue.recommendation}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
