import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Layers, Activity, Terminal, ArrowRight, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';

// Mock Data (Initial State)
const INITIAL_MAPPINGS = [
    { id: 1, rawField: "COMPANY_CODE", targetField: "entity_id", confidence: 0.98 },
    { id: 2, rawField: "GL_ACCOUNT", targetField: "gl_code", confidence: 0.95 },
    { id: 3, rawField: "TRX_AMOUNT", targetField: "amount", confidence: 0.92 },
    { id: 4, rawField: "DOC_DATE", targetField: "transaction_date", confidence: 0.88 },
];

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
    const [mappings, setMappings] = useState(INITIAL_MAPPINGS);
    const [isSaving, setIsSaving] = useState(false);

    // Load mappings from Firestore on mount
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'mapping_rules'), (snapshot) => {
            if (!snapshot.empty) {
                const loadedMappings = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as any[];
                setMappings(loadedMappings);
            }
        });
        return () => unsubscribe();
    }, []);

    const saveMappings = async (newMappings: any[]) => {
        setIsSaving(true);
        try {
            // We'll save each rule as a document in 'mapping_rules'
            // For simplicity, we'll clear and re-add or just use the field name as ID
            const promises = newMappings.map(m =>
                setDoc(doc(db, 'mapping_rules', m.rawField.replace(/\//g, '_')), {
                    rawField: m.rawField,
                    targetField: m.targetField,
                    confidence: m.confidence,
                    updatedAt: new Date().toISOString()
                })
            );
            await Promise.all(promises);
            toast.success("Mapping rules synchronized with backend");
        } catch (error) {
            console.error("Save error", error);
            toast.error("Failed to sync mapping rules");
        } finally {
            setIsSaving(false);
        }
    };

    const applyMappings = async () => {
        setIsSaving(true);
        try {
            // Trigger the transformation/logic engine (via API)
            const res = await fetch('/api/process_transaction/mapping/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mappings })
            });

            if (res.ok) {
                toast.success("Mappings applied! Re-run ingestion to see changes.");
            } else {
                throw new Error("Mapping engine failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to apply mappings.");
        } finally {
            setIsSaving(false);
        }
    };

    // Simulator State (Updated for Phase 12)
    const [simEntity, setSimEntity] = useState("SOCAR Georgia");
    const [simGlAccount, setSimGlAccount] = useState("4001");
    const [simAmount, setSimAmount] = useState<number>(150000);
    const [simCurrency, setSimCurrency] = useState("GEL");
    const [simResult, setSimResult] = useState<any | null>(null);

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            // Simple parser: Assume columns "Raw" and "Target" exist, or just map first 2 cols
            // For robustness, we'll try to find 'source' and 'target' keys, or fall back to keys 0 and 1

            if (jsonData.length > 0) {
                const newMappings = jsonData.map((row, idx) => {
                    const keys = Object.keys(row);
                    return {
                        id: Date.now() + idx,
                        rawField: row['Raw Field'] || row['source'] || row[keys[0]] || 'UNKNOWN',
                        targetField: row['Target'] || row['target'] || row[keys[1]] || 'UNKNOWN',
                        confidence: 1.0 // Manual upload implies 100% confidence
                    };
                });

                setMappings(newMappings);
                await saveMappings(newMappings);
                toast.success(`Parsed ${newMappings.length} mapping rules successfully`);
            } else {
                toast.warning("File appears empty");
            }

        } catch (error) {
            console.error("Parsing error", error);
            toast.error("Failed to parse mapping file. Ensure it is a valid Excel/CSV.");
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } });

    const handleSimulate = () => {
        // Phase 17: Validated SOCAR Logic Simulator
        const entMap = simEntity === 'SOCAR Georgia' ? 'SGG-001' : (simEntity === 'SOCAR Gas' ? 'SGG-002' : 'UNKNOWN');
        const glStr = String(simGlAccount).trim();
        const glPrefix = glStr.charAt(0);

        // Detailed Logic Matching Backend
        let category = 'Unmapped';
        let subCategory = 'General';

        if (glPrefix === '4') {
            category = 'Revenue';
            if (glStr.includes('4001')) subCategory = 'Social Gas Sales';
            else if (glStr.includes('4002')) subCategory = 'Commercial Gas Sales';
            else if (glStr.includes('4003')) subCategory = 'Gas Distribution Service';
            else subCategory = 'Other Revenue';
        }
        else if (glPrefix === '5') {
            category = 'Expenses'; // Or COGS depending on definition, mapping typically maps to main buckets
            // Simple Frontend Simulation
            if (glStr.includes('5001')) { category = 'COGS'; subCategory = 'Cost of Social Gas'; }
            else if (glStr.includes('5002')) { category = 'COGS'; subCategory = 'Cost of Commercial Gas'; }
            else if (glStr.includes('5003')) { category = 'COGS'; subCategory = 'Gas Transportation Cost'; }
            else if (glStr.includes('5100')) { category = 'Expenses'; subCategory = 'Depreciation'; }
            else { category = 'Expenses'; subCategory = 'Operating Expenses'; }
        }
        else if (glPrefix === '1') category = 'Assets';
        else if (glPrefix === '2') category = 'Liabilities';
        else if (glPrefix === '3') category = 'Equity';

        const result = {
            input: { entity: simEntity, gl: simGlAccount, amt: simAmount },
            mapped: {
                entity_id: entMap,
                category: category,
                sub_category: subCategory,
                is_balance_sheet: ['Assets', 'Liabilities', 'Equity'].includes(category)
            },
            validation: {
                status: entMap !== 'UNKNOWN' && category !== 'Unmapped' ? 'ok' : 'warning',
                message: entMap === 'UNKNOWN' ? 'Unknown Entity' : (category === 'Unmapped' ? 'Invalid GL Code' : `Mapped to ${subCategory}`)
            }
        };
        setSimResult(result);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Configuration & Structure */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" /> Mapping Configuration
                            </CardTitle>
                            <Button size="sm" onClick={applyMappings} disabled={isSaving}>
                                {isSaving ? "Applying..." : "Apply Mappings"}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="rules">
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="rules">Rules</TabsTrigger>
                                    <TabsTrigger value="entity">Entities</TabsTrigger>
                                    <TabsTrigger value="gl">GL Schema</TabsTrigger>
                                </TabsList>

                                <TabsContent value="rules" className="space-y-4">
                                    <div {...getRootProps()} className={cn(
                                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300",
                                        isDragActive ? "border-primary bg-primary/10 scale-105" : "border-border hover:bg-muted/50"
                                    )}>
                                        <input {...getInputProps()} />
                                        <div className="flex flex-col items-center gap-2">
                                            <UploadCloud className={cn("h-8 w-8 mb-2", isDragActive ? "text-primary animate-bounce" : "text-muted-foreground")} />
                                            <p className="text-sm font-medium">Drop mapping matrix files here</p>
                                            <p className="text-xs text-muted-foreground">.xlsx or .csv (Column A: Raw, Column B: Target)</p>
                                        </div>
                                    </div>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">Raw Field</TableHead>
                                                    <TableHead className="text-xs">Target</TableHead>
                                                    <TableHead className="text-xs text-right">Conf.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {mappings.map((m) => (
                                                    <TableRow key={m.id}>
                                                        <TableCell className="text-xs font-mono text-muted-foreground">{m.rawField}</TableCell>
                                                        <TableCell className="text-xs">{m.targetField}</TableCell>
                                                        <TableCell className="text-xs text-right text-emerald-500">{(m.confidence * 100).toFixed(0)}%</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="entity">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">Entity ID</TableHead>
                                                    <TableHead className="text-xs">Name</TableHead>
                                                    <TableHead className="text-xs">Type</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {ENTITY_HIERARCHY.map((e) => (
                                                    <TableRow key={e.code}>
                                                        <TableCell className="text-xs font-mono font-bold">{e.code}</TableCell>
                                                        <TableCell className="text-xs">{e.name}</TableCell>
                                                        <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{e.type}</Badge></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                <TabsContent value="gl">
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">GL Range</TableHead>
                                                    <TableHead className="text-xs">Category</TableHead>
                                                    <TableHead className="text-xs">Statement</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {GL_HIERARCHY.map((g) => (
                                                    <TableRow key={g.range}>
                                                        <TableCell className="text-xs font-mono">{g.range}</TableCell>
                                                        <TableCell className="text-xs font-bold">{g.category}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{g.type}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Validation Simulator */}
                <Card className="border-primary/20 bg-primary/5 relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Activity className="h-64 w-64" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-5 w-5 text-primary" />
                            Mapping Logic Simulator
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Entity Name</label>
                                <input className="w-full text-sm bg-background border rounded-md px-3 py-2" value={simEntity} onChange={e => setSimEntity(e.target.value)} placeholder="e.g. SOCAR Georgia" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">GL Account</label>
                                <input className="w-full text-sm bg-background border rounded-md px-3 py-2 font-mono" value={simGlAccount} onChange={e => setSimGlAccount(e.target.value)} placeholder="e.g. 4001" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Amount</label>
                                <input type="number" className="w-full text-sm bg-background border rounded-md px-3 py-2" value={simAmount} onChange={e => setSimAmount(Number(e.target.value))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Currency</label>
                                <select className="w-full text-sm bg-background border rounded-md px-3 py-2" value={simCurrency} onChange={e => setSimCurrency(e.target.value)}>
                                    <option>GEL</option>
                                    <option>USD</option>
                                    <option>EUR</option>
                                </select>
                            </div>
                        </div>

                        <Button onClick={handleSimulate} className="w-full shadow-lg shadow-primary/20" size="lg">
                            <ArrowRight className="h-4 w-4 mr-2" /> Run Phase 12 Validation
                        </Button>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Result Box */}
                            <div className="col-span-2 p-4 bg-black/40 backdrop-blur-sm border border-border/50 rounded-lg font-mono text-xs space-y-2 h-[200px] overflow-auto">
                                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                                    <span className="font-bold text-primary">SIMULATION OUTPUT</span>
                                    {simResult && (
                                        <Badge variant="outline" className={cn(simResult.validation.status === 'ok' ? 'text-emerald-500 border-emerald-500/30' : 'text-amber-500 border-amber-500/30')}>
                                            {simResult.validation.status.toUpperCase()}
                                        </Badge>
                                    )}
                                </div>
                                {simResult ? (
                                    <pre className="text-muted-foreground">{JSON.stringify(simResult, null, 2)}</pre>
                                ) : (
                                    <span className="text-muted-foreground/50 italic">Waiting for input...</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MappingMatrix;
