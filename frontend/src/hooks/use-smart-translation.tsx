import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { useAppState } from './use-app-state';

// Context to share the translation cache and batcher
interface TranslationContextType {
    translate: (text: string) => string;
    register: (text: string) => void;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

// Batch Manager
class Batcher {
    queue: Set<string> = new Set();
    timeout: NodeJS.Timeout | null = null;
    callback: (texts: string[]) => void;

    constructor(callback: (texts: string[]) => void) {
        this.callback = callback;
    }

    add(text: string) {
        this.queue.add(text);
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.flush(), 200); // 200ms debounce
    }

    flush() {
        if (this.queue.size === 0) return;
        const batch = Array.from(this.queue);
        this.queue.clear();
        this.callback(batch);
    }
}

export const SmartTranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { language } = useAppState();
    const [cache, setCache] = useState<Record<string, Record<string, string>>>({});
    const batcherRef = useRef<Batcher | null>(null);

    // Initial Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('ai_translation_cache');
        if (saved) {
            try {
                setCache(JSON.parse(saved));
            } catch (e) {
                console.error("Cache Parse Error", e);
            }
        }
    }, []);

    // Save to LocalStorage on update
    useEffect(() => {
        localStorage.setItem('ai_translation_cache', JSON.stringify(cache));
    }, [cache]);

    // Batch Processor
    useEffect(() => {
        batcherRef.current = new Batcher(async (texts) => {
            if (language === 'en') return; // No translation needed for source

            // Filter out what we already have
            const needed = texts.filter(t => !cache[language]?.[t]);

            if (needed.length === 0) return;

            try {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        texts: needed,
                        target: language,
                        context: "Financial Dashboard UI"
                    })
                });

                if (res.ok) {
                    const translations = await res.json();
                    setCache(prev => ({
                        ...prev,
                        [language]: {
                            ...(prev[language] || {}),
                            ...translations
                        }
                    }));
                }
            } catch (e) {
                console.error("Translation Failed", e);
            }
        });
    }, [language, cache]);

    const register = (text: string) => {
        if (language === 'en') return;
        if (!cache[language]?.[text]) {
            batcherRef.current?.add(text);
        }
    };

    const translate = (text: string) => {
        if (language === 'en') return text;
        return cache[language]?.[text] || text; // Return original while loading
    };

    return (
        <TranslationContext.Provider value={{ translate, register }}>
            {children}
        </TranslationContext.Provider>
    );
};

// Component <T>
export const T: React.FC<{ children: string }> = ({ children }) => {
    const ctx = useContext(TranslationContext);

    useEffect(() => {
        if (children) ctx?.register(children);
    }, [children, ctx]);

    if (!ctx) return <>{children}</>;

    return <>{ctx.translate(children)}</>;
};

// Hook for non-JSX usage
export const useSmartTranslation = () => {
    const ctx = useContext(TranslationContext);
    if (!ctx) throw new Error("useSmartTranslation must be used within SmartTranslationProvider");
    return ctx;
};
