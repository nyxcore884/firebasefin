import React, { useState } from 'react';
import { FinancialTable, FinancialNode } from '@/components/analysis/FinancialTable';
import { Scale, Download, Calendar, Filter, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockBSData: FinancialNode[] = [
  {
    id: 'assets-01',
    label: 'Total Assets',
    actual: 5400000,
    priorYear: 5100000,
    level: 0,
    children: [
      {
        id: 'assets-curr',
        label: 'Current Assets',
        actual: 2100000,
        priorYear: 1850000,
        level: 1,
        children: [
          { id: 'cash', label: 'Cash & Equivalents', actual: 850000, priorYear: 600000, level: 2 },
          { id: 'ar', label: 'Accounts Receivable', actual: 750000, priorYear: 800000, level: 2 },
          { id: 'inv', label: 'Inventory', actual: 500000, priorYear: 450000, level: 2 },
        ]
      },
      {
        id: 'assets-noncurr',
        label: 'Non-Current Assets',
        actual: 3300000,
        priorYear: 3250000,
        level: 1,
        children: [
          { id: 'ppe', label: 'PPE (Net)', actual: 2800000, priorYear: 2850000, level: 2 },
          { id: 'int', label: 'Intangibles', actual: 500000, priorYear: 400000, level: 2 },
        ]
      }
    ]
  },
  {
    id: 'liab-equity',
    label: 'Total Liabilities & Equity',
    actual: 5400000,
    priorYear: 5100000,
    level: 0,
    isTotal: true,
    children: [
      {
        id: 'liab',
        label: 'Total Liabilities',
        actual: 2400000,
        priorYear: 2200000,
        level: 1,
        children: [
          { id: 'ap', label: 'Accounts Payable', actual: 400000, priorYear: 350000, level: 2 },
          { id: 'debt', label: 'Long-term Debt', actual: 2000000, priorYear: 1850000, level: 2 },
        ]
      },
      {
        id: 'equity',
        label: 'Total Equity',
        actual: 3000000,
        priorYear: 2900000,
        level: 1,
        children: [
          { id: 'cap', label: 'Share Capital', actual: 1500000, priorYear: 1500000, level: 2 },
          { id: 're', label: 'Retained Earnings', actual: 1500000, priorYear: 1400000, level: 2 },
        ]
      }
    ]
  }
];

export const BalanceSheet: React.FC = () => {
  return (
    <div className="p-8 max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Scale size={42} className="text-indigo-500" />
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              Balance Sheet
            </h1>
          </div>
          <p className="text-slate-400 font-normal">
            Comprehensive view of financial position with solvency and liquidity analysis.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
            <Calendar size={18} />
            As of Dec 31, 2025
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold shadow-lg transition-colors">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Ratios Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Current Ratio', val: '5.25', target: '2.00', status: 'GOOD', trend: 'up' },
          { label: 'Quick Ratio', val: '4.00', target: '1.00', status: 'GOOD', trend: 'up' },
          { label: 'Debt to Equity', val: '0.80', target: '1.50', status: 'GOOD', trend: 'down' },
          { label: 'Working Capital', val: '$1.7M', valNum: 1700000, target: '$1.0M', status: 'GOOD', trend: 'up' }
        ].map((ratio, i) => (
          <div key={i} className="glass-premium p-6 rounded-3xl border border-white/5 relative overflow-hidden group bg-black/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{ratio.label}</div>
                <div className="text-3xl font-extrabold mt-1 text-white">{ratio.val}</div>
              </div>
              <div className={cn("p-2 rounded-xl", ratio.status === 'GOOD' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                {ratio.trend === 'up' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>TARGET: {ratio.target}</span>
                <span>{ratio.status}</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", ratio.status === 'GOOD' ? "bg-emerald-500" : "bg-rose-500")}
                  style={{ width: '75%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8">
          <FinancialTable data={mockBSData} type="BS" />
        </div>
        <div className="xl:col-span-4">
          <div className="glass-card p-6 rounded-[32px] border border-white/5 bg-black/20">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <PieChart size={20} className="text-indigo-500" />
              Asset Composition
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Cash', pct: 15, color: '#6366f1' },
                { label: 'Receivables', pct: 14, color: '#8b5cf6' },
                { label: 'Inventory', pct: 9, color: '#ec4899' },
                { label: 'PPE', pct: 52, color: '#10b981' },
                { label: 'Intangibles', pct: 10, color: '#f59e0b' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-400">{item.label}</span>
                    <span className="font-bold text-white">{item.pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <hr className="my-8 border-white/5" />
            <div className="bg-indigo-500/5 rounded-2xl p-4 border border-indigo-500/10">
              <div className="text-indigo-400 font-bold mb-2 text-sm">Analyst Note</div>
              <p className="text-slate-400 leading-relaxed text-sm">
                Liquidity remains strong with a current ratio of 5.25. The increase in cash reserves ($250k) offsets the growth in long-term debt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
