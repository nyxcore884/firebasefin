import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Search,
  Sun,
  Moon,
  Sparkles,
  Globe,
  DollarSign,
  Coins,
  BrainCircuit,
  X,
  Send,
  Building2,
  Calendar as CalendarIcon,
  Users,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Database,
  PanelLeft,
  FileBarChart,
  CheckCircle,
  Layout,
  Presentation,
  Activity
} from 'lucide-react';
import { AIBackground } from './AIBackground';
import AudioBriefing from './AudioBriefing';
import InteractiveVoice from './InteractiveVoice';
import NotificationCenter from './NotificationCenter';
import { AppSidebar } from './Sidebar';
import { FinsightIcon } from '@/components/FinsightIcon';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppState, translations } from '@/hooks/use-app-state';
import { AIText } from '@/components/common/AIText';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from "firebase/auth";


interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  thought_process?: string[]; // Chain of Thought
  feedback?: 'up' | 'down';
}

// HUD Ticker Component
const HUDTicker = ({ company, period, department }: { company: string, period: string | null, department: string }) => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/truth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'hud_metrics', entity: company, period: period, department: department })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        if (!text) return;

        const data = JSON.parse(text);
        setMetrics(data);
      } catch (e) {
        // Suppress noise
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [company, period, department]);

  if (!metrics) return <div className="h-10 px-6 text-xs text-muted-foreground flex items-center">Loading live metrics...</div>;

  return (
    <div className="flex h-10 items-center justify-between px-6">
      <div className="flex items-center gap-6 text-xs font-mono tracking-wide overflow-hidden whitespace-nowrap mask-linear-fade">
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          REV: ₾{(metrics.revenue || metrics.REVENUE || 0).toLocaleString()}
        </div>
        <div className="flex items-center gap-2 text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          BURN: ₾{(metrics.burn_rate || metrics.OPEX || 0).toLocaleString()}
        </div>
        <div className="flex items-center gap-2 text-blue-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          RUNWAY: {metrics.cash_runway || 0} Mo
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
        <span><AIText>Verified by Engine</AIText></span>
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: "Hello! I'm monitoring your financial data streams. How can I assist with your analysis today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedCompany, selectedPeriod, selectedDepartment, language } = useAppState();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const msgId = Date.now().toString();
    setMessages(prev => [...prev, { id: msgId, role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const endpoint = "/api/query";
      const user = auth.currentUser;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          userId: user?.uid || 'anonymous',
          action: 'query',
          context: {
            company_id: selectedCompany,
            period: selectedPeriod,
            department: selectedDepartment
          }
        })
      });

      if (!response.ok) throw new Error("AI Backend Error");

      const data = await response.json();
      const aiText = data.answer || "No response generated.";
      const thoughts = data.thought_process || [];

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: aiText,
        thought_process: thoughts
      }]);

    } catch (error) {
      console.error("AI Query Error:", error);
      toast.error("Failed to connect to AI Brain.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: rating } : m));
    toast.success(rating === 'up' ? "Feedback recorded!" : "Thanks, I'll improve.");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-[380px] h-[600px] glass-card shadow-2xl rounded-2xl flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="p-4 border-b bg-primary/5 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold"><AIText>AI Assistant MURTAZI</AIText></h4>
                <p className="text-[10px] text-muted-foreground"><AIText>Cognitive Engine v2</AIText></p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && (
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
                    <BrainCircuit className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-3 rounded-xl text-xs shadow-sm",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none space-y-2"
                  )}>
                    {msg.thought_process && msg.thought_process.length > 0 && (
                      <div className="mb-2 pb-2 border-b border-primary/10">
                        <p className="text-[10px] uppercase font-bold text-primary/70 mb-1 flex items-center gap-1">
                          <BrainCircuit className="h-3 w-3" /> <AIText>Thinking Process</AIText>
                        </p>
                        <div className="space-y-1 pl-1 border-l-2 border-primary/20">
                          {msg.thought_process.map((thought, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground"><AIText>{thought}</AIText></p>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                  {msg.role === 'model' && (
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => handleFeedback(msg.id, 'up')} className={cn("p-1 hover:bg-muted rounded transition-colors", msg.feedback === 'up' ? "text-green-500" : "text-muted-foreground")}>
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleFeedback(msg.id, 'down')} className={cn("p-1 hover:bg-muted rounded transition-colors", msg.feedback === 'down' ? "text-red-500" : "text-muted-foreground")}>
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="p-3 bg-muted rounded-xl w-fit animate-pulse text-[10px] uppercase font-black tracking-widest">Generating Insight...</div>}
          </div>
          <div className="p-3 border-t bg-background/50 rounded-b-2xl">
            <form className="flex gap-2" onSubmit={handleSend}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder={language === 'en' ? "Ask MURTAZI..." : "ჰკითხეთ MURTAZI-ს..."}
                disabled={loading}
              />
              <Button type="submit" size="icon" className="h-8 w-8 rounded-lg" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-primary/25 transition-all duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <BrainCircuit className="h-6 w-6" />}
      </Button>
    </div>
  );
};

