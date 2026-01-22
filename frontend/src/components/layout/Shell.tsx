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
import {
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  DollarSign,
  Coins,
  BrainCircuit,
  X,
  Send,
  Building2,
  Calendar,
  Users,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { AIBackground } from './AIBackground';
import { AppSidebar } from './Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { useAppState, translations } from '@/hooks/use-app-state';
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
const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: "Hello! I'm monitoring your financial data streams. How can I assist with your analysis today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedCompany, selectedPeriod, selectedDepartment } = useAppState();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const msgId = Date.now().toString();
    setMessages(prev => [...prev, { id: msgId, role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const endpoint = "/functions/ai";
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

    if (rating === 'up') toast.success("Feedback recorded. I'll remember this!");

    const endpoint = "/functions/ai_query_api";
    const user = auth.currentUser;

    // If downvote, we could ask for correction, but for now just log it
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'feedback',
        userId: user?.uid || 'anonymous',
        msgId,
        rating,
        correction: rating === 'down' ? "User flagged this answer as incorrect." : ""
      })
    });
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
                <h4 className="text-sm font-semibold">CFO Assistant</h4>
                <p className="text-[10px] text-muted-foreground">Cognitive Engine v2</p>
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
                        <p className="text-[10px] uppercase font-bold text-primary/70 mb-1 flex items-center gap-1">
                          <BrainCircuit className="h-3 w-3" /> Thinking Process
                        </p>
                        <div className="space-y-1 pl-1 border-l-2 border-primary/20">
                          {msg.thought_process.map((thought, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground italic">{thought}</p>
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
                placeholder="Ask your CFO Assistant..."
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

  return (
    <SidebarProvider defaultOpen={isSidebarPinned}>
      <div className="relative min-h-screen w-full selection:bg-primary/30 selection:text-foreground">
        <AIBackground />
        <AppSidebar />
        <div className={cn("min-h-screen flex flex-col", isSidebarPinned ? "lg:ml-64" : "lg:ml-12", "transition-all duration-300 ease-in-out")}>
          <header className="sticky top-0 z-10 h-16 px-6 flex items-center justify-between glass-header">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden text-muted-foreground hover:text-foreground" />

              {/* Context Selector: Company */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">{selectedCompany}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="glass-card w-48">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Select Entity</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedCompany('SGG-001')} className={cn("text-xs", selectedCompany === 'SGG-001' && "bg-primary text-primary-foreground")}>
                    SOCAR Georgia (SGG-001)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCompany('SGG-002')} className={cn("text-xs", selectedCompany === 'SGG-002' && "bg-primary text-primary-foreground")}>
                    SOCAR Gas Export (SGG-002)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedCompany('SGG-003')} className={cn("text-xs", selectedCompany === 'SGG-003' && "bg-primary text-primary-foreground")}>
                    TelavGas (SGG-003)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Context Selector: Period */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 rounded-full border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold">{selectedPeriod}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="glass-card w-40">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Select Period</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {['2023-09', '2023-10', '2023-11', '2023-12'].map(p => (
                    <DropdownMenuItem key={p} onClick={() => setSelectedPeriod(p)} className={cn("text-xs", selectedPeriod === p && "bg-emerald-500 text-white")}>
                      {p}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Context Selector: Department */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 rounded-full border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-semibold">{selectedDepartment}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="glass-card w-48">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Select Department</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {['All', 'Finance', 'Technical', 'Operations'].map(d => (
                    <DropdownMenuItem key={d} onClick={() => setSelectedDepartment(d)} className={cn("text-xs", selectedDepartment === d && "bg-purple-500 text-white")}>
                      {d} Department
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className={cn(
                "hidden xl:flex items-center gap-2 rounded-full px-3 py-1.5 w-64 lg:w-80 transition-all duration-300 ml-4",
                theme === 'dark'
                  ? "bg-secondary/60 border border-border/60 focus-within:ring-1 focus-within:ring-primary"
                  : "bg-muted/50 border border-border focus-within:ring-1 focus-within:ring-ring"
              )}>
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search analysis, reports, or data..."
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/80"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-muted-foreground hover:text-foreground">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card">
                  <DropdownMenuLabel>{t.language}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLanguage('en')} className={cn(language === 'en' && "bg-primary text-primary-foreground")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('ka')} className={cn(language === 'ka' && "bg-primary text-primary-foreground")}>
                    ქართული
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                    {currency === 'USD' ? <DollarSign className="h-5 w-5" /> : <Coins className="h-5 w-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card">
                  <DropdownMenuLabel>{t.currency}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCurrency('USD')} className={cn(currency === 'USD' && "bg-primary text-primary-foreground")}>
                    USD ($)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('GEL')} className={cn(currency === 'GEL' && "bg-primary text-primary-foreground")}>
                    GEL (₾)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
  );
};
