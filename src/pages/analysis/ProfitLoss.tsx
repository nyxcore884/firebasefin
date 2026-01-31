import React, { useState } from 'react';
import { FinancialTable, FinancialNode } from '@/components/analysis/FinancialTable';
import { Sparkles, Download, Calendar, Filter, BrainCircuit, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const mockPLData: FinancialNode[] = [
  {
    id: 'rev-01',
    label: 'Total Revenue',
    actual: 1250000,
    budget: 1100000,
    level: 0,
    children: [
      { id: 'rev-01-01', label: 'Operating Revenue', actual: 1100000, budget: 1000000, level: 1 },
      { id: 'rev-01-02', label: 'Other Revenue', actual: 150000, budget: 100000, level: 1 },
    ]
  },
  {
    id: 'cogs-01',
    label: 'Cost of Goods Sold',
    actual: 450000,
    budget: 420000,
    level: 0,
    children: [
      { id: 'cogs-01-01', label: 'Direct Labor', actual: 250000, budget: 240000, level: 1 },
      { id: 'cogs-01-02', label: 'Materials', actual: 200000, budget: 180000, level: 1 },
    ]
  },
  {
    id: 'gp-01',
    label: 'Gross Profit',
    actual: 800000,
    budget: 680000,
    level: 0,
    isTotal: true
  },
  {
    id: 'opex-01',
    label: 'Operating Expenses',
    actual: 320000,
    budget: 350000,
    level: 0,
    children: [
      { id: 'opex-01-01', label: 'Selling & Marketing', actual: 120000, budget: 140000, level: 1 },
      { id: 'opex-01-02', label: 'R&D', actual: 150000, budget: 160000, level: 1 },
      { id: 'opex-01-03', label: 'G&A', actual: 50000, budget: 50000, level: 1 },
    ]
  },
  {
    id: 'ebitda-01',
    label: 'EBITDA',
    actual: 480000,
    budget: 330000,
    level: 0,
    isTotal: true
  },
  {
    id: 'other-01',
    label: 'D&A, Interest & Taxes',
    actual: 120000,
    budget: 110000,
    level: 0
  },
  {
    id: 'ni-01',
    label: 'Net Income',
    actual: 360000,
    budget: 220000,
    level: 0,
    isTotal: true
  }
];

export const ProfitLoss: React.FC = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isAiScanning, setIsAiScanning] = useState(false);

  const runAiAnalysis = () => {
    setIsAiScanning(true);
    setTimeout(() => setIsAiScanning(false), 2000);
  };

  return (
    <div className="p-8 max-w-[1800px] mx-auto animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={42} className="text-primary" />
            <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              P&L Analysis
            </h3>
          </div>
          <h6 className="text-slate-400 font-normal text-lg">
            Hierarchical profit and loss statement with intelligent variance tracking.
          </h6>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar size={18} />
            Q4 2025
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter size={18} />
            Entities
          </Button>
          <Button className="shadow-vivid bg-primary hover:bg-primary/90 gap-2">
            <Download size={18} />
            Export Package
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Statement */}
        <div className="xl:col-span-9">
          <div className="flex gap-4 mb-6">
            <Button
              variant={activeTab === 'summary' ? 'default' : 'ghost'}
              className={cn("rounded-2xl px-6 py-2 font-bold transition-all", activeTab === 'summary' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5")}
              onClick={() => setActiveTab('summary')}
            >
              Executive Summary
            </Button>
            <Button
              variant={activeTab === 'detailed' ? 'default' : 'ghost'}
              className={cn("rounded-2xl px-6 py-2 font-bold transition-all", activeTab === 'detailed' ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5")}
              onClick={() => setActiveTab('detailed')}
            >
              Detailed Breakdown
            </Button>
          </div>

          <FinancialTable data={mockPLData} type="PL" />
        </div>

        {/* AI Sidebar */}
        <div className="xl:col-span-3">
          <div className="glass-premium p-6 rounded-[32px] sticky top-8 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-primary" size={24} />
                <h6 className="font-bold text-lg text-white">FinSight AI</h6>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">ONLINE</Badge>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
              <span className="text-slate-400 block mb-2 uppercase tracking-widest font-bold text-xs">Quick Insight</span>
              <p className="text-slate-200 leading-relaxed italic text-sm">
                "Revenue is up 13.6% vs budget, primarily driven by 'Other Revenue' streams. EBITDA margin has improved to 38.4%."
              </p>
            </div>

            <h6 className="text-slate-300 font-bold mb-4 text-sm">Key Variances</h6>

            <div className="space-y-4">
              {[
                { label: 'Operating Revenue', val: '+$100k', status: 'GOOD', desc: 'Higher conversion rates in retail segment.' },
                { label: 'Materials Cost', val: '+$20k', status: 'BAD', desc: 'Supply chain friction in Asia-Pacific.' },
                { label: 'Marketing Spend', val: '-$20k', status: 'GOOD', desc: 'Optimized digital ad placement.' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <span className={cn("text-xs font-bold", item.status === 'GOOD' ? "text-emerald-400" : "text-rose-400")}>{item.val}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="my-6 border-t border-white/5" />

            <Button
              className="w-full rounded-2xl py-6 bg-gradient-to-r from-primary to-indigo-600 font-bold shadow-vivid hover:from-primary/90 hover:to-indigo-600/90"
              onClick={runAiAnalysis}
              disabled={isAiScanning}
            >
              {isAiScanning ? <div className="animate-spin mr-2"><BrainCircuit size={18} /></div> : <Sparkles size={18} className="mr-2" />}
              {isAiScanning ? "Analyzing..." : "Regenerate Commentary"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
