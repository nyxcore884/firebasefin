import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface IngestionLog {
    id: string;
    fileName: string;
    uploadDate: string; // ISO string
    status: 'Processing' | 'Transforming' | 'Loaded' | 'Error';
    targetCollection: string;
    droppedRows?: number;
    error?: string;
    rowsProcessed?: number;
}

const PipelineMonitor = () => {
    const [logs, setLogs] = useState<IngestionLog[]>([]);

    useEffect(() => {
        // Mock subscription or real one if the backend was fully ready. 
        // Implementing a "mock" live effect for demonstration until backend writes to this path.
        const mockLogs: IngestionLog[] = [
            { id: '1', fileName: 'July SGG.csv', uploadDate: new Date().toISOString(), status: 'Loaded', targetCollection: 'july_sgg_transactions', rowsProcessed: 1450 },
            { id: '2', fileName: 'Budget Template v2.xlsx', uploadDate: new Date(Date.now() - 3600000).toISOString(), status: 'Transforming', targetCollection: 'detailed_budget' },
            { id: '3', fileName: 'Loans_2024.txt', uploadDate: new Date(Date.now() - 7200000).toISOString(), status: 'Error', targetCollection: 'loans', error: 'Parsing error line 43' },
        ];

        setLogs(mockLogs);

        // REAL Implementation would be:
        /*
        const q = query(collection(db, 'system_status', 'ingestion_logs', 'events'), orderBy('uploadDate', 'desc'), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
           const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IngestionLog));
           setLogs(data);
           setLoading(false);
        });
        return () => unsubscribe();
        */
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Loaded': return 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20';
            case 'Error': return 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border-rose-500/20';
            case 'Transforming': return 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/20';
            default: return 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20';
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle>Pipeline Monitor</CardTitle>
                </div>
                <CardDescription>Real-time status of data ingestion and transformation.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead className="text-right">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{log.fileName}</span>
                                            {log.error && <span className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {log.error}</span>}
                                            {log.droppedRows && <span className="text-xs text-amber-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {log.droppedRows} rows dropped</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`capitalize ${getStatusColor(log.status)}`}>
                                            {log.status === 'Processing' && <Clock className="mr-1 h-3 w-3 animate-spin" />}
                                            {log.status === 'Transforming' && <Activity className="mr-1 h-3 w-3 animate-pulse" />}
                                            {log.status === 'Loaded' && <CheckCircle className="mr-1 h-3 w-3" />}
                                            {log.status === 'Error' && <AlertCircle className="mr-1 h-3 w-3" />}
                                            {log.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{log.targetCollection}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {new Date(log.uploadDate).toLocaleTimeString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default PipelineMonitor;
