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
    id?: string;
    name: string;
    description: string;
    owner: string;
    tags: string[];
    schema: Record<string, string>; // Simple key-value for now (col_name: type) or DatasetSchemaItem[]
    lineage: string[];
    quality_rules: string[];
    quality_status?: QualityCheckResult[];
    created_at?: number;
}
