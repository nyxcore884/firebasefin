import React from 'react';
import { Box, Paper } from '@mui/material';

interface ConsoleLayoutProps {
    leftPanel: React.ReactNode;
    mainPanel: React.ReactNode;
    rightPanel: React.ReactNode;
}

export const ConsoleLayout: React.FC<ConsoleLayoutProps> = ({ leftPanel, mainPanel, rightPanel }) => {
    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 2fr) minmax(350px, 1fr)',
            gap: 2,
            p: 2,
            height: 'calc(100vh - 80px)', // Adjust based on header height 
            bgcolor: '#f4f6f8'
        }}>
            {/* Left Panel: Context / Upload */}
            <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {leftPanel}
            </Paper>

            {/* Center Panel: Intelligence / Chat */}
            <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {mainPanel}
            </Paper>

            {/* Right Panel: Live Analysis Widgets */}
            <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {rightPanel}
            </Paper>
        </Box>
    );
};
