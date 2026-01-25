<<<<<<< Updated upstream
import React, { useState, useEffect } from 'react';
=======
import { useState, useEffect, useCallback } from 'react';
>>>>>>> Stashed changes
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< Updated upstream
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, ShieldCheck, GitBranch, Search, Plus, Loader2, Tag } from 'lucide-react';
=======
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDropzone } from 'react-dropzone';

import { Database, ShieldCheck, GitBranch, Search, Plus, Loader2, Tag, MoreHorizontal, FileText, Play, Trash2, Upload, File as FileIcon, X } from 'lucide-react';
>>>>>>> Stashed changes
import { DatasetMetadata } from '../../types/registry';
import { toast } from 'sonner';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, setDoc, serverTimestamp, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export default function DatasetRegistry() {
    const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newOwner, setNewOwner] = useState("");
    const [newTags, setNewTags] = useState("");

    // File Upload State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Real-time Sync
    useEffect(() => {
        const q = query(collection(db, 'datasets'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as DatasetMetadata[];
            setDatasets(data);
        }, (error) => {
            console.error("Error fetching datasets:", error);
            toast.error("Failed to sync catalog");
        });
        return () => unsubscribe();
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setUploadFile(acceptedFiles[0]);
            // Auto-fill name based on file
            if (!newName) {
                setNewName(acceptedFiles[0].name);
            }
        }
    }, [newName]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
            'application/pdf': ['.pdf']
        }
    });

    const handleRegister = async () => {
        setLoading(true);
        try {
            let downloadUrl = "";
            let storageName = "";
            let bucketName = "";

            // 1. Upload File if present
            if (uploadFile) {
                const nameParts = uploadFile.name.split('.');
                const ext = nameParts.pop();
                const baseName = nameParts.join('.');
                storageName = `${baseName}-${Date.now()}.${ext}`;
                const storageRef = ref(storage, `ingestion/${storageName}`);

                const uploadTask = uploadBytesResumable(storageRef, uploadFile);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => reject(error),
                        async () => {
                            downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            bucketName = uploadTask.snapshot.ref.bucket;
                            resolve();
                        }
                    );
                });
            }

            // 2. Register Metadata
            const generatedId = uploadFile
                ? uploadFile.name.toLowerCase().replace(/\./g, '_').replace(/\s/g, '_')
                : `manual_${Date.now()}`;

            const payload = {
                id: generatedId,
                name: newName,
                description: newDesc,
                owner: newOwner,
                tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
                schema: {},
                lineage: uploadFile ? ['Direct_Upload', 'Ingestion_Pipeline'] : ['Manual_entry'],
                type: uploadFile ? 'ingested_file' : 'manual_entry',
                quality_rules: ["manual_validation"],
                quality_status: [{ rule: "manual_validation", passed: true, timestamp: Date.now() }],
                created_at: serverTimestamp(),
                // Store extra file info if available
                file_metadata: uploadFile ? {
                    original_name: uploadFile.name,
                    size: uploadFile.size,
                    mime_type: uploadFile.type,
                    download_url: downloadUrl,
                    storage_path: `ingestion/${storageName}`
                } : null
            };

            await setDoc(doc(db, 'datasets', generatedId), payload, { merge: true });

            // 3. Trigger Backend Processing (Ingestion Pipeline)
            if (uploadFile && storageName) {
                try {
                    fetch('/api/ingest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            storagePath: `ingestion/${storageName}`,
                            bucket: bucketName,
                            context: JSON.stringify({ description: newDesc, tags: newTags })
                        })
                    }).then(res => {
                        if (res.ok) toast.success("AI Analysis Started");
                        else toast.error("Ingestion Trigger Failed");
                    });
                } catch (err) {
                    console.error("Failed to trigger pipeline", err);
                }
            }

            toast.success("Dataset Registered Successfully");
            setIsRegistering(false);
            resetForm();

        } catch (e) {
            toast.error("Registration Failed");
            console.error(e);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (dataset: DatasetMetadata) => {
        if (!confirm("WARNING: This will permanently delete the file from Storage and the Catalog. Confirm?")) return;
        try {
            // 1. Delete from Storage if path exists
            if (dataset.file_metadata?.storage_path) {
                const storageRef = ref(storage, dataset.file_metadata.storage_path);
                await deleteObject(storageRef);
                toast.success("Storage file deleted");
            }

            // 2. Delete Metadata
            if (dataset.id) {
                await deleteDoc(doc(db, 'datasets', dataset.id));
                toast.success("Catalog entry removed");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete. Check console for details.");
        }
    };

    const handleAnalyze = (dataset: DatasetMetadata) => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 2000)),
            {
                loading: `Initializing Analysis Engine for ${dataset.name}...`,
                success: 'Analysis Dashboard Generated!',
                error: 'Analysis Failed'
            }
        );
    };

    const resetForm = () => {
        setNewName(""); setNewDesc(""); setNewOwner(""); setNewTags(""); setUploadFile(null);
    };

    const filteredDatasets = datasets.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Sidebar: Navigation & Filters */}
            <Card className="lg:col-span-1 h-fit bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Catalog Filters</CardTitle>
                    <CardDescription>Refine your data search</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search datasets..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 pt-4">
                        <Label>Quick Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {["finance", "sales", "hr", "operations", "forecast"].map(tag => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={() => setSearchTerm(tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Button className="w-full mt-4" onClick={() => setIsRegistering(!isRegistering)}>
                        <Plus className="mr-2 h-4 w-4" /> Register New Dataset
                    </Button>
                </CardContent>
            </Card>

            {/* Main Content: Registry List or Form */}
            <div className="lg:col-span-2 space-y-6">

                {isRegistering ? (
                    <Card className="animate-in fade-in slide-in-from-right-4 border-primary/20">
                        <CardHeader>
                            <CardTitle>Register New Dataset</CardTitle>
                            <CardDescription>Upload a file or define metadata manually.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            {/* File Upload Zone */}
                            {!uploadFile ? (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                                    <p className="text-sm font-medium">Drag & drop your dataset here</p>
                                    <p className="text-xs text-muted-foreground mt-1">Supports XLSX, CSV, PDF</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
                                        <FileIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                                        <p className="text-xs text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setUploadFile(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label>Dataset Name</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Q3 Adjustments.xlsx" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Context for the AI..." />
                            </div>
                            <div className="grid gap-2">
                                <Label>Data Owner</Label>
                                <Input value={newOwner} onChange={e => setNewOwner(e.target.value)} placeholder="Email or Dept" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tags</Label>
                                <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="finance, sensitive..." />
                            </div>

                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="ghost" onClick={() => setIsRegistering(false)}>Cancel</Button>
                                <Button onClick={handleRegister} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {uploadFile ? (loading ? 'Uploading & Registering...' : 'Upload & Register') : 'Register Metadata'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Data Catalog <span className="text-muted-foreground text-sm font-normal">({filteredDatasets.length})</span>
                            </h3>
                        </div>

                        {filteredDatasets.length === 0 && (
                            <div className="text-center p-12 border-2 border-dashed rounded-lg border-muted">
                                <p className="text-muted-foreground">No datasets found. Upload a file or register one manually.</p>
                            </div>
                        )}

                        {filteredDatasets.map(dataset => (
                            <Card key={dataset.id} className="group hover:border-primary/50 transition-all hover:shadow-md bg-card/40 backdrop-blur-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <FileText className="h-4 w-4 text-blue-500" />
                                                {dataset.name}
                                                {dataset.type === 'ingested_file' && (
                                                    <Badge variant="secondary" className="text-[10px] ml-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                                                        Auto-Ingested
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                {dataset.tags?.map(tag => (
                                                    <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0 h-5 text-muted-foreground">
                                                        <Tag className="h-3 w-4 mr-1 opacity-50" /> {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="default" className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleAnalyze(dataset)}>
                                                <Play className="h-3 w-3" /> Analyze
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleAnalyze(dataset)}>
                                                        Generate Insight Report
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(dataset)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete File & Metadata
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {dataset.description || "No description provided."}
                                    </p>

                                    <div className="flex gap-6 pt-4 border-t border-border/50">
                                        <div className="flex-1">
                                            <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                                                <GitBranch className="h-3 w-3" /> Lineage
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-foreground/80">
                                                {dataset.lineage?.length > 0 ? dataset.lineage.join(" → ") : "Manual"}
                                            </div>
                                            {dataset.file_metadata?.storage_path && (
                                                <div className="mt-2 p-1.5 bg-muted/50 rounded text-[10px] font-mono text-muted-foreground break-all border border-border/50">
                                                    <span className="font-semibold text-primary/70">STORAGE:</span> {dataset.file_metadata.storage_path}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 flex items-center gap-1">
                                                <ShieldCheck className="h-3 w-3" /> Health
                                            </div>
                                            <div className="space-y-1">
                                                {dataset.quality_status?.map((qc, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${qc.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                        <span className={qc.passed ? 'text-emerald-500' : 'text-rose-500'}>
                                                            {qc.rule}
                                                        </span>
                                                    </div>
                                                )) || <span className="text-xs text-muted-foreground">Not checked</span>}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
