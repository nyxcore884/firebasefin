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
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
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
            const listRef = ref(storage, 'ingestion/');
            const res = await listAll(listRef);
            setFiles(res.items.map(i => ({ name: i.name, fullPath: i.fullPath, ref: i })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFiles(); }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!storage) return;
        acceptedFiles.forEach((file) => {
            const storageName = `${file.name.split('.')[0]}-${Date.now()}.${file.name.split('.').pop()}`;
            const storageRef = ref(storage, `ingestion/${storageName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            setUploading(true);
            uploadTask.on('state_changed',
                (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
                () => setUploading(false),
                () => {
                    toast.success("Uploaded!");
                    setUploading(false);
                    fetchFiles();
                }
            );
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><HardDrive className="h-5 w-5" /> Storage Manager</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchFiles}><RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /></Button>
            </CardHeader>
            <CardContent>
                <div {...getRootProps()} className={cn("border-2 border-dashed rounded-xl p-8 mb-6 text-center cursor-pointer", isDragActive ? "bg-primary/5 border-primary" : "")}>
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">{uploading ? `Uploading ${Math.round(uploadProgress)}%` : 'Drag & drop finance files'}</p>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader><TableRow><TableHead>File</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {files.map((file) => (
                                <TableRow key={file.fullPath}>
                                    <TableCell className="text-sm font-medium">{file.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="default" size="sm" className="bg-indigo-600 h-8" onClick={() => { setSelectedFile(file); setIsDialogOpen(true); }}>Process</Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteObject(file.ref).then(fetchFiles)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Pipeline Console</DialogTitle></DialogHeader>
                    {processStatus === 'idle' ? (
                        <div className="space-y-4">
                            <label className="text-sm font-medium">Processing Context</label>
                            <Textarea value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="e.g. Q3 Adjusted Actuals" />
                            <Button className="w-full bg-indigo-600" onClick={runPipeline}>Start Pipeline</Button>
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            {processStatus === 'processing' ? <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" /> : <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />}
                            <p className="mt-4 font-bold">{processStatus === 'processing' ? 'Analyzing Data...' : 'Ingestion Successful'}</p>
                            {lastResult && <div className="mt-4 p-4 bg-muted rounded-md text-sm">Processed {lastResult.rows_processed} rows</div>}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
