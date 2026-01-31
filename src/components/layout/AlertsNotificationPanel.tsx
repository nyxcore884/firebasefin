import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/use-app-state';

interface Alert {
    id: string;
    type: 'warning' | 'critical' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

export default function AlertsNotificationPanel() {
    const { selectedCompany } = useAppState();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const unreadCount = alerts.filter(a => !a.read).length;

    useEffect(() => {
        fetchAlerts();
    }, [selectedCompany]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/process-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'alerts', company_id: selectedCompany })
            });
            const data = await res.json();

            if (data.status === 'success' && data.alerts) {
                setAlerts(data.alerts);
            } else {
                // Demo alerts if backend doesn't have any
                setAlerts([
                    {
                        id: 'alert-1',
                        type: 'critical',
                        title: 'Budget Breach Detected',
                        message: 'IT Operations exceeded budget by 15.2% this month.',
                        timestamp: '2 hours ago',
                        read: false
                    },
                    {
                        id: 'alert-2',
                        type: 'warning',
                        title: 'Anomaly Detected',
                        message: 'Unusual transaction pattern in Marketing department.',
                        timestamp: '5 hours ago',
                        read: false
                    },
                    {
                        id: 'alert-3',
                        type: 'success',
                        title: 'Reconciliation Complete',
                        message: 'Monthly payment reconciliation matched 98.5%.',
                        timestamp: '1 day ago',
                        read: true
                    },
                    {
                        id: 'alert-4',
                        type: 'info',
                        title: 'Forecast Updated',
                        message: 'Monte Carlo simulation completed with new Q4 projections.',
                        timestamp: '2 days ago',
                        read: true
                    }
                ]);
            }
        } catch (e) {
            console.error('Failed to fetch alerts:', e);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    };

    const markAllAsRead = () => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'critical':
                return <AlertTriangle className="h-4 w-4 text-rose-500" />;
            case 'warning':
                return <TrendingDown className="h-4 w-4 text-amber-500" />;
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            default:
                return <TrendingUp className="h-4 w-4 text-blue-500" />;
        }
    };

    const getAlertBgColor = (type: string, read: boolean) => {
        if (read) return 'bg-muted/10';
        switch (type) {
            case 'critical':
                return 'bg-rose-500/10 border-rose-500/20';
            case 'warning':
                return 'bg-amber-500/10 border-amber-500/20';
            case 'success':
                return 'bg-emerald-500/10 border-emerald-500/20';
            default:
                return 'bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 max-h-[500px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Notifications</span>
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    {unreadCount} new
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
                                    Mark all read
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Alert List */}
                    <div className="overflow-y-auto max-h-[400px]">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading alerts...</div>
                        ) : alerts.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No notifications</div>
                        ) : (
                            alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors",
                                        getAlertBgColor(alert.type, alert.read)
                                    )}
                                    onClick={() => markAsRead(alert.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={cn("font-medium text-sm", !alert.read && "text-white")}>
                                                    {alert.title}
                                                </span>
                                                {!alert.read && (
                                                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {alert.message}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground/70 mt-2 block">
                                                {alert.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/10 text-center">
                        <Button variant="ghost" size="sm" className="text-xs w-full">
                            View All Notifications
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
