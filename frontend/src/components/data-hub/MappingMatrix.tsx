import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Layers, Activity, Terminal, ArrowRight, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

const ENTITY_HIERARCHY = [
    { code: "SGG-001", name: "SOCAR Georgia Gas", type: "HQ" },
    { code: "SGG-002", name: "SOCAR Gas Export", type: "Sub" },
    { code: "SGG-TEL", name: "TelavGas", type: "Regional" },
];

const GL_HIERARCHY = [
    { range: "1000-1999", category: "Assets", type: "Balance Sheet" },
    { range: "2000-2999", category: "Liabilities", type: "Balance Sheet" },
    { range: "3000-3999", category: "Equity", type: "Balance Sheet" },
    { range: "4000-4999", category: "Revenue", type: "P&L" },
    { range: "5000-5999", category: "Expenses", type: "P&L" },
];

const MappingMatrix = () => {
    const [mappings, setMappings] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [simEntity, setSimEntity] = useState("SOCAR Georgia");
    const [simGlAccount, setSimGlAccount] = useState("4001");
    const [simAmount, setSimAmount] = useState<number>(150000);
    const [simResult, setSimResult] = useState<any | null>(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'mapping_rules'), (snapshot) => {
            if (!snapshot.empty) {
                setMappings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        });
        return () => unsubscribe();
    }, []);

    const saveMappings = async (newMappings: any[]) => {
        setIsSaving(true);
        try {
            await Promise.all(newMappings.map(m =>
                setDoc(doc(db, 'mapping_rules', m.rawField.replace(/\//g, '_')), {
                    rawField: m.rawField,
                    targetField: m.targetField,
                    confidence: m.confidence,
                    updatedAt: new Date().toISOString()
                })
            ));
            toast.success("Rules synchronized");
        } catch (e) {
            toast.error("Failed to sync rules");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAIMapping = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'map_data', sample: mappings.slice(0, 5) })
            });
            if (res.ok) toast.success("Gemini induced new rules!");
        } catch (e) {
            toast.error("AI Mapping failed");
        } finally {
            setIsSaving(false);
        }
    };

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];
            if (jsonData.length > 0) {
                const newMappings = jsonData.map((row, idx) => ({
                    id: Date.now() + idx,
                    rawField: row['Raw Field'] || Object.values(row)[0],
                    targetField: row['Target'] || Object.values(row)[1],
                    confidence: 1.0
                }));
                setMappings(newMappings);
                await saveMappings(newMappings);
            }
        } catch (e) {
            toast.error("Parsing failed");
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleSimulate = () => {
        const entMap = simEntity.includes('Georgia') ? 'SGG-001' : 'SGG-002';
        const glStr = String(simGlAccount);
        let category = 'Unmapped';
        if (glStr.startsWith('4')) category = 'Revenue';
        else if (glStr.startsWith('5')) category = 'Expenses';
        setSimResult({ mapped: { entity_id: entMap, category }, status: 'ok' });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2"><Layers className="h-4 w-4" /> Mapping Configuration</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleAIMapping}>{isSaving ? '...' : 'AI Induce'}</Button>
                            <Button size="sm" onClick={() => saveMappings(mappings)}>{isSaving ? '...' : 'Sync Rules'}</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="rules">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="rules">Rules</TabsTrigger>
                                <TabsTrigger value="entity">Entities</TabsTrigger>
                                <TabsTrigger value="gl">GL Schema</TabsTrigger>
                            </TabsList>
                            <TabsContent value="rules" className="space-y-4">
                                <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer", isDragActive ? "bg-primary/10" : "")}>
                                    <input {...getInputProps()} />
                                    <UploadCloud className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">Drop mapping matrix files here</p>
                                </div>
                                <div className="max-h-[300px] overflow-auto border rounded-md">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Raw</TableHead><TableHead>Target</TableHead><TableHead className="text-right">Conf.</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {mappings.map((m) => (
                                                <TableRow key={m.id}>
                                                    <TableCell className="text-xs font-mono">{m.rawField}</TableCell>
                                                    <TableCell className="text-xs">{m.targetField}</TableCell>
                                                    <TableCell className="text-right text-emerald-500">{(m.confidence * 100).toFixed(0)}%</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                            <TabsContent value="entity">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead></TableRow></TableHeader>
                                    <TableBody>{ENTITY_HIERARCHY.map(e => <TableRow key={e.code}><TableCell className="font-mono text-xs">{e.code}</TableCell><TableCell className="text-xs">{e.name}</TableCell></TableRow>)}</TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5" /> Logic Simulator</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[10px] uppercase font-bold">Entity</label><Input value={simEntity} onChange={e => setSimEntity(e.target.value)} /></div>
                            <div className="space-y-1"><label className="text-[10px] uppercase font-bold">GL</label><Input value={simGlAccount} onChange={e => setSimGlAccount(e.target.value)} /></div>
                        </div>
                        <Button onClick={handleSimulate} className="w-full">Run Validation</Button>
                        <div className="p-4 bg-black/40 rounded-lg font-mono text-xs h-[120px] overflow-auto">
                            {simResult ? <pre className="text-muted-foreground">{JSON.stringify(simResult, null, 2)}</pre> : <span className="opacity-50 italic">Waiting...</span>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MappingMatrix;
