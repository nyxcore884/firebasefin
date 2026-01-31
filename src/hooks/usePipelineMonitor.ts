
import { useState, useEffect } from 'react';
import { api } from '../services/api';

/**
 * Interface representing a stage in the intelligence pipeline.
 */
export interface PipelineStage {
    step_name: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    started_at: string;
    human_readable_explanation: string;
    engine_name: string;
}

/**
 * Hook to monitor the systemic state machine in real-time.
 * Connects Brain 3 (Orchestrator) to the UI.
 * 
 * @param runId - The unique ID of the pipeline run to monitor
 * @returns { currentStage, error }
 */
export const usePipelineMonitor = (runId: string | null) => {
    const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!runId) {
            setCurrentStage(null);
            return;
        }

        const fetchStatus = async () => {
            try {
                // Point to the refactored modular route in /api/v1/ai
                const data = await api.get(`/api/v1/ai/pipeline/${runId}`);

                if (data.success) {
                    setCurrentStage({
                        step_name: data.step_name,
                        status: data.status,
                        started_at: data.started_at,
                        human_readable_explanation: data.human_readable_explanation,
                        engine_name: data.engine_name
                    });
                }
            } catch (err) {
                // Silent fail for pulse effect, log only
                console.warn("Neural link to Pipeline Orchestrator interrupted:", err);
                setError("Neural link to Pipeline Orchestrator severed.");
            }
        };

        // Initial fetch
        fetchStatus();

        // High-frequency polling for smooth UI pulse (Glass Box effect)
        const interval = setInterval(fetchStatus, 1500);

        return () => clearInterval(interval);
    }, [runId]);

    return { currentStage, error };
};
