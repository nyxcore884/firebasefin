import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Building2,
    Home,
    MapPin,
    Share2
} from 'lucide-react';
import { Entity } from '@/store/entitySlice';
import { cn } from '@/lib/utils';

interface EntityTreeProps {
    entities: Entity[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

const EntityIcon = ({ type }: { type: Entity['type'] }) => {
    switch (type) {
        case 'holding': return <Home size={16} />;
        case 'legal_entity': return <Building2 size={16} />;
        case 'region': return <MapPin size={16} />;
        case 'branch': return <Share2 size={16} />;
        default: return <Building2 size={16} />;
    }
};

const EntityNode: React.FC<{
    node: Entity;
    entities: Entity[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    depth: number;
}> = ({ node, entities, selectedId, onSelect, depth }) => {
    const [isOpen, setIsOpen] = useState(true);
    const children = entities.filter(e => e.parentId === node.id);
    const isSelected = selectedId === node.id;
    const hasChildren = children.length > 0;

    return (
        <li>
            <div
                className="relative"
                style={{ paddingLeft: `${depth * 16}px` }} // Depth padding is strictly layout, not styling override
            >
                {/* Tree Line */}
                {depth > 0 && (
                    <div
                        className="absolute w-px bg-white/10 left-[calc(100%-8px)] top-0"
                        style={{
                            left: `${(depth * 16) - 8}px`,
                            bottom: hasChildren && isOpen ? '100%' : '50%'
                        }}
                    />
                )}

                <div
                    className={cn(
                        "group flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer select-none mb-1",
                        isSelected ? "bg-indigo-600/20 border border-indigo-500/50 text-indigo-300" : "hover:bg-white/5 border border-transparent text-slate-400"
                    )}
                    onClick={() => onSelect(node.id)}
                >
                    <div className="flex items-center justify-center w-5 h-5 shrink-0">
                        {hasChildren ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(!isOpen);
                                }}
                                className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : (
                            <div className="w-5" />
                        )}
                    </div>

                    <EntityIcon type={node.type} />

                    <div className="flex flex-col">
                        <span className={cn(
                            "text-sm tracking-tight",
                            isSelected ? "font-bold" : "font-medium"
                        )}>
                            {node.name}
                        </span>
                        {node.ownershipPct < 100 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                                {node.ownershipPct}% Ow.
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {hasChildren && isOpen && (
                <ul className="list-none">
                    {children.map(child => (
                        <EntityNode
                            key={child.id}
                            node={child}
                            entities={entities}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

export const FinancialTree: React.FC<EntityTreeProps> = ({ entities, selectedId, onSelect }) => {
    return <EntityTree entities={entities} selectedId={selectedId} onSelect={onSelect} />;
};

export const EntityTree: React.FC<EntityTreeProps> = ({ entities, selectedId, onSelect }) => {
    const rootEntities = entities.filter(e => !e.parentId);

    return (
        <ul className="w-full list-none space-y-1">
            {rootEntities.map(root => (
                <EntityNode
                    key={root.id}
                    node={root}
                    entities={entities}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    depth={0}
                />
            ))}
        </ul>
    );
};
