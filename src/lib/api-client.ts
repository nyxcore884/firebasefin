import { toast } from "sonner";
import { auth, db } from "./firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, getDoc, where } from "firebase/firestore";

// =============================================================================
// GCloud Backend API Configuration
// =============================================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://us-central1-studio-9381016045-4d625.cloudfunctions.net';

export const API_ENDPOINTS = {
    // Analytics & Reporting
    DUCKDB_ANALYTICS: `${BASE_URL}/analytics/duckdb`,

    // Data Ingestion & Transformation
    TRANSFORM_RAW_ROWS: `${BASE_URL}/data/transform`,
    MAPPING_UPLOAD: `${BASE_URL}/data/mapping/upload`,
    MAPPING_TEST: `${BASE_URL}/data/mapping/test`,
    INGEST_DATA: `${BASE_URL}/data/ingest`,

    // AI Services
    AI_QUERY_API: `${BASE_URL}/ai/chat`,
    VERTEX_AI_INFERENCE: `${BASE_URL}/ai/inference`,

    // Dashboard & Actions
    DASHBOARD_ACTIONS: `${BASE_URL}/dashboard/actions`,

    // Audit & Governance
    AUDIT_MAPPING_CHANGE: `${BASE_URL}/audit/mapping`,
    WATCHDOG_INGESTION: `${BASE_URL}/audit/watchdog`,

    // Accounting & Ledger
    ACCOUNTING_HANDLER: `${BASE_URL}/financials/accounting`,

    // Financial Truth (Single Source)
    FINANCIAL_TRUTH: `${BASE_URL}/financials/truth`,

    // Prognostics
    PROGNOSIS_ENGINE: `${BASE_URL}/financials/prognosis`,

    // Knowledge Base
    KNOWLEDGE_BASE: `${BASE_URL}/ai/knowledge/search`,
    KNOWLEDGE_INGEST: `${BASE_URL}/ai/knowledge/ingest`,

    // Intelligence Orchestration
    REASONING_ORCHESTRATOR: `${BASE_URL}/ai/reasoning/orchestrator`,
    REASONING_TRAINER: `${BASE_URL}/ai/reasoning/trainer`,

    // Reporting & Board
    GENERATE_REPORT: `${BASE_URL}/reports/generate`,

    // Deterministic Financial Engine
    DETERMINISTIC_ENGINE: `${BASE_URL}/financials/deterministic`,
    BUDGET_ENGINE: `${BASE_URL}/financials/budget`,

    // Unified Data Library
    DATA_QUERY: `${BASE_URL}/data/query`,
} as const;

// ... (existing helpers skipped for brevity)

/**
 * Execute a reasoning orchestration run.
 */
export const runReasoningOrchestrator = async (query: string, context: any): Promise<any> => {
    try {
        return await apiPost(API_ENDPOINTS.REASONING_ORCHESTRATOR, { query, context });
    } catch (e: any) {
        console.error("Reasoning Error:", e);
        throw e;
    }
};

/**
 * Interface with the Reasoning Trainer for learning loop management.
 */
export const manageReasoningProposals = async (action: 'list_proposals' | 'approve_proposal' | 'reject_proposal' | 'simulate_scenario' | 'export_audit', payload: any = {}): Promise<any> => {
    try {
        return await apiPost(API_ENDPOINTS.REASONING_TRAINER, { action, payload });
    } catch (e: any) {
        console.error("Trainer Error:", e);
        throw e;
    }
};

// ... (types and existing helpers skipped for brevity)

/**
 * Search the AI Knowledge Base
 */
export const searchKnowledge = async (query: string, entity: string): Promise<any> => {
    try {
        return await apiPost(API_ENDPOINTS.KNOWLEDGE_BASE, { query, entity });
    } catch (e: any) {
        console.error("Knowledge Search Error:", e);
        return { results: [] };
    }
};

/**
 * Ingest document into Knowledge Base
 */
export const ingestKnowledge = async (payload: { title: string; content: string; entity: string }): Promise<any> => {
    try {
        return await apiPost(API_ENDPOINTS.KNOWLEDGE_INGEST, payload);
    } catch (e: any) {
        console.error("Knowledge Ingest Error:", e);
        return { success: false };
    }
};

/**
 * Generate AI Financial Report
 */
export const generateAIReport = async (entity: string): Promise<any> => {
    try {
        return await apiPost(API_ENDPOINTS.GENERATE_REPORT, {
            entity_id: entity
        });
    } catch (e) {
        console.error("AI Report Gen Error:", e);
        return { success: false };
    }
};

