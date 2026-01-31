import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Sparkles, UploadCloud, MessageSquare, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OperationalConsoleProps {
    title: string;
    description: string;
    icon?: React.ElementType;

    // Zone A: Input
    onUpload?: (file: File) => void;
    onChatQuery?: (query: string) => void;
    isProcessing?: boolean;

    // Zone B: Process Visualization
    processVisualizer?: React.ReactNode;

    // Zone C: Results
    results?: React.ReactNode;
    hasResults?: boolean;
    onDownload?: () => void;

    // Layout
    className?: string;
    actions?: React.ReactNode;
}

export function OperationalConsole({
    title,
    description,
    icon: Icon,
    onUpload,
    onChatQuery,
    isProcessing = false,
    processVisualizer,
    results,
    hasResults = false,
    onDownload,
    className,
    actions
}: OperationalConsoleProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onUpload) {
            onUpload(e.target.files[0]);
        }
    };

    return (
        <div className={cn("flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-white overflow-hidden", className)}>
            {/* Header */}
            <header className="flex-none p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-900/50">
                        {Icon && <Icon className="h-6 w-6 text-cyan-400" />}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{title}</h1>
                        <p className="text-sm text-slate-400">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Input & Control (30-40% width) */}
                <div className="w-[400px] flex-none border-r border-slate-800 flex flex-col bg-slate-925">
                    {/* Zone A: Unified Input */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        <Card className="bg-slate-900/50 border-slate-800 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-cyan-400" /> COMMAND & CONTROL
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-lg border-2 border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileSelect}
                                        accept=".csv,.xlsx,.pdf"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <div className="p-3 rounded-full bg-slate-800 group-hover:bg-cyan-900/20 transition-colors">
                                            <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-cyan-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-300">Drop Source File</p>
                                            <p className="text-xs text-slate-500">CSV, Excel, PDF</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Or ask AI to analyze..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-3 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && onChatQuery?.((e.target as HTMLInputElement).value)}
                                    />
                                    <Sparkles className="absolute right-3 top-2.5 h-4 w-4 text-purple-400" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Zone B: Live Process Feed */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">System Activity</h3>
                            {processVisualizer || (
                                <div className="text-sm text-slate-600 italic px-2">System idle. Waiting for input.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Result Stage (Remaining width) */}
                <div className="flex-1 flex flex-col bg-slate-950 relative">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-slate-950 to-slate-950 pointer-events-none" />

                    {/* Toolbar */}
                    {hasResults && (
                        <div className="flex-none h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/20 backdrop-blur-md z-10">
                            <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Result
                            </span>
                            <Button size="sm" variant="outline" className="border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400" onClick={onDownload}>
                                <Download className="h-4 w-4 mr-2" /> Export Result
                            </Button>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full w-full">
                            <div className="p-8 pb-20 min-h-full">
                                {hasResults ? results : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 mt-20">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center mb-4">
                                            <Terminal className="h-8 w-8" />
                                        </div>
                                        <p className="text-lg font-medium">No active result</p>
                                        <p className="text-sm">Input data or run a query to see output.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
        </div>
    );
}
