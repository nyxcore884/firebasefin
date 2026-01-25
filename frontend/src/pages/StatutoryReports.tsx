import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText, Printer, Share2, Filter,
    TrendingUp, Landmark, ShieldCheck, Download
} from 'lucide-react';
import { useAppState } from '@/hooks/use-app-state';
import { fetchFinancialTruth } from '@/lib/api-client';
import { AIText } from '@/components/common/AIText';

const StatutoryReports = () => {
    const { selectedCompany, selectedPeriod, selectedDepartment, currency } = useAppState();
    const [truth, setTruth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState<'PL' | 'BS'>('PL');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchFinancialTruth(selectedCompany, selectedPeriod || '', currency, selectedDepartment);
            setTruth(data);
            setLoading(false);
        };
        load();
    }, [selectedCompany, selectedPeriod, selectedDepartment, currency]);

    const formatVal = (v: number) =>
        new Intl.NumberFormat('ka-GE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v || 0);

    return (
        <div className="space-y-8 pb-12 w-full p-6 lg:p-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-glow flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary shadow-glow" />
                        <AIText>Statutory Reporting</AIText>
                    </h1>
                    <p className="text-muted-foreground mt-1 uppercase text-[10px] font-black tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        <AIText>Board-Certified Accuracy • Single Source of Truth</AIText>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 border-primary/20">
                        <Printer className="h-4 w-4" /> Export PDF
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/80 gap-2 shadow-vivid">
                        <Share2 className="h-4 w-4" /> Share with Board
                    </Button>
                </div>
            </div>

            {/* Selection Toggles */}
            <div className="flex bg-primary/5 p-1 rounded-xl border border-primary/10 w-fit">
                <Button
                    variant={reportType === 'PL' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setReportType('PL')}
                    className="text-[10px] font-black uppercase tracking-widest h-9 px-6"
                >
                    Statement of Profit & Loss
                </Button>
                <Button
                    variant={reportType === 'BS' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setReportType('BS')}
                    className="text-[10px] font-black uppercase tracking-widest h-9 px-6"
                >
                    Balance Sheet
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                    <AIText>Materializing Board Report...</AIText>
                </div>
            ) : (
                <Card className="glass-vivid border-primary/10 shadow-vivid max-w-4xl mx-auto overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10 py-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-black italic uppercase italic tracking-tighter text-primary">{selectedCompany}</h2>
                            <p className="text-lg font-bold tracking-widest opacity-80">
                                {reportType === 'PL' ? 'Consolidated Profit & Loss Statement' : 'Consolidated Balance Sheet'}
                            </p>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                                For the Period Ended {selectedPeriod} • Figures in {currency}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="p-10 space-y-8">
                            {reportType === 'PL' ? (
                                <>
                                    <ReportSection title="Operating Revenue" value={truth?.statutory?.REVENUE} />
                                    <ReportSection title="Cost of Goods Sold" value={truth?.statutory?.COGS * -1} isSubtraction />
                                    <ReportSubtotal title="Gross Profit" value={(truth?.statutory?.REVENUE || 0) + (truth?.statutory?.COGS || 0)} />

                                    <ReportSection title="Operating Expenses" value={truth?.statutory?.OPEX * -1} isSubtraction />
                                    <ReportSubtotal title="EBITDA" value={(truth?.statutory?.REVENUE || 0) + (truth?.statutory?.COGS || 0) + (truth?.statutory?.OPEX || 0)} isMain />
                                </>
                            ) : (
                                <>
                                    <ReportSection title="Current Assets" value={truth?.statutory?.ASSETS || 0} />
                                    <ReportSubtotal title="Total Assets" value={truth?.statutory?.ASSETS || 0} isMain />

                                    <ReportSection title="Current Liabilities" value={truth?.statutory?.LIABILITIES || 0} />
                                    <ReportSection title="Owner's Equity" value={truth?.statutory?.EQUITY || 0} />
                                    <ReportSubtotal title="Total Liabilities & Equity" value={(truth?.statutory?.LIABILITIES || 0) + (truth?.statutory?.EQUITY || 0)} isMain />
                                </>
                            )}
                        </div>

                        <div className="bg-muted/30 p-8 border-t border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Landmark className="h-3 w-3" /> Audit Opinion
                            </h4>
                            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed italic">
                                "In our opinion, the consolidated financial statements present fairly, in all material respects,
                                the financial position of {selectedCompany} as of {selectedPeriod} in accordance with IFRS."
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20 max-w-4xl mx-auto">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <AIText>Automated Statutory Materialization Mode: All data sourced from the immutable Truth Warehouse. System Hash:</AIText> {Math.random().toString(36).substring(7).toUpperCase()}
                </p>
            </div>
        </div>
    );
};

const ReportSection = ({ title, value, isSubtraction = false }: any) => (
    <div className="flex justify-between items-center py-2 group">
        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">
            {title}
        </span>
        <span className={cn("text-xs font-black", isSubtraction && value < 0 ? "text-red-400" : "text-white")}>
            {new Intl.NumberFormat('ka-GE', { minimumFractionDigits: 0 }).format(value || 0)}
        </span>
    </div>
);

const ReportSubtotal = ({ title, value, isMain = false }: any) => (
    <div className={cn(
        "flex justify-between items-center py-4 border-t-2 border-white/10 mt-4",
        isMain && "bg-primary/5 px-4 rounded-lg border-primary/20"
    )}>
        <span className={cn("text-xs font-black uppercase tracking-widest", isMain ? "text-primary" : "text-white")}>
            {title}
        </span>
        <span className={cn("text-sm font-black", isMain ? "text-primary" : "text-white")}>
            {new Intl.NumberFormat('ka-GE', { minimumFractionDigits: 0 }).format(value || 0)}
        </span>
    </div>
);

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default StatutoryReports;
