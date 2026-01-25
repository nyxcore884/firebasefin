# Product + Engineering Blueprint (Canonical Source)

## Executive Summary
The repository implements a modern pipeline: frontend SPA (Vite + React) that talks to Firebase services (Firestore, Storage, Functions) and Cloud/Vertex components. The system separates ingestion → normalized mapping → accounting engine via Pub/Sub. The frontend exposes Storage listing, mapping UI, and a Financial Insights Dashboard. Gaps remain in storage visibility, per-company partitioning, COA management, and end-to-end AI training/governance.

## 1. Repository Map

### Frontend
- `frontend/src/lib/firebase.ts`: Firebase config and service exports.
- `frontend/src/components/data-hub/StorageManager.tsx`: GCS Storage listing and ingestion triggers.
- `frontend/src/components/data-hub/MappingMatrix.tsx`: Mapping rules editor UI.
- `frontend/src/components/data-hub/MappingUpload.tsx`: CSV mapping upload utility.
- `frontend/src/components/data-hub/FinancialInsightsDashboard.tsx`: Metrics visualization and drill-down.
- `frontend/src/pages/DataHub.tsx`: Data Hub landing page.

### Backend Functions
- `functions/8-data-ingestion`: Standard ingestion and raw row creation.
- `functions/2-transformation`: Normalized mapping engine via shared schemas.
- `functions/6-accounting-engine`: Ledger entry generation.
- `functions/7-mapping-ingestion`: Mapping set management.
- `functions/9-ai-query`: Vertex/Gemini integration for financial queries.
- `shared/schema_loader.py`: Schema management and mapping indexing.

## 2. Data & Storage Model

### Current State
- Storage listing is flat under `ingestion/`.
- Data model supports `company_id` and `department` but UI partitioning is implicit.

### Recommended Layout
- `gs://PROJECT-financial-uploads/{company_id}/{source_profile}/{YYYY}/{file_name}`
- Primary metadata records in `file_processing_logs` for speed and filtering.

## 3. Financial Hierarchy & COA
- **Requirement**: Implement a dedicated Chart of Accounts (COA) editor.
- **Goal**: Enable authoritative master maintenance for accounts, legal entities, and department hierarchies.
- **Integration**: Link mapping targets directly to COA account IDs via dropdowns.

## 4. AI Governance & Vertex Integration

### Gaps
- Missing UI for dataset snapshots and labeling.
- No frontend training/tuning orchestration.
- Lack of model registry and promotion (active/shadow) workflows.

### Proposed Architecture
- **Dataset Registry**: Query builder for `normalized_rows` to create training snapshots.
- **Training Orchestration**: `POST /api/ml/train` to trigger Vertex AI jobs.
- **MLTuningPage**: Monitoring logs and metrics for AutoML/Custom jobs.
- **Model Registry**: Governance-controlled promotion (Approved → Production).

## 5. Implementation Roadmap

### Phase 1: Data Hub & Storage Controls (Current Priority)
- [ ] Implement Storage Explorer with company/department prefix browsing.
- [ ] Add upload modal for company/period/profile metadata.
- [ ] Sync `file_processing_logs` metadata on upload.
- [ ] Enforce storage path conventions.

### Phase 2: ERP Foundation
- [ ] Build Chart of Accounts (COA) tree editor.
- [ ] Integrate COA with Mapping Matrix selectors.
- [ ] Update Accounting Engine to use canonical IDs.

### Phase 3: AI Governance Pipeline
- [ ] Implement `ml-training` function (Vertex AI wrapper).
- [ ] Build `MLTuningPage` for dataset/model management.
- [ ] Establish model registry and feedback loop (thumbs up/down).

### Phase 4: System Hardening
- [ ] Approval workflows for mappings and model promotion.
- [ ] Dead Letter Queues (DLQs) and ingestion monitoring.
