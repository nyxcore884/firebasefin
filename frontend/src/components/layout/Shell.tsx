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
<<<<<<< Updated upstream
=======
import GodMode from './GodMode';
import AudioBriefing from './AudioBriefing';
import InteractiveVoice from './InteractiveVoice';
import NotificationCenter from './NotificationCenter';
>>>>>>> Stashed changes
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

// Floating AI Assistant Component
<<<<<<< Updated upstream
=======
// HUD Ticker Component
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
        // Check if it's a 500 or JSON error, suppress log noise for known dev issues
        // console.error("HUD Fetch Error", e); 
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

>>>>>>> Stashed changes
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
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm having trouble retrieving financial records right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, rating: 'up' | 'down') => {
    // Optimistic UI Update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: rating } : m));

    let correction = "";
    if (rating === 'down') {
      correction = window.prompt("How can I improve this response? (This helps me learn)") || "Incorrect answer flagged.";
      toast.info("Correction received. Sending to Neural Brain for retraining...");
    } else {
      toast.success("Feedback recorded. I'll remember this!");
    }

    const endpoint = "/api/query"; // Fixed to use active gateway
    const user = auth.currentUser;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          userId: user?.uid || 'anonymous',
          msgId,
          rating,
          correction
        })
      });
    } catch (e) {
      console.error("Feedback error", e);
    }
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
<<<<<<< Updated upstream
                <h4 className="text-sm font-semibold">CFO Assistant</h4>
                <p className="text-[10px] text-muted-foreground">Cognitive Engine v2</p>
=======
                <h4 className="text-sm font-semibold"><AIText>AI Assistant MURTAZI</AIText></h4>
                <p className="text-[10px] text-muted-foreground"><AIText>Cognitive Engine v2</AIText></p>
>>>>>>> Stashed changes
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
                    {/* CoT Display */}
                    {msg.thought_process && msg.thought_process.length > 0 && (
                      <div className="mb-2 pb-2 border-b border-primary/10">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300 antialiased">Synthesized Reasoning Trace</h4>
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

                  {/* Feedback Buttons */}
                  {msg.role === 'model' && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => handleFeedback(msg.id, 'up')}
                        className={cn("p-1 hover:bg-muted rounded transition-colors", msg.feedback === 'up' ? "text-green-500" : "text-muted-foreground")}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, 'down')}
                        className={cn("p-1 hover:bg-muted rounded transition-colors", msg.feedback === 'down' ? "text-red-500" : "text-muted-foreground")}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
                  <BrainCircuit className="h-3 w-3 text-primary" />
                </div>
                <div className="bg-muted p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-xs flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t bg-background/50 rounded-b-2xl">
            <form className="flex gap-2" onSubmit={handleSend}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
<<<<<<< Updated upstream
                placeholder="Ask your CFO Assistant..."
=======
                placeholder={language === 'en' ? "Ask MURTAZI..." : "ჰკითხეთ MURTAZI-ს..."}
