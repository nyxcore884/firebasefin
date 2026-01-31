
import React, { useState } from 'react';
import { X, Send, Upload, Sparkles, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { aiService } from '@/services/aiService';
import { ResponseRenderer } from '@/components/ai/ResponseRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AIResponse {
    answer: string;
    visualizations: any[];
    confidence: number;
    query_id: string;
    reasoning_path?: string[];
    explanations?: string[];
}

export const AIAssistantPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [lastQuery, setLastQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const location = useLocation();
    const { currentCompany } = useSelector((state: RootState) => state.company);

    const buildContext = () => ({
        page: location.pathname,
        company: {
            org_id: currentCompany?.org_id || 'SOCAR_GROUP',
            org_name: currentCompany?.org_name || 'SOCAR Group',
        },
        dataset: currentCompany?.org_id === 'SGG' ? 'sgg_core' :
            currentCompany?.org_id === 'SGP' ? 'sgp_core' :
                'socar_consolidated'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() && files.length === 0) return;

        setIsLoading(true);
        const originalQuery = query;
        setResponse(null);

        try {
            const context = buildContext();
            let result;

            if (files.length > 0) {
                result = await aiService.queryWithFiles(query, context, files);
            } else {
                result = await aiService.query(query, context);
            }

            setResponse(result);
            setLastQuery(originalQuery);
        } catch (error) {
            console.error('AI query failed:', error);
            setResponse({
                answer: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                visualizations: [],
                confidence: 0,
                query_id: ''
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = async (rating: number) => {
        if (!response?.query_id) return;
        try {
            await aiService.submitFeedback(
                response.query_id,
                currentCompany?.org_id || 'SOCAR_GROUP',
                lastQuery,
                rating
            );
        } catch (error) {
            console.error('Feedback failed:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-primary rounded-full shadow-2xl flex items-center justify-center text-primary-foreground hover:shadow-primary/50 transition-all z-50 group"
                >
                    <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                </motion.button>
            )}

            {/* AI Assistant Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        className="fixed inset-y-0 right-0 w-[450px] bg-card border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.3)] z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border bg-primary/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground text-sm uppercase tracking-tight">AI Assistant</h3>
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest italic">
                                            {currentCompany?.org_code || 'SOCAR'} INTELLIGENCE
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1.5 hover:bg-accent rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Context Indicator */}
                        <div className="px-4 py-1.5 bg-accent/20 border-b border-border text-[8px] font-black text-muted-foreground uppercase tracking-widest italic">
                            PATH: {location.pathname} • ENGINE: {buildContext().dataset}
                        </div>

                        {/* Response Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {response ? (
                                <div className="space-y-4">
                                    <ResponseRenderer response={response} />

                                    {/* Feedback Buttons */}
                                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Helpful?</span>
                                        <button
                                            onClick={() => handleFeedback(5)}
                                            className="p-2 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 rounded-lg transition-colors"
                                        >
                                            <ThumbsUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleFeedback(1)}
                                            className="p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                                        >
                                            <ThumbsDown size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <Loader2 size={32} className="animate-spin text-primary mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Synthesizing...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-10 space-y-4">
                                    <Sparkles size={48} className="text-primary/20" />
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground text-[11px] uppercase tracking-widest">How can I assist you?</p>
                                        <p className="text-[9px] font-medium text-foreground/70 uppercase tracking-tighter leading-relaxed">
                                            Ask about trends, anomalies, or upload artifacts for deep forensic analysis.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-accent/5">
                            {files.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="px-2 py-1 bg-primary/10 rounded-md border border-primary/20 text-[8px] font-black text-primary flex items-center gap-1 uppercase tracking-widest shadow-sm"
                                        >
                                            <span className="truncate max-w-[100px]">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                                                className="hover:text-foreground p-0.5"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <label className="cursor-pointer shrink-0">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".xlsx,.xls,.csv,.pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <div className="p-2.5 bg-card border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all">
                                        <Upload size={18} />
                                    </div>
                                </label>

                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Input query..."
                                    className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-[11px] font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all uppercase tracking-tight"
                                    disabled={isLoading}
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading || (!query.trim() && files.length === 0)}
                                    className="px-4 bg-primary text-primary-foreground rounded-lg font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Send size={16} />
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
