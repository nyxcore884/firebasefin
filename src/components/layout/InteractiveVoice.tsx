import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, MessageSquare, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppState } from '@/hooks/use-app-state';
import { auth } from '@/lib/firebase';

export default function InteractiveVoice() {
    const { selectedCompany, selectedPeriod, selectedDepartment } = useAppState();
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                processCommand(text);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Recognition Error", event.error);
                setIsListening(false);
                toast.error("Voice recognition failed. Please try again.");
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
            toast.info("Listening for command...");
        }
    };

    const processCommand = async (command: string) => {
        setIsProcessing(true);
        try {
            const user = auth.currentUser;
            const res = await fetch("/api/query", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: command,
                    userId: user?.uid || 'anonymous',
                    action: 'query',
                    context: {
                        company_id: selectedCompany,
                        period: selectedPeriod,
                        department: selectedDepartment
                    }
                })
            });

            const data = await res.json();
            const answer = data.answer || "I couldn't process that request.";

            // Speak the answer
            speak(answer);
        } catch (e) {
            console.error("Voice command processing error", e);
            speak("I'm sorry, I encountered an error connecting to the neural brain.");
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha'));
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="flex items-center gap-2">
            {transcript && (
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-in fade-in slide-in-from-right-4 duration-300">
                    <MessageSquare className="h-3 w-3 text-indigo-400" />
                    <span className="text-[10px] text-indigo-300 italic font-medium truncate max-w-[150px]">"{transcript}"</span>
                </div>
            )}
            <Button
                onClick={toggleListening}
                disabled={isProcessing}
                variant="outline"
                size="icon"
                className={`
                    relative rounded-full h-10 w-10 transition-all duration-500
                    ${isListening
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                        : isProcessing
                            ? 'bg-indigo-500/10 border-indigo-500/30'
                            : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/50'}
                `}
            >
                {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                ) : isListening ? (
                    <Mic className="h-4 w-4" />
                ) : (
                    <MicOff className="h-4 w-4" />
                )}

                {isListening && (
                    <span className="absolute -inset-1 rounded-full border border-rose-500/50 animate-ping" />
                )}
                {isProcessing && (
                    <Volume2 className="absolute -top-1 -right-1 h-3 w-3 text-indigo-400 animate-bounce" />
                )}
            </Button>
        </div>
    );
}
