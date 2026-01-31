import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAppState } from '@/hooks/use-app-state';

interface VoiceInterfaceProps {
    onQuery: (text: string) => void;
    isProcessing?: boolean;
}

export default function VoiceInterface({ onQuery, isProcessing = false }: VoiceInterfaceProps) {
    const { selectedCompany } = useAppState();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const result = event.results[current];
                const text = result[0].transcript;
                setTranscript(text);

                if (result.isFinal) {
                    onQuery(text);
                    setIsListening(false);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                toast.error('Voice recognition failed. Please try again.');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onQuery]);

    const startListening = () => {
        if (!recognitionRef.current) {
            toast.error('Voice recognition not supported in this browser');
            return;
        }

        setTranscript('');
        setIsListening(true);
        recognitionRef.current.start();
        toast.info('Listening... Speak your query.');
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const speakResponse = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha'));
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Voice Input Button */}
            <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={cn(
                    "relative h-10 w-10 rounded-full transition-all duration-300",
                    isListening && "animate-pulse shadow-lg shadow-rose-500/50"
                )}
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
            >
                {isListening ? (
                    <MicOff className="h-5 w-5" />
                ) : (
                    <Mic className="h-5 w-5" />
                )}

                {/* Listening indicator */}
                {isListening && (
                    <span className="absolute -inset-1 rounded-full border-2 border-rose-500 animate-ping opacity-75" />
                )}
            </Button>

            {/* Transcript Display */}
            {(isListening || transcript) && (
                <div className="flex-1 px-4 py-2 rounded-lg bg-muted/20 border border-white/10 animate-in fade-in slide-in-from-left-2">
                    <div className="flex items-center gap-2">
                        {isListening && <Loader2 className="h-4 w-4 animate-spin text-rose-500" />}
                        <span className={cn(
                            "text-sm",
                            isListening ? "text-rose-400" : "text-muted-foreground"
                        )}>
                            {transcript || "Listening..."}
                        </span>
                    </div>
                </div>
            )}

            {/* Speaker Indicator */}
            {isSpeaking && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <Volume2 className="h-4 w-4 text-indigo-400 animate-pulse" />
                    <span className="text-xs text-indigo-400">Speaking...</span>
                </div>
            )}
        </div>
    );
}

// Export the speak function for use in queries
export const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha'));
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    }
};
