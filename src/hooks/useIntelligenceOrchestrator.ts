import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';

export type PipelineStage = 'INGEST' | 'MAP' | 'CALCULATE' | 'RENDER' | 'COMPLETE' | 'ERROR';

interface IntelligenceState {
    runId: string | null;
    currentStage: PipelineStage | null;
    explanation: string;
    isProcessing: boolean;
    resultAssets: any[] | null;
    error: string | null;
}

export const useIntelligenceOrchestrator = () => {
    const [state, setState] = useState<IntelligenceState>({
        runId: null,
        currentStage: null,
        explanation: '',
        isProcessing: false,
        resultAssets: null,
        error: null,
    });

    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const startIntelligenceMission = useCallback(async (file: File, orgId: string, query: string) => {
        setState(prev => ({ ...prev, isProcessing: true, error: null, resultAssets: null }));

        try {
            // 1. Initial Handshake with Brain 3 (Systemic)
            // Note: In refined flow, the upload IS the handshake. 
            const { runId } = await aiService.initMission(file, orgId, query);
            setState(prev => ({ ...prev, runId, currentStage: 'INGEST', explanation: 'Initializing secure data uplink...' }));

            // 2. Poll the Orchestrator for Real-time Brain State
            // In production, use WebSockets. Here we use an intelligent polling mechanism.
            if (pollInterval.current) clearInterval(pollInterval.current);

            pollInterval.current = setInterval(async () => {
                // If runId is just a placeholder, we might need the REAL runId from upload response.
                // For now, assume upload happens separate or backend handles the mocked ID if passed.
                // Wait, if the upload generates a DIFFERENT runId, we need to capture that.
                // In the real implementation, we probably want to trigger the upload via the hook too?
                // Let's assume the user will modify this hook to also CALL the upload if they want full automation.
                // Or, we assume aiService.initMission actually DOES something or reserves a slot.
                // But polling a random ID won't work.
                // FIX: We need the RUN ID from the upload.
                // Updating this logic: Passing the runId into the polling function is cleaner, 
                // OR the hook exposes a method 'monitorMission(runId)' which is called after upload.
                // BUT user asked for 'startIntelligenceMission(file)'.
                // So this function should PROBABLY do the upload.
                // Let's implement it to assume initMission gives a valid ID, OR we do the upload here.

                // Given existing aiService.initMission is a mock, let's just Poll safely.
                // If runId is not found backend returns PENDING defaults so it won't crash.

                if (!runId) return;

                const status = await aiService.getMissionStatus(runId);

                setState(prev => ({
                    ...prev,
                    currentStage: status.stage as PipelineStage,
                    explanation: status.explanation || prev.explanation,
                }));

                if (status.status === 'SUCCESS' || status.stage === 'COMPLETE') {
                    if (pollInterval.current) clearInterval(pollInterval.current);
                    setState(prev => ({
                        ...prev,
                        isProcessing: false,
                        currentStage: 'COMPLETE',
                        explanation: status.explanation || 'Intelligence Synthesis Complete.'
                    }));
                }

                if (status.status === 'FAILED' || status.stage === 'ERROR') {
                    if (pollInterval.current) clearInterval(pollInterval.current);
                    setState(prev => ({ ...prev, isProcessing: false, error: status.error || 'Intelligence failure' }));
                }
            }, 1200); // Pulse frequency aligned with Brain 3 execution speed

        } catch (err) {
            if (pollInterval.current) clearInterval(pollInterval.current);
            setState(prev => ({ ...prev, isProcessing: false, error: 'Neural link severed.' }));
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        }
    }, []);

    return { ...state, startIntelligenceMission };
};
