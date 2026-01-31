import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
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

/**
 * AI Proxy Service
 * Routes natural language queries to the backend LLM engine (Cloud Functions / Vertex AI).
 */
export const aiProxyService = {
    /**
     * Sends a query to the AI Backend endpoint.
     */
    async queryLLM(request: ChatRequest): Promise<ChatResponse> {
        // In a production environment, this would be a real fetch call to a Cloud Function.
        // URL: https://<region>-<project-id>.cloudfunctions.net/aiAssistant

        console.log(`[AI Proxy] Routing query to LLM: "${request.question}"`);

        // Injecting financial context into the request for "grounding"
        const enrichedRequest = {
            ...request,
            system_context: {
                timestamp: new Date().toISOString(),
                platform: "FinSight Enterprise",
                data_confidence: "high (deterministic core)",
                ...request.context
            }
        };

        try {
            // Use relative path - Firebase Hosting will rewrite /api/** to Cloud Run
            // Correct endpoint is /query (not /chat)
            // Use explicit URL in production to bypass potential rewrite/headers issues
            const backendUrl = import.meta.env.PROD
                ? 'https://firebasefin-backend-733431756980.us-central1.run.app/api/v1/ai/query'
                : '/api/v1/ai/query';

            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Company-ID': request.org_id
                },
                body: JSON.stringify({
                    query: enrichedRequest.question, // Backend expects 'query', not 'question'
                    context: enrichedRequest.system_context
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Backend error: ${response.statusText}`);
            }

            return await response.json() as ChatResponse;
        } catch (error: any) {
            console.error("[AI Proxy] Backend communication error:", error);
            // Return a generic error instead of confusing mocks
            return {
                answer: "I am unable to connect to the financial engine at this moment. Please check your connection or try again later.",
                confidence: 0,
                sources: [],
                suggested_followups: []
            };
        }
    },

    /**
     * Helper to return safe fallback if needed (Unused now)
     */
    getMockedBackendResponse(query: string): ChatResponse {
        return {
            answer: "System is offline.",
            confidence: 0,
            sources: [],
            suggested_followups: []
        };
    }
};
