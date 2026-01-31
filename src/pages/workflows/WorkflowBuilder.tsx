import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Plus, Save, Settings, Trash2,
  Database, FileCheck, Mail, Calculator,
  GitBranch, Clock, Info, CheckCircle, RefreshCw, Zap,
  Activity, Workflow, Shield, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkflowNode, workflowService } from '../../services/workflowService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NODE_TYPES = [
  { type: 'trigger', label: 'Schedule Trigger', icon: <Clock size={16} />, color: 'bg-emerald-500' },
  { type: 'action', label: 'Import Data', icon: <Database size={16} />, color: 'bg-blue-500' },
  { type: 'action', label: 'Validate Rules', icon: <FileCheck size={16} />, color: 'bg-indigo-500' },
  { type: 'action', label: 'Run Calculation', icon: <Calculator size={16} />, color: 'bg-violet-500' },
  { type: 'condition', label: 'Conditional Branch', icon: <GitBranch size={16} />, color: 'bg-amber-500' },
  { type: 'action', label: 'Send Email', icon: <Mail size={16} />, color: 'bg-rose-500' }
];

interface WorkflowBuilderProps {
  isEmbedded?: boolean;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ isEmbedded = false }) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, 'idle' | 'running' | 'completed'>>({});
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [logs, setLogs] = useState<{ time: string, msg: string }[]>([]);

  const handleAddNode = (type: any) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type: type.type,
      label: type.label,
      x: 0,
      y: 0,
      config: { color: type.color, icon: type.icon, settings: {} }
    };
    setNodes([...nodes, newNode]);
    setNodeStatuses(prev => ({ ...prev, [newNode.id]: 'idle' }));
  };

  const handleRemoveNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await workflowService.saveWorkflow({
      id: 'new_flow',
      name: 'Untitled Workflow',
      nodes,
      status: 'draft',
      orgId: 'SOCAR_GROUP' // Should be dynamic in full production
    });
    setIsSaving(false);
  };

  const handleTestRun = async () => {
    if (nodes.length === 0) return;
    setIsRunning(true);
    setLogs([]);
    const initialStatuses: any = {};
    nodes.forEach(n => initialStatuses[n.id] = 'idle');
    setNodeStatuses(initialStatuses);

    await workflowService.runWorkflow(
      { id: 'test', name: 'Test', nodes, status: 'draft', orgId: 'SOCAR_GROUP' },
      (nodeId: string, status: string, message: string) => {
        setNodeStatuses(prev => ({ ...prev, [nodeId]: status as any }));
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: message }]);
      }
    );

    setIsRunning(false);
  };

  const updateNodeConfig = (nodeId: string, key: string, value: any) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId
        ? { ...n, config: { ...n.config, settings: { ...n.config?.settings, [key]: value } } }
        : n
    ));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, config: { ...prev.config, settings: { ...prev.config?.settings, [key]: value } } } : null);
    }
  };

  return (
    <div className={cn("p-6 max-w-[1800px] mx-auto animate-in fade-in duration-500 flex gap-6 relative overflow-hidden", isEmbedded ? "h-[600px]" : "h-[calc(100vh-100px)]")}>
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-mesh" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-mesh" style={{ animationDelay: '-5s' }} />

      {/* Sidebar: Toolkit - Hidden when embedded if needed, but here we keep it for functionality */}
      {!isEmbedded && (
        <div className="nyx-card w-72 flex flex-col overflow-hidden bg-black/20 border-white/5">
          <div className="p-6 border-b border-white/10 bg-white/[0.02]">
            <h2 className="text-[10px] font-black flex items-center gap-3 text-white uppercase tracking-[0.3em]">
              <Settings size={18} className="text-primary text-glow" />
              Neural Toolkit
            </h2>
          </div>
          <div className="p-6 space-y-8 overflow-y-auto scrollbar-none">
            <div>
              <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] mb-4 block">Triggers</span>
              <div className="space-y-2">
                {NODE_TYPES.filter(n => n.type === 'trigger').map((node: any, i: number) => (
                  <div key={i} onClick={() => handleAddNode(node)} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex items-center gap-3 transition-all group">
                    <div className={`p-2 rounded-lg bg-white/10 text-white group-hover:bg-primary group-hover:text-white transition-all`}>{node.icon}</div>
                    <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-tight">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] mb-4 block">Action Arrays</span>
              <div className="space-y-2">
                {NODE_TYPES.filter(n => n.type === 'action').map((node: any, i: number) => (
                  <div key={i} onClick={() => handleAddNode(node)} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex items-center gap-3 transition-all group">
                    <div className={`p-2 rounded-lg bg-white/10 text-white group-hover:bg-primary group-hover:text-white transition-all`}>{node.icon}</div>
                    <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-tight">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div className="nyx-card flex-grow flex flex-col relative overflow-hidden bg-black/40 border-white/10">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02] backdrop-blur-xl z-20">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tighter text-glow">Flow Designer</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgb(37,99,235)]" />
              <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">Neural Network active</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleTestRun}
              disabled={isRunning || nodes.length === 0}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl px-5 py-2.5 border border-white/10 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-20"
            >
              {isRunning ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
              {isRunning ? 'Synthesizing...' : 'Simulate Flow'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-3 bg-primary hover:bg-primary/90 shadow-vivid text-white font-black uppercase tracking-widest rounded-xl px-7 py-2.5 transition-all text-[10px] disabled:opacity-50"
            >
              {isSaving ? <Settings className="animate-spin" size={16} /> : <Save size={16} />}
              Save Sequence
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-grow p-10 overflow-auto relative neural-grid flex flex-col lg:flex-row scrollbar-none">
          <div className="flex-grow relative z-10 flex flex-col items-center">
            {nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20">
                <Workflow size={80} className="mb-6 text-primary" />
                <h3 className="text-xl font-black text-white uppercase tracking-[0.4em]">Designer Hub</h3>
                <p className="text-[10px] font-black text-white uppercase tracking-widest mt-2">Inject nodes from toolkit to begin</p>
              </div>
            ) : (
              <div className="space-y-0 w-full max-w-xl pb-20">
                {nodes.map((node: WorkflowNode, index: number) => (
                  <motion.div
                    key={node.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative"
                  >
                    {/* Connector line with flow animation */}
                    {index > 0 && (
                      <div className="h-12 w-1.5 mx-auto relative overflow-hidden bg-white/5">
                        <motion.div
                          animate={{ y: [0, 48] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="absolute top-[-12px] left-0 w-full h-3 bg-primary/40 blur-sm"
                        />
                        {nodeStatuses[node.id] !== 'idle' && (
                          <div className="absolute inset-0 bg-primary shadow-vivid" />
                        )}
                      </div>
                    )}

                    <div
                      onClick={() => setSelectedNode(node)}
                      className={cn(
                        "p-6 rounded-[2rem] backdrop-blur-3xl border transition-all cursor-pointer flex items-center justify-between group/card",
                        selectedNode?.id === node.id
                          ? "bg-primary/10 border-primary shadow-vivid"
                          : "bg-white/[0.03] border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-2xl",
                          nodeStatuses[node.id] === 'running' ? 'bg-primary animate-pulse' : 'bg-white/5'
                        )}>
                          {nodeStatuses[node.id] === 'completed' ? <CheckCircle className="text-emerald-400" size={24} /> : node.config?.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-tighter leading-none mb-1.5">{node.label}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-white/20 text-[8px] font-black uppercase tracking-[0.3em]">{node.type}</span>
                            {nodeStatuses[node.id] === 'running' && (
                              <span className="text-[8px] text-primary font-black uppercase tracking-widest animate-pulse">Processing...</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveNode(node.id); }}
                        className="p-3 text-white/10 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover/card:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                <div className="h-12 w-1.5 bg-white/5 mx-auto" />
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 hover:border-primary/50 hover:text-primary transition-all cursor-pointer hover:scale-110">
                    <Plus size={24} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Context Control */}
          <div className="w-full lg:w-96 flex flex-col gap-6 relative z-20">
            <div className="nyx-card p-8 bg-black/60 border-white/10 backdrop-blur-3xl h-fit">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                <Zap size={18} className="text-glow" /> Node IQ Configuration
              </h3>

              {selectedNode ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Module Label</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-black text-white uppercase focus:border-primary outline-none transition-all tracking-tight"
                      value={selectedNode.label}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, label: newLabel } : n));
                        setSelectedNode({ ...selectedNode, label: newLabel });
                      }}
                    />
                  </div>

                  {selectedNode.type === 'action' && selectedNode.label.includes('Email') && (
                    <div className="space-y-4">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Recipient Channel</label>
                      <input
                        type="email"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-black text-white uppercase focus:border-primary outline-none transition-all"
                        value={selectedNode.config?.settings?.email || ''}
                        onChange={(e) => updateNodeConfig(selectedNode.id, 'email', e.target.value)}
                        placeholder="ORACLE_FEED@SOCAR.GE"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-white/20 uppercase block mb-1">System Internal ID</span>
                    <span className="text-[10px] font-mono text-primary font-bold">{selectedNode.id}</span>
                  </div>

                  <Button variant="ghost" className="w-full text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/5 py-4 rounded-xl border border-rose-500/10">
                    Purge Logic Node
                  </Button>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center">
                  <Info size={40} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest max-w-[120px]">Select a sequence node for array config</p>
                </div>
              )}
            </div>

            <div className="nyx-card p-6 bg-black/40 border-white/5 flex-grow min-h-[300px] flex flex-col">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                <Activity size={18} className="text-glow" /> Live Sequence Logs
              </h3>
              <div className="flex-grow overflow-y-auto space-y-3 font-mono text-[9px] scrollbar-none">
                {logs.length === 0 ? (
                  <p className="text-white/10 italic">Awaiting simulation trigger...</p>
                ) : (
                  logs.map((log: { time: string, msg: string }, i: number) => (
                    <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-white/20 shrink-0">[{log.time}]</span>
                      <span className="text-white/60 uppercase">{log.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
