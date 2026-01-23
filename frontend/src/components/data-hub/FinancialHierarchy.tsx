import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Building2, Wallet, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { Company, Department, FinancialNode } from '../../types/structure';
import { validateBalanceSheet } from '@/lib/financial-logic';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FinancialHierarchyProps {
    data: Company[];
}

const FinancialNodeView = ({ node, level = 0 }: { node: FinancialNode; level?: number }) => {
    const [isOpen, setIsOpen] = useState(level < 1); // Open first level by default
    const hasChildren = node.children && node.children.length > 0;

    // Variance color
    const isPositive = node.value.variance >= 0;
    const varianceColor = isPositive ? 'text-emerald-500' : 'text-rose-500';

    return (
        <div className="animate-in fade-in slide-in-from-left-2">
            <div
                className={cn(
                    "flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors border-b border-border/20",
                    level === 0 && "bg-muted/30 font-semibold"
                )}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
            >
                <div className="flex items-center gap-2">
                    {hasChildren ? (
                        isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground/70" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                    ) : (
                        <div className="w-4" />
                    )}
                    <span className="text-sm font-medium">{node.name}</span>
                    {node.glCode && <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 rounded">{node.glCode}</span>}
                </div>
                <div className="flex items-center gap-4 text-xs tabular-nums">
                    <div className="w-24 text-right">
                        <span className="text-muted-foreground block text-[10px]">Budget</span>
                        {node.value.budget.toLocaleString()}
                    </div>
                    <div className="w-24 text-right font-medium">
                        <span className="text-muted-foreground block text-[10px]">Actual</span>
                        {node.value.actual.toLocaleString()}
                    </div>
                    <div className={cn("w-20 text-right font-bold", varianceColor)}>
                        <span className="text-muted-foreground block text-[10px] uppercase">Var</span>
                        {node.value.variance.toLocaleString()}
                    </div>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div className="border-l border-border/30 ml-3">
                    {node.children!.map((child) => (
                        <FinancialNodeView key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const DepartmentView = ({ dept }: { dept: Department }) => {
    // Run validation on render
    const validation = useMemo(() => validateBalanceSheet(dept.financials), [dept.financials]);

    return (
        <div className="space-y-4 pt-2">
            {/* Health Check Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert variant={validation.isValid ? "default" : "destructive"} className={cn("transition-all", validation.isValid ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700" : "bg-destructive/10")}>
                    <div className="flex items-center gap-3">
                        {validation.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <div>
                            <AlertTitle className="text-sm font-semibold">{validation.isValid ? "Balance Sheet Balanced" : "Balance Sheet Imbalance"}</AlertTitle>
                            {!validation.isValid && (
                                <AlertDescription className="text-xs mt-1">
                                    Discrepancy: ${validation.diff.toLocaleString()} (Assets ≠ Liab + Equity)
                                </AlertDescription>
                            )}
                        </div>
                    </div>
                </Alert>
                <div className="flex gap-2 items-center justify-end px-4 text-xs text-muted-foreground">
                    <div>Assets: <span className="font-mono text-foreground">${validation.assetsTotal.toLocaleString()}</span></div>
                    <span>=</span>
                    <div>L+E: <span className="font-mono text-foreground">${(validation.liabilitiesTotal + validation.equityTotal).toLocaleString()}</span></div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Card className="p-0 overflow-hidden border-border/40">
                    <div className="bg-muted/20 px-4 py-2 border-b border-border/40 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Income Statement</span>
                    </div>
                    <div className="p-2">
                        <FinancialNodeView node={dept.financials.incomeStatement} />
                    </div>
                </Card>
                <Card className="p-0 overflow-hidden border-border/40">
                    <div className="bg-muted/20 px-4 py-2 border-b border-border/40 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-sm">Balance Sheet</span>
                    </div>
                    <div className="p-2 space-y-2">
                        <FinancialNodeView node={dept.financials.assets} />
                        <FinancialNodeView node={dept.financials.liabilities} />
                        <FinancialNodeView node={dept.financials.equity} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const FinancialHierarchy = ({ data }: FinancialHierarchyProps) => {
    const [selectedCompany] = useState<string>(data?.[0]?.id || '');
    const [selectedDept, setSelectedDept] = useState<string>(data?.[0]?.subsidiaries?.[0]?.departments?.[0]?.id || '');

    // Flatten logic for selection helper (simplified)
    const activeCompany = (data && data.length > 0) ? (data.find(c => c.id === selectedCompany) || data[0]) : null;
    const activeSubsidiary = activeCompany?.subsidiaries?.find(s => s.departments?.some(d => d.id === selectedDept));
    const activeDept = activeSubsidiary?.departments?.find(d => d.id === selectedDept);

    if (!activeCompany) return <div className="p-8 text-muted-foreground">No hierarchy data available</div>;

    return (
        <div className="flex h-full min-h-[500px] border rounded-xl overflow-hidden bg-background/50 shadow-sm">
            {/* Sidebar: Companies & Departments */}
            <div className="w-64 border-r border-border/40 bg-muted/10 p-4 space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">Entity Structure</h3>
                    <div className="space-y-1">
                        {data.map(company => (
                            <div key={company.id} className="space-y-1">
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-sm font-medium cursor-default">
                                    <Building2 className="h-4 w-4 text-sky-500" />
                                    {company.name}
                                </div>
                                {/* Subsidiaries */}
                                <div className="ml-4 space-y-1 border-l border-border/50 pl-2">
                                    {company.subsidiaries?.map(sub => (
                                        <div key={sub.id} className="space-y-1">
                                            <div className="flex items-center gap-2 px-2 py-1 text-sm text-foreground/80">
                                                <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                                {sub.name}
                                            </div>
                                            {/* Departments */}
                                            <div className="ml-4 space-y-0.5">
                                                {sub.departments?.map(dept => (
                                                    <button
                                                        key={dept.id}
                                                        onClick={() => setSelectedDept(dept.id)}
                                                        className={cn(
                                                            "w-full text-left px-2 py-1 text-xs rounded-sm transition-colors flex items-center justify-between group",
                                                            selectedDept === dept.id
                                                                ? "bg-primary/10 text-primary font-medium"
                                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                        )}
                                                    >
                                                        {dept.name}
                                                        {selectedDept === dept.id && <ChevronRight className="h-3 w-3" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content: Financial Data */}
            <div className="flex-1 p-6 overflow-auto">
                {activeDept ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    {activeDept.name}
                                    <Badge variant="outline" className="font-normal text-muted-foreground">{activeSubsidiary?.name}</Badge>
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">Full financial breakdown with budget variance.</p>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-white/5">Profit: $20k</Badge>
                            </div>
                        </div>
                        <DepartmentView dept={activeDept} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <Building2 className="h-12 w-12 mb-4" />
                        <p>Select a department to view financials</p>
                    </div>
                )}
            </div>
        </div>
    );
};
