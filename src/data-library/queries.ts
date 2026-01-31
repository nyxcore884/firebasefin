import { API_ENDPOINTS, apiPost } from "../lib/api-client";
import { DataBucket } from "./buckets";
import { CommonFilters } from "./filters";

export interface DataQueryRequest {
    bucket: DataBucket;
    filters?: CommonFilters;
}

export interface DataQueryResponse<T = any> {
    data: T[];
    metadata?: {
        total?: number;
        source?: string;
    };
    error?: string;
    trace_id?: string;
}

/**
 * Unified Query Function to fetch data from any canonical bucket.
 * This replaces ad-hoc API calls for standard data retrieval.
 */
export async function queryBucket<T = any>(
    bucket: DataBucket,
    filters: CommonFilters = {}
): Promise<DataQueryResponse<T>> {
    try {
        const response = await apiPost<DataQueryResponse<T>>(API_ENDPOINTS.DATA_QUERY, {
            bucket,
            filters
        });
        return response;
    } catch (e) {
        console.error(`Data Library Query Error [${bucket}]:`, e);
        return {
            data: [],
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
