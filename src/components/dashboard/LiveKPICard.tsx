import React, { useEffect, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { cn } from '@/lib/utils';

interface LiveKPICardProps {
    title: string;
    value: number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
    format?: 'currency' | 'percentage' | 'number';
    icon?: string;
    severity?: 'info' | 'warning' | 'critical';
    onClick?: () => void;
    className?: string;
}

export const LiveKPICard: React.FC<LiveKPICardProps> = ({
    title,
    value,
    change,
    trend,
    format = 'currency',
    icon,
    severity,
    onClick,
    className
}) => {
    const [prevValue, setPrevValue] = useState(value);
    const [isFlashing, setIsFlashing] = useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);

    // Mouse movement tracker for gradient
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        cardRef.current.style.setProperty('--mouse-x', `${x}%`);
        cardRef.current.style.setProperty('--mouse-y', `${y}%`);
    };

    // Animated value
    const animatedValue = useSpring({
        number: value,
        from: { number: prevValue },
        config: { duration: 1000 }
    });

    // Flash effect on value change
    useEffect(() => {
        if (value !== prevValue) {
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 500);
            setPrevValue(value);
        }
    }, [value, prevValue]);

    const formatValue = (val: number) => {
        switch (format) {
            case 'currency':
                return `₾${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
            case 'percentage':
                return `${val.toFixed(1)}%`;
            default:
                return val.toLocaleString();
        }
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className={cn(
                "nyx-card group cursor-default h-full",
                className,
                onClick && "cursor-pointer active:scale-95"
            )}
            onClick={onClick}
        >
            <div className="p-6 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                        <div className={`p-3 rounded-2xl w-fit backdrop-blur-md bg-white/10 ${change !== undefined && change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {icon && <span className="text-2xl filter drop-shadow-md">{icon}</span>}
                        </div>
                    </div>
                    {change !== undefined && (
                        <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-md border",
                            change >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        )}>
                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </div>
                    )}
                </div>

                <div className="mt-auto">
                    <div className="font-display font-black text-white tracking-tighter leading-none mb-1 text-4xl overflow-hidden text-ellipsis">
                        <animated.span className={cn("transition-colors duration-300", isFlashing ? "text-primary shadow-primary" : "text-white")}>
                            {animatedValue.number.to(n => formatValue(n))}
                        </animated.span>
                    </div>

                    <div className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] font-display">
                        {title}
                    </div>
                </div>

                {/* Decorative Bottom Bar */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
                    <div
                        className={cn(
                            "h-full transition-all duration-500",
                            change !== undefined && change >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
                            "shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        )}
                        style={{ width: `${Math.min(Math.abs(change || 0) * 5, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
