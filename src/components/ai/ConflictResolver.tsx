import React, { useState } from 'react';
import { AlertCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import { api as apiService } from '../../services/api';

interface UncategorizedItem {
    raw_product_name: string;
}

export const ConflictResolver = ({ uncategorizedItems, onResolve }: { uncategorizedItems: UncategorizedItem[], onResolve?: () => void }) => {
    const [resolvedItems, setResolvedItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const resolveConflict = async (product: string, concept: string) => {
        setIsLoading(product);
        try {
            await apiService.post('/api/v1/ai/resolve-mapping', {
                raw_product: product,
                target_concept: concept
            });
            setResolvedItems(prev => [...prev, product]);
            if (onResolve) onResolve();
        } catch (error) {
            console.error("Failed to resolve conflict:", error);
        } finally {
            setIsLoading(null);
        }
    };

    const activeItems = uncategorizedItems.filter(item => !resolvedItems.includes(item.raw_product_name));

    if (activeItems.length === 0) return null;

    return (
        <div className="nyx-card p-6 border-rose-500/30 bg-rose-500/5 mt-6">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-3">
                <AlertCircle size={16} /> Logic Gap Detected: Uncategorized Items
            </h4>
            <div className="mt-4 space-y-2">
                {activeItems.map(item => (
                    <div key={item.raw_product_name} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <span className="text-[10px] text-white/80 font-bold font-mono">{item.raw_product_name}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => resolveConflict(item.raw_product_name, 'REVENUE_RETAIL')}
                                disabled={isLoading === item.raw_product_name}
                                className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-bold uppercase transition-colors"
                            >
                                <PlusCircle size={12} /> Retail
                            </button>
                            <button
                                onClick={() => resolveConflict(item.raw_product_name, 'REVENUE_WHOLESALE')}
                                disabled={isLoading === item.raw_product_name}
                                className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-[9px] font-bold uppercase transition-colors"
                            >
                                <PlusCircle size={12} /> Wholesale
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
