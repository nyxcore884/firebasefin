export interface ReasoningStep {
    id: string;
    step: string;
    description: string;
    status: 'pending' | 'completed' | 'failed' | 'running';
    substeps?: string[];
}

export const AI_TYPES_HEALTH_CHECK = true;
