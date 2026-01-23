import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Paperclip,
  Download,
  Sparkles,
  BrainCircuit,
  Maximize2,
  Minimize2,
  Presentation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAppState, translations } from '@/hooks/use-app-state';
import { toast } from 'sonner';

// Define the message type
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  ui_component?: string;
  ui_data?: any;
}

// Simple Chart Component Stubs for GenUI
const DynamicBarChart = ({ data }: { data: any }) => (
  <div className="p-2 border rounded bg-white/5 mt-2">
    <p className="text-xs font-bold mb-2 text-center">{data?.title || 'Chart'}</p>
    <div className="flex items-end justify-between h-24 gap-1 px-4">
      {data?.datasets?.[0]?.data?.map((val: number, i: number) => (
        <div key={i} className="flex flex-col items-center gap-1 w-full">
          <div className="w-full bg-blue-500/50 rounded-t" style={{ height: `${Math.min(100, Math.max(10, (val / 5000) * 100))}%` }}></div>
          <span className="text-[9px] text-muted-foreground truncate w-full text-center">{data.labels[i]}</span>
        </div>
      ))}
    </div>
  </div>
);

const CriticalAlertBox = ({ message }: { message: string }) => (
  <div className="p-3 my-2 border border-red-500/50 bg-red-500/10 rounded-md text-red-200 text-xs flex gap-2 items-center">
    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
    {message}
  </div>
);

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useAppState();
  const t = translations[language];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const toggleOpen = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleFileUpload = () => {
    toast.info("Upload feature initialized. Select a file (Excel, CSV, PDF).");
  };

  const handleGeneratePresentation = () => {
    toast.success("Presentation generation started. Analyzing stored data...");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      // Calling the "Brain" function (Architecture Component: 9-ai-query)
      // Uses Firebase Hosting Rewrite
      const response = await fetch(`/api/query?cb=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          userId: 'user-1',
          context: {
            company_id: 'SGG-001',
            period: '2023-11'
          }
        }),
      });

      // Check if response is ok - if not, try to parse error details
      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Query failed:", response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}...`);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error:", e, text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 50)}...`);
      }

      // Check if the response contains an error message
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.answer || "I processed that.",
        role: 'assistant',
        ui_component: data.ui_component,
        ui_data: data.ui_data
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Query Error:', error);
      // Show more helpful error message
      const errorMessage = error?.message || JSON.stringify(error) || "Unknown error occurred";
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: `I'm having trouble retrieving financial records right now. \n\n**Debug Details:**\n\`${errorMessage}\``,
        role: 'assistant',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <Card className={cn(
          "flex flex-col overflow-hidden transition-all duration-300 shadow-2xl glass-card",
          isExpanded ? "w-[600px] h-[700px]" : "w-[380px] h-[500px]"
        )}>
          <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center animate-pulse">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">FinSight AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] opacity-80 uppercase font-bold tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={toggleExpand}>
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={toggleOpen}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-2 border-b border-border/50 bg-muted/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Button variant="outline" size="xs" className="text-[10px] gap-1 shrink-0 rounded-full" onClick={handleFileUpload}>
              <Paperclip className="h-3 w-3" /> {t.upload}
            </Button>
            <Button variant="outline" size="xs" className="text-[10px] gap-1 shrink-0 rounded-full" onClick={handleGeneratePresentation}>
              <Presentation className="h-3 w-3" /> {t.presentation}
            </Button>
            <Button variant="outline" size="xs" className="text-[10px] gap-1 shrink-0 rounded-full" onClick={() => toast.info('Report generation is not yet implemented.')}>
              <Download className="h-3 w-3" /> Report
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full pt-12 text-center space-y-4 opacity-60">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Hello! I&apos;m your FinSight Assistant.</p>
                    <p className="text-xs max-w-[240px]">Ask me to analyze data, prepare reports, or generate presentations.</p>
                  </div>
                </div>
              )}
              {messages.map((m: Message) => (
                <div key={m.id} className={cn(
                  "flex gap-3",
                  m.role === 'user' ? "flex-row-reverse" : ""
                )}>
                  <div className={cn(
                    "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border",
                    m.role === 'user' ? "bg-primary border-primary" : "bg-muted border-border"
                  )}>
                    {m.role === 'user' ? <User className="h-4 w-4 text-primary-foreground" /> : <Bot className="h-4 w-4 text-primary" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                    m.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/50 border border-border/50 rounded-tl-none"
                  )}>
                    {m.content}
                    {m.ui_component === 'bar_chart' && m.ui_data && (
                      <DynamicBarChart data={m.ui_data} />
                    )}
                    {m.ui_component === 'alert' && m.ui_data && (
                      <CriticalAlertBox message={m.ui_data.message} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 bg-muted/10 border-t border-border/50">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message FinSight AI..."
                className="pr-24 h-12 rounded-xl bg-background border-border/50 focus:ring-1 focus:ring-primary transition-all shadow-inner"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 rounded-lg shadow-lg shadow-primary/20"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <Button
        onClick={toggleOpen}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-2xl shadow-2xl transition-all duration-300 group",
          isOpen ? "bg-destructive hover:bg-destructive rotate-90" : "bg-primary hover:bg-primary hover:scale-110"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6 group-hover:animate-bounce" />}
      </Button>
    </div>
  );
};
