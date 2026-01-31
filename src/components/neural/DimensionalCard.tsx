import React from 'react';
import { cn } from '@/lib/utils';

interface DimensionalCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    glowColor?: 'teal' | 'violet' | 'magenta';
    pulse?: boolean;
}

export const DimensionalCard: React.FC<DimensionalCardProps> = ({
    children,
    className,
    glowColor = 'teal',
    pulse = false,
    ...props
}) => {
    const glowStyles = {
        teal: 'border-cyan-500/20 shadow-[0_0_20px_rgba(0,212,255,0.1)] hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]',
        violet: 'border-violet-500/20 shadow-[0_0_20px_rgba(124,58,237,0.1)] hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]',
        magenta: 'border-magenta-500/20 shadow-[0_0_20px_rgba(255,0,212,0.1)] hover:shadow-[0_0_30px_rgba(255,0,212,0.2)]',
    };

    return (
        <div
            className={cn(
                "relative rounded-[2.5rem] bg-gradient-to-br from-[#0a0f1d] to-[#05070a] border border-white/5 backdrop-blur-3xl overflow-hidden transition-all duration-500 group",
                glowStyles[glowColor],
                pulse && "animate-border-pulse",
                className
            )}
            {...props}
        >
            {/* Inner Glow Layer */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* Top Beam Decoration */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent group-hover:via-cyan-400/50 transition-all duration-700" />

            <div className="relative z-10 p-6">
                {children}
            </div>
        </div>
    );
};
