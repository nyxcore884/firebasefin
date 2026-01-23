import { useState, useEffect } from 'react';
import { Command } from 'cmdk'; // The magic library
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, FileText, TrendingUp, AlertTriangle, Search } from 'lucide-react';

export default function GodMode() {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const navigate = useNavigate();

    // Toggle on Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        }
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-2xl"
                    >
                        <Command className="bg-slate-900/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
                            <div className="flex items-center border-b border-white/5 px-4">
                                <Search className="w-5 h-5 text-slate-400 mr-2" />
                                <Command.Input
                                    autoFocus
                                    placeholder="Ask FinAI or navigate..."
                                    className="w-full bg-transparent py-4 text-lg text-white placeholder:text-slate-500 focus:outline-none"
                                    onValueChange={setInputValue}
                                />
                                <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded font-mono">ESC</span>
                            </div>

                            <Command.List className="max-h-[400px] overflow-y-auto p-2">
                                <Command.Empty className="p-4 text-slate-500 text-center text-sm">
                                    Asking Neural Core: <span className="text-indigo-400">"{inputValue}"</span>...
                                </Command.Empty>

                                <Command.Group heading="Navigation" className="text-xs text-slate-500 font-mono uppercase mb-2 px-2 mt-2">
                                    <Item icon={<TrendingUp className="w-4 h-4" />} text="Go to Dashboard" onSelect={() => { setOpen(false); navigate('/'); }} />
                                    <Item icon={<FileText className="w-4 h-4" />} text="Data Hub (Upload)" onSelect={() => { setOpen(false); navigate('/datahub'); }} />
                                    <Item icon={<Calculator className="w-4 h-4" />} text="Prognostics (Forecast)" onSelect={() => { setOpen(false); navigate('/prognostics'); }} />
                                    {/* Matching logic to App.tsx routes */}
                                    <Item icon={<FileText className="w-4 h-4" />} text="Reports" onSelect={() => { setOpen(false); navigate('/reports'); }} />
                                    <Item icon={<Search className="w-4 h-4" />} text="Analysis" onSelect={() => { setOpen(false); navigate('/analysis'); }} />
                                </Command.Group>

                                <Command.Group heading="Instant Intelligence" className="text-xs text-slate-500 font-mono uppercase mb-2 px-2 mt-2">
                                    <Item icon={<AlertTriangle className="text-red-500 w-4 h-4" />} text="Show Critical Risks" onSelect={() => alert('Fetching Risks...')} />
                                    <Item icon={<Calculator className="text-emerald-500 w-4 h-4" />} text="Calculate Burn Rate" onSelect={() => alert('Calculating...')} />
                                </Command.Group>
                            </Command.List>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function Item({ icon, text, onSelect }: any) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-200 text-sm cursor-pointer hover:bg-white/10 hover:text-white aria-selected:bg-white/10 aria-selected:text-white transition-colors"
        >
            {icon}
            <span>{text}</span>
        </Command.Item>
    );
}