/**
 * Generate Boardroom Slide Deck
 */
export const generateDeck = async (entity: string): Promise<any> => {
    try {
        return await apiPost(API_ENDPOINTS.ACCOUNTING_HANDLER, {
            action: 'slides',
            company_code: entity
        });
    } catch (e) {
        console.error("Deck Gen Error:", e);
        return { success: false };
    }
};

// =============================================================================
// Types
// =============================================================================

export interface FinancialTruthRequest {
    entity: string;
    period: string;
    currency?: string;
    department?: string;
}

export interface FinancialTruthResponse {
    metrics: Record<string, number>;
    breakdown?: Array<{ article: string; actual: number; budget: number }>;
    forecast?: Array<{ name: string; forecast: number; actual: number }>;
    variance?: Record<string, number>;
    anomalies?: any[];
    statutory?: Record<string, number>;
    locked?: boolean;
}

export interface AIQueryRequest {
    query: string;
    context?: {
        entity?: string;
        period?: string;
        module?: string;
        user_id?: string;
    };
}

export interface AIQueryResponse {
    answer: string;
    confidence: number;
    sources?: string[];
    visualization?: any;
}

export interface IngestDataRequest {
    entity: string;
    period: string;
    data_type: 'budget' | 'actual' | 'forecast';
    rows?: any[];
    file_content?: string;
    file_name?: string;
    user_prompt?: string;
}

export interface AccountingTransactionRequest {
    action: 'post' | 'reverse' | 'adjust';
    document_type: string;
    company_code: string;
    fiscal_year: string;
    period: string;
    lines: Array<{
        gl_account: string;
        debit_amount?: number;
        credit_amount?: number;
        cost_center?: string;
        profit_center?: string;
    }>;
    reference?: string;
    description?: string;
}

export interface AnalyticsQueryRequest {
    query: string;
    params?: Record<string, any>;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalized Metric Keys (UI typically expects lowercase/snake_case)
 * Backend (Controller) uses UPPERCASE Semantic Keys.
 */
export const normalizeMetrics = (backendMetrics: any) => {
    if (!backendMetrics) return {};
    const normalized: any = {};
    Object.keys(backendMetrics).forEach(key => {
        normalized[key.toLowerCase()] = backendMetrics[key];
    });
    normalized['net_income'] = normalized['net_income'] || normalized['net_profit'] || 0;
    return normalized;
};

/**
 * Generate a unique trace ID for end-to-end auditability
 */
export const generateTraceId = () => crypto.randomUUID();

/**
 * Helper to wait for Firebase Auth to hydrate
 * Prevents 401/403 errors on immediate page load
 */
const waitForAuth = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        if (user) return resolve(user);

        const unsub = auth.onAuthStateChanged(user => {
            if (user) {
                unsub();
                resolve(user);
            }
        });

        // Safety timeout for anonymous auth
        setTimeout(() => {
            unsub();
            reject(new Error("Financial Nexus: Auth initialization timeout"));
        }, 5000);
    });
};

/**
 * Generic API POST Helper with trace_id propagation
 */
export const apiPost = async <T>(url: string, body: any): Promise<T> => {
    try {
        let user = auth.currentUser;
        if (!user) {
            user = await waitForAuth();
        }

        if (!user) throw new Error("Financial Nexus: Auth hydration failed");

        const token = await user.getIdToken();
        const trace_id = body?.trace_id || generateTraceId();

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Trace-Id': trace_id
            },
            body: JSON.stringify({ ...body, trace_id })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Unknown Error' }));
            throw new Error(error.error || `Request failed with status ${res.status}`);
        }
        return await res.json();
    } catch (e: any) {
        console.error(`API Error at ${url}:`, e);
        throw e;
    }
};

/**
 * Generic API GET Helper
 */
