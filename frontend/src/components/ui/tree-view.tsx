import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeViewProps {
    children: React.ReactNode;
    className?: string;
}

export function TreeView({ children, className }: TreeViewProps) {
    return <div className={cn("p-4 border border-border/50 rounded-lg bg-muted/10 mb-4", className)}>{children}</div>;
}

interface TreeItemProps {
    nodeId: string;
    label: string;
    children?: React.ReactNode;
    isOpen?: boolean;
}

export function TreeItem({ nodeId, label, children, isOpen: defaultOpen = true }: TreeItemProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const hasChildren = React.Children.count(children) > 0;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="ml-2">
            <div
                className={cn(
                    "flex items-center py-1.5 px-2 rounded-md hover:bg-accent/50 cursor-pointer select-none transition-colors",
                    !hasChildren && "cursor-default"
                )}
                onClick={handleToggle}
            >
                {hasChildren ? (
                    <div className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground mr-1">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                ) : (
                    <div className="w-6" />
                )}

                {hasChildren ? (
                    <Folder className={cn("h-4 w-4 mr-2", isOpen ? "text-blue-500" : "text-blue-400")} />
                ) : (
                    <File className="h-4 w-4 mr-2 text-slate-500" />
                )}

                <span className="text-sm font-medium">{label}</span>
            </div>

            {isOpen && children && (
                <div className="border-l border-border/40 ml-4 pl-1 animate-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
