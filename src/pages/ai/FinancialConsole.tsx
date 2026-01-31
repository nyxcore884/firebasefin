import React, { useState } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Button,
    TextField,
    Divider,
    Paper,
    IconButton
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

import { ConsoleLayout } from '@/components/layout/ConsoleLayout';
import { MappingDashboard } from '@/components/dashboard/MappingDashboard';
import { FxImpactChart } from '@/components/dashboard/FxImpactChart';
import { ValidationDashboard } from '@/components/dashboard/ValidationDashboard';
import { NaturalLanguageFeedback } from '@/components/ai/NaturalLanguageFeedback';
import { ConfidenceWarning } from '@/components/ai/ConfidenceWarning';

// Mock components or simple implementations for internal panels

const ConsoleUpload = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => (
    <Box p={3} textAlign="center" border="2px dashed #ccc" borderRadius={2} m={2}>
        <UploadFileIcon sx={{ fontSize: 40, color: '#ccc' }} />
        <Typography variant="body1" color="text.secondary">
            Drag & drop financial reports here
        </Typography>
        <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload File
            <input hidden accept=".xlsx,.csv" multiple type="file" onChange={() => setTimeout(onUploadSuccess, 1000)} />
        </Button>
    </Box>
);

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

export const FinancialConsole: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'ai', text: 'Hello! I am your SGP Financial Intelligence Agent. Upload a file or ask me about the variances.', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [activeWidget, setActiveWidget] = useState<'mapping' | 'fx' | 'validation' | 'pipeline'>('validation');

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newMsg: Message = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Heuristic to switch widgets based on query (Mocking Intelligence Layer triggering UI changes)
        if (input.toLowerCase().includes('fx') || input.toLowerCase().includes('currency')) {
            setActiveWidget('fx');
        } else if (input.toLowerCase().includes('mapping') || input.toLowerCase().includes('missing')) {
            setActiveWidget('mapping');
        }

        try {
            // Call Backend
            const res = await fetch('http://localhost:8000/api/v1/financial-ai/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input })
            });
            const data = await res.json();

            // Construct AI Response
            let responseText = "I processed your request.";
            if (data.data && Array.isArray(data.data)) {
                responseText = `I found ${data.data.length} records matching your query. Check the visualization panel.`;
            } else if (data.sql) {
                responseText = `I generated the SQL: ${data.sql}`;
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: responseText,
                timestamp: new Date(),
                confidenceScore: data.confidence_score,
                confidenceReason: data.confidence_reason
            } as any;
            setMessages(prev => [...prev, aiMsg]);

            // Add Feedback Prompt if it was a query
            if (data.sql) {
                const feedbackMsg: Message = {
                    id: (Date.now() + 2).toString(),
                    sender: 'ai',
                    text: '',
                    timestamp: new Date(),
                    isFeedback: true,
                    originalQuery: input,
                    generatedSql: data.sql,
                    requestId: (Date.now()).toString()
                } as any;
                setMessages(prev => [...prev, feedbackMsg]);
            }

        } catch (err) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: "Sorry, I encountered an error connecting to the Intelligence Engine.", timestamp: new Date() };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    const LeftPanel = (
        <>
            <Box p={2} borderBottom="1px solid #eee">
                <Typography variant="h6" color="primary">Data Context</Typography>
            </Box>
            <ConsoleUpload onUploadSuccess={() => {
                const uploadMsg: Message = { id: Date.now().toString(), sender: 'ai', text: "File uploaded successfully. I've detected some unmapped items.", timestamp: new Date() };
                setMessages(prev => [...prev, uploadMsg]);
                setActiveWidget('mapping');
            }} />
            <List component="nav">
                <ListItem disablePadding>
                    <ListItemButton onClick={() => setActiveWidget('validation')} selected={activeWidget === 'validation'}>
                        <ListItemIcon><TableChartIcon /></ListItemIcon>
                        <ListItemText primary="Latest Upload (Jan 25)" secondary="Status: Unverified" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => setActiveWidget('mapping')}>
                        <ListItemIcon>
                            <WarningAmberIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText primary="Mapping Issues" secondary="3 Unmapped Items" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => setActiveWidget('pipeline')}>
                        <ListItemIcon><HealthAndSafetyIcon /></ListItemIcon>
                        <ListItemText primary="Pipeline Health" secondary="All Systems Go" />
                    </ListItemButton>
                </ListItem>
            </List>
        </>
    );

    const MainPanel = (
        <>
            <Box p={2} borderBottom="1px solid #eee" display="flex" justifyContent="space-between">
                <Typography variant="h6">Financial Intelligence Chat</Typography>
            </Box>
            <Box flex={1} p={2} sx={{ overflowY: 'auto' }}>
                {messages.map(msg => (
                    <Box key={msg.id} display="flex" justifyContent={msg.sender === 'user' ? 'flex-end' : 'flex-start'} mb={2}>
                        {msg.sender === 'ai' && !((msg as any).isFeedback) && <SmartToyIcon sx={{ mr: 1, color: 'primary.main', mt: 0.5 }} />}

                        {(msg as any).isFeedback ? (
                            <Box width="100%">
                                <NaturalLanguageFeedback
                                    requestId={(msg as any).requestId}
                                    originalQuery={(msg as any).originalQuery}
                                    generatedSql={(msg as any).generatedSql}
                                />
                            </Box>
                        ) : (
                            <Paper sx={{
                                p: 2,
                                bgcolor: msg.sender === 'user' ? 'primary.main' : '#fff',
                                color: msg.sender === 'user' ? '#fff' : 'text.primary',
                                maxWidth: '80%'
                            }}>
                                {(msg as any).confidenceScore !== undefined && (msg as any).confidenceScore < 0.85 && (
                                    <ConfidenceWarning
                                        score={(msg as any).confidenceScore}
                                        reasonCode={(msg as any).confidenceReason}
                                        lastUpdate={new Date().toISOString()} // Mock: Freshness
                                    />
                                )}
                                <Typography variant="body1">{msg.text}</Typography>
                            </Paper>
                        )}
                    </Box>
                ))}
            </Box>
            <Divider />
            <Box p={2} display="flex" gap={1}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Ask about margins, tax leakage, or forecast..."
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                    onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button variant="contained" endIcon={<SendIcon />} onClick={handleSendMessage}>
                    Send
                </Button>
            </Box>
        </>
    );

    const RightPanel = (
        <>
            <Box p={2} borderBottom="1px solid #eee">
                <Typography variant="h6">Live Analysis</Typography>
            </Box>
            <Box flex={1} p={2} sx={{ overflowY: 'auto' }}>
                {activeWidget === 'mapping' && <MappingDashboard />}
                {activeWidget === 'validation' && <ValidationDashboard />}
                {activeWidget === 'fx' && <FxImpactChart />}

                {/* Fallback info */}
                <Box mt={4} textAlign="center">
                    <Typography variant="caption" color="text.secondary">
                        Widget Area updates based on context.
                    </Typography>
                </Box>
            </Box>
        </>
    );

    return <ConsoleLayout leftPanel={LeftPanel} mainPanel={MainPanel} rightPanel={RightPanel} />;
};
