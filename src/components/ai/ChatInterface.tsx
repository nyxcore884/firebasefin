import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    confidence?: number;
    sources?: string[];
}

export const ChatInterface: React.FC<{ orgId: string }> = ({ orgId }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Mock chat function (Placeholder)
    const chat = async (payload: any) => {
        return new Promise<{ answer: string, confidence: number, sources: string[] }>((resolve) => {
            setTimeout(() => resolve({
                answer: "This is a simulated AI response based on Gemini logic.",
                confidence: 0.95,
                sources: ["Financial Record #123"]
            }), 1000);
        });
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMessage: Message = { role: 'user', content: message };
        setMessages(prev => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await chat({
                orgId,
                question: message,
                context: {}
            });

            const aiMessage: Message = {
                role: 'assistant',
                content: response.answer,
                confidence: response.confidence,
                sources: response.sources
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl h-[600px] flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <Bot className="w-12 h-12 mb-3" />
                        <p className="text-sm font-mono uppercase tracking-widest">AI Interface Ready</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 rounded-tr-none'
                                : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
                            }`}>
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                {msg.role === 'assistant' ? <Bot size={12} /> : <User size={12} />}
                                <span className="text-[10px] uppercase font-bold tracking-widest">
                                    {msg.role === 'assistant' ? 'FinSight AI' : 'You'}
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            {msg.confidence && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                                    <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400" style={{ width: `${msg.confidence * 100}%` }}></div>
                                    </div>
                                    <span className="text-[9px] font-mono text-emerald-400">
                                        {(msg.confidence * 100).toFixed(0)}% CONFIDENCE
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 rounded-2xl rounded-tl-none p-4 border border-white/5 flex items-center gap-3">
                            <Bot size={16} className="text-cyan-400 animate-pulse" />
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="relative">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your financial data..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !message.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
