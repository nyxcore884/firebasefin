import React, { useState } from 'react';
import { Play, Pause, FastForward, Rewind, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TimelineEvent {
    id: string;
    label: string;
    timestamp: string;
    type: 'alert' | 'logic' | 'ai' | 'dashboard';
    activeNodes: string[];
    activeEdges: string[];
}

const mockEvents: TimelineEvent[] = [
    { id: '1', label: 'Query Ingress', timestamp: '10:00:01', type: 'logic', activeNodes: ['data-source'], activeEdges: [] },
    { id: '2', label: 'Intent Extraction', timestamp: '10:00:03', type: 'ai', activeNodes: ['ai-intent'], activeEdges: ['e-data-intent'] },
    { id: '3', label: 'Ledger Truth Access', timestamp: '10:00:05', type: 'logic', activeNodes: ['truth-ledger'], activeEdges: ['e-intent-ledger'] },
    { id: '4', label: 'Anomalous Variance Detected', timestamp: '10:00:07', type: 'alert', activeNodes: ['gov-logic'], activeEdges: ['e-ledger-gov'] },
    { id: '5', label: 'Dashboard Generation', timestamp: '10:00:10', type: 'dashboard', activeNodes: ['dash-output'], activeEdges: ['e-gov-dash'] },
];

export function TimelineScrubber({ onEventChange }: { onEventChange: (event: TimelineEvent | null) => void }) {
    const [index, setIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const currentEvent = mockEvents[index];

    const handleScrub = (val: number[]) => {
        setIndex(val[0]);
        onEventChange(mockEvents[val[0]]);
    };

    return (
        <div className="w-full bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col md:flex-row items-center gap-6">
                {/* 1. PLAYBACK CONTROLS */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5 rounded-full">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 bg-primary/20 text-primary hover:bg-primary/30 rounded-full border border-primary/20"
                        onClick={() => setIsPlaying(!isPlaying)}
                    >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block" />
                </div>

                {/* 2. THE SCRUBBER BAR */}
                <div className="flex-1 space-y-3 w-full">
                    <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Temporal Replay</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white tracking-tight">{currentEvent.label}</span>
                                <Badge variant="outline" className="text-[9px] font-mono bg-slate-900 border-slate-800 text-slate-400">
                                    <Clock className="h-2.5 w-2.5 mr-1" /> {currentEvent.timestamp}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                            STEP {index + 1} / {mockEvents.length}
                        </div>
                    </div>

                    <div className="relative pt-2">
                        <Slider
                            value={[index]}
                            max={mockEvents.length - 1}
                            step={1}
                            onValueChange={handleScrub}
                            className="z-10"
                        />
                        <div className="absolute top-2 left-0 right-0 h-4 flex justify-between pointer-events-none px-1">
                            {mockEvents.map((e, i) => (
                                <div
                                    key={e.id}
                                    className={cn(
                                        "w-[2px] h-3 rounded-full transition-all duration-300",
                                        i <= index ? "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-800"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. EVENT TYPE LEGEND */}
                <div className="hidden lg:flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">AI</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Logic</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Alert</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
