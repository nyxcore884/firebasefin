import { useState } from 'react';
import { ChevronRight, ChevronDown, CreditCard, ShieldCheck, Hash } from 'lucide-react';
import { PaymentCategory } from '../../types/structure';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PaymentTreeProps {
    data: PaymentCategory[];
}

const ApprovalBadge = ({ level }: { level: PaymentCategory['approvalLevel'] }) => {
    const colors = {
        Dept: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        Manager: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        CFO: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        Finance: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
        CEO: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    };

    return (
        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-normal", colors[level] || colors.Dept)}>
            {level}
        </Badge>
    );
};

const PaymentNode = ({ node, level = 0 }: { node: PaymentCategory; level?: number }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1">
            <div
                className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors border-b border-border/10 group"
                onClick={() => hasChildren && setIsOpen(!isOpen)}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
            >
                <div className="flex items-center gap-3">
                    {hasChildren ? (
                        <div className={cn("transition-transform duration-200", isOpen && "rotate-90")}>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                        </div>
                    ) : (
                        <div className="w-4" />
                    )}

                    <div className="flex items-center gap-2">
                        <div className={cn("p-1 rounded-md bg-muted group-hover:bg-background transition-colors", level === 0 && "bg-primary/10 text-primary")}>
                            <CreditCard className="h-3.5 w-3.5" />
                        </div>
                        <span className={cn("text-sm", level === 0 && "font-semibold")}>{node.name}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                        <Hash className="h-3 w-3" />
                        <span className="font-mono">{node.glAccountCode}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-[100px] justify-end">
                        <span className="text-[10px] text-muted-foreground uppercase mr-1">Appr:</span>
                        <ApprovalBadge level={node.approvalLevel} />
                    </div>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div className="relative">
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border/30" style={{ left: `${level * 1.5 + 1.25}rem` }} />
                    {node.children!.map((child) => (
                        <PaymentNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const PaymentTree = ({ data }: PaymentTreeProps) => {
    return (
        <div className="border rounded-xl bg-background/50 shadow-sm p-4 min-h-[500px]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Payment Matrix
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Approval workflows & GL mapping.</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                        {data.reduce((acc, curr) => acc + (curr.children?.length || 0) + 1, 0)} Categories
                    </Badge>
                </div>
            </div>
            <div className="space-y-1">
                {data.map(node => (
                    <PaymentNode key={node.id} node={node} />
                ))}
            </div>
        </div>
    );
};
