import { useState, useEffect } from 'react';
import {
    Database, Search, Plus, FileText, BrainCircuit, Layers,
    CheckCircle2, RefreshCw, Clock, AlertCircle, ExternalLink, Info, Activity, Loader2
} from 'lucide-react';
import { AIText } from '@/components/common/AIText';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KnowledgeItem {
    id: string;
    text: string;
    score?: number;
    metadata?: any;
}

export default function KnowledgeBasePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Ingestion State
    const [ingestText, setIngestText] = useState('');
    const [ingestTitle, setIngestTitle] = useState('');
    const [openIngest, setOpenIngest] = useState(false);
    const [ingesting, setIngesting] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm) return;
        setLoading(true);
        try {
            const res = await fetch('/api/knowledge/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchTerm, limit: 10 })
            });
            const data = await res.json();
            setResults(data.results || []);
        } catch (error) {
            toast.error("Vector Search Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleIngest = async () => {
        if (!ingestText || !ingestTitle) return;
        setIngesting(true);
        try {
            const res = await fetch('/api/knowledge/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: ingestText,
                    metadata: { source: ingestTitle, type: 'manual_entry' }
                })
            });
            if (res.ok) {
                toast.success("Knowledge Ingested & Embedded");
                setOpenIngest(false);
                setIngestText('');
                setIngestTitle('');
            } else {
                toast.error("Ingestion Failed");
            }
        } catch (error) {
            toast.error("API Error");
        } finally {
            setIngesting(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-8 p-6 lg:p-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-glow flex items-center gap-3 uppercase italic">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                        <AIText>Vertex AI Knowledge Base</AIText>
                    </h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 mt-1">
                        <Activity className="h-3 w-3" /> <AIText>Live Vector Index & RAG Governance</AIText>
                    </p>
                </div>

                <Dialog open={openIngest} onOpenChange={setOpenIngest}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> Add Knowledge
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ingest New Knowledge</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <Input placeholder="Document Title (e.g., Q3 Policy)" value={ingestTitle} onChange={e => setIngestTitle(e.target.value)} />
                            <Textarea placeholder="Paste content here to embed..." value={ingestText} onChange={e => setIngestText(e.target.value)} className="h-32" />
                            <Button className="w-full" onClick={handleIngest} disabled={ingesting}>
                                {ingesting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                                Embed & Store
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {/* Search Console */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="glass-card rounded-[2rem] border-white/5 p-8 flex flex-col gap-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                className="pl-12 h-14 rounded-2xl bg-background/50 border-white/10 text-lg"
                                placeholder="Query the Neural Index..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <Button className="absolute right-2 top-2 bottom-2 rounded-xl" onClick={handleSearch} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                            </Button>
                        </div>

                        {/* Results */}
                        <div className="grid gap-4">
                            {results.length === 0 && !loading && (
                                <div className="text-center py-12 text-muted-foreground/50 italic">
                                    Vector space ready. Enter a query or add knowledge.
                                </div>
                            )}

                            {results.map((item) => (
                                <div key={item.id} className="p-6 rounded-2xl bg-background/20 border border-white/5 hover:border-primary/30 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-foreground flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            {item.metadata?.source || 'Unknown Source'}
                                        </h4>
                                        <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                                            {((item.score || 0) * 100).toFixed(1)}% Match
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
