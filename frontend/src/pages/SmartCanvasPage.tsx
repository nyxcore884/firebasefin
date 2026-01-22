import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sparkles,
    Upload,
    Loader2,
    Send,
    Code,
    Maximize2,
    RefreshCw,
    Share2,
    Download,
    Paperclip,
    FileText,
    X,
    Link as LinkIcon,
    Check,
    ChevronRight
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

// --- System Prompt ---
const SYSTEM_PROMPT = `
You are an expert UI designer and frontend developer.
Your task is to generate a professional, visually rich infographic presentation as a SINGLE HTML5 file.

RULES:
1. OUTPUT FORMAT: Return ONLY the raw HTML code. Do not wrap it in markdown block \`\`\`html. Just the code.
2. STYLING: Use Tailwind CSS via CDN. <script src="https://cdn.tailwindcss.com"></script>
3. ICONS: Use FontAwesome via CDN. <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
4. LAYOUT:
   - The body should work like a slide deck or a long-scrolling infographic.
   - Use <section> tags for each slide/section.
   - Use high-contrast, modern colors (Slate-900 for bg, Cyan-400 for accents).
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

            setHtmlCode(text);
            setChatHistory(prev => [...prev, { role: 'ai', text: "Presentation generated successfully." }]);
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
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#0f1117] text-slate-200 relative">
            {/* Ambient Gradient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950/50 to-black z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none mix-blend-overlay" />

            {/* LEFT PANEL: Chat Interface */}
            <div className="w-[450px] flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl h-full z-10 relative" {...getRootProps()}>
                <input {...getInputProps()} />

                {/* Chat History */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {chatHistory.length === 0 && (
                        <div className="text-center p-8 text-white/40 flex flex-col items-center justify-center h-full">
                            <div className="h-20 w-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mb-6 border border-white/5 backdrop-blur-md shadow-2xl animate-pulse">
                                <Sparkles className="h-10 w-10 text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-medium text-white/80 mb-2">Insight Workspace</h2>
                            <p className="text-sm font-light max-w-[260px] leading-relaxed">
                                Upload financial data and let AI craft your strategic narrative in seconds.
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
                                ? "ml-auto bg-indigo-600/80 text-white rounded-tr-sm border-indigo-500/30"
                                : "mr-auto bg-white/5 text-slate-200 border-white/10 rounded-tl-sm"
                        )}>
                            {msg.text}
                        </div>
                    ))}

                    {status === 'generating' && (
                        <div className="mr-auto bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm flex items-center gap-4 text-sm shadow-lg backdrop-blur-md animate-in fade-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 animate-pulse" />
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-400 relative z-10" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="font-medium text-indigo-300">Designing logic...</p>
                                <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Generating HTML5...</p>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-white/5 bg-black/40 backdrop-blur-2xl space-y-4">
                    {/* File Context Chip */}
                    {activeFile && (
                        <div className="flex items-center justify-between bg-indigo-500/20 border border-indigo-500/30 px-3 py-2 rounded-lg text-xs animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 text-indigo-200">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="font-medium truncate max-w-[200px]">{activeFile.name}</span>
                            </div>
                            <button onClick={() => setActiveFile(null)} className="text-indigo-400 hover:text-white transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                        <div className="relative flex gap-2 items-center bg-[#13151b] p-2 rounded-xl border border-white/10 focus-within:border-indigo-500/50 transition-all">
                            <button onClick={openFileDialog} className="p-2 text-white/40 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-all transform hover:scale-105" title="Upload Context">
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={activeFile ? "Refine the findings..." : "Ask Finance AI..."}
                                className="border-none shadow-none bg-transparent focus-visible:ring-0 px-2 text-slate-200 placeholder:text-white/20 h-10"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                            <Button size="icon" className="rounded-lg h-9 w-9 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105" onClick={handleGenerate} disabled={status === 'generating'}>
                                {status === 'generating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: The Secure Sandbox (Iframe) */}
            <div className="flex-1 flex flex-col h-full relative z-10 bg-white/5">

                {/* Transparent Header */}
                <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                            <Code className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white/90">Preview Canvas</h3>
                            <p className="text-[10px] text-white/30 font-mono">LIVE RENDERING</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-9 text-xs gap-2 text-white/40 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setHtmlCode("")}>
                            <RefreshCw className="h-3.5 w-3.5" /> Clear
                        </Button>

                        {/* Share Dialog */}
                        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 text-xs gap-2 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all hover:border-white/20">
                                    <Share2 className="h-3.5 w-3.5" /> Share
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-[#1a1d26] border-white/10 text-slate-200">
                                <DialogHeader>
                                    <DialogTitle>Share Presentation</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Anyone with this link will be able to view this generated presentation.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex items-center space-x-2 bg-black/30 p-1.5 rounded-lg border border-white/5">
                                    <div className="grid flex-1 gap-2">
                                        <label htmlFor="link" className="sr-only">Link</label>
                                        <Input
                                            id="link"
                                            defaultValue="https://finsight.app/share/p/x9j29ks"
                                            readOnly
                                            className="bg-transparent border-none text-xs h-8 text-slate-400 focus-visible:ring-0"
                                        />
                                    </div>
                                    <Button size="sm" className="px-3 h-8 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300" onClick={copyLink}>
                                        {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>
                                <DialogFooter className="sm:justify-start">
                                    <DialogClose asChild>
                                        <Button type="button" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
                                            Close
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button size="sm" className="h-9 text-xs gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
                            <Download className="h-3.5 w-3.5" /> Export PDF
                        </Button>
                    </div>
                </div>

                {/* Iframe Area */}
                <div className="flex-1 relative bg-black/40 m-6 rounded-2xl border border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
                    {htmlCode ? (
                        <iframe
                            ref={iframeRef}
                            srcDoc={htmlCode}
                            title="AI Preview"
                            className="w-full h-full border-none"
                            sandbox="allow-scripts" // Allow JS for interaction
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/20">
                            <div className="text-center">
                                <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-white/5 border border-white/5 flex items-center justify-center animate-pulse">
                                    <Code className="h-10 w-10 opacity-50" />
                                </div>
                                <p className="text-sm font-medium text-white/40">Ready to Render</p>
                                <p className="text-xs text-white/20 mt-1">Waiting for AI generation...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SmartCanvasPage;
