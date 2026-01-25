import { Node, Edge } from '@xyflow/react';

export interface BackendBinding {
    fn: string;                // Python function or Cloud Function entry point
    args: Record<string, any>; // parameters to call with
}

export interface SchemaField {
    field: string;
    type: string;
    description?: string;
}

export interface BlockPreviewData {
    summary?: string;
    count?: number;
    sampleRows?: Record<string, any>[];
    lastRunAt?: string;
    error?: string;
}

// --- SYSTEM STUDIO DATA TYPES (FinSight v2.1) ---

export interface DataNodeData extends Record<string, unknown> {
    kind: 'data';
    label: string;
    subType: 'storage' | 'firestore' | 'bigquery';
    path: string; // e.g. "ingestion/blobs" or "financial_transactions"
    recordCount?: number;
    lastWriteAt?: string;
    status: 'active' | 'idle' | 'error';
    preview?: BlockPreviewData;
}

export interface TruthEngineNodeData extends Record<string, unknown> {
    kind: 'truthEngine';
    label: string;
    functionId: string; // e.g. "process_transaction"
    batchTime?: string;
    throughput?: number; // items/min
    logicHash?: string; // for verification
    status: 'running' | 'idle' | 'degraded' | 'error';
    preview?: BlockPreviewData;
}

export interface SystemZoneNodeData extends Record<string, unknown> {
    kind: 'systemZone';
    label: string;
    zoneColor: 'emerald' | 'blue' | 'purple' | 'amber';
}

export interface AiIntentNodeData extends Record<string, unknown> {
    kind: 'aiIntent';
    label: string; // e.g. "Detected: Financial Analysis"
    confidence: number;
    status: 'active' | 'idle';
}

export interface AiToolExecutionNodeData extends Record<string, unknown> {
    kind: 'aiToolExecution';
    label: string; // e.g. "Calling: get_burn_rate()"
    toolName: string;
    status: 'running' | 'success' | 'error';
    duration?: string;
}

export interface AiModelNodeData extends Record<string, unknown> {
    kind: 'aiModel';
    label: string; // e.g. "Gemini 1.5 Pro"
    model: string;
    tokenUsage: number;
    status: 'streaming' | 'complete' | 'idle';
}

// --- EDGE TYPES ---
export interface FlowEdgeData extends Record<string, unknown> {
    kind: 'data' | 'control' | 'ai' | 'alert';
    condition?: string;
    description?: string;
    active?: boolean;
    type?: string;
}

// --- LEGACY/FINANCIAL DATA TYPES (Restored for compat) ---
export interface DataBlockData extends Record<string, unknown> {
    kind: 'data';
    label: string;
    collection: string;
    enabled: boolean;
    outputSchema?: SchemaField[];
    preview?: BlockPreviewData;
}
export interface TransformBlockData extends Record<string, unknown> {
    kind: 'transform';
    label: string;
    operation: 'filter' | 'group_by' | 'aggregate' | 'join' | 'fx_convert' | 'outlier_remove' | 'custom';
    config: Record<string, any>;
    inputSchema?: SchemaField[];
    outputSchema?: SchemaField[];
    preview?: BlockPreviewData & { beforeSample?: any[], afterSample?: any[] };
}
export interface MetricBlockData extends Record<string, unknown> {
    kind: 'metric';
    key: string;
    label: string;
    formula: string;
    currentValue?: number;
    trend?: 'up' | 'down' | 'flat';
    inputSchema?: SchemaField[];
    outputSchema?: SchemaField[];
    preview?: BlockPreviewData;
}
export interface ModelBlockData extends Record<string, unknown> {
    kind: 'model';
    toolName: string;
    label: string;
    enabled: boolean;
    params: Record<string, any>;
    explanation?: string;
    inputSchema?: SchemaField[];
    outputSchema?: SchemaField[];
    preview?: BlockPreviewData;
}
export interface OutputBlockData extends Record<string, unknown> {
    kind: 'output';
    label: string;
    target: 'executive_alert' | 'dashboard' | 'ai_knowledge_base' | 'governance_log';
    inputSchema?: SchemaField[];
    preview?: BlockPreviewData;
}
export interface TableNodeData extends Record<string, unknown> {
    kind: 'table';
    label: string;
    schema: { field: string; type: string; description?: string }[];
    owner?: string;
    qualityNotes?: string;
}
export interface AiToolNodeData extends Omit<ModelBlockData, 'kind'> {
    kind: 'aiToolNode';
    intents: string[];
    errorRate?: number;
    lastUsedAt?: string;
}
export interface GeoIngestionNodeData extends Record<string, unknown> {
    kind: 'geoIngestion';
    label: string;
    format: 'geojson' | 'shapefile' | 'kml';
    crs: string;
    featureCount?: number;
    preview?: BlockPreviewData;
}
export interface SpatialProcessNodeData extends Record<string, unknown> {
    kind: 'spatialProcess';
    label: string;
    operation: 'buffer' | 'intersect' | 'union' | 'difference' | 'spatial_join';
    parameters: Record<string, any>;
    preview?: BlockPreviewData;
}
export interface MapVizNodeData extends Record<string, unknown> {
    kind: 'mapViz';
    label: string;
    layers: string[];
    center: [number, number];
    zoom: number;
    preview?: BlockPreviewData;
}

// --- SYSTEM STUDIO TYPES ---
export interface GovernanceNodeData extends Record<string, unknown> {
    kind: 'governance';
    label: string;
    type: 'dashboard' | 'alert' | 'audit_log';
    targetId: string; // e.g. "cfo_dashboard"
    alertCount?: number;
    lastAuditAt?: string;
    preview?: BlockPreviewData;
}
export interface WorkflowNodeData extends Record<string, unknown> {
    kind: 'workflow';
    label: string;
    status: 'idle' | 'running' | 'success' | 'error' | 'disabled' | 'failed';
    conditions?: string[];
    lastRunResult?: string;
}

export type FinSightNodeData =
    | DataNodeData
    | TruthEngineNodeData
    | AiIntentNodeData
    | AiToolExecutionNodeData
    | AiModelNodeData
    | SystemZoneNodeData
    | GovernanceNodeData
    | WorkflowNodeData
    | DataBlockData
    | TransformBlockData
    | MetricBlockData
    | ModelBlockData
    | OutputBlockData
    | TableNodeData
    | AiToolNodeData
    | GeoIngestionNodeData
    | SpatialProcessNodeData
    | MapVizNodeData;

export type FinSightNode = Node<FinSightNodeData>;
export type FinSightEdge = Edge<FlowEdgeData | Record<string, unknown>>;
