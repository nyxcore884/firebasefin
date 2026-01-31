import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  Send, Bot, User, Paperclip, Mic, Sparkles,
  Files, History, ChevronRight, CheckCircle2,
  Presentation, FileText,
  Cpu,
  Microscope,
  Clock,
  Briefcase,
  Terminal,
  Brain,
  Shield,
  Search,
  Settings,
  Zap,
  ArrowUpRight,
  MoreHorizontal,
  X,
  Database,
  ArrowRight,
  Download, BarChart3, PieChart, Table as TableIcon, LayoutDashboard, FileSpreadsheet
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../../services/aiService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useIntelligenceOrchestrator } from '../../hooks/useIntelligenceOrchestrator';
import { ForensicDashboard } from '../../components/ai/ForensicDashboard';
import { ContextSidebar } from '../../components/ai/ContextSidebar';
import { toast } from 'sonner';

// Types for internal state
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  confidence?: number;
  engine?: string;
  hasDashboard?: boolean;
  dashboardData?: any;
  intelligenceAssets?: any[];
  runId?: string;
}

type EngineType = 'forensic' | 'risk' | 'forecast' | 'general';

const SUGGESTIONS = [
  { text: "what was our revenue variance last month?", icon: <Zap size={16} /> },
  { text: "draft an executive summary for q1", icon: <FileText size={16} /> },
  { text: "forecast cash flow for next 3 months", icon: <Clock size={16} /> },
];

