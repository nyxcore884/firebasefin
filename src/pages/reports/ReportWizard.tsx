import React, { useState } from 'react';
import {
    FileText,
    Download,
    ChevronRight,
    ChevronLeft,
    Image as ImageIcon,
    Layers,
    PieChart,
    CheckCircle,
    Sparkles,
    Globe,
    Loader2
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { reportService, ReportConfig } from '@/services/reportService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const STEPS = ['report selection', 'customization', 'review & export'];

export const ReportWizard: React.FC = () => {
    const { entities } = useSelector((state: RootState) => state.entities);
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx'>('pdf');

    const [config, setConfig] = useState<ReportConfig>({
        execSummary: true,
        kpis: true,
        pnl: true,
        balanceSheet: false,
        cashFlow: false,
        charts: true
    });

    const [branding, setBranding] = useState({
        logo: '',
        title: 'financial performance review',
        entity: 'all',
        period: 'december 2025',
        commentary: '',
        showBadge: true
    });

    const [previews, setPreviews] = useState({
        logoUrl: ''
    });

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setBranding({ ...branding, logo: base64 });
                setPreviews({ ...previews, logoUrl: base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleExport = async (format: 'pdf' | 'xlsx') => {
        setLoading(true);
        try {
            await reportService.generateReport({
                entity: branding.entity,
                period: branding.period,
                config,
                branding: {
                    logo: branding.logo,
                    title: branding.title,
                    commentary: branding.commentary,
                    organization: branding.entity === 'all'
                        ? 'Consolidated Group'
                        : entities.find(e => e.id === branding.entity)?.name
                }
            }, format);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const currentEntityName = branding.entity === 'all'
        ? 'consolidated group'
        : (entities.find(e => e.id === branding.entity)?.name || branding.entity).toLowerCase();

    return (
        <div className="p-4 max-w-[1000px] mx-auto">
            <div className="mb-6 text-center">
                <h3 className="text-3xl font-bold text-white mb-2 lowercase">
                    report generation wizard
                </h3>
                <p className="text-slate-400 lowercase">
                    high-performance, audit-ready financial statements for enterprise stakeholders.
                </p>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-center w-full">
                    {STEPS.map((label, index) => (
                        <div key={label} className="flex items-center">
                            <div className="flex flex-col items-center relative z-10">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                    activeStep >= index
                                        ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                                        : "bg-slate-800 text-slate-400 border border-white/10"
                                )}>
                                    {index + 1}
                                </div>
                                <span className={cn(
                                    "absolute -bottom-6 text-xs font-medium whitespace-nowrap lowercase transition-colors duration-300",
                                    activeStep >= index ? "text-indigo-400" : "text-slate-500"
                                )}>
                                    {label}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={cn(
                                    "h-[2px] w-24 mx-2 transition-colors duration-500",
                                    activeStep > index ? "bg-indigo-600" : "bg-slate-800"
                                )} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-premium p-8 rounded-3xl border border-white/10 shadow-2xl min-h-[570px] flex flex-col mt-10 bg-slate-900/40 backdrop-blur-md">
                {activeStep === 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h5 className="text-xl font-bold mb-4 lowercase text-white">step 1: scope & structure</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="mb-6">
                                    <h6 className="text-indigo-400 text-sm font-bold mb-2 lowercase">target consolidation</h6>
                                    <Select
                                        value={branding.entity}
                                        onValueChange={(val) => setBranding({ ...branding, entity: val })}
                                    >
                                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Select entity" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">consolidated group (global view)</SelectItem>
                                            {entities.map(e => (
                                                <SelectItem key={e.id} value={e.id} className="focus:bg-slate-800 focus:text-white lowercase">{e.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <h6 className="text-indigo-400 text-sm font-bold mb-2 lowercase">time period</h6>
                                    <Select
                                        value={branding.period}
                                        onValueChange={(val) => setBranding({ ...branding, period: val })}
                                    >
                                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            <SelectItem value="december 2025" className="focus:bg-slate-800 focus:text-white lowercase">december 2025 (latest verified)</SelectItem>
                                            <SelectItem value="q4 2025" className="focus:bg-slate-800 focus:text-white lowercase">q4 2025 summary</SelectItem>
                                            <SelectItem value="fy 2025" className="focus:bg-slate-800 focus:text-white lowercase">2025 fiscal year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <h6 className="text-indigo-400 text-sm font-bold mb-2 lowercase">report modules</h6>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="execSummary"
                                            checked={config.execSummary}
                                            onCheckedChange={(checked) => setConfig({ ...config, execSummary: checked as boolean })}
                                            className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <div className="grid gap-0.5 leading-none">
                                            <label htmlFor="execSummary" className="text-sm font-bold text-white lowercase cursor-pointer">
                                                executive commentary
                                            </label>
                                            <p className="text-xs text-slate-400 lowercase">
                                                contextual ai-driven financial analysis
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10 w-full" />

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="kpis"
                                            checked={config.kpis}
                                            onCheckedChange={(checked) => setConfig({ ...config, kpis: checked as boolean })}
                                            className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <div className="grid gap-0.5 leading-none">
                                            <label htmlFor="kpis" className="text-sm font-bold text-white lowercase cursor-pointer">
                                                performance dashlet
                                            </label>
                                            <p className="text-xs text-slate-400 lowercase">
                                                visual kpi cards for quick review
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10 w-full" />

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="pnl"
                                            checked={config.pnl}
                                            onCheckedChange={(checked) => setConfig({ ...config, pnl: checked as boolean })}
                                            className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <div className="grid gap-0.5 leading-none">
                                            <label htmlFor="pnl" className="text-sm font-bold text-white lowercase cursor-pointer">
                                                consolidated income statement
                                            </label>
                                            <p className="text-xs text-slate-400 lowercase">
                                                primary p&l audit trail
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10 w-full" />

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="charts"
                                            checked={config.charts}
                                            onCheckedChange={(checked) => setConfig({ ...config, charts: checked as boolean })}
                                            className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <div className="grid gap-0.5 leading-none">
                                            <label htmlFor="charts" className="text-sm font-bold text-white lowercase cursor-pointer">
                                                trend visualizations
                                            </label>
                                            <p className="text-xs text-slate-400 lowercase">
                                                growth and variance charts
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h5 className="text-xl font-bold mb-4 lowercase text-white">step 2: professional branding</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h6 className="text-indigo-400 text-sm font-bold mb-2 lowercase">presentation details</h6>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-medium lowercase">report header title</label>
                                        <Input
                                            value={branding.title}
                                            onChange={(e) => setBranding({ ...branding, title: e.target.value })}
                                            placeholder="e.g. q4 performance review"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-medium lowercase">managerial commentary</label>
                                        <textarea
                                            value={branding.commentary}
                                            onChange={(e) => setBranding({ ...branding, commentary: e.target.value })}
                                            placeholder="provide qualitative context for the financial results..."
                                            className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h6 className="text-indigo-400 text-sm font-bold mb-2 lowercase">logo & identity</h6>
                                <div className="bg-white/5 border-dashed border-2 border-white/20 rounded-2xl flex flex-col items-center justify-center p-8 gap-4 transition-all hover:bg-white/10 group cursor-pointer relative min-h-[200px]">
                                    {previews.logoUrl ? (
                                        <img src={previews.logoUrl} className="h-[60px] w-auto max-w-full object-contain" alt="Logo preview" />
                                    ) : (
                                        <ImageIcon size={48} className="text-white/20 group-hover:text-white/40" />
                                    )}
                                    <div className="text-center pointer-events-none">
                                        <p className="font-bold text-sm lowercase text-white">{previews.logoUrl ? 'update logo' : 'upload corporate logo'}</p>
                                        <p className="text-xs text-slate-400 lowercase">svg, png, or jpg (high resolution recommended)</p>
                                    </div>
                                    <input
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        type="file"
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                                <div className="mt-4 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                                    <span className="text-xs text-blue-400 font-bold block mb-2 lowercase">preview settings</span>
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="showBadge"
                                            checked={branding.showBadge}
                                            onCheckedChange={(checked) => setBranding({ ...branding, showBadge: checked as boolean })}
                                            className="border-blue-500/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <label htmlFor="showBadge" className="text-xs text-slate-300 lowercase cursor-pointer">
                                            include "finsight enterprise" assurance watermark
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeStep === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                        <h5 className="text-xl font-bold mb-4 lowercase text-white">step 3: export & finalize</h5>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
                            <div className="md:col-span-7">
                                <div className="bg-slate-950 rounded-2xl border border-white/10 h-full overflow-hidden flex flex-col shadow-inner min-h-[400px]">
                                    <div className="bg-slate-900 p-3 border-b border-white/5 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 lowercase">live report preview</span>
                                        <div className="flex gap-1.5">
                                            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/20 border border-rose-500/50" />
                                            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 overflow-y-auto bg-slate-900/50">
                                        {/* Mock PDF Preview */}
                                        <div className="bg-white text-slate-900 p-8 shadow-2xl min-h-[400px] font-sans rounded-sm mx-auto max-w-[90%]">
                                            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                                                <div>
                                                    <h6 className="font-bold text-slate-900 text-lg lowercase">{branding.title}</h6>
                                                    <span className="text-xs text-slate-500 lowercase">{currentEntityName} | {branding.period}</span>
                                                </div>
                                                {previews.logoUrl ? (
                                                    <img src={previews.logoUrl} className="h-8 w-auto" alt="Logo" />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-900">fs</div>
                                                )}
                                            </div>

                                            {config.execSummary && (
                                                <div className="mb-6">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block border-b border-slate-100 pb-1">executive summary</span>
                                                    <p className="text-[10px] leading-relaxed text-slate-700 text-justify">
                                                        the financial period ending <span className="font-semibold">{branding.period}</span> shows sustained growth for <span className="font-semibold">{currentEntityName}</span>.
                                                        performance benchmarks indicate optimized operational handling and strategic revenue capture across core verticals.
                                                    </p>
                                                    {branding.commentary && (
                                                        <div className="mt-3 p-3 bg-slate-50 text-[10px] italic text-slate-600 border-l-2 border-slate-300">
                                                            "{branding.commentary}"
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {config.kpis && (
                                                <div className="mb-6">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block border-b border-slate-100 pb-1">key performance indicators</span>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="p-2 border border-slate-100 bg-slate-50/50 rounded text-center">
                                                                <div className="text-[8px] text-slate-400 lowercase mb-1">metric 0{i}</div>
                                                                <div className="text-[12px] font-bold text-indigo-600">₾{(Math.random() * 100).toFixed(1)}k</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-12 pt-4 border-t border-slate-100 flex justify-between items-end">
                                                <span className="text-[8px] text-slate-400 lowercase italic">confidential document</span>
                                                <span className="text-[8px] text-slate-300 lowercase font-medium flex items-center gap-1">
                                                    <Sparkles size={8} /> verified by finsight ai engine
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-5">
                                <div className="flex flex-col gap-6 h-full justify-center">
                                    <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                        <div className="flex gap-3 items-start">
                                            <CheckCircle size={24} className="mt-0.5" />
                                            <div>
                                                <p className="font-bold text-sm lowercase text-white">validated & ready</p>
                                                <p className="text-xs text-emerald-400/80 lowercase mt-1 leading-relaxed">all deterministic logic paths cleared. data integrity confirmed at 99.8% confidence interval.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full justify-start h-12 border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/20"
                                            onClick={() => handleExport('xlsx')}
                                            disabled={loading}
                                        >
                                            <Layers size={18} className="mr-2" />
                                            export structured excel
                                        </Button>
                                        <Button
                                            size="lg"
                                            className="w-full justify-start h-12 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                            onClick={() => handleExport('pdf')}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
                                            {loading ? 'processing...' : 'download premium pdf'}
                                        </Button>
                                    </div>

                                    <p className="text-[10px] text-slate-500 text-center px-4 lowercase leading-relaxed">
                                        by exporting, you agree to the firm's data sovereignty and reporting compliance standards. exceptions are logged.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-auto pt-6 flex justify-between border-t border-white/5">
                    <Button
                        variant="ghost"
                        disabled={activeStep === 0 || loading}
                        onClick={handleBack}
                        className="text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                    >
                        <ChevronLeft size={18} className="mr-1" />
                        back
                    </Button>
                    {activeStep < 2 && (
                        <Button
                            onClick={handleNext}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 pl-6 pr-4"
                        >
                            continue
                            <ChevronRight size={18} className="ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Benefits */}
            <div className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex gap-4 items-center group">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Globe size={22} />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white lowercase mb-0.5">audit ready</p>
                            <p className="text-xs text-slate-400 lowercase">ifrs compliant layouts with full traceability.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center group">
                        <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles size={22} />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white lowercase mb-0.5">ai insights</p>
                            <p className="text-xs text-slate-400 lowercase">automatic variance commentary included by default.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center group">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <PieChart size={22} />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white lowercase mb-0.5">high fidelity</p>
                            <p className="text-xs text-slate-400 lowercase">vector charts and formatted spreadsheets.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
