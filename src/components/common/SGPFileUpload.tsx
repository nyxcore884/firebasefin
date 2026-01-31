import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { UploadCloud, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { RootState } from '../../store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export const SGPFileUpload: React.FC = () => {
    const { currentCompany } = useSelector((state: RootState) => state.company);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [progress, setProgress] = useState(0);
    const [query, setQuery] = useState('');

    // Only show for SGP
    const isSGP = currentCompany?.org_id.toUpperCase().includes('SGP') || currentCompany?.org_id === 'socar_petroleum';

    if (!isSGP) {
        return (
            <Alert variant="default" className="bg-blue-500/5 border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertTitle className="text-blue-400 text-xs font-bold uppercase tracking-wider">Note</AlertTitle>
                <AlertDescription className="text-slate-400 text-xs">
                    This upload feature is customized for SOCAR Georgia Petroleum (SGP) reporting formats.
                    Selected: <strong>{currentCompany?.org_name || 'None'}</strong>
                </AlertDescription>
            </Alert>
        );
    }

    const handleUpload = async (file: File) => {
        setUploading(true);
        setSuccess(false);
        setProgress(10);

        const formData = new FormData();
        formData.append('file', file);
        if (currentCompany) {
            formData.append('org_id', currentCompany.org_id);
        }
        if (query) formData.append('ai_query', query);

        try {
            // Simulated progress
            const interval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 10 : prev));
            }, 300);

            const response = await fetch(
                `/api/v1/upload/financial-data`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            clearInterval(interval);
            setProgress(100);

            if (response.ok) {
                setSuccess(true);
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl overflow-hidden group hover:border-indigo-500/30 transition-all">
            <CardHeader className="p-6">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <UploadCloud size={20} className="text-indigo-400" />
                    </div>
                    SGP Data Stream Ingestion
                </CardTitle>
                <CardDescription className="text-slate-500 text-sm">
                    Upload <strong>SGP Reports.xlsx</strong>. AI will auto-map Revenue & COGS structures.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-4">
                {success && (
                    <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription className="text-xs">
                            Data ingested. AI models are re-calculating SGP metrics.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col gap-4">
                    {/* Enquiry Field */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            AI Enquiry (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="E.g., Generate revenue report for Jan 2025..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500">
                            Ask a question about the data you are uploading. The AI will generate a specific report.
                        </p>
                    </div>

                    <Button
                        variant="default"
                        disabled={uploading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 relative overflow-hidden group"
                        asChild
                    >
                        <label className="cursor-pointer w-full flex items-center justify-center gap-2">
                            {uploading ? 'PROCESSING...' : 'SELECT SGP FINANCIAL FILE'}
                            {!uploading && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                            />
                        </label>
                    </Button>

                    {uploading && (
                        <div className="space-y-3">
                            <Progress value={progress} className="h-1 bg-white/5" indicatorClassName="bg-indigo-500 shadow-[0_0_10px_#6366f1]" />

                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
                                    <span>1. Adaptive Parsing</span>
                                    <span className={progress > 30 ? "text-emerald-400" : "text-slate-600"}>{progress > 30 ? "Done" : "..."}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
                                    <span>2. SGP Product Mapping</span>
                                    <span className={progress > 60 ? "text-emerald-400" : "text-slate-600"}>{progress > 60 ? "Done" : "..."}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
                                    <span>3. BigQuery Ingestion</span>
                                    <span className={progress > 90 ? "text-emerald-400" : "text-slate-600"}>{progress > 90 ? "Done" : "..."}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