export const Shell = () => {
  const {
    theme, toggleTheme, language, setLanguage, currency, setCurrency,
    setSearchQuery, isSidebarPinned,
    selectedCompany, setSelectedCompany,
    selectedPeriod, setSelectedPeriod,
    selectedDepartment, setSelectedDepartment
  } = useAppState();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const signIn = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    signIn();
  }, []);

  const location = useLocation();
  const isController = location.pathname.startsWith('/controller');

  return (
    <SidebarProvider defaultOpen={isSidebarPinned}>
      <div className="flex bg-transparent min-h-screen w-full font-sans antialiased text-foreground selection:bg-primary/20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/5 via-transparent to-transparent overflow-x-hidden">
        <AIBackground />
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 h-20 px-6 lg:px-8 flex items-center justify-between bg-background/80 dark:bg-slate-950/80 border-b border-primary/10 dark:border-white/5 backdrop-blur-3xl shadow-vivid">
            <div className="flex items-center gap-6 flex-1">
              <SidebarTrigger className="lg:hidden text-muted-foreground hover:text-foreground" />
              <div className="flex items-center gap-0.5 bg-primary/5 dark:bg-slate-900/40 p-1 rounded-2xl border border-primary/10 dark:border-white/5 backdrop-blur-md shadow-vivid ring-1 ring-primary/5">
                <div className="flex items-center gap-2 px-4 py-2 border-r border-primary/10 dark:border-white/5 group focus-within:bg-primary/10 transition-all">
                  <Search className="h-4 w-4 text-primary/40 group-focus-within:text-primary" />
                  <input
                    className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest w-32 xl:w-48 placeholder:text-muted-foreground/30 text-foreground"
                    placeholder={language === 'en' ? "SEARCH CONTEXT..." : "ძიება..."}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all outline-none group border-r border-primary/10 dark:border-primary/20 whitespace-nowrap text-left">
                      <Building2 className="h-4 w-4 text-primary" />
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-widest">Entity</span>
                        <span className="text-[11px] font-black text-foreground">{selectedCompany}</span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 glass-card p-3 border-primary/20 shadow-2xl rounded-2xl bg-background/90">
                    <DropdownMenuLabel className="text-[9px] uppercase font-black text-slate-500 px-2 pb-2">Corporation Context</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5 mb-2" />
                    {[
                      { id: 'SGG-001', name: 'SOCAR Georgia Gas', type: 'Distribution' },
                      { id: 'SGG-002', name: 'SOCAR Gas Export', type: 'Logistics' },
                      { id: 'SGG-003', name: 'TelavGas', type: 'Regional' }
                    ].map(c => (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => setSelectedCompany(c.id)}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 rounded-xl transition-all cursor-pointer mb-1 last:mb-0",
                          selectedCompany === c.id ? "bg-indigo-500/20 border border-indigo-500/20" : "hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <span className="text-[11px] font-black uppercase">{c.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{c.type} Division</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all outline-none group border-r border-primary/10 dark:border-primary/20 whitespace-nowrap text-left">
                      <Users className="h-4 w-4 text-primary" />
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-widest">Department</span>
                        <span className="text-[11px] font-black text-foreground">{selectedDepartment}</span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 glass-card p-2 border-white/10 shadow-2xl rounded-2xl bg-background">
                    {['All', 'Technical', 'Human Resources', 'Sales & Marketing', 'Customer Service', 'Finance'].map(dept => (
                      <DropdownMenuItem
                        key={dept}
                        onClick={() => setSelectedDepartment(dept)}
                        className={cn("p-3 rounded-xl cursor-pointer mb-1 last:mb-0 text-[11px] font-black uppercase tracking-widest", selectedDepartment === dept ? "bg-indigo-500/20" : "hover:bg-white/5")}
                      >
                        {dept}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-3 px-5 py-2 hover:bg-primary/5 transition-all outline-none group rounded-r-2xl border-l border-primary/10 dark:border-white/5">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <div className="flex items-start flex-col leading-tight">
                        <span className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-widest">Fiscal Window</span>
                        <span className="text-[11px] font-black text-foreground">{selectedPeriod || 'OPEN'}</span>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedPeriod ? new Date(selectedPeriod + '-01') : undefined}
                      onSelect={(date) => date && setSelectedPeriod(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={toggleTheme} className="h-10 w-10 p-0 rounded-xl">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrency(currency === 'USD' ? 'GEL' : 'USD')} className="h-10 w-10 p-0 rounded-xl font-black text-primary">
                {currency === 'USD' ? '$' : '₾'}
              </Button>
              <NotificationCenter />
              <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <div className="font-black text-[10px]">CFO</div>
              </Button>
            </div>
          </header>

          <div className="sticky top-20 z-30 w-full backdrop-blur-xl bg-background/40 dark:bg-slate-950/40 border-b border-primary/10 dark:border-white/10 shadow-vivid">
            <HUDTicker company={selectedCompany} period={selectedPeriod} department={selectedDepartment} />
          </div>

          <div className={cn("flex flex-col flex-1", isController ? "min-h-0 overflow-hidden" : "overflow-y-auto")}>
            <div className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 flex-1", isController ? "h-full w-full" : "w-full space-y-8")}>
              <Outlet />
            </div>
            {!isController && <FloatingAssistant />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
