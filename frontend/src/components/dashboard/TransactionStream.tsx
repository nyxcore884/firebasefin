import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Pause,
    Play,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/use-app-state';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: 'credit' | 'debit';
    timestamp: string;
}

export default function TransactionStream() {
    const { selectedCompany, currency } = useAppState();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [connected, setConnected] = useState(true);
    const streamRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initial fetch
        fetchLatestTransactions();

        // Set up polling for "real-time" updates
        if (!isPaused) {
            streamRef.current = setInterval(() => {
                simulateNewTransaction();
            }, 5000); // New transaction every 5 seconds
        }

        return () => {
            if (streamRef.current) {
                clearInterval(streamRef.current);
            }
        };
    }, [selectedCompany, isPaused]);

    const fetchLatestTransactions = async () => {
        try {
            const res = await fetch('/api/truth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity: selectedCompany,
                    period: "2023-11" // Hardcoded for demo parity or use dynamic
                })
            });
            const data = await res.json();

            if (data.status === 'success' && data.transactions) {
                setTransactions(data.transactions);
                setConnected(true);
            }
        } catch (e) {
            console.error('Stream fetch error:', e);
            setConnected(false);
        }
    };

    const simulateNewTransaction = () => {
        // Now calling the real periodic fetch instead of simulating mock data
        fetchLatestTransactions();
    };

    const formatCurrency = (amount: number) => {
        const symbol = currency === 'USD' ? '$' : '₾';
        return `${symbol}${amount.toLocaleString()}`;
    };

    return (
        <Card className="glass-card h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            connected ? "bg-emerald-500/10" : "bg-rose-500/10"
                        )}>
                            <Activity className={cn(
                                "h-5 w-5",
                                connected ? "text-emerald-500 animate-pulse" : "text-rose-500"
                            )} />
                        </div>
                        <div>
                            <CardTitle className="text-sm">Transaction Stream</CardTitle>
                            <CardDescription className="text-xs">Live financial activity feed</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={connected ? "default" : "destructive"}
                            className={cn("text-[10px]", connected && "bg-emerald-500/20 text-emerald-500")}
                        >
                            {connected ? "LIVE" : "DISCONNECTED"}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={fetchLatestTransactions}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto max-h-[400px]">
                {transactions.map((txn, idx) => (
                    <div
                        key={txn.id}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all",
                            "hover:bg-white/5",
                            idx === 0 && "animate-in fade-in slide-in-from-top-2 duration-500",
                            txn.type === 'credit'
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : "border-white/10 bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center",
                                txn.type === 'credit' ? "bg-emerald-500/20" : "bg-rose-500/20"
                            )}>
                                {txn.type === 'credit'
                                    ? <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                    : <ArrowDownRight className="h-4 w-4 text-rose-500" />
                                }
                            </div>
                            <div>
                                <p className="text-sm font-medium">{txn.description}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {txn.category}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{txn.timestamp}</span>
                                </div>
                            </div>
                        </div>
                        <div className={cn(
                            "text-sm font-mono font-semibold",
                            txn.type === 'credit' ? "text-emerald-500" : "text-rose-400"
                        )}>
                            {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </div>
                    </div>
                ))}

                {transactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No transactions yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