// --- UPDATED: Dynamic Pipeline Pulse ---
const DynamicPipelinePulse = ({ steps, activeStep, explanation }: { steps: string[], activeStep: number | null, explanation?: string }) => {
  if (activeStep === null) return null;
  return (
    <div className="mb-6 animate-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between p-4 bg-background/60 backdrop-blur-xl border border-white/5 rounded-2xl mb-2 overflow-x-auto scrollbar-none shadow-sm">
        {steps.map((step, i) => (
          <div key={i} className={cn(
            "flex flex-col items-center px-4 transition-all duration-500 min-w-[120px]",
            i === activeStep ? "opacity-100 scale-105" : i < activeStep ? "opacity-40" : "opacity-30 grayscale"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-full mb-2 flex items-center justify-center text-xs transition-colors",
              i === activeStep ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 animate-pulse" : "bg-secondary text-muted-foreground"
            )}>
              {i < activeStep ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap text-muted-foreground text-center">
              {step.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
      {explanation && (
        <div className="flex justify-center">
          <div className="px-5 py-2 rounded-full bg-background/80 border border-primary/20 flex items-center gap-2 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const AiAssistant: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "system online. i am the nyx intelligence oracle. connected to high-fidelity bigquery clusters. i can analyze variance, predict leakage, or generate real-time financial arrays. **how shall we proceed?**",
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [activeEngine, setActiveEngine] = useState<EngineType>('general');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<string[]>(['INGEST', 'IDENTIFY_ENTITIES', 'SQL_GEN', 'VALIDATE', 'RENDER']);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [currentPipelineRunId, setCurrentPipelineRunId] = useState<string | null>(null);

  // --- HOOK INTEGRATION: Brain 3 Pulse ---
  const {
    currentStage,
    explanation,
    startIntelligenceMission,
    resultAssets,
    isProcessing,
    runId: pipelineRunId
  } = useIntelligenceOrchestrator();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map backend stages to UI steps
  useEffect(() => {
    if (currentStage) {
      const stageMap: Record<string, number> = {
        'INGEST': 0,
        'DISCOVER': 1, // Brain 2 Mapping
        'CALCULATE': 2, // Brain 1 Math
        'NARRATE': 3, // Brain 2 Narration
        'COMPLETE': 4
      };
      // Fuzzy match or exact match
      const stageIndex = stageMap[currentStage] ?? 0;
      setActiveStep(stageIndex);
    }
  }, [currentStage]);

  // Handle Intelligence Completion
  useEffect(() => {
    if (resultAssets && resultAssets.length > 0) {
      // Append intelligence results as a bot message
      // This simulates the synthesis completion
      // Ideally the result comes via the hook, or we query the final output.
      // Current hook implementation sets resultAssets on completion.
      // We'll trust the hook.
    }
  }, [resultAssets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, explanation]); // Auto-scroll on pulse updates

  const handleSend = async (text: string = input) => {
    if (!text.trim() && files.length === 0) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      engine: activeEngine
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (files.length > 0) {
        // TRIGGER BRAIN 3 PIPELINE
        // We use the first file for the mission (v10 constraint)
        await startIntelligenceMission(files[0], currentCompany?.org_id || 'SOCAR_GROUP', text);
        // The hook (useIntelligenceOrchestrator) now drives the UI state (isProcessing, explanation)
        // We sit back and let the Pulse UI show the progress.
        // On complete, we should add the message? 
        // The hook could expose a 'onComplete' callback or we watch state.
        // For simplicity, we let the hook handle the visuals, and we just wait effectively.
        // Actually, startIntelligenceMission is async but returns void (in hook).
        // The hook updates state. 
        // We need to know when to stop "Typing" or show the final card.
        // We'll use the 'isProcessing' flag to control the "Synthesizing..." UI.
      } else {
        // Text-only query (Standard Path)
        const response = await aiService.queryIntelligence(text, {
          company: currentCompany,
          engine: activeEngine
        });

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
          confidence: response.confidence,
          intelligenceAssets: response.assets,
          runId: response.run_id,
          engine: activeEngine
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (error) {
      // Error handled by hook state usually, but for text query we handle here
      if (files.length === 0) {
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Intelligence link failed.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      if (files.length === 0) setIsTyping(false);
      setFiles([]);
    }
  };

  // Watch for completion to add final message
  const lastProcessedRunId = useRef<string | null>(null);

  useEffect(() => {
    // If we just finished processing and have no error
    if (currentStage === 'COMPLETE' && !isProcessing && explanation && pipelineRunId !== lastProcessedRunId.current) {
      setIsTyping(false);
      lastProcessedRunId.current = pipelineRunId;

      // Add success message
      const botMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: explanation, // The backend now stores the final narrative here
        timestamp: new Date(),
        engine: activeEngine,
        runId: pipelineRunId || undefined
      };
      setMessages(prev => [...prev, botMsg]);
    }
  }, [currentStage, isProcessing, explanation, pipelineRunId, activeEngine]);

  const handleIntelligenceAction = (action: string) => {
    // Placeholder for export/action logic
    console.log("Intelligence Action Triggered:", action);
  };

  return (
    <div className="flex h-full w-full bg-background/50 overflow-hidden font-sans">
      {/* LEFT: Neural Context & Directives */}
      <ContextSidebar
        activeEngine={activeEngine}
        onEngineChange={(eng) => setActiveEngine(eng)}
        onExport={handleIntelligenceAction}
        selectedCompany={currentCompany?.org_name || "SOCAR GROUP"}
      />

      {/* CENTER: Chat Workspace */}
      <div className="flex-grow flex flex-col h-full overflow-hidden relative border-r border-white/5 bg-black/5 animate-in fade-in duration-1000">
        {/* Header: Oracle Status */}
        <div className="p-8 border-b border-white/5 bg-background/40 backdrop-blur-3xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/20 animate-pulse">
              <Sparkles size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] font-display">Intelligence Oracle</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgb(16,185,129)]"></span>
                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">Neural Link: ACTIVE</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2.5 bg-secondary/30 border border-border/40 rounded-2xl flex items-center gap-4 group hover:border-primary/30 transition-all">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">Protocol: {activeEngine.toUpperCase()}</span>
              <div className="flex gap-1">
                <span className="w-1 h-3 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-1 h-3 bg-primary rounded-full animate-bounce [animation-delay:200ms]"></span>
                <span className="w-1 h-3 bg-primary rounded-full animate-bounce [animation-delay:400ms]"></span>
              </div>
            </div>
          </div>
        </div >

        {/* Messages Hub */}
        < div className="flex-grow overflow-y-auto p-12 space-y-10 scrollbar-none" >

          {/* THE PIPELINE PULSE: Driven by the Orchestrator Hook */}
          <DynamicPipelinePulse
            steps={['INGEST', 'DISCOVER', 'CALCULATE', 'NARRATE', 'COMPLETE']}
            activeStep={activeStep}
            explanation={explanation}
          />

          <div className="space-y-10">
            {messages.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "flex items-start gap-6 max-w-[95%]",
                  m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center border transition-all duration-500",
                  m.role === 'user'
                    ? "bg-secondary/40 border-white/5 text-white/60"
                    : "bg-primary/10 border-primary/20 text-primary shadow-xl shadow-primary/10"
                )}>
                  {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>

                <div className={cn(
                  "flex flex-col gap-3",
                  m.role === 'user' ? "items-end text-right" : "items-start"
                )}>
                  <div className={cn(
                    "p-8 rounded-[2rem] border text-sm font-medium leading-relaxed tracking-tight transition-all duration-300",
                    m.role === 'user'
                      ? "bg-white/5 border-white/10 text-white"
                      : "bg-white/[0.03] backdrop-blur-3xl border-white/5 text-white shadow-2xl"
                  )}>
                    <div className="prose prose-invert max-w-none">
                      {m.content}
                    </div>

                    {m.intelligenceAssets && (
                      <div className="mt-8 pt-8 border-t border-white/5">
                        <ForensicDashboard
                          assets={m.intelligenceAssets}
                          requestId={m.runId || m.id}
                          userQuery={m.content}
                          orgId={currentCompany?.org_id || 'SOCAR_GROUP'}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 px-4">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.engine && (
                      <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                        {m.engine} protocol
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {(isTyping || isProcessing) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 w-fit"
              >
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:200ms]"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:400ms]"></span>
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{explanation || "Synthesizing Intelligence..."}</span>
              </motion.div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div >

        {/* Oracle Input Terminal */}
        < div className="p-12 mt-auto" >
          {files.length > 0 && (
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
              {files.map((f, i) => (
                <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 transition-all hover:bg-white/10">
                  <FileSpreadsheet size={14} className="text-emerald-400" />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-tight">{f.name}</span>
                  <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-white/20 hover:text-rose-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative p-2 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center gap-4 pr-6 shadow-2xl transition-all">
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 text-white/40 hover:text-primary hover:bg-white/5 transition-all rounded-[2rem]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={22} />
              </Button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query the Oracle..."
                className="flex-grow bg-transparent border-none outline-none text-xs font-black text-white placeholder-white/20 px-4 uppercase tracking-[0.1em]"
              />
              <Button
                className="h-14 w-14 rounded-[2rem] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 active:scale-95 transition-all text-white"
                onClick={() => handleSend()}
              >
                <Send size={22} />
              </Button>
            </div>
          </div>
        </div >
      </div >

      {/* RIGHT: Neural Insights Suggestions */}
      <div className="w-80 hidden 2xl:flex flex-col bg-black/20 border-l border-white/5 animate-in slide-in-from-right duration-700">
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <h6 className="text-[10px] font-black flex items-center gap-3 text-primary uppercase tracking-[0.4em]">
            <Sparkles size={18} />
            Neural Insights
          </h6>
        </div>
        <div className="p-8 space-y-8 h-full overflow-y-auto scrollbar-none">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-white/5">
            <p className="text-[10px] font-bold text-white/60 leading-relaxed uppercase tracking-wider">
              BigQuery detects <span className="text-white">COGS Flow</span> anomalies in the Georgian cluster.
            </p>
          </div>

          <div className="space-y-4">
            {/* REMOVED: Old mocked isIngesting logic, now driven by real-time pulse */}

            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.text)}
                className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col gap-4 text-left group"
              >
                <div className="text-primary group-hover:scale-110 transition-transform">{s.icon}</div>
                <p className="text-[10px] font-black text-white/60 group-hover:text-white transition-colors leading-relaxed uppercase tracking-widest">
                  {s.text}
                </p>
                <ArrowUpRight size={16} className="text-white/20 ml-auto group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            const fileArray = Array.from(e.target.files);
            setFiles(fileArray);
          }
        }}
      />
    </div>
  );
};
