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
  Presentation,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAppState, translations } from '@/hooks/use-app-state';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { language, selectedCompany, selectedPeriod } = useAppState();
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), content: input, role: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    const currentInput = input;
    setInput('');

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentInput,
          entity: selectedCompany,
          period: selectedPeriod
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.answer || "I'm sorry, I couldn't process that.",
        role: 'assistant',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get a response from the AI.');
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
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center animate-pulse"><BrainCircuit className="h-5 w-5" /></div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">FinSight AI</h3>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /><span className="text-[10px] opacity-80 uppercase font-bold">Online</span></div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleExpand}>{isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleOpen}><X className="h-4 w-4" /></Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full pt-12 text-center space-y-4 opacity-60">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles className="h-8 w-8 text-primary" /></div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Hello! I'm your FinSight Assistant.</p>
                    <p className="text-xs">Ask me to analyze data or prepare reports.</p>
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "")}>
                  <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border", m.role === 'user' ? "bg-primary border-primary" : "bg-muted border-border")}>
                    {m.role === 'user' ? <User className="h-4 w-4 text-primary-foreground" /> : <Bot className="h-4 w-4 text-primary" />}
                  </div>
                  <div className={cn("max-w-[80%] px-3 py-2 rounded-2xl text-sm", m.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/50 border border-border/50 rounded-tl-none")}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 bg-muted/10 border-t border-border/50">
            <div className="relative">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message FinSight AI..." className="pr-12 h-12 rounded-xl" />
              <Button type="submit" size="icon" className="absolute right-2 top-2 h-8 w-8" disabled={isLoading || !input.trim()}>
                {isLoading ? <Activity className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Button onClick={toggleOpen} size="icon" className={cn("h-14 w-14 rounded-2xl shadow-2xl transition-all", isOpen ? "bg-destructive rotate-90" : "bg-primary hover:scale-110")}>
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  );
};
