import React, { useState } from 'react';
import {
    Zap, BarChart3, Table as TableIcon, CheckCircle,
    ThumbsUp, ThumbsDown, MessageSquare, ShieldAlert, Download, FileSpreadsheet, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';
import { api } from '../../services/api';

// --- Automated Feedback Component ---
export const IntelligenceFeedback = ({ requestId, query, orgId }: { requestId: string, query: string, orgId: string }) => {
    const [submitted, setSubmitted] = useState(false);

    const submitFeedback = async (score: number, comment: string = "") => {
        try {
            const { aiService } = await import('../../services/aiService');
            // This updates studio-9381016045-4d625.sgp_financial_intelligence.ai_feedback_loop
            await aiService.submitFeedback(
                requestId,
                orgId,
                query,
                score,
                comment
            );
            setSubmitted(true);
        } catch (err) {
            console.error("Failed to submit feedback:", err);
        }
    };

    if (submitted) return (
        <div className="text-[8px] text-emerald-400 font-black uppercase flex items-center gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle size={12} /> Logic Saved to Brain 2 (Cognitive Loop)
        </div>
    );

    return (
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Validate Logic:</span>
            <div className="flex gap-2">
                <button
                    onClick={() => submitFeedback(1)}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-all active:scale-95"
                    title="Approve Logic"
                >
                    <ThumbsUp size={14} />
                </button>
                <button
                    onClick={() => submitFeedback(-1)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-all active:scale-95"
                    title="Flag Correction"
                >
                    <ThumbsDown size={14} />
                </button>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
export const ForensicDashboard = ({ assets, requestId, userQuery, orgId }: any) => {
    if (!assets || assets.length === 0) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-1000">
            {assets.map((asset: any) => (
                <div key={asset.id} className="p-8 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                            {asset.type === 'stats' ? <Zap size={16} /> : asset.type === 'table' ? <TableIcon size={16} /> : <ShieldAlert size={16} />}
                            {asset.title}
                        </h4>
                        <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-white/5 rounded-lg"><Download size={14} /></button>
                        </div>
                    </div>

                    {asset.type === 'stats' && (
                        <div className="grid grid-cols-2 gap-6">
                            {asset.data.map((item: any, i: number) => (
                                <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-primary/50 transition-all">
                                    <span className="text-[8px] font-black text-white/30 uppercase block mb-2">{item.label}</span>
                                    <span className={cn("text-2xl font-black", item.trend === 'up' ? 'text-emerald-400' : 'text-rose-400')}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {asset.type === 'chart' && asset.data && asset.data.length > 0 && (
                        <div className="h-[240px] w-full mt-4 bg-black/20 rounded-3xl p-6 border border-white/5">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={asset.data}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey={Object.keys(asset.data[0] || {})[0]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={Object.keys(asset.data[0] || {})[2] || 'amount'}
                                        stroke="#6366f1"
                                        fillOpacity={1}
                                        fill="url(#colorVal)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {asset.type === 'table' && (
                        <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/20">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5">
                                        {asset.data.columns.map((col: string) => (
                                            <th key={col} className="p-4 text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">
                                                {col.replace(/_/g, ' ')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(asset.data.rows || []).map((row: any, i: number) => (
                                        <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                                            {asset.data.columns.map((col: string) => {
                                                const val = row[col];
                                                const isCritical = row['Status'] === 'CRITICAL' || row['forensic_status'] === 'CRITICAL';
                                                const isWarning = row['Status'] === 'WARNING' || row['forensic_status'] === 'SUSPICIOUS';

                                                return (
                                                    <td key={col} className={cn(
                                                        "p-4 text-[10px] font-bold",
                                                        isCritical && col === 'Status' ? 'text-rose-500' :
                                                            isWarning && col === 'Status' ? 'text-orange-500' :
                                                                'text-white/80'
                                                    )}>
                                                        {typeof val === 'number' && col.toLowerCase().includes('margin') ? `${(val * 100).toFixed(1)}%` : val}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Action Footer for Assets */}
                    <div className="mt-6 flex gap-3">
                        <button className="flex-1 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-2xl text-[9px] font-black uppercase text-primary transition-all flex items-center justify-center gap-2">
                            <FileSpreadsheet size={14} /> Forensic Audit (Excel)
                        </button>
                        <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase text-white/60 transition-all flex items-center justify-center gap-2">
                            <FileText size={14} /> Detailed Summary (PDF)
                        </button>
                    </div>

                    <IntelligenceFeedback requestId={requestId} query={userQuery} orgId={orgId} />
                </div>
            ))}
        </div>
    );
};