>>>>>>> Stashed changes
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
  const t = translations[language];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Ensure user is signed in anonymously for Vertex AI access
  useEffect(() => {
    const signIn = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
          console.log("Signed in anonymously for AI Agent access.");
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

        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <SidebarInset>
          <header className="sticky top-0 z-40 h-20 px-6 lg:px-8 flex items-center justify-between bg-background/80 dark:bg-slate-950/80 border-b border-primary/10 dark:border-white/5 backdrop-blur-3xl shadow-vivid">
            <div className="flex items-center gap-6 flex-1">
              <SidebarTrigger className="lg:hidden text-muted-foreground hover:text-foreground" />

              {/* Unified Command Hub - Strategic Cockpit Bar */}
              <div className="flex items-center gap-0.5 bg-primary/5 dark:bg-slate-900/40 p-1 rounded-2xl border border-primary/10 dark:border-white/5 backdrop-blur-md shadow-vivid ring-1 ring-primary/5">
                {/* 1. Search / Intelligence Context */}
                <div className="flex items-center gap-2 px-4 py-2 border-r border-primary/10 dark:border-white/5 group focus-within:bg-primary/10 transition-all">
                  <Search className="h-4 w-4 text-primary/40 group-focus-within:text-primary" />
                  <input
                    className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest w-32 xl:w-48 placeholder:text-muted-foreground/30 text-foreground"
                    placeholder={language === 'en' ? "SEARCH CONTEXT..." : "ძიება..."}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* 2. Company Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all outline-none group border-r border-primary/10 dark:border-primary/20 whitespace-nowrap text-left">
                      <Building2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col items-start leading-tight text-left">
                        <span className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-widest"><AIText>Entity</AIText></span>
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
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-black text-white uppercase">{c.name}</span>
                          <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full font-black">{c.id}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{c.type} Division</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 3. Department Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-all outline-none group border-r border-primary/10 dark:border-primary/20 whitespace-nowrap text-left">
                      <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-widest"><AIText>Department</AIText></span>
                        <span className="text-[11px] font-black text-foreground">{selectedDepartment}</span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 glass-card p-2 border-white/10 shadow-2xl rounded-2xl bg-slate-950">
                    {['All', 'Technical', 'Human Resources', 'Sales & Marketing', 'Customer Service', 'Finance'].map(dept => (
                      <DropdownMenuItem
                        key={dept}
                        onClick={() => setSelectedDepartment(dept)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer mb-1 last:mb-0 text-[11px] font-black uppercase tracking-widest",
                          selectedDepartment === dept ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-white/5 text-slate-300"
                        )}
                      >
                        {dept}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 4. Fiscal Window (Advanced Calendar) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-3 px-5 py-2 hover:bg-primary/5 transition-all outline-none group whitespace-nowrap rounded-r-2xl border-l border-primary/10 dark:border-white/5">
                      <CalendarIcon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[8px] uppercase font-black text-muted-foreground/40 tracking-widest">{language === 'en' ? 'Fiscal Window' : 'აუდიტის ფანჯარა'}</span>
                        <span className="text-[11px] font-black text-foreground">{selectedPeriod || (language === 'en' ? 'OPEN CONTEXT' : 'ღია კონტექსტი')}</span>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-white/10 shadow-2xl rounded-2xl bg-slate-950" align="end">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">{language === 'en' ? 'Select Audit Period' : 'აირჩიეთ პერიოდი'}</span>
                      {selectedPeriod && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[9px] font-black text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          onClick={() => setSelectedPeriod(null)}
                        >
                          {language === 'en' ? 'CLEAR' : 'გასუფთავება'}
                        </Button>
                      )}
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedPeriod ? new Date(selectedPeriod + '-01') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          setSelectedPeriod(`${year}-${month}`);
                        }
                      }}
                      className="bg-slate-950 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {/* ... Right side header items ... */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {/* Global Language Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-primary/10 bg-primary/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-widest gap-2">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      {language === 'en' ? 'EN' : 'KA'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-950 border-white/10 rounded-xl">
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="text-[10px] font-black uppercase py-2">English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('ka')} className="text-[10px] font-black uppercase py-2">ქართული</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Global Theme Toggle */}
                <Button
                  variant="outline" size="sm"
                  className="h-10 w-10 p-0 rounded-xl border-primary/10 bg-primary/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 text-primary transition-all shadow-vivid"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                {/* Global Currency Toggle */}
                <Button
                  variant="outline" size="sm"
                  className="h-10 w-10 p-0 rounded-xl border-primary/10 bg-primary/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 text-[10px] font-black uppercase transition-all shadow-vivid"
                  onClick={() => setCurrency(currency === 'USD' ? 'GEL' : 'USD')}
                >
                  <span className="text-primary text-[14px]">{currency === 'USD' ? '$' : '₾'}</span>
                </Button>

                <div className="w-px h-6 bg-primary/10 dark:bg-white/5 mx-2" />

<<<<<<< Updated upstream
              <Button variant="ghost" size="icon" onClick={() => toast.info('Notifications are not yet implemented.')} className="relative rounded-full text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-1 ring-background" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
              <Outlet />
            </div>
            <FloatingAssistant />
          </main>
        </div>
      </div>
    </SidebarProvider>
=======
                <NotificationCenter />

                <Button size="icon" variant="ghost" className="rounded-xl h-10 w-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <div className="font-black text-[10px]">CFO</div>
                </Button>
              </div>
            </div>
          </header>

          {/* Sticky HUD */}
          <div className="sticky top-20 z-30 w-full backdrop-blur-xl bg-background/40 dark:bg-slate-950/40 border-b border-primary/10 dark:border-white/10 animate-in slide-in-from-top-4 duration-500 shadow-vivid">
            <HUDTicker company={selectedCompany} period={selectedPeriod} department={selectedDepartment} />
          </div>

          <div className={cn(
            "flex flex-col flex-1",
            isController ? "min-h-0 overflow-hidden" : "overflow-y-auto"
          )}>
            <div className={cn(
              "flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both flex-1",
              isController ? "h-full w-full min-h-0" : "w-full space-y-8"
            )}>
              <Outlet />
            </div>
            {!isController && <FloatingAssistant />}
            {!isController && <GodMode />}
            {/* Footer or Padding could go here */}
          </div>
        </SidebarInset>
      </div >
    </SidebarProvider >
>>>>>>> Stashed changes
  );
};
