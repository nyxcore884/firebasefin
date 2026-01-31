import React, { useState } from 'react';
import { FinancialTable, FinancialNode } from '@/components/analysis/FinancialTable';
import { Wallet, Download, Calendar, BarChart, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const mockCFData: FinancialNode[] = [
  {
    id: 'ops',
    label: 'Net Cash from Operating Activities',
    actual: 520000,
    budget: 480000,
    level: 0,
    children: [
      { id: 'ni', label: 'Net Income', actual: 360000, budget: 340000, level: 1 },
      { id: 'da', label: 'Depreciation & Amortization', actual: 80000, budget: 80000, level: 1 },
      { id: 'wc', label: 'Working Capital Changes', actual: 80000, budget: 60000, level: 1 },
    ]
  },
  {
    id: 'inv',
    label: 'Net Cash from Investing Activities',
    actual: -250000,
    budget: -200000,
    level: 0,
    children: [
      { id: 'capex', label: 'Capital Expenditures', actual: -200000, budget: -180000, level: 1 },
      { id: 'asst', label: 'Asset Sales', actual: -50000, budget: -20000, level: 1 },
    ]
  },
  {
    id: 'fin',
    label: 'Net Cash from Financing Activities',
    actual: 150000,
    budget: 100000,
    level: 0,
    children: [
      { id: 'debt', label: 'Net Debt Issuance', actual: 200000, budget: 150000, level: 1 },
      { id: 'div', label: 'Dividends Paid', actual: -50000, budget: -50000, level: 1 },
    ]
  },
  {
    id: 'total',
    label: 'Net Change in Cash',
    actual: 420000,
    budget: 380000,
    level: 0,
    isTotal: true
  }
];

const waterfallData = [
  { name: 'Start', value: 350000, type: 'start' },
  { name: 'Operating', value: 520000, type: 'pos' },
  { name: 'Investing', value: -250000, type: 'neg' },
  { name: 'Financing', value: 150000, type: 'pos' },
  { name: 'End', value: 770000, type: 'end' },
];

export const CashFlow: React.FC = () => {
  return (
    <div className="p-8 max-w-[1800px] mx-auto animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Wallet size={42} className="text-indigo-400" />
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Cash Flow Analysis
            </h1>
          </div>
          <p className="text-slate-400 font-normal">
            Real-time cash movement tracking via indirect method with waterfall breakdown.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-white font-medium">
            <Calendar size={18} /> FY 2025
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg transition-colors text-white font-bold">
            <Download size={18} />
            Export Statement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Waterfall Chart */}
        <div className="col-span-12">
          <div className="glass-premium p-8 rounded-[40px] border border-white/5 mb-8 bg-slate-800/20">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-white">
              <BarChart size={20} className="text-indigo-400" />
              Cash Movement Waterfall
            </h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={index} fill={
                        entry.type === 'start' || entry.type === 'end' ? '#6366f1' :
                          entry.type === 'pos' ? '#10b981' : '#f43f5e'
                      } />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-8">
              <div className="text-center">
                <span className="text-slate-500 font-bold uppercase text-xs block">Starting Cash</span>
                <span className="text-2xl font-extrabold text-white">$350,000</span>
              </div>
              <ArrowRight className="text-slate-700 mt-4" />
              <div className="text-center">
                <span className="text-slate-500 font-bold uppercase text-xs block">Net Change</span>
                <span className="text-2xl font-extrabold text-emerald-400">+$420,000</span>
              </div>
              <ArrowRight className="text-slate-700 mt-4" />
              <div className="text-center">
                <span className="text-slate-500 font-bold uppercase text-xs block">Ending Cash</span>
                <span className="text-2xl font-extrabold text-indigo-400">$770,000</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-8">
          <FinancialTable data={mockCFData} type="CF" />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <div className="glass-card p-6 rounded-[32px] border border-white/5 h-full bg-slate-800/40">
            <h3 className="text-lg font-bold mb-6 text-white">Cash Insights</h3>
            <div className="space-y-6">
              <div className="flex gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Strong Operating Cash</h4>
                  <p className="text-xs text-slate-400 mt-1">Op cash flow exceeded budget by $40k due to improved collections.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <div className="w-10 h-10 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
                  <TrendingDown size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Investing Outflows</h4>
                  <p className="text-xs text-slate-400 mt-1">Capex was $20k over budget due to unexpected infrastructure maintenance.</p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <h4 className="font-bold text-slate-300 text-sm">Liquidity Forecast</h4>
              <p className="text-sm text-slate-400 leading-relaxed italic">
                "Based on current burn rate and project financing, cash reserves are projected to reach $1.2M by end of Q1 2026."
              </p>

              <button className="w-full py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-slate-400 text-sm font-medium">
                View Cash Forecast
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
