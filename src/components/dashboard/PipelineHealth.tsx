
import React from 'react';
import { cn } from '@/lib/utils';

interface Stage {
    name: string;
    status: 'Success' | 'Warning' | 'Processing' | 'Error' | 'Pending';
    progress: number;
}

export const PipelineHealth: React.FC = () => {
    const stages: Stage[] = [
        { name: 'Ingest', status: 'Success', progress: 100 },
        { name: 'Mapping', status: 'Success', progress: 100 },
        { name: 'Forecast', status: 'Warning', progress: 85 },
        { name: 'Serve', status: 'Pending', progress: 0 },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Success': return 'bg-emerald-500 text-white';
            case 'Warning': return 'bg-amber-500 text-white';
            case 'Error': return 'bg-rose-500 text-white';
            default: return 'bg-accent text-muted-foreground';
        }
    };

    return (
        <div className="nyx-card p-4">
            <h2 className="text-[9px] font-black font-display uppercase tracking-[0.2em] text-muted-foreground mb-4 italic">Infrastructure Health</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {stages.map((stage, idx) => (
                    <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                            <span className="text-foreground/80">{stage.name}</span>
                            <span className={cn("px-1.5 py-0.5 rounded-full scale-90 origin-right", getStatusStyle(stage.status))}>
                                {stage.status}
                            </span>
                        </div>
                        <div className="h-1 w-full bg-accent rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all duration-1000", stage.status === 'Success' ? 'bg-emerald-500' : stage.status === 'Warning' ? 'bg-amber-500' : 'bg-primary/20')}
                                style={{ width: `${stage.progress}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
