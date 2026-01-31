import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    UploadCloud, CheckCircle, AlertTriangle, AlertCircle, Clock,
    RefreshCw, ChevronRight, FileSpreadsheet, Database,
    Search, Filter, Plus, Download, Trash2, X, LayoutGrid, List as ListIcon, History,
    Shield, Network, Workflow, Calculator, Zap, Activity, Info, BarChart2,
    Settings, Wand2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { financialService } from '../../services/financialService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Consolidated Components
import { DataQuality } from './DataQuality';
import { EntityManager } from '../settings/EntityManager';
import { WorkflowBuilder } from '../workflows/WorkflowBuilder';

interface Dataset {
    id: string;
    name: string;
    type: 'Actual' | 'Budget' | 'Forecast';
    period: string;
    entities: number;
    records: number;
    quality: number;
    updatedAt: string;
    status: 'Validated' | 'Warning' | 'Processing';
}

interface OperationStep {
    label: string;
    status: 'pending' | 'loading' | 'success' | 'warning';
    details?: string;
}

export const DataHub: React.FC = () => {
    const dispatch = useDispatch();
    const { currentCompany } = useSelector((state: RootState) => state.company);
    const templates = useSelector((state: RootState) => state.templates.templates);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [operations, setOperations] = useState<OperationStep[]>([]);
    const [targetOrg, setTargetOrg] = useState(currentCompany?.org_id || 'SOCAR_GROUP');
    const [targetPeriod, setTargetPeriod] = useState('2026-01');

    // Library State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [activeTab, setActiveTab] = useState<'warehouse' | 'quality' | 'entities' | 'workflows' | 'engine'>('warehouse');
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['warehouse', 'quality', 'entities', 'workflows', 'engine'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [location]);

    useEffect(() => {
        if (currentCompany?.org_id) {
            loadLibrary();
        }
    }, [currentCompany]);

    const loadLibrary = async () => {
        setIsLoadingLibrary(true);
        try {
            const data = await financialService.getDatasets(currentCompany?.org_id || 'SOCAR_GROUP');
            setDatasets(data);
        } catch (err) {
            console.error("Failed to load datasets", err);
        } finally {
            setIsLoadingLibrary(false);
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(10);

        // Dispatch Global Processing Event
        window.dispatchEvent(new CustomEvent('nyx-process-start', {
            detail: { message: `Ingesting: ${file.name}` }
        }));

        setOperations([
            { label: `file: ${file.name.toLowerCase()}`, status: 'success' },
            { label: 'initiating ingestion...', status: 'loading' }
        ]);

        try {
            setUploadProgress(40);
            window.dispatchEvent(new CustomEvent('nyx-process-update', {
                detail: { stage: 'CLOUD_INGESTION', progress: 40, message: 'Stream established...' }
            }));

            const response = await financialService.uploadFinancialData(file);

            window.dispatchEvent(new CustomEvent('nyx-process-update', {
                detail: { stage: 'NEURAL_MAPPING', progress: 75, message: 'Reconciling nodes...' }
            }));

            setUploadProgress(100);
            window.dispatchEvent(new CustomEvent('nyx-process-update', {
                detail: { stage: 'SUCCESS', progress: 100, message: 'Ingestion Finalized' }
            }));

            setOperations(prev => [
                ...prev.slice(0, 1),
                { label: 'ingestion complete', status: 'success', details: `processed ${response.processed_count || 0} nodes` },
                { label: 'engine validation', status: 'success', details: 'integrity check passed' }
            ]);

            loadLibrary(); // Reload library after upload

            setTimeout(() => {
                setIsUploading(false);
                setOperations([]);
                window.dispatchEvent(new CustomEvent('nyx-process-stop'));
            }, 3000);
        } catch (error: any) {
            window.dispatchEvent(new CustomEvent('nyx-process-update', {
                detail: { stage: 'ERROR', progress: 0, message: error.message }
            }));
            setOperations(prev => [...prev, { label: 'ingestion failed', status: 'warning', details: error.message }]);
            setIsUploading(false);
            setTimeout(() => window.dispatchEvent(new CustomEvent('nyx-process-stop')), 5000);
        }
    }, [currentCompany]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
        }
    });

    const filteredDatasets = datasets.filter(ds =>
        ds.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto space-y-6 min-h-screen relative overflow-hidden bg-grid-white">
            {/* Mesh Gradient Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-mesh" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end pb-6 border-b border-white/10 gap-4 relative z-10">
                <div className="space-y-1">
                    <span className="text-primary font-black tracking-[0.4em] block text-[10px] uppercase text-glow">
                        Operational Intelligence Hub
                    </span>
                    <div className="flex items-center gap-4">
                        <Database size={32} className="text-primary" />
                        <h1 className="text-4xl lg:text-5xl font-black text-white font-display uppercase tracking-tighter text-glow">
                            {activeTab === 'warehouse' ? 'Warehouse' :
                                activeTab === 'quality' ? 'Data Quality' :
                                    activeTab === 'entities' ? 'Entities' :
                                        activeTab === 'workflows' ? 'Workflows' : 'Engine'}
                        </h1>
                    </div>
                </div>

                {/* Compact Tab Switcher */}
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                    {[
                        { id: 'warehouse', icon: Database, label: 'Warehouse' },
                        { id: 'quality', icon: Shield, label: 'Quality' },
                        { id: 'entities', icon: Network, label: 'Entities' },
                        { id: 'workflows', icon: Workflow, label: 'Flows' },
                        { id: 'engine', icon: Calculator, label: 'Engine' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                    : "text-white/30 hover:text-white/60 hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    {/* WAREHOUSE TAB */}
                    {activeTab === 'warehouse' && (
                        <motion.div
                            key="warehouse"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-12 gap-6"
                        >
                            {/* Upload Zone */}
                            <div className="col-span-12 xl:col-span-5 space-y-6">
                                <div className="nyx-card p-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-2xl shadow-primary/5">
                                    <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 italic flex items-center gap-2">
                                        <UploadCloud size={16} /> Ingestion Channel
                                    </h2>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Target Context</span>
                                            <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-black text-white uppercase outline-none focus:border-primary backdrop-blur-md">
                                                <option className="bg-[#020617]">{currentCompany?.org_name}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Fiscal Scope</span>
                                            <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-black text-white uppercase outline-none focus:border-primary backdrop-blur-md">
                                                <option className="bg-[#020617]">January 2026</option>
                                                <option className="bg-[#020617]">Q1 2026</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div
                                        {...getRootProps()}
                                        className={cn(
                                            "p-12 text-center border-2 border-dashed rounded-3xl transition-all cursor-pointer group backdrop-blur-md",
                                            isDragActive ? "border-primary bg-primary/10 scale-95" : "border-white/10 hover:border-primary/50 bg-white/[0.02]"
                                        )}
                                    >
                                        <input {...getInputProps()} />
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                                            <UploadCloud size={32} className="text-white/40 group-hover:text-primary transition-colors" />
                                        </div>
                                        <p className="text-xs font-black text-white uppercase tracking-tight">Drop Financial Arrays Here</p>
                                        <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-2">supports .xlsx, .csv (MAX 50MB)</p>
                                    </div>

                                    {isUploading && (
                                        <div className="mt-6 p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 shadow-2xl">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Engine Processing...</span>
                                                <span className="text-[10px] font-mono text-white/40">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary shadow-[0_0_10px_rgb(37,99,235)] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                            <ul className="space-y-3">
                                                {operations.map((op, idx) => (
                                                    <li key={idx} className="flex items-start gap-3">
                                                        <div className={cn(
                                                            "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center",
                                                            op.status === 'success' ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/20 text-primary"
                                                        )}>
                                                            {op.status === 'success' ? <CheckCircle size={10} /> : <RefreshCw size={10} className="animate-spin" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-white uppercase leading-none">{op.label}</p>
                                                            <p className="text-[9px] text-white/40 uppercase italic mt-1">{op.details}</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Library Zone */}
                            <div className="col-span-12 xl:col-span-7 space-y-6">
                                <div className="nyx-card p-6 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Database size={16} className="text-primary" /> Repository Assets
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                                <input
                                                    type="text"
                                                    placeholder="Search assets..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-[11px] font-black text-white uppercase outline-none focus:border-primary/50 w-56 backdrop-blur-md"
                                                />
                                            </div>
                                            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 backdrop-blur-md">
                                                <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-primary text-white shadow-xl" : "text-white/20 hover:text-white")}>
                                                    <LayoutGrid size={16} />
                                                </button>
                                                <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-primary text-white shadow-xl" : "text-white/20 hover:text-white")}>
                                                    <ListIcon size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {viewMode === 'grid' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredDatasets.map(ds => (
                                                <div key={ds.id} className="nyx-card p-6 border-white/10 hover:border-primary/50 bg-white/[0.03] transition-all cursor-pointer group flex flex-col h-full" onClick={() => setSelectedDataset(ds)}>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="p-3 bg-white/5 rounded-2xl text-white/40 group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                                                            <FileSpreadsheet size={24} />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <h4 className="text-xs font-black text-white uppercase truncate tracking-tight">{ds.name}</h4>
                                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1 italic">{ds.period}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-white/30 uppercase">Nodes</span>
                                                            <span className="text-xs font-black text-white">{ds.records.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[8px] font-black text-white/30 uppercase">Health</span>
                                                            <span className={cn("text-xs font-black", ds.quality > 90 ? "text-emerald-400" : "text-amber-400")}>{ds.quality}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            {/* List View Table */}
                                            <table className="w-full text-left text-[11px]">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-white/30 uppercase tracking-[0.2em] font-black text-[9px]">
                                                        <th className="p-4">Asset Identification</th>
                                                        <th className="p-4">Class</th>
                                                        <th className="p-4">Temporal Scope</th>
                                                        <th className="p-4 text-right">Integrity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/[0.05]">
                                                    {filteredDatasets.map(ds => (
                                                        <tr key={ds.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => setSelectedDataset(ds)}>
                                                            <td className="p-4 font-black text-white uppercase tracking-tight">{ds.name}</td>
                                                            <td className="p-4"><span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-white/60">{ds.type}</span></td>
                                                            <td className="p-4 font-bold text-white/40 uppercase text-[10px]">{ds.period}</td>
                                                            <td className="p-4 text-right font-black text-emerald-400 text-glow">{ds.quality}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* QUALITY TAB */}
                    {activeTab === 'quality' && (
                        <motion.div
                            key="quality"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <DataQuality isEmbedded />
                        </motion.div>
                    )}

                    {/* ENTITIES TAB */}
                    {activeTab === 'entities' && (
                        <motion.div
                            key="entities"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                        >
                            <EntityManager isEmbedded />
                        </motion.div>
                    )}

                    {/* WORKFLOWS TAB */}
                    {activeTab === 'workflows' && (
                        <motion.div
                            key="workflows"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <WorkflowBuilder isEmbedded />
                        </motion.div>
                    )}

                    {/* ENGINE TAB */}
                    {activeTab === 'engine' && (
                        <motion.div
                            key="engine"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="nyx-card p-12 bg-white/[0.01] border-dashed border-white/10 min-h-[500px] flex flex-col items-center justify-center"
                        >
                            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
                                <Calculator size={40} className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 text-glow">Financial Calculation Engine</h2>
                            <p className="text-xs text-white/30 uppercase max-w-lg text-center leading-relaxed tracking-widest">
                                The logic cluster for SOCAR GROUP is currently under synthesis.
                                <br />
                                Deterministic models for Multi-Currency Consolidation and Forensic Audit are being optimized for BigQuery execution.
                            </p>
                            <div className="mt-12 flex gap-4">
                                <Button
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('nyx-process-start', { detail: { message: 'Infrastructuring Logic Array...' } }));
                                        setTimeout(() => window.dispatchEvent(new CustomEvent('nyx-process-stop')), 2000);
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] h-12 px-8 rounded-2xl shadow-xl"
                                >
                                    Define Logic Array
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('nyx-process-start', { detail: { message: 'Accessing BigQuery Schema...' } }));
                                        setTimeout(() => window.dispatchEvent(new CustomEvent('nyx-process-stop')), 2000);
                                    }}
                                    className="border-white/10 bg-white/5 text-white font-black uppercase text-[10px] h-12 px-8 rounded-2xl"
                                >
                                    View BigQuery Directives
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Asset Detail Overlay */}
            {selectedDataset && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-50 transition-opacity" onClick={() => setSelectedDataset(null)} />
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="fixed inset-y-0 right-0 w-[450px] bg-card border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] z-50 p-8 flex flex-col overflow-hidden"
                    >
                        {/* Detail background glow */}
                        <div className="absolute top-0 right-0 w-full h-[300px] bg-primary/10 blur-[100px] -z-10" />

                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] italic text-glow">Asset Metadata Array</h3>
                            <button onClick={() => setSelectedDataset(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} className="text-white/40" /></button>
                        </div>

                        <div className="flex items-center gap-6 mb-12">
                            <div className="p-6 bg-primary/20 border border-primary/30 rounded-[2.5rem] text-primary shadow-[0_0_50px_rgba(37,99,235,0.2)]">
                                <FileSpreadsheet size={48} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">{selectedDataset.name}</h4>
                                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest truncate max-w-[200px]">NODE_ID: {selectedDataset.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-12">
                            {[
                                { label: 'Class', val: selectedDataset.type, icon: Database },
                                { label: 'Scope', val: selectedDataset.period, icon: ChevronRight },
                                { label: 'Total Nodes', val: selectedDataset.records.toLocaleString(), icon: Plus },
                                { label: 'Integrity', val: `${selectedDataset.quality}%`, icon: CheckCircle, highlight: true },
                            ].map((stat, i) => (
                                <div key={i} className="p-5 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-white/20 transition-all group">
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">{stat.label}</span>
                                    <div className="flex items-center justify-between">
                                        <span className={cn("text-lg font-black uppercase text-glow", stat.highlight ? "text-emerald-400" : "text-white")}>{stat.val}</span>
                                        <stat.icon size={16} className="text-white/10 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 mt-auto">
                            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs py-8 rounded-3xl shadow-[0_0_50px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3">
                                <Download size={20} /> Export High-Fidelity Array
                            </Button>
                            <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] py-8 rounded-3xl tracking-widest flex items-center justify-center gap-3">
                                <History size={20} /> Transaction Lineage
                            </Button>
                            <div className="h-px bg-white/5 my-6" />
                            <Button variant="ghost" className="w-full text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 font-black uppercase text-[10px] py-6 rounded-2xl transition-all flex items-center justify-center gap-3">
                                <Trash2 size={18} /> Purge Intelligence Asset
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
};
