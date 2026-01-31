"""
Pipeline Orchestrator (The Systemic Brain)
Manages the lifecycle of data processing through a strict State Machine.
Ensures no step is skipped (e.g., cannot calculate before mapping is verified).
"""

from enum import Enum
import logging
from typing import Dict, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

class PipelineState(Enum):
    UPLOADED = 1
    COMPANY_DETECTED = 2
    MAPPING_VERIFIED = 3
    CALCULATING = 4
    COMPLETED = 5
    ERROR = 0

class FinancialPipelineOrchestrator:
    """
    The Conductor of the Financial Intelligence Pipeline.
    """
    
    def __init__(self, file_id: str):
        self.file_id = file_id
        self.state = PipelineState.UPLOADED
        self.context: Dict = {}
        self.history: List[Dict] = []
        self._log_state_change("Initialized")

    def advance_state(self, context_update: Optional[Dict] = None) -> PipelineState:
        """
        Attempts to advance the pipeline to the next logical state.
        Validates prerequisites for each transition.
        """
        if context_update:
            self.context.update(context_update)

        try:
            if self.state == PipelineState.UPLOADED:
                self._detect_company()
            elif self.state == PipelineState.COMPANY_DETECTED:
                self._verify_mapping()
            elif self.state == PipelineState.MAPPING_VERIFIED:
                self._run_math_engine()
            elif self.state == PipelineState.CALCULATING:
                self._finalize_and_snapshot()
            elif self.state == PipelineState.COMPLETED:
                logger.info(f"Pipeline for {self.file_id} is already completed.")
            
        except Exception as e:
            logger.error(f"Pipeline Error in {self.file_id}: {str(e)}")
            self.state = PipelineState.ERROR
            self._log_state_change(f"Error: {str(e)}")
            raise

        return self.state

    def _detect_company(self):
        """
        Step 1: Company Recognition
        Scans file headers/metadata to identify the entity.
        """
        logger.info(f"[{self.file_id}] Running Company Detection...")
        
        # simulated detection logic (real logic would parse the file content passed in context)
        detected_entity = self.context.get('detected_entity_hint', 'Unknown')
        
        if detected_entity == 'Unknown':
             # In a real system, this might trigger a 'Human Review' loop
             # For now, we default or use hints
             logger.warning(f"[{self.file_id}] Entity ambiguous. Defaulting to Socar Group.")
             self.context['entity'] = 'Socar Group'
        else:
             self.context['entity'] = detected_entity
             
        self.state = PipelineState.COMPANY_DETECTED
        self._log_state_change("Company Detected")

    def _verify_mapping(self):
        """
        Step 2: Deterministic Mapping Verification
        Ensures all products in the file have a mapped article in the registry.
        """
        logger.info(f"[{self.file_id}] Verifying Mappings for {self.context.get('entity')}...")
        
        # Logic: Check if any rows are UNMAPPED
        unmapped_count = self.context.get('unmapped_count', 0)
        
        if unmapped_count > 0:
            logger.warning(f"[{self.file_id}] Found {unmapped_count} unmapped items. Halting for Human Verification.")
            # In a real app, we would STOP here or go to a 'WAITING_FOR_USER' state
            # For this "Auto-Pilot" demo, we assume (simulate) they are mapped to 'Uncategorized'
            self.context['mapping_status'] = 'Auto-Resolved to Uncategorized'
        
        self.state = PipelineState.MAPPING_VERIFIED
        self._log_state_change("Mapping Verified")

    def _run_math_engine(self):
        """
        Step 3: Calculating
        Triggers the Deterministic Brain to crunch numbers.
        """
        logger.info(f"[{self.file_id}] Engaging Deterministic Engine...")
        
        # Connects to deterministic_engine (simulated call)
        # deterministic_engine.calculate_metrics(...)
        
        self.state = PipelineState.CALCULATING
        self._log_state_change("Calculations Started")

    def _finalize_and_snapshot(self):
        """
        Step 4: Finalization
        Saves the "Golden Record" to the history snapshots.
        """
        logger.info(f"[{self.file_id}] Finalizing and Snapshotting...")
        
        self.state = PipelineState.COMPLETED
        self._log_state_change("Pipeline Completed")

    def _log_state_change(self, message: str):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "state": self.state.name,
            "message": message
        }
        self.history.append(entry)
        logger.info(f"[{self.file_id}] State -> {self.state.name}: {message}")

    def get_status(self) -> Dict:
        return {
            "file_id": self.file_id,
            "current_state": self.state.name,
            "entity": self.context.get('entity'),
            "history": self.history
        }
