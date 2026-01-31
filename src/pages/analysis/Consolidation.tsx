
import React, { useState, useEffect } from 'react';
import {
  Layers, PlayCircle, CheckSquare,
  ChevronRight, ChevronDown, Download,
  CheckCircle, AlertTriangle
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  consolidationService,
  EntityNode,
  ConsolidatedResult,
  Elimination
} from '../../services/consolidationService';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

// --- COMPONENTS ---

const EntityTreeItem = ({ node, level = 0 }: { node: EntityNode, level?: number }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 hover:bg-white/5 rounded px-2 cursor-pointer transition-colors`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mr-2 text-slate-400">
          {hasChildren ? (
            expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <div className="w-4" />
          )}
        </div>
        <div className="mr-2 text-indigo-400">
          <CheckSquare size={16} />
        </div>
        <span className={cn("text-sm", level === 0 ? 'font-bold text-white' : 'text-slate-300')}>
          {node.name}
        </span>
        {node.ownership_pct < 100 && (
          <span className="ml-auto bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
            {node.ownership_pct}%
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map(child => (
            <EntityTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Consolidation: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<EntityNode | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ConsolidatedResult | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Redux Data
  const records = useSelector((state: RootState) => state.financial.records);
  const { entities } = useSelector((state: RootState) => state.entities);

  // Interactive State
  const [period, setPeriod] = useState('2025-12');
  const [currency, setCurrency] = useState('GEL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAmount, setFilterAmount] = useState<string>('');
  const [openAdjustmentDialog, setOpenAdjustmentDialog] = useState(false);

  // Manual Adjustment Form
  const [newAdj, setNewAdj] = useState<Partial<Elimination>>({
    description: '', amount: 0, debit_account: '', credit_account: '', entity_a: 'SGG', entity_b: ''
  });

  // Settings
  const [settings, setSettings] = useState({
    eliminateIntercompany: true,
    calculateMinority: true,
    showReconciliation: true
  });

  useEffect(() => {
    loadData();
  }, [entities]);

  const loadData = async () => {
    const tree = await consolidationService.getHierarchy(entities);
    setHierarchy(tree);
  };

  const handleRun = async () => {
    if (!hierarchy) return;
    setRunning(true);
    setProgress(0);
    setProgressLogs([]);
    setResult(null);

    try {
      const res = await consolidationService.runConsolidation(
        {
          parent_entity_id: hierarchy.id,
          consolidation_id: `cons_${Date.now()}`,
          period: period,
          consolidation_date: new Date().toISOString(),
          included_entities: [],
          consolidation_method: 'full',
          eliminate_intercompany: settings.eliminateIntercompany,
          calculate_minority_interest: settings.calculateMinority,
          translate_currency: currency !== 'GEL',
          target_currency: currency
        },
        records as any[],
        hierarchy,
        (step, pct, detail) => {
          setProgress(pct);
          setCurrentStep(step);
          if (detail) {
            setProgressLogs(prev => [...prev, `[${step}] ${detail}`]);
          }
        }
      );

      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const handleAddAdjustment = () => {
    if (!result || !newAdj.amount || !newAdj.description) return;

    const adjustment: Elimination = {
      id: `adj_${Date.now()}`,
      elimination_type: 'manual_adjustment',
      debit_account: newAdj.debit_account || 'Manual Dr',
      credit_account: newAdj.credit_account || 'Manual Cr',
      amount: Number(newAdj.amount),
      description: newAdj.description,
      entity_a: newAdj.entity_a,
      entity_b: newAdj.entity_b,
      affects_income_statement: true,
      affects_balance_sheet: false
    };

    const updatedEliminations = [...result.eliminations, adjustment];
    setResult({
      ...result,
      eliminations: updatedEliminations
    });
    setOpenAdjustmentDialog(false);
    setNewAdj({ description: '', amount: 0, debit_account: '', credit_account: '', entity_a: 'SGG', entity_b: '' });
  };

  const filterPnl = (name: string, total: number) => {
    if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterAmount && Math.abs(total) < Number(filterAmount)) return false;
    return true;
  };

  const TabButton = ({ label, index }: { label: string, index: number }) => (
    <button
      onClick={() => setActiveTab(index)}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        activeTab === index
          ? "border-indigo-500 text-white"
          : "border-transparent text-slate-400 hover:text-slate-200"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 min-h-screen">

      <div className="mb-8 border-b border-white/10 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2 text-white">
            <Layers className="text-indigo-400" size={32} />
            Consolidation Engine
          </h1>
          <p className="text-slate-400 text-lg font-normal">
            Multi-entity financial aggregation & intercompany eliminations
          </p>
        </div>
        {result && (
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-white/5 transition-colors">
              <Download size={16} />
              Export Excel
            </button>
          </div>
        )}
      </div>

      {!result && !running && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <div className="glass-premium p-6 h-full border border-indigo-500/20 rounded-2xl bg-black/40 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                Entity Scope
              </h2>
              <div className="bg-slate-900/50 rounded-xl p-4 min-h-[400px]">
                {hierarchy ? <EntityTreeItem node={hierarchy} /> : <div className="text-slate-500">Loading...</div>}
              </div>
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="glass-premium p-8 border border-indigo-500/20 rounded-2xl h-full flex flex-col bg-black/40 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Configuration</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 block">Financial Period</label>
                    <select
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      <option value="2025-12">December 2025</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 block">Target Currency</label>
                    <select
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="GEL">GEL (Georgian Lari)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.eliminateIntercompany}
                      onChange={e => setSettings({ ...settings, eliminateIntercompany: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-slate-300">Eliminate intercompany</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.calculateMinority}
                      onChange={e => setSettings({ ...settings, calculateMinority: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-slate-300">Calculate minority interest</span>
                  </label>
                </div>
              </div>
              <button
                onClick={handleRun}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 text-lg rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <PlayCircle size={24} />
                Run Consolidation Engine
              </button>
            </div>
          </div>
        </div>
      )}

      {running && (
        <div className="max-w-3xl mx-auto pt-12 text-center">
          <h2 className="text-3xl text-white font-bold mb-8">Executing Process...</h2>
          <div className="h-4 w-full bg-slate-800 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="bg-slate-900 rounded-xl p-6 h-[300px] overflow-y-auto text-left border border-white/10 font-mono">
            {progressLogs.map((log, i) => (
              <div key={i} className="text-indigo-300 mb-1">✓ {log}</div>
            ))}
          </div>
        </div>
      )}

      {result && !running && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Revenue', val: `₾ ${result.consolidated_financials.revenue.toLocaleString()}` },
              { label: 'Net Income', val: `₾ ${result.consolidated_financials.net_income.toLocaleString()}` },
              { label: 'Total Assets', val: `₾ ${result.consolidated_financials.total_assets.toLocaleString()}` },
              { label: 'Eliminations', val: `${result.eliminations.length} Active` }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border border-white/5 bg-black/20">
                <div className="text-xs uppercase opacity-50 mb-1">{stat.label}</div>
                <div className="text-2xl font-bold">{stat.val}</div>
              </div>
            ))}
          </div>

          <div className="glass-premium rounded-2xl overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10">
            <div className="border-b border-white/10 p-2 flex gap-2">
              <TabButton label="Consolidated totals" index={0} />
              <TabButton label="Entity Breakdown (Workings)" index={1} />
              <TabButton label="Eliminations Journal" index={2} />
            </div>

            <div className="p-6">
              {activeTab === 0 && (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-400">Account</TableHead>
                      <TableHead className="text-right text-slate-400">Amount (GEL)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { n: 'Consolidated Revenue', v: result.consolidated_financials.revenue },
                      { n: 'Consolidated COGS', v: result.consolidated_financials.cogs },
                      { n: 'Consolidated EBITDA', v: result.consolidated_financials.ebitda },
                      { n: 'Consolidated Net Income', v: result.consolidated_financials.net_income }
                    ].filter(r => filterPnl(r.n, r.v)).map(r => (
                      <TableRow key={r.n} className="border-b border-white/5 hover:bg-white/5">
                        <TableCell className="text-white font-medium">{r.n}</TableCell>
                        <TableCell className="text-right font-mono text-white">{r.v.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {activeTab === 1 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-white/10 hover:bg-transparent">
                        <TableHead className="text-slate-400">Line Item</TableHead>
                        {Object.keys(result.entities_data).slice(0, 5).map(id => (
                          <TableHead key={id} className="text-right uppercase text-[10px] text-indigo-400">{id}</TableHead>
                        ))}
                        <TableHead className="text-right font-bold text-emerald-400">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { label: 'Revenue', key: 'revenue' },
                        { label: 'COGS', key: 'cogs' },
                        { label: 'Net Income', key: 'net_income' },
                        { label: 'Assets', key: 'total_assets' }
                      ].map(row => (
                        <TableRow key={row.label} className="border-b border-white/5 hover:bg-white/5">
                          <TableCell className="text-slate-300 font-bold">{row.label}</TableCell>
                          {Object.keys(result.entities_data).slice(0, 5).map(id => (
                            <TableCell key={id} className="text-right font-mono text-[11px] text-slate-300">
                              {(result.entities_data[id] as any)[row.key].toLocaleString()}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-bold font-mono text-white">
                            {(result.consolidated_financials as any)[row.key].toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 2 && (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-400">Description</TableHead>
                      <TableHead className="text-slate-400">Accounts (Dr/Cr)</TableHead>
                      <TableHead className="text-right text-slate-400">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.eliminations.map((elim) => (
                      <TableRow key={elim.id} className="border-b border-white/5 hover:bg-white/5">
                        <TableCell className="text-white">{elim.description}</TableCell>
                        <TableCell className="text-xs text-slate-400">{elim.debit_account} / {elim.credit_account}</TableCell>
                        <TableCell className="text-right text-rose-400 font-mono font-bold">{elim.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setResult(null)}
              className="px-6 py-2 border border-slate-600 rounded-lg text-white hover:bg-white/5 transition-colors"
            >
              New Run
            </button>
            <button
              className="px-6 py-2 bg-emerald-600 rounded-lg text-white hover:bg-emerald-500 text-sm font-bold shadow-lg ml-auto transition-colors"
            >
              Approve Results
            </button>
          </div>
        </div>
      )}

      <Dialog open={openAdjustmentDialog} onOpenChange={setOpenAdjustmentDialog}>
        <DialogContent className="bg-slate-900 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Manual Adjustment</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Description</label>
              <input
                type="text"
                value={newAdj.description}
                onChange={e => setNewAdj({ ...newAdj, description: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Amount</label>
              <input
                type="number"
                value={newAdj.amount}
                onChange={e => setNewAdj({ ...newAdj, amount: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpenAdjustmentDialog(false)}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAdjustment}
              className="px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 font-bold"
            >
              Update
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
