import { useEffect, useState, useMemo } from 'react';
import { useAppState } from '@/hooks/use-app-state';
import { ChevronRight, ChevronDown, Building2, Wallet, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { Company, Department, FinancialNode } from '../../types/structure';
import { validateBalanceSheet } from '@/lib/financial-logic';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FinancialNodeView = ({ node, level = 0 }: { node: FinancialNode; level?: number }) => {
    const [isOpen, setIsOpen] = useState(level < 1);
    const hasChildren = node.children && node.children.length > 0;
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
                    {hasChildren ? (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <div className="w-4" />}
                    <span className="text-sm font-medium">{node.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs tabular-nums">
                    <div className="w-24 text-right"><span className="text-[10px] block">Budget</span>{node.value.budget.toLocaleString()}</div>
                    <div className="w-24 text-right font-medium"><span className="text-[10px] block">Actual</span>{node.value.actual.toLocaleString()}</div>
                    <div className={cn("w-20 text-right font-bold", varianceColor)}><span className="text-[10px] block uppercase">Var</span>{node.value.variance.toLocaleString()}</div>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div className="border-l border-border/30 ml-3">
                    {node.children!.map((child) => <FinancialNodeView key={child.id} node={child} level={level + 1} />)}
                </div>
            )}
        </div>
    );
};

const DepartmentView = ({ dept }: { dept: Department }) => {
    const validation = useMemo(() => validateBalanceSheet(dept.financials), [dept.financials]);
    return (
        <div className="space-y-4 pt-2">
            <Alert variant={validation.isValid ? "default" : "destructive"}>
                <div className="flex items-center gap-3">
                    {validation.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <div>
                        <AlertTitle className="text-sm font-semibold">{validation.isValid ? "Balanced" : "Imbalance"}</AlertTitle>
                        {!validation.isValid && <AlertDescription className="text-xs">Discrepancy: ${validation.diff.toLocaleString()}</AlertDescription>}
                    </div>
                </div>
            </Alert>
            <div className="grid grid-cols-1 gap-4">
                <Card className="p-0 overflow-hidden"><FinancialNodeView node={dept.financials.incomeStatement} /></Card>
                <Card className="p-0 overflow-hidden space-y-2 p-2">
                    <FinancialNodeView node={dept.financials.assets} />
                    <FinancialNodeView node={dept.financials.liabilities} />
                    <FinancialNodeView node={dept.financials.equity} />
                </Card>
            </div>
        </div>
    );
};

export const FinancialHierarchy = () => {
    const { selectedCompany } = useAppState();
    const [data, setData] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState<string>('');

    useEffect(() => {
        const fetchHierarchy = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/process-transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'hierarchy', company_id: selectedCompany })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    setData(result.data);
                    if (result.data?.[0]?.subsidiaries?.[0]?.departments?.[0]?.id) {
                        setSelectedDept(result.data[0].subsidiaries[0].departments[0].id);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchHierarchy();
    }, [selectedCompany]);

    const activeCompany = data[0];
    const activeDept = activeCompany?.subsidiaries?.[0]?.departments?.find(d => d.id === selectedDept);

    if (loading) return <div className="p-12 text-center">Loading hierarchy...</div>;

    return (
        <div className="flex h-full min-h-[500px] border rounded-xl overflow-hidden">
            <div className="w-64 border-r p-4 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Entity Structure</h3>
                {data.map(company => (
                    <div key={company.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium"><Building2 className="h-4 w-4" /> {company.name}</div>
                        <div className="ml-4 border-l pl-2 space-y-1">
                            {company.subsidiaries?.map(sub => (
                                <div key={sub.id} className="space-y-1">
                                    <div className="text-xs font-bold opacity-60">{sub.name}</div>
                                    <div className="ml-2 space-y-0.5">
                                        {sub.departments?.map(dept => (
                                            <button key={dept.id} onClick={() => setSelectedDept(dept.id)} className={cn("w-full text-left px-2 py-1 text-xs rounded-sm", selectedDept === dept.id ? "bg-primary/10 text-primary" : "text-muted-foreground")}>{dept.name}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex-1 p-6 overflow-auto">
                {activeDept ? <DepartmentView dept={activeDept} /> : <div className="flex flex-col items-center justify-center h-full opacity-50"><Building2 className="h-12 w-12 mb-4" /><p>Select a department</p></div>}
            </div>
        </div>
    );
};
