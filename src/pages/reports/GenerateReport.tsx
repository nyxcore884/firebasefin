
import React, { useState, useEffect } from 'react';
import {
  FileText, LayoutTemplate, PieChart, Calendar,
  Settings, Download, Wand2, ChevronRight,
  ChevronLeft, CheckCircle2, FileJson, FileSpreadsheet,
  Presentation, File, Sparkles, Plus, Image, Box,
  Share2, Save, MoreVertical, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportService } from '../../services/reportService';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export const GenerateReport: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeBlocks, setActiveBlocks] = useState<string[]>(['header', 'summary']);

  const [reportData, setReportData] = useState({
    title: "Financial Intelligence Package",
    period: "Q1 2026 Forecast",
    summary: "Automated synthesis of cross-entity performance indicant significant upside in the retail division, balanced by energy cost spikes in SOCAR Georgia.",
    kpis: [
      { label: "Revenue", value: "$4.25M", trend: "+6.3%" },
      { label: "EBITDA", value: "29.4%", trend: "+2.1%" },
      { label: "Op Cash", value: "$1.2M", trend: "+9.1%" }
    ]
  });

  const [notification, setNotification] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Simulate Gemini Canvas generation
    setTimeout(() => {
      setActiveBlocks(prev => [...new Set([...prev, 'kpis', 'chart'])]);
      setIsGenerating(false);
      setPrompt('');
      setNotification("Canvas regenerated with high-fidelity arrays.");
      setTimeout(() => setNotification(null), 3000);
    }, 2000);
  };

  const handleAction = (action: string) => {
    setNotification(`${action} simulation initiated...`);
    setTimeout(() => setNotification(null), 3000);
  };

  const addComponent = () => {
    const options = ['kpis', 'chart'];
    const next = options.find(o => !activeBlocks.includes(o));
    if (next) {
      setActiveBlocks(prev => [...prev, next]);
    } else {
      setNotification("All semantic blocks already active on canvas.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] flex overflow-hidden bg-background">

      {/* Sidebar: Prompt & Materials */}
      <div className="w-80 border-r border-border bg-card flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-primary animate-pulse" />
            <h2 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Creative Console</h2>
          </div>
          <p className="text-[9px] text-muted-foreground font-bold uppercase opacity-60 italic leading-none">Gemini Canvas Mode</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Active Prompt</label>
              <textarea
                className="w-full h-32 bg-accent/10 border border-border rounded-xl p-3 text-[11px] font-bold text-foreground outline-none focus:border-primary transition-all resize-none placeholder:opacity-30 uppercase tracking-tight"
                placeholder="Describe your report... e.g., 'Generate an infographic summary of Q1 performance for board review'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] py-6 shadow-xl shadow-primary/20"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wand2 size={16} className="mr-2" />}
              Generate Canvas
            </Button>
          </div>

          <div className="space-y-4 pt-6 border-t border-border">
            <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Available Materials</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Q1 Actuals', icon: FileSpreadsheet },
                { label: 'Budget v2', icon: FileJson },
                { label: 'Market Pulse', icon: Globe },
                { label: 'Logo Pack', icon: Image }
              ].map((m, i) => (
                <div key={i} className="p-2 border border-border rounded-lg bg-accent/5 flex flex-col items-center gap-1 hover:bg-accent/10 cursor-pointer transition-colors">
                  <m.icon size={16} className="text-muted-foreground" />
                  <span className="text-[8px] font-black text-foreground uppercase leading-tight text-center">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-accent/5">
          <Button
            variant="outline"
            className="w-full text-[9px] font-black uppercase tracking-widest h-10 border-primary/20 hover:border-primary/50 text-primary"
            onClick={addComponent}
          >
            <Plus size={14} className="mr-1.5" /> Add Component
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-y-auto bg-accent/5 p-12 relative flex justify-center">

        {/* Canvas floating controls */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-card/80 border border-white/10 rounded-full shadow-vivid backdrop-blur-2xl z-20">
          <button onClick={() => handleAction('Save')} className="p-2 hover:bg-primary/10 rounded-full text-foreground hover:text-primary transition-all"><Save size={16} /></button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button onClick={() => handleAction('Publish')} className="px-6 py-1.5 bg-primary text-white text-[9px] font-black uppercase rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-all">Publish Intelligence</button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button onClick={() => handleAction('Share')} className="p-2 hover:bg-primary/10 rounded-full text-foreground hover:text-primary transition-all"><Share2 size={16} /></button>
          <button onClick={() => handleAction('Download')} className="p-2 hover:bg-primary/10 rounded-full text-foreground hover:text-primary transition-all"><Download size={16} /></button>
        </div>

        {/* The Infographic Paper */}
        <div className="w-full max-w-[850px] min-h-[1100px] bg-white text-slate-900 shadow-[0_25px_100px_rgba(0,0,0,0.1)] rounded-sm p-16 origin-top transform hover:ring-1 hover:ring-primary/20 transition-all">

          <AnimatePresence>
            {activeBlocks.includes('header') && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <div className="flex justify-between items-end border-b-4 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-4xl font-black font-display uppercase tracking-tighter leading-none">{reportData.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">{reportData.period} • {currentCompany?.org_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Confidential Intelligence</p>
                    <p className="text-[10px] font-mono font-bold">ARC-CODE: 938-FIN</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeBlocks.includes('summary') && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-12 gap-8 mb-12">
                <div className="col-span-8">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 italic">Executive Synthesis</h3>
                  <p className="text-xs leading-relaxed text-slate-600 font-medium lowercase">
                    {reportData.summary}
                  </p>
                </div>
                <div className="col-span-4 bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-center items-center text-center">
                  <Sparkles size={24} className="text-primary mb-3" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">AI Conviction Score</p>
                  <p className="text-3xl font-black">94%</p>
                  <p className="text-[8px] text-slate-400 uppercase mt-2">Data Quality Robust</p>
                </div>
              </motion.div>
            )}

            {activeBlocks.includes('kpis') && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-3 gap-6 mb-12">
                {reportData.kpis.map((k, i) => (
                  <div key={i} className="p-6 border-2 border-slate-100 rounded-3xl group hover:border-primary transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">{k.value}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase italic">{k.trend} vs Budget</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeBlocks.includes('chart') && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-6 italic">Visual Trajectory</h3>
                <div className="h-64 w-full bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
                  {/* Simulated Infographic Chart */}
                  <div className="flex items-end gap-3 h-32">
                    {[40, 65, 45, 90, 70, 85, 95].map((h, i) => (
                      <div key={i} className="w-8 bg-slate-200 rounded-t-lg relative group transition-all" style={{ height: `${h}%` }}>
                        <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-6 flex justify-between w-full px-12 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer of the paper */}
          <div className="mt-auto pt-12 border-t border-slate-100 flex justify-between items-center text-slate-400 opacity-50">
            <p className="text-[8px] font-black uppercase tracking-widest">Powered by FinSight Gemini Engine</p>
            <p className="text-[8px] font-mono">PAGE 01 / 01</p>
          </div>

        </div>

        {/* Floating Guide */}
        {!activeBlocks.includes('chart') && !isGenerating && (
          <div className="absolute bottom-12 right-12 nyx-card p-6 bg-primary text-white shadow-2xl animate-bounce">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 font-display italic">Tip: Use Prompting</p>
            <p className="text-[9px] opacity-90 font-bold max-w-xs leading-tight">"Add a quarterly trend chart comparing regional EBITDA nodes..."</p>
          </div>
        )}
        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-vivid z-[100]"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

const Globe = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
