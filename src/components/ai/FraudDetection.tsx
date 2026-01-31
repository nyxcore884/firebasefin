import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ShieldAlert, Fingerprint, Repeat } from 'lucide-react';
import { AIText } from '@/components/common/AIText';

const fraudPatterns = [
    {
        id: 'P-001',
        name: "Benford's Law Violation",
        description: "Abnormal distribution of first digits in transaction amounts.",
        risk: 'High',
        count: 12,
        icon: Fingerprint
    },
    {
        id: 'P-002',
        name: 'Split Transactions',
        description: "Multiple transactions just below authorization thresholds.",
        risk: 'Critical',
        count: 3,
        icon: Repeat
    },
    {
        id: 'P-003',
        name: 'Ghost Vendor Activity',
        description: "Payments to bank accounts not associated with verified vendors.",
        risk: 'High',
        count: 1,
        icon: ShieldAlert
    }
];

export const FraudDetection = ({ externalAnomalies = [] }: { externalAnomalies?: any[] }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fraudPatterns.map((p) => (
                    <Card key={p.id} className="glass-vivid border-primary/10 hover:border-primary/30 transition-all cursor-pointer group">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <p.icon className="h-4 w-4 text-primary" />
                                </div>
                                <Badge variant={p.risk === 'Critical' ? 'destructive' : 'default'} className="text-[8px] uppercase">
                                    {p.risk}
                                </Badge>
                            </div>
                            <CardTitle className="text-xs font-black uppercase mt-4 tracking-widest">{p.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{p.description}</p>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase opacity-50">Active Alerts</span>
                                <span className="text-sm font-black text-primary">{p.count}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="glass-vivid border-rose-500/20 bg-rose-500/5 shadow-2xl">
                <CardHeader className="border-b border-rose-500/10">
                    <CardTitle className="text-rose-500 flex items-center gap-2 text-sm font-black uppercase italic">
                        <AlertTriangle className="h-4 w-4" /> Live Fraud Detection Feed
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-rose-500/60">Cross-referencing Ledger vs. Verified Master Data</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-rose-500/5">
                            <TableRow className="border-rose-500/10 hover:bg-transparent">
                                <TableHead className="text-rose-400 text-[10px] font-black uppercase">Timestamp</TableHead>
                                <TableHead className="text-rose-400 text-[10px] font-black uppercase">Pattern</TableHead>
                                <TableHead className="text-rose-400 text-[10px] font-black uppercase">Entity</TableHead>
                                <TableHead className="text-rose-400 text-[10px] font-black uppercase text-right">Confidence</TableHead>
                                <TableHead className="text-rose-400 text-[10px] font-black uppercase text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(externalAnomalies.length > 0 ? externalAnomalies : [
                                { id: 'ANOMALY-P1', type: 'BENFORD_LAW_SHIFT', metric: 'REVENUE', score: 'High (92%)', severity: 'Investigate' },
                                { id: 'ANOMALY-P2', type: 'SPLIT_POSTING', metric: 'OPEX', score: 'Medium (88%)', severity: 'Investigate' }
                            ]).map((a, i) => (
                                <TableRow key={i} className="border-rose-500/10 hover:bg-rose-500/10 transition-colors cursor-pointer">
                                    <TableCell className="text-[10px] font-mono text-rose-300">2026-01-26 14:22</TableCell>
                                    <TableCell className="text-[10px] font-bold text-rose-200">{a.type}</TableCell>
                                    <TableCell className="text-[10px] font-mono text-rose-300">{a.metric || 'GLOBAL'}</TableCell>
                                    <TableCell className="text-right text-rose-400 font-black">{typeof a.score === 'number' ? `${(a.score * 100).toFixed(0)}%` : a.score}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge className="bg-rose-500 text-white border-none text-[8px] font-black uppercase">
                                            {a.severity || 'Investigate'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
