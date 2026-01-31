import React, { useState } from 'react';
import {
    Link
} from 'react-router-dom';
import {
    Plus,
    Network,
    List,
    Settings,
    ChevronRight,
    Users,
    Globe
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { EntityTree } from '@/components/entities/EntityTree';
import { EntityDetailsForm } from '../../components/entities/EntityDetailsForm';
import { selectEntity, addEntity, Entity } from '@/store/entitySlice';
import { cn } from '@/lib/utils';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface EntityManagerProps {
    isEmbedded?: boolean;
}

export const EntityManager: React.FC<EntityManagerProps> = ({ isEmbedded = false }) => {
    const dispatch = useDispatch();
    const { entities, selectedEntityId } = useSelector((state: RootState) => state.entities);
    const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
    const [isAdding, setIsAdding] = useState(false);

    const selectedEntity = entities.find(e => e.id === selectedEntityId);

    const handleAddEntity = () => {
        setIsAdding(true);
        dispatch(selectEntity(null));
    };

    return (
        <div className={cn("h-full flex flex-col gap-6 animate-in fade-in duration-500", !isEmbedded && "p-8")}>
            {/* Header - Hidden when embedded */}
            {!isEmbedded && (
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <Link to="/settings" className="hover:text-white transition-colors">Settings</Link>
                            <ChevronRight size={14} />
                            <span className="text-white">Entity Management</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Organizational Structure
                        </h1>
                        <p className="text-slate-400">
                            Define entities, ownership levels, and consolidation hierarchies.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white/5 rounded-lg p-1 flex border border-white/5">
                            <button
                                onClick={() => setViewMode('tree')}
                                className={cn("p-2 rounded-md transition-all", viewMode === 'tree' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                            >
                                <Network size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <button
                            onClick={handleAddEntity}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-colors"
                        >
                            <Plus size={18} />
                            Add Entity
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Navigation / Tree Panel */}
                <div className="md:col-span-4 h-full">
                    <div className="glass-card h-full flex flex-col overflow-hidden border border-white/5 rounded-2xl bg-black/20">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white">Group Hierarchy</h3>
                            <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{entities.length} Entities</span>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <EntityTree
                                entities={entities}
                                selectedId={selectedEntityId}
                                onSelect={(id) => {
                                    dispatch(selectEntity(id));
                                    setIsAdding(false);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Details Panel */}
                <div className="md:col-span-8 h-full">
                    <div className="glass-card h-full flex flex-col overflow-hidden border border-white/5 rounded-2xl bg-black/20 backdrop-blur-sm">
                        {selectedEntity || isAdding ? (
                            <div className="p-8 overflow-auto h-full">
                                <div className="mb-6 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {isAdding ? "New Entity" : selectedEntity?.name}
                                        </h2>
                                        {!isAdding && (
                                            <p className="text-sm text-slate-500 font-mono mt-1">
                                                ID: <span className="text-slate-400">{selectedEntity?.id}</span>
                                            </p>
                                        )}
                                    </div>
                                    {!isAdding && selectedEntity?.isConsolidationNode && (
                                        <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
                                            Consolidation Node
                                        </div>
                                    )}
                                </div>

                                <EntityDetailsForm
                                    entity={selectedEntity}
                                    isNew={isAdding}
                                    onSubmit={(data: Partial<Entity>) => {
                                        console.log("Submitting entity:", data);
                                        // Add/Update logic will go here
                                        setIsAdding(false);
                                    }}
                                    onCancel={() => {
                                        setIsAdding(false);
                                        dispatch(selectEntity(entities[0].id));
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                                    <Network size={32} className="text-slate-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-300">Select an entity to view details</h3>
                                <p className="text-slate-500">Or create a new one to join the group.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Summary Panel */}
            <div className="mt-auto pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Globe size={20} />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider block">Legal Entities</span>
                            <span className="text-xl font-bold text-white">{entities.filter(e => e.type === 'legal_entity').length}</span>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Network size={20} />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider block">Consolidation Level</span>
                            <span className="text-xl font-bold text-white">3 Layers</span>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                            <Users size={20} />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider block">Avg. Ownership</span>
                            <span className="text-xl font-bold text-white">92.4%</span>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Settings size={20} />
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Branches</span>
                            <span className="text-xl font-bold text-white">{entities.filter(e => e.type === 'branch').length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
