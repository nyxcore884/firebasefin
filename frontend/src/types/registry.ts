export interface DatasetSchemaItem {
    name: string;
    type: string;
    description?: string;
}

export interface QualityCheckResult {
    rule: string;
    passed: boolean;
    timestamp: number;
}

export interface DatasetMetadata {
    id: string; // Made required as it's a key in Firestore
    name: string;
    description: string;
    owner: string;
    tags: string[];
    schema: Record<string, string>; // Simple key-value for now (col_name: type) or DatasetSchemaItem[]
    lineage: string[];
    type?: 'ingested_file' | 'manual_entry' | 'derived'; // Added type
    quality_rules: string[];
    quality_status?: QualityCheckResult[];
    created_at?: any; // Changed to any to support Firestore Timestamp
    file_metadata?: {
        original_name: string;
        size: number;
        mime_type: string;
        download_url: string;
        storage_path: string;
    } | null;
}