export const apiGet = async <T>(url: string, params?: Record<string, string>): Promise<T> => {
    try {
        const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
        const res = await fetch(url + queryString, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`);
        }
        return await res.json();
    } catch (e) {
        console.error(`API Error at ${url}:`, e);
        throw e;
    }
};

// =============================================================================
// Financial Truth API
// =============================================================================

/**
 * Fetch Financial Truth Object (Single Source of Financial Data)
 */
export const fetchFinancialTruth = async (
    companyId: string,
    period: string,
    currency: string = 'GEL',
    department: string = 'All'
): Promise<FinancialTruthResponse | null> => {
    try {
        const truth = await apiPost<FinancialTruthResponse>(API_ENDPOINTS.FINANCIAL_TRUTH, {
            entity: companyId,
            period: period,
            currency: currency,
            department: department
        });

        // Normalize keys for frontend component compatibility
        if (truth) {
            const normalized = { ...truth };
            normalized.metrics = normalizeMetrics(truth.metrics);
            if (truth.variance) {
                const tv = truth.variance;
                const normVar: any = {};
                Object.keys(tv).forEach(k => {
                    normVar[k.toLowerCase()] = (tv as any)[k];
                });
                normalized.variance = normVar;
            }
            return normalized;
        }

        return null;
    } catch (e: any) {
        console.error("Financial Truth Fetch Error:", e);
        if (e.message?.includes('409') || e.message?.includes('conflict')) {
            toast.error('Data not locked. Please lock in Governance.');
        }
        return null;
    }
};

// =============================================================================
// AI Query API
// =============================================================================

/**
 * Query the AI Financial Assistant
 */
export const queryAI = async (request: AIQueryRequest): Promise<AIQueryResponse | null> => {
    try {
        const response = await apiPost<AIQueryResponse>(API_ENDPOINTS.AI_QUERY_API, request);
        return response;
    } catch (e: any) {
        console.error("AI Query Error:", e);
        toast.error("AI query failed. Please try again.");
        return null;
    }
};

/**
 * Run Vertex AI Inference (for advanced AI operations)
 */
export const runVertexAIInference = async (payload: any): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.VERTEX_AI_INFERENCE, payload);
        return response;
    } catch (e) {
        console.error("Vertex AI Inference Error:", e);
        return null;
    }
};

/**
 * Run Prognosis Engine (Statistical and AI forecasting)
 */
export const runPrognosis = async (payload: any): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.PROGNOSIS_ENGINE, payload);
        return response;
    } catch (e) {
        console.error("Prognosis Engine Error:", e);
        return null;
    }
};

// =============================================================================
// Data Ingestion API
// =============================================================================

export interface IngestResponse {
    success: boolean;
    message: string;
    rows_processed?: number;
    total_value?: number;
    ledger_ids?: string[];
    trace_id?: string;
}

/**
 * Ingest data file into the system
 */
export const ingestData = async (request: IngestDataRequest): Promise<IngestResponse> => {
    try {
        const response = await apiPost<IngestResponse>(API_ENDPOINTS.INGEST_DATA, request);
        if (response.success) {
            toast.success(response.message || "Data ingested successfully");
        }
        return response;
    } catch (e: any) {
        console.error("Ingest Data Error:", e);
        toast.error("Data ingestion failed.");
        return { success: false, message: "Ingestion failed" };
    }
};

/**
 * Upload field mapping configuration
 */
export const uploadMapping = async (mappingConfig: any): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.MAPPING_UPLOAD, mappingConfig);
        toast.success("Mapping uploaded successfully");
        return response;
    } catch (e) {
        return null;
    }
};

/**
 * Fetch list of uploaded files from Dataset Registry
 */
export const fetchUploadedFiles = async (entity: string): Promise<any[]> => {
    try {
        const q = query(
            collection(db, 'dataset_registry'),
            where('entity', '==', entity),
            orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        console.error("Fetch Uploads Error:", e);
        return [];
    }
};

/**
 * Test a mapping configuration
 */
export const testMapping = async (mappingConfig: any, sampleData: any): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.MAPPING_TEST, { mapping: mappingConfig, sample: sampleData });
        return response;
    } catch (e) {
        console.error("Mapping Test Error:", e);
        return null;
    }
};

/**
 * Transform raw rows using AI mapping
 */
export const transformRawRows = async (rows: any[], mappingId: string): Promise<any[]> => {
    try {
        const response = await apiPost<{ transformed_rows: any[] }>(API_ENDPOINTS.TRANSFORM_RAW_ROWS, {
            rows,
            mapping_id: mappingId
        });
        return response.transformed_rows || [];
    } catch (e) {
        console.error("Transform Raw Rows Error:", e);
        return [];
    }
};

// =============================================================================
// Analytics API (DuckDB)
// =============================================================================

/**
 * Run an analytics query against DuckDB
 */
export const runAnalyticsQuery = async (request: AnalyticsQueryRequest): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.DUCKDB_ANALYTICS, request);
        return response;
    } catch (e) {
        console.error("Analytics Query Error:", e);
        toast.error("Analytics query failed.");
        return null;
    }
};

// =============================================================================
// Dashboard Actions API
// =============================================================================

/**
 * Execute a dashboard action
 */
export const executeDashboardAction = async (action: string, params?: any): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.DASHBOARD_ACTIONS, { action, ...params });
        return response;
    } catch (e) {
        console.error("Dashboard Action Error:", e);
        return null;
    }
};

// =============================================================================
// Accounting Handler API
// =============================================================================

/**
 * Post an accounting transaction to the Universal Ledger
 */
export const postAccountingTransaction = async (
    request: AccountingTransactionRequest
): Promise<{ success: boolean; ledger_id?: string; message?: string }> => {
    try {
        const response = await apiPost<{ success: boolean; ledger_id?: string; message?: string }>(
            API_ENDPOINTS.ACCOUNTING_HANDLER,
            request
        );
        if (response.success) {
            toast.success(`Transaction posted: ${response.ledger_id}`);
        }
        return response;
    } catch (e) {
        console.error("Accounting Transaction Error:", e);
        toast.error("Transaction posting failed.");
        return { success: false, message: "Transaction failed" };
    }
};

/**
 * Get ledger entries
 */
export const getLedgerEntries = async (filters: {
    company_code?: string;
    period?: string;
    gl_account?: string;
    cost_center?: string;
}): Promise<any[]> => {
    try {
        const response = await apiPost<{ entries: any[] }>(API_ENDPOINTS.ACCOUNTING_HANDLER, {
            action: 'get_entries',
            ...filters
        });
        return response.entries || [];
    } catch (e) {
        console.error("Get Ledger Entries Error:", e);
        return [];
    }
};

// =============================================================================
// Audit & Governance API
// =============================================================================

/**
 * Audit a mapping change
 */
export const auditMappingChange = async (changeDetails: any): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.AUDIT_MAPPING_CHANGE, changeDetails);
        return response;
    } catch (e) {
        console.error("Audit Mapping Change Error:", e);
        return null;
    }
};

/**
 * Start watchdog ingestion monitoring
 */
export const startWatchdogIngestion = async (config: any): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.WATCHDOG_INGESTION, config);
        return response;
    } catch (e) {
        console.error("Watchdog Ingestion Start Error:", e);
        return null;
    }
};

// =============================================================================
// ERP Transaction Modules
// =============================================================================

import { LedgerEntry } from "@/types/ledger";

/**
 * Post a General Ledger Journal Entry
 */
export const createJournalEntry = async (entry: Partial<LedgerEntry>): Promise<{ success: boolean; ledger_id?: string; message?: string }> => {
    return postAccountingTransaction({
        action: 'post',
        document_type: 'JE',
        company_code: entry.header?.company_code || '',
        fiscal_year: entry.header?.fiscal_year?.toString() || new Date().getFullYear().toString(),
        period: entry.header?.period?.toString() || (new Date().getMonth() + 1).toString(),
        lines: entry.lines || [],
        description: entry.header?.reference_document
    });
};

/**
 * Post an Accounts Payable Invoice
 */
export const createAPInvoice = async (invoice: any): Promise<{ success: boolean; id?: string }> => {
    // Logic to post to AP sub-ledger and GL
    return postAccountingTransaction({
        action: 'post',
        document_type: 'INV',
        company_code: invoice.company_code,
        fiscal_year: invoice.fiscal_year,
        period: invoice.period,
        lines: invoice.lines, // Should include Vendor liability line
        description: `Vendor Invoice: ${invoice.vendor_id}`
    });
};

/**
 * Post an Accounts Receivable Invoice
 */
export const createARInvoice = async (invoice: any): Promise<{ success: boolean; id?: string }> => {
    return postAccountingTransaction({
        action: 'post',
        document_type: 'BIL',
        company_code: invoice.company_code,
        fiscal_year: invoice.fiscal_year,
        period: invoice.period,
        lines: invoice.lines, // Should include Customer receivable line
        description: `Customer Invoice: ${invoice.customer_id}`
    });
};

/**
 * Execute Depreciation Run
 */
export const runAssetDepreciation = async (companyId: string, period: string): Promise<any> => {
    try {
        const response = await apiPost(API_ENDPOINTS.ACCOUNTING_HANDLER, {
            action: 'run_depreciation',
            company_code: companyId,
            period: period
        });
        return response;
    } catch (e) {
        console.error("Depreciation Run Error:", e);
        return { success: false };
    }
};

// =============================================================================
// Deterministic Financial Engine API
// =============================================================================

export interface DeterministicEngineResponse<T> {
    success: boolean;
    entity_id: string;
    period: string;
    data?: T;
    error?: string;
    status?: string;
}

/**
 * Fetch metrics from the Deterministic Financial Engine
 */
export const fetchDeterministicMetrics = async (entityId: string, period: string): Promise<any> => {
    try {
        const response = await apiPost<DeterministicEngineResponse<any>>(API_ENDPOINTS.DETERMINISTIC_ENGINE, {
            action: 'metrics',
            entity_id: entityId,
            period: period
        });
        return response.success ? response.data : null;
    } catch (e) {
        console.error("Deterministic Metrics Error:", e);
        return null;
    }
};

/**
 * Fetch P&L statement from the Deterministic Financial Engine
 */
export const fetchDeterministicPL = async (entityId: string, period: string): Promise<any> => {
    try {
        const response = await apiPost<DeterministicEngineResponse<any>>(API_ENDPOINTS.DETERMINISTIC_ENGINE, {
            action: 'pl',
            entity_id: entityId,
            period: period
        });
        return response.success ? response.data : null;
    } catch (e) {
        console.error("Deterministic PL Error:", e);
        return null;
    }
};

/**
 * Fetch Balance Sheet from the Deterministic Financial Engine
 */
export const fetchDeterministicBS = async (entityId: string, period: string): Promise<any> => {
    try {
        const response = await apiPost<DeterministicEngineResponse<any>>(API_ENDPOINTS.DETERMINISTIC_ENGINE, {
            action: 'bs',
            entity_id: entityId,
            period: period
        });
        return response.success ? response.data : null;
    } catch (e) {
        console.error("Deterministic BS Error:", e);
        return null;
    }
};

/**
 * Fetch Cash Flow from the Deterministic Financial Engine
 */
export const fetchDeterministicCF = async (entityId: string, period: string): Promise<any> => {
    try {
        const response = await apiPost<DeterministicEngineResponse<any>>(API_ENDPOINTS.DETERMINISTIC_ENGINE, {
            action: 'cf',
            entity_id: entityId,
            period: period
        });
        return response.success ? response.data : null;
    } catch (e) {
        console.error("Deterministic CF Error:", e);
        return null;
    }
};

/**
 * Run invariant checks in the Deterministic Financial Engine
 */
export const runInvariants = async (entityId: string, period: string): Promise<any> => {
    try {
        const response = await apiPost<DeterministicEngineResponse<any>>(API_ENDPOINTS.DETERMINISTIC_ENGINE, {
            action: 'invariants',
            entity_id: entityId,
            period: period
        });
        return response;
    } catch (e) {
        console.error("Invariant Check Error:", e);
        return { success: false, error: "API Failure" };
    }
};

// =============================================================================
// Master Data Management API
// =============================================================================

export const MDM_COLLECTIONS = {
    COA: 'chart_of_accounts',
    PARTNERS: 'partners_registry',
    ORG: 'org_structure',
    TAX_FX: 'tax_fx_policy'
};

/**
 * Generic Save for Master Data
 */
export const saveMasterRecord = async (collectionName: string, id: string, data: any) => {
    try {
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, {
            ...data,
            updated_at: new Date().toISOString()
        }, { merge: true });
        toast.success(`Record saved to ${collectionName}`);
        return true;
    } catch (e) {
        console.error("MDM Save Error:", e);
        toast.error("Failed to save master record.");
        return false;
    }
};

/**
 * Generic Delete for Master Data
 */
export const deleteMasterRecord = async (collectionName: string, id: string) => {
    try {
        await deleteDoc(doc(db, collectionName, id));
        toast.success("Record deleted.");
        return true;
    } catch (e) {
        console.error("MDM Delete Error:", e);
        toast.error("Failed to delete record.");
        return false;
    }
};

/**
 * Fetch All Master Data for a collection
 */
export const fetchMasterData = async (collectionName: string) => {
    try {
        const q = query(collection(db, collectionName));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("MDM Fetch Error:", e);
        return [];
    }
};
// =============================================================================
// Entity Analysis & Subsidiary Management
// =============================================================================

export interface EntityPerformance {
    id: string;
    name: string;
    revenue: number;
    expenses: number;
    cash_flow: number;
    risk_score: number;
    ai_forecast: number;
    anomalies: number;
    status: 'Healthy' | 'Risk' | 'Critical';
}

/**
 * Fetch Aggregated Performance for All Entities
 */
export const fetchEntityPerformance = async (): Promise<EntityPerformance[]> => {
    // In production, this would call an aggregation endpoint: apiPost(API_ENDPOINTS.ENTITY_PERFORMANCE, ...)
    return [
        { id: 'SGG-001', name: 'SOCAR Georgia Gas', revenue: 0, expenses: 0, cash_flow: 0, risk_score: 0, ai_forecast: 0, anomalies: 0, status: 'Healthy' },
        { id: 'SGG-002', name: 'SOCAR Gas Export', revenue: 0, expenses: 0, cash_flow: 0, risk_score: 0, ai_forecast: 0, anomalies: 0, status: 'Healthy' },
        { id: 'SGG-003', name: 'TelavGas', revenue: 0, expenses: 0, cash_flow: 0, risk_score: 0, ai_forecast: 0, anomalies: 0, status: 'Healthy' },
        { id: 'SGG-004', name: 'Socar Logistics', revenue: 0, expenses: 0, cash_flow: 0, risk_score: 0, ai_forecast: 0, anomalies: 0, status: 'Healthy' }
    ];
};

export interface AIRecommendation {
    entityId: string;
    type: 'Risk' | 'Opportunity' | 'Efficiency';
    severity: 'High' | 'Medium' | 'Low';
    description: string;
    action: string;
}

/**
 * Fetch AI Recommendations for Entities
 */
export const fetchAIRecommendations = async (): Promise<AIRecommendation[]> => {
    // Simulated AI Engine Output
    return [
        { entityId: 'SGG-003', type: 'Risk', severity: 'High', description: 'Liquidity ratio below threshold.', action: 'Requires verification' },
        { entityId: 'SGG-002', type: 'Efficiency', severity: 'Medium', description: 'Logistics variance detected.', action: 'Audit required' },
        { entityId: 'SGG-001', type: 'Opportunity', severity: 'Low', description: 'Cash position analysis pending.', action: 'Optimize' }
    ];
};

/**
 * Upload Entity Data
 */
export const uploadEntityData = async (file: File): Promise<{ success: boolean, message: string }> => {
    // Simulate upload
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, message: "Entities Imported: 4 New, 2 Updated" }), 1500));
};
// =============================================================================
// Simulation & Scenario Engine
// =============================================================================

export interface SimulationParams {
    inflation_rate: number;
    revenue_growth: number;
    opex_reduction: number;
    fx_rate: number;
    investment_amount: number;
}

export interface SimulationResult {
    entity_id: string;
    baseline_revenue: number[];
    simulated_revenue: number[];
    baseline_net_income: number[];
    simulated_net_income: number[];
    risk_variance: number;
    confidence_score: number;
    recommendations: string[];
}

/**
 * Run AI Simulation
 */
export const runSimulation = async (params: SimulationParams): Promise<SimulationResult[]> => {
    // Mock AI Simulation Engine (Removed)
    await new Promise(r => setTimeout(r, 800));
    return [];
};
// =============================================================================
// Risk & Compliance API
// =============================================================================

export interface RiskMatrixItem {
    id: string;
    entity: string;
    category: 'Liquidity' | 'Operational' | 'Market' | 'Credit';
    score: number; // 0-100
    exposure: number;
    trend: 'up' | 'down' | 'stable';
}

export interface CompliancePolicy {
    id: string;
    name: string;
    status: 'Pass' | 'Fail' | 'Warning';
    last_checked: string;
    violations: number;
    description: string;
}

/**
 * Fetch Risk Heatmap Data
 */
export const fetchRiskMatrix = async (): Promise<RiskMatrixItem[]> => {
    // Simulated Risk Engine Output
    await new Promise(r => setTimeout(r, 600));
    return [
        { id: '1', entity: 'SGG-001', category: 'Liquidity', score: 0, exposure: 0, trend: 'stable' },
        { id: '2', entity: 'SGG-001', category: 'Operational', score: 0, exposure: 0, trend: 'stable' },
        { id: '3', entity: 'SGG-002', category: 'Market', score: 0, exposure: 0, trend: 'stable' },
        { id: '4', entity: 'SGG-002', category: 'Liquidity', score: 0, exposure: 0, trend: 'stable' },
        { id: '5', entity: 'SGG-003', category: 'Credit', score: 0, exposure: 0, trend: 'stable' },
        { id: '6', entity: 'SGG-003', category: 'Operational', score: 0, exposure: 0, trend: 'stable' }
    ];
};

/**
 * Fetch Compliance Policies
 */
export const fetchCompliancePolicies = async (): Promise<CompliancePolicy[]> => {
    // Simulated Policy Engine Output
    await new Promise(r => setTimeout(r, 600));
    return [
        { id: 'POL-01', name: 'IFRS-9 Provisioning', status: 'Warning', last_checked: new Date().toISOString(), violations: 0, description: 'Compliance check pending.' },
        { id: 'POL-02', name: 'AML/KYC Thresholds', status: 'Warning', last_checked: new Date().toISOString(), violations: 0, description: 'Audit required.' },
        { id: 'POL-03', name: 'Inter-company Reconcilation', status: 'Warning', last_checked: new Date().toISOString(), violations: 0, description: 'Monthly mismatch check.' },
        { id: 'POL-04', name: 'Tax FX Rate Usage', status: 'Warning', last_checked: new Date().toISOString(), violations: 0, description: 'NGB rate usage verification.' }
    ];
};

/**
 * Upload Validation/Policy Document
 */
export const uploadPolicyDocument = async (file: File): Promise<{ success: boolean, message: string }> => {
    // Simulate upload
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, message: "Policy Updated: Rules Engine Refreshed" }), 1500));
};

/**
 * Export Compliance Report
 */
export const exportComplianceReport = async (): Promise<{ success: boolean, message: string }> => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, message: "Report Generated: Risk_Compliance_Q3.pdf" }), 1000));
};

// =============================================================================
// Transaction Ledger & Audit API
// =============================================================================

export interface TransactionRecord {
    id: string;
    date: string;
    entity: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    risk_score: number; // 0-100
    ai_status: 'Cleared' | 'Flagged' | 'Review';
    ai_reasoning?: string;
    predicted_impact?: string;
}

/**
 * Fetch Transactions with AI Scoring
 */
export const fetchTransactions = async (entity?: string, startDate?: string, endDate?: string): Promise<TransactionRecord[]> => {
    // Simulated Backend Query
    await new Promise(r => setTimeout(r, 700));

    // Mock Data Generator (Retained for type reference but returning empty)
    return [];
};

/**
 * Upload Transaction File
 */
export const uploadTransactions = async (file: File): Promise<{ success: boolean; message: string; count: number }> => {
    // Simulate ingestion
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "File Processed Successfully", count: 142 }), 2000));
};

/**
 * Process Bulk Action on Transactions
 */
export const processBulkAction = async (ids: string[], action: 'approve' | 'flag' | 'reclassify'): Promise<boolean> => {
    // Simulate processing
    await new Promise(r => setTimeout(r, 1000));
    toast.success(`${action.toUpperCase()} action applied to ${ids.length} transactions.`);
    return true;
};

// =============================================================================
// AI Learning & Training API
// =============================================================================

export interface TrainingProposal {
    id: string;
    description: string;
    impact_simulation: {
        accuracy_gain: number;
        risk_reduction: number;
    };
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
}

export const fetchTrainingProposals = async (): Promise<TrainingProposal[]> => {
    await new Promise(r => setTimeout(r, 800));
    return [
        { id: 'TUNE-2023-11-A', description: 'Anomaly detection sensitivity adjustment', impact_simulation: { accuracy_gain: 0, risk_reduction: 0 }, status: 'Pending', created_at: 'Pending' },
    ];
};

export const trainModelVersion = async (file: File): Promise<{ success: boolean; version: string }> => {
    await new Promise(r => setTimeout(r, 2500));
    return { success: true, version: 'v2.4.0-beta' };
};

export const fetchModelMetrics = async (): Promise<{ accuracy: any[], risk: any[] }> => {
    await new Promise(r => setTimeout(r, 600));
    return {
        accuracy: [],
        risk: []
    };
};
// =============================================================================
// Board & Executive Reporting API
// =============================================================================

export interface BoardBriefing {
    narrative: string;
    kpis: {
        revenue_yoy: number;
        ebitda_margin: number;
        risk_exposure: number;
        headcount_variance: number;
    };
    scenarios: Array<{
        name: string;
        impact: 'High' | 'Medium' | 'Low';
        probability: number;
        outcome_revenue: number;
    }>;
    audit_log_id: string;
}

export const fetchBoardBriefing = async (): Promise<BoardBriefing> => {
    await new Promise(r => setTimeout(r, 1200));
    return {
        narrative: "No report narration available.",
        kpis: {
            revenue_yoy: 0,
            ebitda_margin: 0,
            risk_exposure: 0,
            headcount_variance: 0
        },
        scenarios: [],
        audit_log_id: 'N/A'
    };
};
// =============================================================================
// Regulatory & Market Intelligence API
// =============================================================================

export interface RegulatoryItem {
    id: string;
    title: string;
    category: 'Tax Code' | 'Labor Law' | 'Environmental' | 'Energy Policy';
    date: string;
    severity: 'High' | 'Medium' | 'Low';
    impacted_entities: string[];
    summary: string;
}

export interface MarketIndex {
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
}

export const fetchRegulatoryFeed = async (): Promise<RegulatoryItem[]> => {
    await new Promise(r => setTimeout(r, 900));
    return [
        { id: 'LAW-2023-84', title: 'Energy Excise Policy', category: 'Tax Code', date: 'Pending', severity: 'Medium', impacted_entities: ['SGG-002'], summary: 'Framework analysis.' },
    ];
};

export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
    await new Promise(r => setTimeout(r, 600));
    return [
        { symbol: 'USD/GEL', name: 'USD to GEL', price: 0, change: 0, change_percent: 0 },
        { symbol: 'EUR/GEL', name: 'EUR to GEL', price: 0, change: 0, change_percent: 0 }
    ];
};

export const uploadRegulationDoc = async (file: File): Promise<{ success: boolean; impacts: number }> => {
    await new Promise(r => setTimeout(r, 2000));
    return { success: true, impacts: 3 };
};

// =============================================================================
// Data Library API
// =============================================================================

export interface DataLibraryItem {
    id: string;
    name: string;
    layer: 'Raw' | 'Transformed' | 'Reference' | 'Feature';
    entity: string;
    records: number;
    size: string;
    last_updated: string;
    owner: string;
    tags: string[];
}

export const fetchDataCatalog = async (): Promise<DataLibraryItem[]> => {
    await new Promise(r => setTimeout(r, 800));
    return [
        { id: 'RAW-001', name: 'subsidiary_transactions.csv', layer: 'Raw', entity: 'SGG-001', records: 0, size: '0 MB', last_updated: 'Pending', owner: 'ERP Sync', tags: ['financials'] },
    ];
};

export const uploadDataset = async (file: File, layer: string, entity: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1500));
    return true;
};

// =============================================================================
// Budget Workflow & State Actions
// =============================================================================

/**
 * Perform a secure state transition on a budget.
 */
export const performBudgetAction = async (
    budgetId: string,
    currentState: string,
    targetState: string,
    role: string = 'user'
): Promise<{ success: boolean; new_state?: string; error?: string }> => {
    try {
        const response = await apiPost<{ success: boolean; data?: { new_state: string }; error?: string }>(
            API_ENDPOINTS.DETERMINISTIC_ENGINE,
            {
                action: 'budget_action',
                budget_id: budgetId,
                current_state: currentState,
                target_state: targetState,
                user_role: role
            }
        );
        if (response.success && response.data) {
            toast.success(`Budget moved to ${response.data.new_state}`);
            return { success: true, new_state: response.data.new_state };
        }
        return { success: false, error: response.error };
    } catch (e: any) {
        console.error("Budget Action Error:", e);
        const msg = e.message || "Action unauthorized or illegal transition.";
        toast.error(msg);
        return { success: false, error: msg };
    }
};

export interface FeatureGroup {
    id: string;
    name: string;
    description: string;
    features_count: number;
    freshness: 'Real-time' | 'Daily' | 'Weekly';
    last_updated: string;
    sample_features: Array<{ name: string; type: string; value: string }>;
}

export const fetchFeatureStore = async (): Promise<FeatureGroup[]> => {
    await new Promise(r => setTimeout(r, 700));
    return [
        {
            id: 'FG-01',
            name: 'Financial Ratios',
            description: 'Baseline KPIs for trend detection.',
            features_count: 0,
            freshness: 'Daily',
            last_updated: 'Pending',
            sample_features: [
                { name: 'current_ratio', type: 'float', value: '0.00' }
            ]
        }
    ];
};

export const triggerFeatureCalc = async (groupId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 2000));
    return true;
};

// =============================================================================
// AI Orchestrator API
// =============================================================================

export interface PipelineStatus {
    id: string;
    name: string;
    stage: 'Data Ingestion' | 'Feature Extraction' | 'Model Training' | 'Inference' | 'Complete';
    status: 'Running' | 'Idle' | 'Failed' | 'Success';
    progress: number;
    drift_score: number;
    last_run: string;
    logs: string[];
}

export const fetchOrchestratorStatus = async (): Promise<PipelineStatus[]> => {
    await new Promise(r => setTimeout(r, 900));
    return [
        {
            id: 'PIPE-01',
            name: 'Cash Flow Prediction',
            stage: 'Inference',
            status: 'Idle',
            progress: 0,
            drift_score: 0.0,
            last_run: 'Pending',
            logs: []
        }
    ];
};

export const triggerPipeline = async (id: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1500));
    return true;
};
