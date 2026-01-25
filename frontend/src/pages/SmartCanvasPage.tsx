import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sparkles,
    Upload,
    Loader2,
    Send,
    Code,
    RefreshCw,
    Share2,
    Download,
    Paperclip,
    FileText,
    X,
    Link as LinkIcon,
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import { vertexAI } from '@/lib/firebase';
import { getGenerativeModel } from "firebase/vertexai-preview";
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";

const SYSTEM_PROMPT = `
You are an expert financial UI designer and frontend developer for the CFO Nexus platform.
Your task is to generate a professional, visually rich infographic presentation as a SINGLE HTML5 file.

RULES:
1. OUTPUT FORMAT: Return ONLY the raw HTML code. Do not wrap it in markdown block \`\`\`html. Just the code.
2. STYLING: Use Tailwind CSS via CDN. <script src="https://cdn.tailwindcss.com"></script>
3. ICONS: Use FontAwesome via CDN. <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
4. LAYOUT:
   - The body should work like a slide deck or a long-scrolling infographic.
   - Use <section> tags for each slide/section.
   - Use high-contrast, modern colors. Default to the "Strategic Ledger" palette: bg-slate-50 for main panels, text-slate-900 (Navy/Dark Blue) for readability, and indigo-900 for focal points.
   - Ensure it is responsive and looks "Premium".
5. CONTENT:
   - If the user provides a file context, USE IT. Hallucinate realistic details based on that file's theme.
   - Create charts using simple CSS bars or HTML tables styled nicely. Do NOT use complex JS chart libraries that might fail. Use CSS Flexbox/Grid for layout.
6. IMAGES: Use real unsplash source URLs with office/business keywords.
`;

