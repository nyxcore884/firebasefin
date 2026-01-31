import React, { useState } from 'react';
import {
    FileText, Database, Settings, MoreVertical, Plus,
    Search, FileSpreadsheet, FileCode, Check, UploadCloud
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addTemplate } from '../../store/templateSlice';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

export const Templates: React.FC = () => {
    const dispatch = useDispatch();
    const templates = useSelector((state: RootState) => state.templates.templates);
    const [search, setSearch] = useState("");

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        sourceSystem: '',
        format: 'xlsx',
        mappings: [] as any[]
    });
    const [step, setStep] = useState(1); // 1: Info, 2: File Upload, 3: Mapping
    const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
    const [sampleFile, setSampleFile] = useState<File | null>(null);

    const handleOpen = () => {
        setNewTemplate({ name: '', description: '', sourceSystem: '', format: 'xlsx', mappings: [] });
        setStep(1);
        setSampleFile(null);
        setDetectedColumns([]);
        setOpenModal(true);
    };

    const handleCreate = () => {
        dispatch(addTemplate({
            id: `tmpl_${Date.now()}`,
            ...newTemplate,
            format: newTemplate.format as any,
            lastModified: new Date().toISOString().split('T')[0]
        }));
        setOpenModal(false);
    };

    // File Upload Handling
    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setSampleFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const headers = (jsonData[0] as string[]) || [];
            setDetectedColumns(headers);

            // Auto-map if possible
            const autoMappings = headers.map(header => {
                const lower = header.toLowerCase();
                let target = '';
                if (lower.includes('date')) target = 'transaction_date';
                else if (lower.includes('amount') || lower.includes('debit') || lower.includes('credit')) target = 'amount';
                else if (lower.includes('desc') || lower.includes('memo')) target = 'description';
                else if (lower.includes('account')) target = 'account_code';

                return target ? { sourceColumn: header, targetField: target } : null;
            }).filter(Boolean);

            setNewTemplate(prev => ({ ...prev, mappings: autoMappings }));
        };
        reader.readAsBinaryString(file);
    };
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } });

    const getIcon = (format: string) => {
        switch (format) {
            case 'csv': return <FileSpreadsheet className="text-emerald-400" />;
            case 'json': return <FileCode className="text-amber-400" />;
            case 'xml': return <FileCode className="text-rose-400" />;
            default: return <FileText className="text-indigo-400" />;
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h3 className="text-3xl font-bold flex items-center gap-3 mb-2 text-white">
                        <Database className="text-indigo-400" size={32} />
                        Data Templates
                    </h3>
                    <h6 className="text-slate-400 font-normal text-lg">
                        Manage schemas and mappings to automate future data ingestion.
                    </h6>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                        />
                    </div>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-500 shadow-vivid text-white font-bold rounded-xl px-6 gap-2"
                        onClick={handleOpen}
                    >
                        <Plus size={18} />
                        New Template
                    </Button>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map((tpl, index) => (
                    <motion.div
                        key={tpl.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="glass-card p-6 rounded-[24px] relative overflow-hidden group hover:bg-white/5 transition-all border border-white/5 hover:border-indigo-500/30">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                                    {getIcon(tpl.format)}
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white rounded-full">
                                    <MoreVertical size={20} />
                                </Button>
                            </div>

                            <h6 className="text-lg font-bold text-slate-200 mb-1">
                                {tpl.name}
                            </h6>

                            <p className="text-slate-400 mb-4 h-10 line-clamp-2 text-sm">
                                {tpl.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <Badge
                                    variant="outline"
                                    className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 font-bold uppercase tracking-wider text-[10px]"
                                >
                                    {tpl.sourceSystem}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="bg-slate-800 text-slate-400 border-white/10 font-bold font-mono text-[10px]"
                                >
                                    {tpl.format.toUpperCase()}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-bold text-[10px]"
                                >
                                    {tpl.mappings.length} Mappings
                                </Badge>
                            </div>

                            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-medium">
                                    Updated: {tpl.lastModified}
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-300 hover:text-white hover:bg-white/10 rounded-lg normal-case gap-2"
                                >
                                    <Settings size={14} />
                                    Edit Schema
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Add New Placeholder Card */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={handleOpen}
                    className="h-full min-h-[280px] rounded-[24px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all cursor-pointer group p-6"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <h6 className="text-lg font-bold">Create New Template</h6>
                    <p className="text-sm opacity-70">Define custom mappings manually</p>
                </motion.div>
            </div>

            {/* CREATE TEMPLATE MODAL */}
            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl font-bold">
                            {step === 1 ? 'Template Details' : (step === 2 ? 'Upload Sample' : 'Map Columns')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Template Name</Label>
                                    <Input
                                        id="name"
                                        value={newTemplate.name}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={newTemplate.description}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="source">Source System</Label>
                                    <Select
                                        value={newTemplate.sourceSystem}
                                        onValueChange={(val) => setNewTemplate({ ...newTemplate, sourceSystem: val })}
                                    >
                                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                            <SelectValue placeholder="Select system" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                            {['SAP', 'Oracle', 'Quickbooks', 'Excel', 'Custom'].map((option) => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-400'}`}>
                                <input {...getInputProps()} />
                                <UploadCloud size={48} className="text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-300 font-medium">
                                    {sampleFile ? `Selected: ${sampleFile.name}` : "Drag & drop a sample Excel file to detect columns"}
                                </p>
                            </div>
                        )}

                        {step === 3 && (
                            <div>
                                <Alert className="mb-4 bg-indigo-500/10 text-indigo-200 border-indigo-500/20">
                                    <AlertDescription>
                                        Map the columns found in your file to standard system fields.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                    {detectedColumns.slice(0, 8).map((col, idx) => {
                                        const mapping = newTemplate.mappings.find(m => m.sourceColumn === col);
                                        return (
                                            <div key={idx} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                                <div className="w-1/3 text-sm text-slate-300 font-mono truncate" title={col}>{col}</div>
                                                <div className="text-slate-500">→</div>
                                                <div className="flex-1">
                                                    <select
                                                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
                                                        value={mapping?.targetField || ''}
                                                        onChange={(e) => {
                                                            const target = e.target.value;
                                                            const updated = newTemplate.mappings.filter(m => m.sourceColumn !== col);
                                                            if (target) updated.push({ sourceColumn: col, targetField: target });
                                                            setNewTemplate({ ...newTemplate, mappings: updated });
                                                        }}
                                                    >
                                                        <option value="">-- Ignore --</option>
                                                        <option value="transaction_date">Transaction Date</option>
                                                        <option value="description">Description</option>
                                                        <option value="amount">Amount</option>
                                                        <option value="account_code">Account Code</option>
                                                        <option value="entity_id">Entity ID</option>
                                                    </select>
                                                </div>
                                                {mapping && <Check size={16} className="text-emerald-500" />}
                                            </div>
                                        );
                                    })}
                                    {detectedColumns.length > 8 && <p className="text-xs text-center text-slate-500">...and {detectedColumns.length - 8} more columns</p>}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-8">
                            {step > 1 && <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-slate-400 hover:text-white">Back</Button>}
                            <Button variant="ghost" onClick={() => setOpenModal(false)} className="text-slate-400 hover:text-white">Cancel</Button>
                            {step < 3 ? (
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-500"
                                    disabled={(step === 1 && !newTemplate.name) || (step === 2 && !sampleFile)}
                                    onClick={() => setStep(s => s + 1)}
                                >
                                    Next Step
                                </Button>
                            ) : (
                                <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={handleCreate}>
                                    Create Template
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
