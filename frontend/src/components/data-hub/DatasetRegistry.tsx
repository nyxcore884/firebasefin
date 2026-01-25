import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDropzone } from 'react-dropzone';
import { Database, ShieldCheck, GitBranch, Search, Plus, Loader2, Tag, MoreHorizontal, FileText, Play, Trash2, Upload, File as FileIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, setDoc, serverTimestamp, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export interface DatasetMetadata {
    id: string;
    name: string;
    description: string;
    owner: string;
    tags: string[];
    lineage: string[];
    type: string;
    quality_status?: Array<{ rule: string; passed: boolean; timestamp: number }>;
    file_metadata?: {
        original_name: string;
        size: number;
        mime_type: string;
        download_url: string;
        storage_path: string;
    };
}

export default function DatasetRegistry() {
    const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newOwner, setNewOwner] = useState("");
    const [newTags, setNewTags] = useState("");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const q = query(collection(db, 'datasets'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DatasetMetadata[];
            setDatasets(data);
        });
        return () => unsubscribe();
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setUploadFile(acceptedFiles[0]);
            if (!newName) setNewName(acceptedFiles[0].name);
        }
    }, [newName]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'], 'application/pdf': ['.pdf'] }
    });

    const handleRegister = async () => {
        setLoading(true);
        try {
            let downloadUrl = "";
            let storageName = "";
            let bucketName = "";

            if (uploadFile) {
                storageName = `${uploadFile.name.split('.')[0]}-${Date.now()}.${uploadFile.name.split('.').pop()}`;
                const storageRef = ref(storage, `ingestion/${storageName}`);
                const uploadTask = uploadBytesResumable(storageRef, uploadFile);
                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                        reject,
                        async () => {
                            downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            bucketName = uploadTask.snapshot.ref.bucket;
                            resolve();
                        }
                    );
                });
            }

            const generatedId = uploadFile ? uploadFile.name.toLowerCase().replace(/\s/g, '_') : `manual_${Date.now()}`;
            const payload = {
                id: generatedId,
                name: newName,
                description: newDesc,
                owner: newOwner,
                tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
                lineage: uploadFile ? ['Direct_Upload'] : ['Manual_entry'],
                type: uploadFile ? 'ingested_file' : 'manual_entry',
                created_at: serverTimestamp(),
                file_metadata: uploadFile ? {
                    original_name: uploadFile.name,
                    size: uploadFile.size,
                    mime_type: uploadFile.type,
                    download_url: downloadUrl,
                    storage_path: `ingestion/${storageName}`
                } : null
            };

            await setDoc(doc(db, 'datasets', generatedId), payload);
            if (uploadFile) {
                fetch('/api/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ storagePath: `ingestion/${storageName}`, bucket: bucketName })
                }).then(res => res.ok ? toast.success("AI Ingestion Started") : null);
            }
            toast.success("Dataset Registered");
            setIsRegistering(false);
            setNewName(""); setNewDesc(""); setUploadFile(null);
        } catch (e) {
            toast.error("Registration Failed");
        } finally {
            setLoading(false); setUploadProgress(0);
        }
    };

    const filteredDatasets = datasets.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <Card className="lg:col-span-1 h-fit">
                <CardHeader><CardTitle>Catalog Filters</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input type="search" placeholder="Search..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <Button className="w-full mt-4" onClick={() => setIsRegistering(!isRegistering)}><Plus className="mr-2 h-4 w-4" /> Register New</Button>
                </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
                {isRegistering ? (
                    <Card className="animate-in fade-in">
                        <CardHeader><CardTitle>Register Dataset</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${isDragActive ? 'bg-primary/5 border-primary' : ''}`}>
                                <input {...getInputProps()} />
                                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                                <p className="text-sm">{uploadFile ? uploadFile.name : 'Select file (XLSX, CSV)'}</p>
                            </div>
                            <div className="grid gap-2"><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} /></div>
                            <div className="grid gap-2"><Label>Description</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} /></div>
                            <div className="flex gap-2 justify-end pt-4"><Button variant="ghost" onClick={() => setIsRegistering(false)}>Cancel</Button><Button onClick={handleRegister}>{loading ? 'Processing...' : 'Register'}</Button></div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredDatasets.map(dataset => (
                            <Card key={dataset.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> {dataset.name}</CardTitle></div>
                                        <Button size="sm" className="bg-indigo-600" onClick={() => toast.info("Analyzing...")}><Play className="h-3 w-3 mr-2" /> Analyze</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{dataset.description}</p>
                                    <div className="flex gap-6 pt-4 border-t mt-4">
                                        <div className="flex-1"><GitBranch className="h-3 w-3 inline mr-1" /> {dataset.lineage?.join(" → ")}</div>
                                        <div className="flex-1"><ShieldCheck className="h-3 w-3 inline mr-1" /> Healthy</div>
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