const SmartCanvasPage = () => {
    // State
    const [prompt, setPrompt] = useState("");
    const [htmlCode, setHtmlCode] = useState<string>("");
    const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [activeFile, setActiveFile] = useState<File | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Refs
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, status]);

    // File Upload Logic
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setActiveFile(file);
            toast.success(`Context added: ${file.name}`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
        onDrop,
        noClick: true, // we bind click manually to the icon
        maxFiles: 1
    });

    const handleGenerate = async () => {
        if (!prompt.trim() && !activeFile) return;

        // Construct User Message
        const userMsg = prompt;
        let displayMsg = prompt;
        if (activeFile && !prompt) displayMsg = `Generate presentation for ${activeFile.name}`;

        setPrompt("");
        setChatHistory(prev => [...prev, { role: 'user', text: displayMsg }]);
        setStatus('generating');

        try {
            const model = getGenerativeModel(vertexAI, {
                model: "gemini-1.5-flash-002",
                systemInstruction: SYSTEM_PROMPT
            });

            // Construct Prompt with Context
            let fullPrompt = userMsg;

            if (activeFile) {
                let fileContent = `(File Name: ${activeFile.name})`;

                // Try to read text content for compatible types
                if (activeFile.type === "text/csv" || activeFile.type === "application/json" || activeFile.name.endsWith(".txt") || activeFile.name.endsWith(".md")) {
                    try {
                        const text = await activeFile.text();
                        fileContent += `\n\nDATA CONTENT:\n${text.substring(0, 10000)}`; // limit chars
                    } catch (e) {
                        console.warn("Failed to read file text", e);
                    }
                } else {
                    fileContent += `\n(Binary file - Content inferred from filename and structure)`;
                }

                fullPrompt += `\n\nCONTEXT FILE: ${fileContent}. \nUse this data to generate the content.`;
            }

            if (htmlCode) {
                fullPrompt = `
         CURRENT CODE:
         ${htmlCode}

         USER REQUEST:
         ${fullPrompt}

         INSTRUCTION:
         Regenerate the FULL HTML code with the requested changes applied.
         `;
            }

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            let text = response.text();

            // Cleanup markdown if AI ignores rule
            text = text.replace(/```html/g, '').replace(/```/g, '');

            const themeAdjustedText = text.includes('Slate-900')
                ? text.replace(/Slate-900/g, 'var(--background)').replace(/Cyan-400/g, 'var(--primary)')
                : text;

            setHtmlCode(themeAdjustedText);
            setChatHistory(prev => [...prev, { role: 'ai', text: "Strategic visualization synthesized." }]);
            setStatus('done');

        } catch (error: any) {
            console.error("Vertex AI Error:", error);
            toast.error(`AI Generation Failed: ${error.message || "Unknown error"}`);
            setChatHistory(prev => [...prev, { role: 'ai', text: `Error: ${error.message}` }]);
            setStatus('idle');
        }
    };

    const copyLink = () => {
        const mockLink = `https://finsight.app/share/p/${Math.random().toString(36).substring(7)}`;
        navigator.clipboard.writeText(mockLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied to clipboard");
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background text-foreground relative">
            {/* Ambient Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] z-0 pointer-events-none mix-blend-overlay" />

            {/* LEFT PANEL: Chat Interface */}
            <div className="w-[400px] flex flex-col border-r border-border/80 bg-background/80 dark:bg-card/60 backdrop-blur-xl h-full z-10 relative silver-reflection" {...getRootProps()}>
                <input {...getInputProps()} />

                {/* Chat History */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {chatHistory.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground flex flex-col items-center justify-center h-full">
                            <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 backdrop-blur-md shadow-2xl animate-pulse">
                                <Sparkles className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2 tracking-tight">Intelligence Canvas</h2>
                            <p className="text-xs font-medium max-w-[260px] leading-relaxed opacity-60">
                                Construct strategic narratives from raw financial data using generative visual logic.
                            </p>

                            {isDragActive && (
                                <div className="mt-8 border border-dashed border-indigo-500/50 rounded-2xl p-6 w-full bg-indigo-500/10 text-indigo-300 animate-in fade-in zoom-in-95">
                                    <Upload className="h-6 w-6 mx-auto mb-2" />
                                    Drop context file here
                                </div>
                            )}
                        </div>
                    )}

                    {chatHistory.map((msg, i) => (
                        <div key={i} className={cn(
                            "p-4 rounded-2xl text-sm max-w-[90%] shadow-lg backdrop-blur-md border animate-in fade-in slide-in-from-bottom-2",
                            msg.role === 'user'
                                ? "ml-auto bg-primary text-primary-foreground rounded-tr-none border-primary/50 shadow-primary/20"
                                : "mr-auto bg-white/50 dark:bg-muted/50 text-foreground border-border/40 dark:border-border rounded-tl-none"
                        )}>
                            {msg.text}
                        </div>
                    ))}

                    {status === 'generating' && (
                        <div className="mr-auto bg-muted/50 border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-4 text-sm shadow-xl backdrop-blur-md animate-in fade-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/40 blur-lg animate-pulse" />
                                <Loader2 className="h-5 w-5 animate-spin text-primary relative z-10" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="font-bold text-primary text-[11px] uppercase tracking-tighter">Constructing Logic...</p>
                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Rendering Canvas...</p>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-primary/10 dark:border-white/5 bg-background/50 dark:bg-black/40 backdrop-blur-2xl space-y-4">
                    {/* File Context Chip */}
                    {activeFile && (
                        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 text-primary">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[200px]">{activeFile.name}</span>
                            </div>
                            <button onClick={() => setActiveFile(null)} className="text-primary/60 hover:text-primary transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-primary/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition duration-500 blur"></div>
                        <div className="relative flex gap-2 items-center bg-background p-2 rounded-xl border border-border focus-within:border-primary/50 transition-all shadow-inner">
                            <button onClick={openFileDialog} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="Upload Context">
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={activeFile ? "Refine the findings..." : "Ask Strategic AI..."}
                                className="border-none shadow-none bg-transparent focus-visible:ring-0 px-2 text-foreground placeholder:text-muted-foreground/40 h-10 text-xs"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <Button size="icon" className="rounded-lg h-9 w-9 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all" onClick={handleGenerate} disabled={status === 'generating'}>
                                {status === 'generating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: The Secure Sandbox (Iframe) */}
            <div className="flex-1 flex flex-col h-full relative z-10 bg-secondary/20 dark:bg-muted/20">

                {/* Transparent Header */}
                <div className="h-16 border-b border-border px-6 flex items-center justify-between backdrop-blur-sm bg-background/40 dark:bg-card/40">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 text-primary">
                            <Code className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Strategic Canvas</h3>
                            <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest leading-none">AI Visualization Engine</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors" onClick={() => setHtmlCode("")}>
                            <RefreshCw className="h-3.5 w-3.5" /> Reset
                        </Button>

                        {/* Share Dialog */}
                        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2 bg-background border-border text-foreground hover:bg-muted transition-all">
                                    <Share2 className="h-3.5 w-3.5" /> Share
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black tracking-tight">External Collaboration</DialogTitle>
                                    <DialogDescription className="text-muted-foreground text-xs uppercase tracking-widest font-bold opacity-60">
                                        Grant strategic access to the generated visualization.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-xl border border-border mt-4">
                                    <div className="grid flex-1 gap-2">
                                        <Input
                                            id="link"
                                            defaultValue="https://finsight.app/share/p/x9j29ks"
                                            readOnly
                                            className="bg-transparent border-none text-[11px] font-mono h-8 text-foreground focus-visible:ring-0"
                                        />
                                    </div>
                                    <Button size="sm" className="px-3 h-8 bg-primary hover:bg-primary/90 text-white rounded-lg" onClick={copyLink}>
                                        {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>
                                <DialogFooter className="sm:justify-start mt-6">
                                    <DialogClose asChild>
                                        <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest">
                                            Close Session
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 border-0 transition-all">
                            <Download className="h-3.5 w-3.5" /> Download Snapshot
                        </Button>
                    </div>
                </div>

                {/* Iframe Area */}
                <div className="flex-1 relative bg-white/50 dark:bg-background/50 m-6 rounded-3xl border border-primary/20 dark:border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-2xl overflow-hidden backdrop-blur-sm group silver-reflection">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    {htmlCode ? (
                        <iframe
                            ref={iframeRef}
                            srcDoc={htmlCode}
                            title="AI Preview"
                            className="w-full h-full border-none bg-white"
                            sandbox="allow-scripts" // Allow JS for interaction
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                            <div className="text-center">
                                <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center animate-pulse">
                                    <Code className="h-10 w-10 text-primary opacity-50" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Secure Rendering Env</p>
                                <p className="text-xs text-muted-foreground/20 mt-1 font-medium italic">Pipeline ready for strategic data streams...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SmartCanvasPage;
