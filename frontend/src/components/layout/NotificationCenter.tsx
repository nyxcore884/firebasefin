import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/hooks/use-app-state';

export default function NotificationCenter() {
    const { selectedCompany } = useAppState();
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await fetch('/api/process-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'alerts', company_id: selectedCompany })
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const text = await res.text();
                if (!text) return;

                const data = JSON.parse(text);
                if (data.status === 'success') setAlerts(data.alerts || []);
            } catch (e) {
                // Silently fail on connection error to avoid UI noise
                // console.error("Alerts fetch error", e);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [selectedCompany]);

    const hasUnread = alerts.length > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 ring-2 ring-background"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-card">
                <div className="flex items-center justify-between border-b border-white/10">
                    <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-full flex justify-between">
                        Executive Alerts
                        <Badge variant="secondary" className="text-[10px] bg-slate-800 ml-2">{alerts.length}</Badge>
                    </DropdownMenuLabel>
                </div>
                {alerts.length === 0 ? (
                    <div className="p-8 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">All systems normal. No active alerts.</p>
                    </div>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                        {alerts.map((alert) => (
                            <DropdownMenuItem key={alert.id} className="p-4 focus:bg-white/5 space-y-1 items-start flex-col cursor-pointer border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-2 w-full">
                                    {alert.severity === 'CRITICAL' ? (
                                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                                    ) : (
                                        <Info className="h-4 w-4 text-amber-500" />
                                    )}
                                    <span className={alert.severity === 'CRITICAL' ? 'text-rose-400 font-bold text-[10px]' : 'text-amber-400 font-bold text-[10px]'}>
                                        {alert.type}
                                    </span>
                                    <span className="ml-auto text-[8px] text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-300">{alert.message}</p>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300">
                    View Alert History
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
