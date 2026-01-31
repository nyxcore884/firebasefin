import { create } from 'zustand';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import { FinSightNodeData, FlowEdgeData } from '@/types/flow';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming there is a firebase config at @/lib/firebase
import { toast } from 'sonner';

type FinSightNode = Node<FinSightNodeData>;
type FinSightEdge = Edge<FlowEdgeData>;

interface FlowState {
    nodes: FinSightNode[];
    edges: FinSightEdge[];
    onNodesChange: OnNodesChange<FinSightNode>;
    onEdgesChange: OnEdgesChange<FinSightEdge>;
    onConnect: OnConnect;
    setNodes: (nodes: FinSightNode[]) => void;
    setEdges: (edges: FinSightEdge[]) => void;

    // Firestore Sync
    companyId: string | null;
    flowId: string | null;
    saveFlow: () => Promise<void>;
    loadFlow: (companyId: string, flowId: string) => () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
    nodes: [],
    edges: [],
    companyId: null,
    flowId: null,

    onNodesChange: (changes: NodeChange<FinSightNode>[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes: EdgeChange<FinSightEdge>[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    setNodes: (nodes: FinSightNode[]) => set({ nodes }),
    setEdges: (edges: FinSightEdge[]) => set({ edges }),

    saveFlow: async () => {
        const { nodes, edges, companyId, flowId } = get();
        if (!companyId || !flowId) return;

        try {
            const flowRef = doc(db, 'controller_flows', companyId, 'flows', flowId);
            await setDoc(flowRef, {
                nodes,
                edges,
                updatedAt: serverTimestamp(),
                version: '1.0',
            }, { merge: true });
            toast.success('Flow saved to Cloud');
        } catch (error) {
            console.error('Error saving flow:', error);
            toast.error('Failed to save flow');
        }
    },

    loadFlow: (companyId: string, flowId: string) => {
        const docRef = doc(db, 'controller_flows', companyId, 'flows', flowId);
        console.log(`[Store] Listening to: controller_flows/${companyId}/flows/${flowId}`);

        return onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                console.log(`[Store] Loaded ${data.nodes?.length} nodes and ${data.edges?.length} edges.`);
                set({
                    nodes: data.nodes || [],
                    edges: data.edges || []
                });
            } else {
                console.warn(`[Store] Document not found: controller_flows/${companyId}/flows/${flowId}`);
                set({ nodes: [], edges: [] });
            }
        }, (error) => {
            console.error("[Store] Snapshot Error:", error);
            toast.error(`Error loading flow: ${error.message}`);
        });
    },
}));
