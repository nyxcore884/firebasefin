import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, AlertCircle, Info,
  Settings, ChevronDown, Wand2, FileCheck,
  Activity, Database, Play, Shield, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { dataQualityService, QualityMetrics } from '../../services/dataQualityService';

// Mock Data
const dimensions = [
  { name: 'completeness', score: 98, color: '#10b981' },
  { name: 'accuracy', score: 92, color: '#1c1eb1ff' },
  { name: 'consistency', score: 88, color: '#f59e0b' },
  { name: 'timeliness', score: 95, color: '#3b82f6' },
];

const rules = [
  { id: 'r1', name: 'no orphaned transactions', active: true, desc: 'ensure all journal lines have a valid header.' },
  { id: 'r2', name: 'date period matching', active: true, desc: 'transaction date must fall within open fiscal periods.' },
  { id: 'r3', name: 'entity existence check', active: true, desc: 'verify entity id exists in master data.' },
  { id: 'r4', name: 'duplicate invoice detection', active: false, desc: 'flag identical invoice numbers from same vendor.' },
];

interface DataQualityProps {
  isEmbedded?: boolean;
}

export const DataQuality: React.FC<DataQualityProps> = ({ isEmbedded = false }) => {
  const [activeTab, setActiveTab] = useState('issues');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await dataQualityService.runFullScan('SOCAR_GROUP');
        setMetrics(result);
      } catch (error) {
        console.error("Data Quality Scan Failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'WARNING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'INFO': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return <AlertCircle size={20} />;
      case 'WARNING': return <AlertTriangle size={20} />;
      case 'INFO': return <Info size={20} />;
      default: return <Info size={20} />;
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[50vh] p-6">
        <RefreshCw size={48} className="animate-spin text-indigo-500 mb-4" />
        <div className="text-slate-400 lowercase font-medium">analyzing system integrity...</div>
        <div className="w-[300px] h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 animate-pulse rounded-full w-2/3"></div>
        </div>
      </div>
    );
  }

  const dimensionsList = [
    { name: 'completeness', score: Math.round(metrics.dimensions.completeness), color: '#10b981', barColor: 'bg-emerald-500' },
    { name: 'accuracy', score: Math.round(metrics.dimensions.accuracy), color: '#6366f1', barColor: 'bg-indigo-500' },
    { name: 'consistency', score: Math.round(metrics.dimensions.consistency), color: '#f59e0b', barColor: 'bg-amber-500' },
    { name: 'timeliness', score: Math.round(metrics.dimensions.timeliness), color: '#3b82f6', barColor: 'bg-blue-500' },
  ];

  return (
    <div className="p-6 max-w-[1800px] mx-auto animate-in fade-in zoom-in duration-500">
      {/* Header - Hidden when embedded */}
      {!isEmbedded && (
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield size={42} className="text-indigo-500" />
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight lowercase">
                data quality hub
              </h1>
            </div>
            <p className="text-slate-400 font-normal max-w-2xl lowercase">
              real-time health monitoring, anomaly detection, and automated remediation engine.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors">
              <Database size={18} />
              <span>upload reference</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors">
              <Settings size={18} />
              <span>configuration</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-bold transition-colors"
              onClick={async () => {
                setLoading(true);
                const result = await dataQualityService.runFullScan('SOCAR_GROUP');
                setMetrics(result);
                setLoading(false);
              }}
            >
              <FileCheck size={18} />
              <span>run full scan</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Left Col: Scoreboard */}
        <div className="col-span-12 xl:col-span-4">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl mb-6 text-center relative overflow-hidden shadow-2xl">

            <div className="flex flex-col items-center relative z-10">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">overall health score</span>
              <div className="relative w-56 h-56 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: metrics.overallScore }, { value: 100 - metrics.overallScore }]}
                      innerRadius={85}
                      outerRadius={100}
                      startAngle={180}
                      endAngle={0}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={10}
                      paddingAngle={5}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="font-extrabold leading-none text-7xl tracking-tighter text-white">{metrics.overallScore}</div>
                  <div className={`mt-2 inline-flex px-3 py-1 rounded-lg text-xs font-bold tracking-wider ${metrics.overallScore > 90 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {metrics.overallScore > 90 ? "EXCELLENT" : metrics.overallScore > 75 ? "GOOD" : "CRITICAL"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                {dimensionsList.map(d => (
                  <div key={d.name} className="text-left p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex justify-between mb-2 items-center">
                      <span className="text-xs text-slate-400 font-bold lowercase">{d.name}</span>
                      <span className="text-lg font-bold leading-none text-white">{d.score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.barColor}`} style={{ width: `${d.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h6 className="font-bold text-slate-200 lowercase">trend analysis</h6>
              <span className="px-2 py-1 rounded-lg bg-white/5 text-xs font-medium text-slate-400 lowercase">last 7 days</span>
            </div>
            <div className="h-56 mt-2 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.trend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#6366f1', strokeDasharray: '3 3' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Center/Right: Issues & Rules */}
        <div className="col-span-12 xl:col-span-8">
          <div className="p-1 mb-6 rounded-2xl bg-white/5 border border-white/5 inline-flex backdrop-blur-md">
            <button
              onClick={() => setActiveTab('issues')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition-colors ${activeTab === 'issues' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <AlertTriangle size={18} />
              <span>detected issues</span>
              <span className="ml-2 h-5 text-xs font-bold bg-rose-500 text-white px-2 rounded-full flex items-center justify-center">3</span>
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition-colors ${activeTab === 'rules' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Shield size={18} />
              <span>validation rules</span>
            </button>
            <button
              onClick={() => setActiveTab('autofix')}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition-colors ${activeTab === 'autofix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Wand2 size={18} />
              <span>auto-remediation</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'issues' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {metrics.issues.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/40 border border-white/5 rounded-3xl">
                    <Shield size={48} className="mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">no integrity issues detected</h3>
                    <p className="text-slate-400">your data matches all system validation rules.</p>
                  </div>
                ) : metrics.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`mb-4 rounded-3xl border transition-all duration-200 overflow-hidden ${expandedIssue === issue.id ? 'bg-slate-800/60 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/40'}`}
                  >
                    <div
                      className="p-5 flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                    >
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${getSeverityColor(issue.severity)}`}>
                        {getSeverityIcon(issue.severity)}
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-lg text-slate-200 lowercase">{issue.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                        </div>
                        <span className="text-slate-400 text-sm lowercase">{issue.desc}</span>
                      </div>
                      <div className="text-right">
                        <Shield className="h-4 w-4 text-primary ml-auto mb-1" />
                        <div className="font-extrabold text-2xl leading-none text-white">{issue.count}</div>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">records</span>
                      </div>
                      <button className={`transform transition-transform text-slate-400 ${expandedIssue === (issue.id as any) ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedIssue === issue.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <hr className="border-white/5" />
                          <div className="p-6 bg-black/20">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <h6 className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">
                                  <Database size={14} /> impacted source
                                </h6>
                                <div className="font-mono bg-white/5 p-3 rounded-lg border border-dashed border-white/10 text-sm text-indigo-300">
                                  {issue.source}
                                </div>

                                <div className="mt-4">
                                  <h6 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">recommended actions</h6>
                                  <p className="text-slate-500 text-xs leading-relaxed lowercase">
                                    these issues were detected by the deterministic analytical core.
                                    resolve these by updating the source records or applying auto-fixes where available.
                                  </p>
                                </div>
                              </div>
                              <div className="md:col-span-1 flex flex-col gap-3 justify-center">
                                {issue.autoFix ? (
                                  <button className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg transition-colors">
                                    <Wand2 size={18} />
                                    auto-fix ({issue.count})
                                  </button>
                                ) : (
                                  <button className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg transition-colors">
                                    <Play size={18} />
                                    review manually
                                  </button>
                                )}
                                <button className="w-full py-2 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-colors">dismiss rule</button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'rules' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-lg">
                  <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h6 className="font-bold text-lg text-white lowercase">active logic</h6>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
                      <Settings size={16} />
                      manage rulesets
                    </button>
                  </div>
                  <ul className="p-0 m-0">
                    {rules.map((rule, idx) => (
                      <React.Fragment key={rule.id}>
                        <li className="py-4 px-6 hover:bg-white/5 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                              <Activity size={20} />
                            </div>
                            <div>
                              <span className="font-bold text-lg text-slate-200 lowercase block">{rule.name}</span>
                              <span className="text-slate-400 lowercase text-sm">{rule.desc}</span>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${rule.active ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${rule.active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                          </div>
                        </li>
                        {idx < rules.length - 1 && <hr className="border-white/5" />}
                      </React.Fragment>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab === 'autofix' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="text-center py-16 px-8 rounded-[40px] border border-dashed border-white/10 bg-gradient-to-b from-indigo-500/5 to-transparent">
                  <div className="w-24 h-24 mx-auto mb-6 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-2xl shadow-xl shadow-indigo-500/10">
                    <Wand2 size={48} />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-white lowercase">ai auto-remediation</h3>
                  <p className="text-slate-400 max-w-2xl mx-auto mb-8 text-lg leading-relaxed lowercase">
                    the engine has identified <span className="text-white font-bold">3 patterns of errors</span> that can be automatically corrected with <span className="text-emerald-400 font-bold">99% confidence</span>.
                    <br />
                    includes currency normalization, whitespace trimming, and standardization.
                  </p>
                  <button
                    className="flex items-center justify-center gap-2 mx-auto rounded-2xl px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                  >
                    <Wand2 size={20} />
                    apply all safe fixes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div >
  );
};
