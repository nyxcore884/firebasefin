import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Tag, Settings2, Plus, ArrowRight } from 'lucide-react';
import { AIText } from '@/components/common/AIText';

const ChartOfAccounts = () => {
    const [activeSection, setActiveSection] = useState<'PL' | 'BS'>('PL');

    const categories = [
        { code: '4000', name: 'Sales Revenue', type: 'Revenue', group: 'Income Statement' },
        { code: '5000', name: 'Cost of Sales', type: 'COGS', group: 'Income Statement' },
        { code: '6100', name: 'Operating Expenses', type: 'Exps', group: 'Income Statement' },
        { code: '1100', name: 'Cash and Equivalents', type: 'Asset', group: 'Balance Sheet' },
        { code: '2100', name: 'Accounts Payable', type: 'Liab', group: 'Balance Sheet' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black italic uppercase"><AIText>Chart of Accounts Studio</AIText></h3>
                    <Badge variant="outline" className="text-[9px] uppercase font-black"><AIText>IFRS Standard</AIText></Badge>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-[9px] font-black uppercase tracking-widest"><AIText>Import Schema</AIText></Button>
                    <Button size="sm" className="text-[9px] font-black uppercase tracking-widest bg-primary"><Settings2 className="h-3 w-3 mr-2" /><AIText>Configure Dimensions</AIText></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 1. Statistics Sidebar */}
                <div className="space-y-6">
                    <Card className="glass-vivid border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60"><AIText>Account Structure</AIText></CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: 'Active Codes', val: '248' },
                                { label: 'Mapped Articles', val: '182' },
                                { label: 'Orphaned', val: '0', color: 'text-emerald-500' },
                            ].map((stat, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                                    <span className={cn("text-xs font-black", stat.color || "text-primary")}>{stat.val}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="glass-vivid border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60"><AIText>Budget Articles</AIText></CardTitle>
                            <Plus className="h-3 w-3 text-primary cursor-pointer hover:scale-110 transition-transform" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {['Office Supplies', 'Fuel & Logistics', 'Infrastructure', 'Consulting'].map((art, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg group cursor-pointer hover:bg-white/10 transition-all">
                                    <Tag className="h-3 w-3 text-primary/40 group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{art}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Main Ledger View */}
                <Card className="lg:col-span-3 glass-vivid border-primary/20 bg-primary/5">
                    <CardHeader className="border-b border-primary/10 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveSection('PL')}
                                    className={cn("text-[10px] font-black uppercase tracking-widest pb-1 transition-all", activeSection === 'PL' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-white")}
                                >
                                    <AIText>Income Statement (P&L)</AIText>
                                </button>
                                <button
                                    onClick={() => setActiveSection('BS')}
                                    className={cn("text-[10px] font-black uppercase tracking-widest pb-1 transition-all", activeSection === 'BS' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-white")}
                                >
                                    <AIText>Balance Sheet</AIText>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary/40" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">General Ledger Structure</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {categories
                                .filter(c => activeSection === 'PL' ? c.group === 'Income Statement' : c.group === 'Balance Sheet')
                                .map((c) => (
                                    <div key={c.code} className="flex items-center justify-between p-4 bg-background/40 rounded-xl border border-white/5 hover:border-primary/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-black text-primary italic font-mono w-16">{c.code}</span>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-tight">{c.name}</p>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none mt-1">{c.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase text-primary/60 border-primary/20 tracking-tighter">
                                                {c.group}
                                            </Badge>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default ChartOfAccounts;
