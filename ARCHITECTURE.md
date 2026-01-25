# Financial Application Architecture Blueprint

## 1. Overall Conceptual Blueprint

This document outlines a scalable, secure, and robust architecture for the financial analysis application, built on Google Cloud Platform (GCP) and Firebase.

The data flow begins when a user uploads raw financial documents (Excel, CSV) via the React frontend. 

1.  **Ingestion Layer:** Accepts files, fingerprints them (SHA-256), and stores them as **Immutable Raw Rows**.
2.  **Mapping Engine:** Subscribes to raw events, normalizes data based on source profiles, and stores **Standardized Rows**.
3.  **Accounting Engine:** Subscribes to normalization events, applies double-entry logic, and creates **Immutable Ledger Entries**.
4.  **Consolidation Layer:** Produces derived, high-level views from the ledger for reporting and AI analysis.

---

## 2. Core Firebase Project & React Integration

*   **Firebase Authentication:** Manages user identity.
*   **Firestore Database:**
    *   `raw_rows`: Immutable stage 1 (Raw persistence).
    *   `normalized_rows`: Standardized stage 2 (Mapping).
    *   `ledger_entries`: Atomic financial truth (Double-entry).
    *   `file_processing_logs`: Audit trail and idempotency layer.

---

## 3. Ingestion Layer (functions/8-data-ingestion)

Strictly logic-free entry point for raw data.

*   **Trigger:** HTTPS / Multi-part Upload.
*   **Responsibilities:**
    *   File acceptance and generation of `file_id`.
    *   Fingerprinting (SHA-256) for audit and duplicate detection.
    *   Structural parsing (CSV/Excel -> Row list) with no interpretation.
    *   Emission of `raw-rows-created` Pub/Sub event.

---

## 4. Mapping Engine (functions/2-transformation)

Translates raw rows into standardized financial data.

*   **Trigger:** Pub/Sub `raw-rows-created`.
*   **Responsibilities:**
    *   Schema-based column mapping and terminology normalization.
    *   Categorization tagging (no accounting logic).
    *   Emission of `normalized-rows-created` Pub/Sub event.

---

## 5. Accounting Engine (functions/5-financial-engine)

Decentralized generator of the Atomic Financial Truth.

*   **Trigger:** Pub/Sub `normalized-rows-created`.
*   **Responsibilities:**
    *   Generation of Double-Entry Ledger Pairs (Debit/Credit).
    *   Multi-entity and intercompany flagging.
    *   Persistence to immutable `ledger_entries`.

---

## 6. Consolidation & Truth Engine (functions/15-truth-engine)

Produces derived views and high-level metrics.

*   **Responsibilities:**
    *   Materialization of consolidated views (Materialized Views / BigQuery).
    *   Intercompany eliminations (Materialized only, never modifies ledger).
    *   Historical analysis and variance detection.

---

## 7. Security & Governance

*   **Idempotency:** SHA-256 checksum prevents duplicate processing of the same file.
*   **Traceability:** Every ledger entry links back to a `source_row_id` and `file_id`.
*   **Immutability:** Raw data and ledger entries are never modified after creation.
