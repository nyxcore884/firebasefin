import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Database, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { AIText } from '@/components/common/AIText';

export default function SystemsHub() {
    // Simple Health Check Mock (real wiring would check /api/health)
    const [services, setServices] = useState([
        { name: 'Core Financial Controller', id: '15-core', status: 'online', latency: '45ms' },
        { name: 'Transformation Engine', id: '2-transform', status: 'online', latency: '120ms' },
        { name: 'Analysis Pipeline', id: '3-analysis', status: 'idle', latency: '-' },
        { name: 'AI Query Service', id: '9-ai', status: 'online', latency: '80ms' }
    ]);

    return (
        <div className="h-full w-full p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-glow uppercase italic">
                        <AIText>Systems Orchestration Hub</AIText>
                    </h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 mt-1">
                        <Activity className="h-3 w-3" /> <AIText>Microservices Topology & Health</AIText>
                    </p>
                </div>
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(svc => (
                    <Card key={svc.id} className="glass-card border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">
                                {svc.name}
                            </CardTitle>
                            <Badge variant={svc.status === 'online' ? 'success' : 'secondary'}>
                                {svc.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{svc.latency}</div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Latency</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="p-12 border-2 border-dashed border-white/10 rounded-[3rem] text-center">
                <Server className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-black uppercase tracking-widest text-muted-foreground/50">Topology Map Offline</h3>
                <p className="max-w-md mx-auto mt-2 text-sm text-muted-foreground">
                    The visual topology explorer has been deprecated in favor of this streamlined health dashboard. The underlying microservices remain active.
                </p>
            </div>
        </div>
    );
}
