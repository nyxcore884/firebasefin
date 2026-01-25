import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { storage } from '@/lib/firebase';
import { ref, listAll, deleteObject, StorageReference, uploadBytesResumable } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, FileText, RefreshCw, HardDrive, Play, ListFilter, CheckCircle2, Calculator, Upload, Filter, Calendar as CalendarIcon, Building2 } from 'lucide-react';
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
import { Input } from "@/components/ui/input";
import { useAppState } from '@/hooks/use-app-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export default function StorageManager({ onIngestionSuccess }: { onIngestionSuccess?: (data: IngestionResult) => void }) {
    const { selectedCompany, selectedPeriod, selectedDepartment } = useAppState();
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Metadata & Staging State
    const [stagingFiles, setStagingFiles] = useState<File[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadMetadata, setUploadMetadata] = useState({
        companyId: selectedCompany,
        department: selectedDepartment,
        period: selectedPeriod || ''
    });

    // Pipeline State
    const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
    const [isPipelineOpen, setIsPipelineOpen] = useState(false);
    const [instruction, setInstruction] = useState('');
    const [processStatus, setProcessStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [activeStep, setActiveStep] = useState(0);
    const [lastResult, setLastResult] = useState<IngestionResult | null>(null);

    const steps = [
        { name: 'Validation', desc: 'Checking schema' },
        { name: 'Transformation', desc: 'Applying logic' },
        { name: 'Logic Engine', desc: 'Double-entry' },
        { name: 'Storage', desc: 'Saving' }
    ];

    const fetchFiles = async () => {
        if (!storage) return;
        setLoading(true);
        try {
            // Scope browsing to the selected company prefix
            const listRef = ref(storage, `ingestion/${selectedCompany}/`);
            const res = await listAll(listRef);

            // Note: listAll only lists files in the direct prefix. 
            // We might need a recursive list or a dedicated API if nested deep.
            setFiles(res.items.map(i => ({ name: i.name, fullPath: i.fullPath, ref: i })));
        } catch (e) {
            setFiles([]); // Reset on error/no files
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [selectedCompany]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setStagingFiles(acceptedFiles);
        setUploadMetadata({
            companyId: selectedCompany,
            department: selectedDepartment,
            period: selectedPeriod || ''
        });
        setIsUploadModalOpen(true);
    }, [selectedCompany, selectedDepartment, selectedPeriod]);

    const startUpload = async () => {
        if (!storage || stagingFiles.length === 0) return;

        setIsUploadModalOpen(false);
        setUploading(true);

        const file = stagingFiles[0]; // Process first for simplicity
        const { companyId, department, period } = uploadMetadata;

        // Structured path: ingestion/{company}/{dept}/{period}/{filename}
        const storagePath = `ingestion/${companyId}/${department}/${period}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file, {
            customMetadata: {
                company_id: companyId,
                department: department,
                period: period,
                uploaded_by: 'system_admin'
            }
        });

        uploadTask.on('state_changed',
            (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
            (err) => {
                toast.error("Upload failed");
                setUploading(false);
            },
            async () => {
                toast.success("File uploaded to governance area");
                setUploading(false);
                setStagingFiles([]);
                fetchFiles();
            }
        );
    };

    const runPipeline = async () => {
        if (!selectedFile) return;
        setProcessStatus('processing');
        setActiveStep(0);

        try {
            const res = await fetch('/api/process-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ingest',
                    storagePath: selectedFile.fullPath,
                    bucket: selectedFile.ref.bucket,
                    context: instruction
                })
            });

            if (!res.ok) throw new Error("Pipeline Failed");
            const data = await res.json();
            setLastResult(data);
            setProcessStatus('success');
            setActiveStep(4);
        } catch (e) {
            setProcessStatus('error');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <Card className="shadow-lg border-primary/10 bg-card/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-primary" />
                        Storage Explorer
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                        <Filter className="h-3 w-3" /> Browsing: <span className="text-primary">{selectedCompany}</span>
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchFiles} className="h-8 rounded-lg">
                    <RefreshCw className={cn("h-3.5 w-3.5 mr-2", loading && "animate-spin")} />
                    Sync
                </Button>
            </CardHeader>
            <CardContent className="pt-6">
                <div {...getRootProps()} className={cn(
                    "border-2 border-dashed rounded-2xl p-10 mb-6 text-center transition-all duration-300",
                    isDragActive ? "bg-primary/10 border-primary scale-[1.02]" : "border-border/50 hover:border-primary/30"
                )}>
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-primary/5 text-primary">
                            <Upload className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold">{uploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Drag & drop financial records'}</p>
                            <p className="text-xs text-muted-foreground">Automatic partitioning to {selectedCompany} enabled</p>
                        </div>
                    </div>
                </div>

                <div className="border rounded-xl overflow-hidden bg-background/50">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-bold px-4">Asset Name</TableHead>
                                <TableHead className="text-right text-[10px] uppercase font-bold px-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center text-xs text-muted-foreground italic">
                                        No files found in this company's partition
                                    </TableCell>
                                </TableRow>
                            ) : files.map((file) => (
                                <TableRow key={file.fullPath} className="hover:bg-primary/5 transition-colors">
                                    <TableCell className="px-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-primary/60" />
                                            <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-4">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="default" size="sm" className="bg-indigo-600 h-8 shadow-md" onClick={() => { setSelectedFile(file); setIsPipelineOpen(true); }}>
                                                <Play className="h-3 w-3 mr-1.5" /> Run
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteObject(file.ref).then(fetchFiles)}>
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

            {/* Upload Metadata Dialog */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ListFilter className="h-5 w-5 text-primary" />
                            Ingestion Metadata
                        </DialogTitle>
                        <DialogDescription>
                            Assign governance context to the uploaded file before it enters the raw storage area.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold uppercase tracking-tighter">Company</label>
                            <div className="col-span-3">
                                <Select value={uploadMetadata.companyId} onValueChange={(v) => setUploadMetadata({ ...uploadMetadata, companyId: v })}>
                                    <SelectTrigger className="text-xs font-mono"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SGG-001">Socar Georgia Gas</SelectItem>
                                        <SelectItem value="SGG-002">Socar Gas Export</SelectItem>
                                        <SelectItem value="SGG-TEL">TelavGas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold uppercase tracking-tighter">Dept</label>
                            <Input value={uploadMetadata.department} onChange={(e) => setUploadMetadata({ ...uploadMetadata, department: e.target.value })} className="col-span-3 text-xs" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label className="text-right text-xs font-bold uppercase tracking-tighter">Period</label>
                            <Input value={uploadMetadata.period} onChange={(e) => setUploadMetadata({ ...uploadMetadata, period: e.target.value })} className="col-span-3 text-xs" placeholder="YYYY-MM" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button className="bg-primary" onClick={startUpload}>Finalize & Upload</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pipeline Console Modal */}
            <Dialog open={isPipelineOpen} onOpenChange={setIsPipelineOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><ListFilter className="h-5 w-5" /> Pipeline Console</DialogTitle></DialogHeader>
                    {processStatus === 'idle' ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                                <p className="text-[10px] uppercase font-black text-muted-foreground">Selected File</p>
                                <p className="text-xs font-mono text-primary truncate">{selectedFile?.name}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-black text-muted-foreground">Processing Instructions</label>
                                <Textarea value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="e.g. Q3 Adjusted Actuals - Ensure Tax Compliance" className="text-xs min-h-[100px]" />
                            </div>
                            <Button className="w-full bg-indigo-600 shadow-lg shadow-indigo-500/20" onClick={runPipeline}>
                                <Play className="mr-2 h-4 w-4" /> Start Ingestion Pipeline
                            </Button>
                        </div>
                    ) : (
                        <div className="py-10 text-center space-y-6">
                            <div className="relative flex justify-center">
                                {processStatus === 'processing' ? (
                                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 className="h-8 w-8" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <p className="font-bold text-lg">{processStatus === 'processing' ? 'Thinking & Transforming...' : 'Pipeline Completed'}</p>
                                <p className="text-xs text-muted-foreground">Running module: {steps[Math.min(activeStep, 3)].name}</p>
                            </div>
                            {lastResult && (
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="p-3 bg-muted/30 rounded-lg text-left">
                                        <p className="text-[8px] uppercase font-black opacity-50">Impact</p>
                                        <p className="text-sm font-bold font-mono">₾{lastResult.total_value_gel?.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-muted/30 rounded-lg text-left">
                                        <p className="text-[8px] uppercase font-black opacity-50">Dataset Size</p>
                                        <p className="text-sm font-bold font-mono">{lastResult.rows_processed} rows</p>
                                    </div>
                                </div>
                            )}
                            {processStatus === 'success' && (
                                <Button variant="outline" className="w-full mt-4" onClick={() => setIsPipelineOpen(false)}>Dismiss</Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
