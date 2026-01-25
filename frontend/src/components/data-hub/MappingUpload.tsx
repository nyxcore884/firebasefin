import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiPost } from '@/lib/api-client';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { AIText } from '@/components/common/AIText';
import { cn } from '@/lib/utils';

export default function MappingUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [previewRows, setPreviewRows] = useState<any[]>([]);
    const [mappingName, setMappingName] = useState('');
    const [sourceProfile, setSourceProfile] = useState('budget_holder_mapping_v1');
    const [activate, setActivate] = useState(true);
    const [loading, setLoading] = useState(false);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
        if (f) {
            parseFilePreview(f);
        } else {
            setPreviewRows([]);
        }
    };

    const parseFilePreview = async (f: File) => {
        try {
            const arrayBuffer = await f.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            setPreviewRows(json.slice(0, 100));
        } catch (err) {
            console.error('Parse error', err);
            toast.error('Failed to parse financial mapping file');
        }
    };

    const buildRulesFromPreview = (rows: any[]) => {
        return rows.map((r: any) => ({
            raw_field: 'budget_article',
            raw_value: (r['budget_article'] || r['budget article'] || '').toString().trim(),
            structural_unit: (r['structural_unit'] || r['structural unit'] || r.unit || '').toString().trim(),
            counterparty: (r['counterparty'] || r['vendor'] || '').toString().trim(),
            region: (r['region'] || '').toString().trim(),
            target_field: 'budget_holder',
            target_value: (r['budget_holder'] || r['budget holder'] || '').toString().trim(),
            priority: Number(r['priority'] || 1),
            match_type: 'equals'
        })).filter((rr: any) => rr.raw_value && rr.target_value);
    };

    const uploadMapping = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const rules = buildRulesFromPreview(previewRows);
            if (rules.length === 0) {
                toast.error('No valid mapping rows found in file (requires budget_article and budget_holder)');
                setLoading(false);
                return;
            }

            const payload = {
                name: mappingName || `business_map_${new Date().toISOString().split('T')[0]}`,
                source_profile: sourceProfile,
                description: 'Business override upload via Strategic Nexus',
                rules,
                activate,
                uploaded_by: 'finance_admin'
            };

            const res = await apiPost('/api/mapping/upload', payload);
            toast.success(`Dynamic Mapping Activated: ${payload.name}`);

            setFile(null);
            setPreviewRows([]);
            setMappingName('');
        } catch (err: any) {
            console.error(err);
            toast.error(`Configuration update failed: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="glass-vivid border-primary/20 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

            <CardHeader className="border-b border-white/5 bg-white/5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xs font-black uppercase tracking-widest">
                                <AIText>Dynamic Mapping Control</AIText>
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">
                                Override system logic with business-defined rules
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black border-primary/20 bg-primary/5">
                        MAPPING ENGINE V2
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="group relative">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                Mapping Configuration CSV
                            </label>
                            <div className={cn(
                                "relative h-32 border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-3 bg-primary/5",
                                file ? "border-primary/50 bg-primary/10" : "border-white/10 hover:border-primary/30"
                            )}>
                                <input
                                    type="file"
                                    accept=".csv, .xls, .xlsx"
                                    onChange={onFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                {file ? (
                                    <>
                                        <CheckCircle2 className="h-8 w-8 text-primary animate-in zoom-in" />
                                        <span className="text-[10px] font-black uppercase">{file.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="h-8 w-8 text-muted-foreground/40" />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground/60">Drop Mapping Sheet</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Version Name</label>
                                <Input
                                    placeholder="e.g. Q1_2026_Adjustments"
                                    value={mappingName}
                                    onChange={(e) => setMappingName(e.target.value)}
                                    className="bg-slate-950/50 border-white/5 text-[11px] font-bold"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase">Instant Activation</span>
                                    <span className="text-[8px] text-muted-foreground">Apply to next ingestion cycle</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={activate}
                                    onChange={(e) => setActivate(e.target.checked)}
                                    className="w-5 h-5 rounded-md border-primary/20 bg-primary/5 text-primary focus:ring-primary/40 mr-2"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col h-full bg-slate-950/40 rounded-xl border border-white/5 overflow-hidden">
                        <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">Rule Preview</span>
                            {previewRows.length > 0 && (
                                <Badge className="text-[8px]">{previewRows.length} Rows</Badge>
                            )}
                        </div>
                        <div className="flex-1 overflow-auto p-0 scrollbar-hide">
                            {previewRows.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 z-10">
                                        <tr>
                                            <th className="p-2 text-[8px] font-black uppercase text-muted-foreground border-b border-white/5">Article</th>
                                            <th className="p-2 text-[8px] font-black uppercase text-muted-foreground border-b border-white/5">Holder</th>
                                            <th className="p-2 text-[8px] font-black uppercase text-muted-foreground border-b border-white/5">Prio</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.slice(0, 10).map((r, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors border-b border-white/5">
                                                <td className="p-2 text-[9px] font-medium truncate max-w-[100px]">{r.budget_article || r.Article || '-'}</td>
                                                <td className="p-2 text-[9px] font-black text-primary uppercase">{r.budget_holder || r.Holder || '-'}</td>
                                                <td className="p-2 text-[9px] font-bold">{r.priority || 1}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                                    <AlertCircle className="h-6 w-6 text-muted-foreground/20 mb-2" />
                                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase">No data loaded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={uploadMapping}
                    disabled={loading || !file}
                    className="w-full bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-[0.2em] text-[10px] py-6 shadow-xl shadow-primary/20 rounded-xl group"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Updating Synapse...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 transform group-hover:-translate-y-1 transition-transform" />
                            <span>Commit Mapping Set</span>
                        </div>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
