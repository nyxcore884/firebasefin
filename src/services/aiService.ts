import { aiProxyService, ChatRequest as ProxyRequest, ChatResponse as ProxyResponse } from './aiProxyService';
import { ReasoningStep } from '@/types/ai';

export interface ChatRequest {
    question: string;
    org_id: string;
    context?: Record<string, any>;
}

export interface ChatResponse {
    answer: string;
    confidence: number;
    sources: string[];
    suggested_followups: string[];
    reasoning_path?: string[];
    explanations?: string[];
}

export interface AIQueryResponse {
    success: boolean;
    answer: string;
    visualizations: any[];
    confidence: number;
    query_id: string;
    reasoning_path?: string[];
    explanations?: string[];
    error?: string;
}

export const aiService = {
    /**
     * Sends a natural language query to the AI Assistant.
     * Roots through the proxy to enable future backend integration.
     */
    chat: async (request: ChatRequest): Promise<ChatResponse> => {
        try {
            // Forward to proxy
            const response = await aiProxyService.queryLLM({
                question: request.question,
                org_id: request.org_id,
                context: request.context
            });

            return {
                answer: response.answer,
                confidence: response.confidence,
                sources: response.sources,
                suggested_followups: response.suggested_followups,
                reasoning_path: response.reasoning_path,
                explanations: response.explanations
            };
        } catch (error) {
            console.error("[AI Service] Proxy Error:", error);
            // Fallback for UI continuity
            return {
                answer: "I apologize, but I'm having trouble connecting to the financial intelligence engine right now. Please try again in a moment.",
                confidence: 0,
                sources: ["System Error"],
                suggested_followups: ["Try again"]
            };
        }
    },

    /**
     * Uploads a file for context analysis (Future Phase)
     */
    uploadContextFile: async (file: File): Promise<string> => {
        // Placeholder for file analysis
        return "file_id_placeholder";
    },

    /**
     * Retrieves proactive AI insights.
     */
    getInsights: async (org_id: string): Promise<Insight[]> => {
        // Mock Data for Phase 34/5.1
        return [
            {
                id: 'c1',
                title: 'Intercompany Mismatch',
                severity: 'critical',
                category: 'anomaly',
                description: 'Detected ₾12,400 discrepancy between SGG Corp Revenue and Imereti COGS for gas transfers.',
                impact: 'Inaccurate Consolidated Totals',
                action: 'Reconcile IC Balances'
            },
            {
                id: '1',
                title: 'Unusual Expense Spike',
                severity: 'critical',
                category: 'anomaly',
                description: 'Marketing expenses in Q1 are 45% higher than the 3-month average.',
                impact: '-$12,500 to Net Income',
                action: 'Audit Vendor Invoices'
            },
            {
                id: '2',
                title: 'Cash Flow Opportunity',
                severity: 'info',
                category: 'opportunity',
                description: 'Consolidating USD accounts could reduce FX fees by approx. $1.2k/month.',
                impact: '+$14,400 Annual Savings',
                action: 'View Recommendation'
            }
        ];
    },

    /**
     * Universal AI Assistant - Context-aware query
     */
    query: async (query: string, context: Record<string, any>): Promise<AIQueryResponse> => {
        try {
            const { api } = await import('./api');
            const response = await api.post('/api/v1/ai/query', {
                query,
                context
            });
            return response;
        } catch (error) {
            console.error('AI query failed:', error);
            throw error;
        }
    },

    /**
     * Centralized Intelligence Pipeline (Triple Brain)
     */
    queryIntelligence: async (query: string, context: Record<string, any>): Promise<any> => {
        try {
            const { api } = await import('./api');
            const response = await api.post('/api/v1/ai/query', {
                query,
                context
            });
            return response;
        } catch (error) {
            console.error('Intelligence query failed:', error);
            throw error;
        }
    },

    /**
     * Universal AI Assistant - Query with files
     */
    queryWithFiles: async (
        query: string,
        context: Record<string, any>,
        files: File[]
    ): Promise<AIQueryResponse> => {
        try {
            const { api } = await import('./api');
            const formData = new FormData();
            formData.append('query', query);
            formData.append('context', JSON.stringify(context || {}));

            files.forEach((file) => {
                formData.append('files', file);
            });

            const response = await api.post(
                '/api/v1/ai/query-with-files',
                formData
            );


            return response;
        } catch (error) {
            console.error('AI query with files failed:', error);
            throw error;
        }
    },

    /**
     * Submit user feedback on AI response
     */
    submitFeedback: async (
        queryId: string,
        orgId: string,
        query: string,
        rating: number,
        correction?: string
    ): Promise<void> => {
        try {
            const { api } = await import('./api');
            await api.post('/api/v1/ai/feedback', {
                query_id: queryId,
                org_id: orgId,
                query: query,
                rating,
                correction
            });
        } catch (error) {
            console.error('Feedback submission failed:', error);
            throw error;
        }
    },

    /**
     * Initializes the Intelligence Mission (Brain 3)
     */
    initMission: async (file: File, orgId: string, query: string): Promise<{ runId: string }> => {
        try {
            const { api } = await import('./api');
            const formData = new FormData();
            formData.append('files', file);
            formData.append('query', query || "Analyze this financial dataset");
            formData.append('org_id', orgId);

            const response = await api.post('/api/v1/ai/mission/start', formData);
            return { runId: response.run_id };
        } catch (error) {
            console.error("Mission Init Error:", error);
            throw error;
        }
    },

    getMissionStatus: async (runId: string): Promise<any> => {
        try {
            const { api } = await import('./api');
            const response = await api.get(`/api/v1/ai/mission/${runId}/status`);
            return response;
        } catch (error) {
            console.error("Mission Status Poll Error:", error);
            return { stage: 'ERROR', status: 'FAILED' };
        }
    },

    exportReport: async (format: 'pdf' | 'ppt' | 'report', org_id: string, messages: any[]): Promise<{ success: boolean; url?: string }> => {
        try {
            const { api } = await import('./api');
            const response = await api.post('/api/v1/ai/export', {
                format,
                org_id,
                payload: messages
            });
            // Fetch returns the object directly, not wrapped in .data like Axios
            return {
                success: true,
                url: response.url || response.export_url || response.data?.url
            };
        } catch (error) {
            console.error('AI Export failed:', error);
            return { success: false };
        }
    }
};

export interface Insight {
    id: string;
    title: string;
    severity: 'critical' | 'warning' | 'info';
    category: 'anomaly' | 'trend' | 'opportunity' | 'risk';
    description: string;
    impact?: string;
    action?: string;
}
