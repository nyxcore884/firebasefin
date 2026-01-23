import { useState } from 'react';
import { Play, Pause, Radio } from 'lucide-react';

export default function AudioBriefing() {
    const [playing, setPlaying] = useState(false);

    const speak = async () => {
        if (playing) {
            window.speechSynthesis.cancel();
            setPlaying(false);
            return;
        }

        setPlaying(true);
        try {
            // 1. Fetch text from AI Reporting Engine
            // using mock data summary for demo context, in real app pass the actual metrics from context
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    format: 'text',
                    data_summary: {
                        revenue: "₾ 2.3M",
                        burn_rate: "₾ 45k",
                        trend: "Revenue up 5%, Expenses up 12% (Anomaly)"
                    }
                })
            });
            const data = await res.json();
            const text = data.report_text || "System could not generate a briefing.";

            // 2. Speak
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha'));
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onend = () => setPlaying(false);
            utterance.onerror = () => setPlaying(false);

            window.speechSynthesis.speak(utterance);

        } catch (e) {
            console.error("Audio Briefing Error", e);
            setPlaying(false);
        }
    };

    return (
        <button
            onClick={speak}
            className={`
        flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-500 relative
        ${playing
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 w-48 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-white w-12 hover:w-44 group overflow-hidden'}
      `}
        >
            <div className="relative shrink-0 z-10">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing && (
                    <span className="absolute -inset-2 rounded-full border border-indigo-500 animate-ping opacity-75"></span>
                )}
            </div>

            <span className={`whitespace-nowrap text-sm font-medium ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300 ml-1`}>
                {playing ? "Playing Briefing..." : "Listen to Briefing"}
            </span>

            {playing && <Radio className="h-4 w-4 ml-auto animate-pulse text-indigo-400 absolute right-4" />}
        </button>
    );
}
