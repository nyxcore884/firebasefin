
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { financialService } from '@/services/financialService';
import { cn } from '@/lib/utils';

export const InlineUpload: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setStatus('uploading');
        setProgress(20);
        setMessage(`Uploading ${file.name}...`);

        try {
            // Simulate/Trigger upload
            const response = await financialService.uploadFinancialData(file);
            setProgress(100);
            setStatus('success');
            setMessage(`Successfully ingested ${response.processed_count || 'data'}`);

            // Auto-reset after 3 seconds
            setTimeout(() => {
                setStatus('idle');
                setProgress(0);
                setMessage('');
            }, 3000);
        } catch (error: any) {
            console.error("Upload failed", error);
            setStatus('error');
            setMessage(error.message || "Ingestion failed");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
        },
        multiple: false
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "nyx-card p-6 border-dashed border-2 transition-all cursor-pointer text-center relative overflow-hidden h-full flex flex-col items-center justify-center",
                isDragActive ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-primary/20 hover:border-primary/50 bg-accent/5",
                status === 'success' && "border-emerald-500 bg-emerald-500/5",
                status === 'error' && "border-rose-500 bg-rose-500/5"
            )}
        >
            <input {...getInputProps()} />

            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                            <Upload size={20} className="text-primary" />
                        </div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-1">Import Data</p>
                        <p className="text-[8px] text-muted-foreground font-black uppercase opacity-60 italic">Drop Streams Here</p>
                    </motion.div>
                )}

                {status === 'uploading' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center w-full px-4"
                    >
                        <Loader2 size={24} className="text-primary animate-spin mb-3" />
                        <p className="text-[9px] font-black text-foreground uppercase tracking-widest mb-2">Ingesting...</p>
                        <div className="w-full h-1 bg-accent rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <CheckCircle size={32} className="text-emerald-500 mb-2" />
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">{message}</p>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <AlertTriangle size={32} className="text-rose-500 mb-2" />
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">{message}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

