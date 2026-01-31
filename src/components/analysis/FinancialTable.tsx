import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Info,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ShieldAlert,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ConflictResolver } from '../ai/ConflictResolver';
import { ForensicTree } from '../dashboard/ForensicTree';

export interface FinancialNode {
    id: string;
    label: string;
    actual: number;
    budget?: number;
    priorYear?: number;
    children?: FinancialNode[];
    level: number;
    isTotal?: boolean;
}

interface FinancialTableProps {
    data: FinancialNode[];
    title?: string;
    type: 'PL' | 'BS' | 'CF';
}

export const FinancialTable: React.FC<FinancialTableProps> = ({ data, title, type }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [selectedForensicNode, setSelectedForensicNode] = useState<FinancialNode | null>(null);

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    const calculateVariance = (actual: number, budget?: number) => {
        if (budget === undefined || budget === 0) return null;
        const diff = actual - budget;
        const percent = (diff / budget) * 100;
        return { diff, percent };
    };

    const renderRow = (node: FinancialNode) => {
        const isExpanded = expanded[node.id];
        const hasChildren = node.children && node.children.length > 0;
        const variance = calculateVariance(node.actual, node.budget || node.priorYear);
        const isRevenue = (node.label || '').toLowerCase().includes('revenue');
        const isGood = variance && (isRevenue ? variance.diff > 0 : variance.diff < 0);

        // Governance Flags
        const isUncategorized = node.label.toUpperCase().includes('UNCATEGORIZED');
        const isMarginErosion = isRevenue && variance && variance.percent < -5; // >5% drop

        return (
            <React.Fragment key={node.id}>
                <TableRow
                    className={cn(
                        "transition-colors hover:bg-white/5 border-b border-white/5",
                        node.isTotal ? "bg-indigo-900/10 font-bold border-t-2 border-indigo-500/20" : "",
                        node.level === 0 ? "bg-white/5" : "",
                        isUncategorized ? "bg-rose-500/5 hover:bg-rose-500/10" : ""
                    )}
                >
                    <TableCell className="py-2">
                        <div
                            className="flex items-center gap-2"
                            style={{ paddingLeft: `${node.level * 16}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(node.id)}
                                    className="p-1 text-slate-400 hover:text-white transition-colors"
                                >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            ) : (
                                <div className="w-6" />
                            )}
                            <span className={cn(
                                "text-sm flex items-center gap-2",
                                node.level === 0 || node.isTotal ? "font-bold text-white" : "text-slate-300",
                                isUncategorized ? "text-rose-400 font-mono" : ""
                            )}>
                                {isUncategorized && <AlertTriangle size={12} className="animate-pulse" />}
                                {node.label}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white">
                        <span className={node.isTotal ? "font-bold" : "font-normal"}>
                            {formatCurrency(node.actual)}
                        </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-400">
                        {node.budget !== undefined ? formatCurrency(node.budget) : node.priorYear !== undefined ? formatCurrency(node.priorYear) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                        {variance && (
                            <div className="flex items-center justify-end gap-1">
                                <span className={cn(
                                    "text-xs font-bold",
                                    isGood ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {variance.percent > 0 ? '+' : ''}{variance.percent.toFixed(1)}%
                                </span>
                                {isGood ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-rose-400" />}
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                            {isUncategorized ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 text-rose-400 rounded-md text-[9px] uppercase font-bold hover:bg-rose-500/20 transition-colors">
                                            <AlertTriangle size={10} /> Resolve
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-black/90 border-rose-500/20 backdrop-blur-xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-rose-500">Conflict Resolution Required</DialogTitle>
                                        </DialogHeader>
                                        <ConflictResolver
                                            uncategorizedItems={[{ raw_product_name: node.label.replace('UNCATEGORIZED: ', '') }]}
                                            onResolve={() => console.log("Resolved!")}
                                        />
                                    </DialogContent>
                                </Dialog>
                            ) : isMarginErosion ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button
                                            className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 rounded-md text-[9px] uppercase font-bold hover:bg-amber-500/20 transition-colors"
                                            onClick={() => setSelectedForensicNode(node)}
                                        >
                                            <Activity size={10} /> Analyze
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl bg-black/95 border-white/10 p-0 overflow-hidden rounded-[2.5rem]">
                                        <ForensicTree
                                            data={{
                                                finance_concept: node.label,
                                                product: node.label,
                                                total_revenue: node.actual,
                                                net_margin: node.actual * -0.05, // Simulated for demo
                                                margin_pct: -0.05,
                                                root_cause_category: 'FOREX_DRIVEN',
                                                fx_leakage_lari: node.actual * 0.08,
                                                fx_responsibility_ratio: 0.8
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="p-1 text-slate-500 hover:text-cyan-400 transition-colors">
                                                <Info size={14} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>View Breakdown</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
                {hasChildren && isExpanded && node.children?.map(child => renderRow(child))}
            </React.Fragment>
        );
    };

    return (
        <div>
            {title && (
                <h3 className="mb-4 text-lg font-bold text-white tracking-tight">
                    {title}
                </h3>
            )}
            <div className="rounded-xl border border-white/5 overflow-hidden bg-black/20 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-b border-white/5 hover:bg-white/5">
                            <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider py-3">Account Component</TableHead>
                            <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-wider">Actual</TableHead>
                            <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                {type === 'BS' ? 'Prior Period' : 'Budget'}
                            </TableHead>
                            <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px] tracking-wider">Variance</TableHead>
                            <TableHead className="text-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">Governance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(node => renderRow(node))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
