import React, { useState, useEffect } from 'react';
import { useAppState } from '@/hooks/use-app-state';

interface AITextProps {
    children: string;
    className?: string;
}

export const AIText: React.FC<AITextProps> = ({ children, className }) => {
    const { language, dynamicTranslate } = useAppState();
    const [translatedText, setTranslatedText] = useState(children);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        if (language === 'ka') {
            setIsTranslating(true);
            dynamicTranslate(children).then(text => {
                setTranslatedText(text);
                setIsTranslating(false);
            });
        } else {
            setTranslatedText(children);
        }
    }, [children, language, dynamicTranslate]);

    return (
        <span className={className}>
            {isTranslating ? (
                <span className="opacity-50 animate-pulse">{translatedText}</span>
            ) : (
                translatedText
            )}
        </span>
    );
};
