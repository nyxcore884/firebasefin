import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { storage } from '@/lib/firebase';
import { ref, listAll, getDownloadURL, deleteObject, StorageReference, uploadBytesResumable } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Trash2, FileText, RefreshCw, HardDrive, Play, ListFilter, CheckCircle2, Calculator, AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import FinancialInsightsDashboard from '@/components/data-hub/FinancialInsightsDashboard';

interface StorageFile {
    name: string;
    fullPath: string;
    ref: StorageReference;
}

interface IngestionResult {
    rows_processed: number;
    total_value_gel: number;
    validation_summary: {
        date_range: string;
        mapped_companies: number;
    };
}

interface StorageManagerProps {
    onIngestionSuccess?: (data: IngestionResult) => void;
    className?: string; // Allow style overrides
}

export default function StorageManager({ onIngestionSuccess, className }: StorageManagerProps) {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Process Dialog State
    const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [instruction, setInstruction] = useState('');
    const [processStatus, setProcessStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [activeStep, setActiveStep] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastResult, setLastResult] = useState<IngestionResult | null>(null);

    const steps = [
        { name: 'Validation', desc: 'Checking schema & types' },
        { name: 'Transformation', desc: 'Applying SOCAR logic' },
        { name: 'Logic Engine', desc: 'Double-entry checks' },
        { name: 'Storage', desc: 'Saving to Firestore' }
    ];

    const fetchFiles = async () => {
        if (!storage) return;
        setLoading(true);
        try {
            const listRef = ref(storage, 'ingestion/');
            const res = await listAll(listRef);

            const fileList = res.items.map((itemRef) => ({
                name: itemRef.name,
                fullPath: itemRef.fullPath,
                ref: itemRef,
            }));

            setFiles(fileList);
        } catch (error) {
            console.error("Error listing files", error);
            // toast.error("Failed to load storage files"); // Squelch initial load error if empty
        } finally {
            setLoading(false);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!storage) {
            toast.error("Storage not initialized");
            return;
        }

        acceptedFiles.forEach((file) => {
            const nameParts = file.name.split('.');
            const ext = nameParts.pop();
            const baseName = nameParts.join('.');
            const newName = `${baseName}-${Date.now()}.${ext}`;
            const storageRef = ref(storage, `ingestion/${newName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            setUploading(true);
            setUploadProgress(0);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload failed", error);
                    toast.error(`Failed to upload ${file.name}`);
                    setUploading(false);
                },
                () => {
                    toast.success(`${file.name} uploaded successfully`);
                    setUploading(false);
                    setUploadProgress(0);
                    fetchFiles(); // Refresh list
                }
            );
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleDownload = async (file: StorageFile) => {
        try {
            const url = await getDownloadURL(file.ref);
            window.open(url, '_blank');
        } catch (error) {
            toast.error("Failed to get download link");
        }
    };

    const handleDelete = async (file: StorageFile) => {
        if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
        try {
            await deleteObject(file.ref);
            toast.success("File deleted");
            fetchFiles();
        } catch (error) {
            toast.error("Failed to delete file");
        }
    };

    const runPipeline = async () => {
        if (!selectedFile) return;

        setProcessStatus('processing');
        setActiveStep(0);

        // Simulate Steps Visuals
        const stepInterval = setInterval(() => {
            setActiveStep(prev => {
                if (prev < 3) return prev + 1;
                return prev;
            });
        }, 800);

        try {
            // Use the Firebase Hosting rewrite to call the production endpoint
            const API_URL = "/api/ingest";

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storagePath: selectedFile.fullPath,
                    bucket: selectedFile.ref.bucket,
                    context: instruction // Pass instruction to backend (even if unused yet)
                })
            });

            clearInterval(stepInterval);
            setActiveStep(4); // Done

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ingestion failed");
            }

            setLastResult(data);
            setProcessStatus('success');
            toast.success("Pipeline Completed Successfully!");

            // Trigger callback for parent
            if (onIngestionSuccess) {
                onIngestionSuccess(data);
            }

        } catch (error: any) {
            clearInterval(stepInterval);
            setProcessStatus('error');
            setErrorMsg(error.message || "Unknown error occurred");
            console.error(error);
            toast.error(`Pipeline Failed: ${error.message}`);
        }
    };

    const openProcessDialog = (file: StorageFile) => {
        setSelectedFile(file);
        setInstruction('');
        setProcessStatus('idle');
        setErrorMsg('');
        setActiveStep(0);
        setLastResult(null);
        setIsDialogOpen(true);
    };

    return (
        <Card className={cn("shadow-lg border-border/40 bg-card/50 backdrop-blur-sm", className)}>
            <CardHeader className="flex flex-row items-center justify-between py-6 px-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Raw Data Storage</CardTitle>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading} className="gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent className="px-0">
                {/* Upload Zone */}
                <div className="p-6 pb-2">
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                            isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/40 hover:border-primary/50 hover:bg-muted/10",
                            uploading ? "pointer-events-none opacity-80" : ""
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            <div className={cn("p-4 rounded-full bg-muted transition-all", isDragActive ? "bg-primary/20" : "")}>
                                {uploading ? (
                                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                                ) : (
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                )}
                            </div>
                            <div className="space-y-1">
                                {uploading ? (
                                    <div className="space-y-2 w-[200px]">
                                        <p className="text-sm font-medium">Uploading... {Math.round(uploadProgress)}%</p>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">Excel, CSV, or PDF (Finance Documents)</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* File List Table (Simplified for brevity) */}
                <div className="border-t border-border/40">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="pl-6 w-[40%]">Filename</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files.map((file) => (
                                <TableRow key={file.fullPath} className="hover:bg-muted/5">
                                    <TableCell className="pl-6 font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded bg-blue-500/10 text-blue-500">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <span className="truncate max-w-[200px] text-sm">{file.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="default" size="sm" className="h-8 gap-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                                                onClick={() => openProcessDialog(file)}>
                                                <Play className="h-3 w-3" /> Process
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDownload(file)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(file)}>
                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Pipeline Console Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[90vw] w-full max-h-[90vh] overflow-y-auto bg-card border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ListFilter className="h-5 w-5 text-indigo-500" />
                            Ingestion Pipeline Console
                        </DialogTitle>
                        <DialogDescription>
                            Configure and monitor the ETL process for <span className="font-mono text-primary">{selectedFile?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    {/* 1. Input Context */}
                    {processStatus === 'idle' && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Processing Instructions (Context)</label>
                                <Textarea
                                    placeholder="e.g. 'This file contains Q3 Social Gas adjustments. Ensure strict tax validation.'"
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                    className="bg-muted/20"
                                />
                                <p className="text-[10px] text-muted-foreground">The AI engine will use this context for anomaly detection and categorization.</p>
                            </div>
                        </div>
                    )}

                    {/* 2. Pipeline Visuals */}
                    {processStatus !== 'idle' && (
                        <div className="py-6 space-y-6">
                            {/* Stepper */}
                            <div className="relative flex justify-between">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="flex flex-col items-center relative z-10">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${idx <= activeStep ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                                            }`}>
                                            {idx < activeStep ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{idx + 1}</span>}
                                        </div>
                                        <span className={`text-[10px] mt-2 font-medium ${idx <= activeStep ? 'text-indigo-400' : 'text-muted-foreground'}`}>{step.name}</span>
                                    </div>
                                ))}
                                {/* Connecting Line */}
                                <div className="absolute top-4 left-0 w-full h-[2px] bg-muted z-0">
                                    <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(activeStep / 3) * 100}%` }} />
                                </div>
                            </div>

                            {/* Processing Status Text */}
                            <div className="bg-muted/20 rounded-lg p-4 text-center">
                                {processStatus === 'processing' && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-400">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Running {steps[Math.min(activeStep, 3)].name} module...
                                    </div>
                                )}
                                {processStatus === 'error' && (
                                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-red-400 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                        <div className="flex items-center gap-2 font-bold">
                                            <AlertCircle className="h-4 w-4" />
                                            Pipeline Failed
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center break-all">{errorMsg}</p>
                                    </div>
                                )}
                                {processStatus === 'success' && (
                                    <div className="text-center space-y-3 animate-in fade-in zoom-in duration-300 w-full">
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <div className="inline-flex items-center justify-center p-2 bg-green-500/10 text-green-500 rounded-full">
                                                <CheckCircle2 className="h-6 w-6" />
                                            </div>
                                            <h4 className="text-lg font-bold text-foreground">Ingestion & Analysis Complete</h4>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
                                            <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                                                <p className="text-xs text-muted-foreground uppercase">Total Processed</p>
                                                <p className="text-xl font-bold font-mono">₾{lastResult?.total_value_gel?.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                                                <p className="text-xs text-muted-foreground uppercase">Rows / Entities</p>
                                                <p className="text-xl font-bold font-mono">{lastResult?.rows_processed} <span className="text-xs font-normal text-muted-foreground">/ {lastResult?.validation_summary?.mapped_companies || 0}</span></p>
                                            </div>
                                        </div>

                                        <div className="bg-background/80 rounded-xl border border-white/10 p-4 mt-6 text-left">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Calculator className="h-4 w-4 text-primary" />
                                                <span className="text-sm font-semibold">Live Impact Analysis</span>
                                            </div>
                                            {/* Integrated Dashboard View */}
                                            <div className="scale-90 origin-top -mb-10">
                                                <FinancialInsightsDashboard view="executive" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {processStatus === 'idle' && (
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={runPipeline}>
                                <Play className="mr-2 h-4 w-4" /> Start Pipeline
                            </Button>
                        )}
                        {processStatus === 'success' && (
                            <Button variant="outline" className="w-full" onClick={() => setIsDialogOpen(false)}>
                                Close Console
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card >
    );
}
