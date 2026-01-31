
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    writeBatch,
    doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from './api';

export interface FinancialRecord {
    id?: string;
    orgId: string;
    entityId: string;
    entityName: string;
    accountId: string;
    accountName: string;
    accountType: string;
    amount: number;
    currency: string;
    period: string; // YYYY-MM
    description: string;
    reference?: string;
    type: 'actual' | 'budget' | 'forecast';
    createdAt?: any;
}

export const financialService = {
    /**
     * Save a single record to Firestore
     */
    saveRecord: async (record: FinancialRecord) => {
        const colRef = collection(db, 'financial_records');
        return await addDoc(colRef, {
            ...record,
            createdAt: serverTimestamp()
        });
    },

    /**
     * Bulk save records using Firestore Batch with basic duplicate prevention
     */
    saveRecordsBatch: async (records: FinancialRecord[]) => {
        const batch = writeBatch(db);
        const colRef = collection(db, 'financial_records');

        records.forEach(record => {
            // Create a deterministic ID to prevent duplicates if the same file is uploaded twice
            // Format: type_org_entity_account_period_amount_description
            const compositeKey = [
                record.type,
                record.orgId,
                record.entityId,
                record.accountId,
                record.period,
                record.amount,
                // Short hash of description to keep ID length reasonable
                record.description.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')
            ].join('_').toLowerCase();

            const docRef = doc(colRef, compositeKey);
            batch.set(docRef, {
                ...record,
                createdAt: serverTimestamp()
            }, { merge: true }); // Use merge to avoid overwriting metadata if it exists
        });

        return await batch.commit();
    },

    /**
     * Get records for a specific organization and period
     */
    getRecords: async (orgId: string, period: string, type: string = 'actual') => {
        const colRef = collection(db, 'financial_records');
        const q = query(
            colRef,
            where('orgId', '==', orgId),
            where('period', '==', period),
            where('type', '==', type)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as FinancialRecord[];
    },

    /**
     * Get list of uploaded datasets from BigQuery Warehouse
     */
    getDatasets: async (orgId: string) => {
        try {
            const response = await api.get(`/api/v1/datasets?org_id=${orgId}`);
            return response as any[];
        } catch (error) {
            console.error("Failed to fetch datasets", error);
            return [];
        }
    },

    /**
     * Get comprehensive dashboard metrics from BigQuery
     */
    getDashboardMetrics: async (
        orgId: string,
        period: 'current_month' | 'current_quarter' | 'current_year' = 'current_month'
    ) => {
        try {
            const response = await api.get(
                `/api/v1/dashboard/dashboard/metrics?org_id=${orgId}&period=${period}`
            );
            return response.data;
        } catch (error) {
            console.error("Failed to fetch dashboard metrics", error);
            throw error;
        }
    },

    /**
     * Get financial records from BigQuery with filters
     */
    getBigQueryRecords: async (params: {
        orgId: string;
        period?: string;
        limit?: number;
        offset?: number;
        accountCode?: string;
        category?: string;
    }) => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('org_id', params.orgId);

            if (params.period) queryParams.append('period', params.period);
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.offset) queryParams.append('offset', params.offset.toString());
            if (params.accountCode) queryParams.append('account_code', params.accountCode);
            if (params.category) queryParams.append('category', params.category);

            const response = await api.get(`/api/v1/financial/financial-records?${queryParams.toString()}`);
            return response;
        } catch (error) {
            console.error("Failed to fetch financial records", error);
            throw error;
        }
    },

    /**
     * Get financial summaries for period range
     */
    getFinancialSummaries: async (
        orgId: string,
        startPeriod: string,
        endPeriod: string
    ) => {
        try {
            const response = await api.get(
                `/api/v1/financial/financial-summaries?org_id=${orgId}&start_period=${startPeriod}&end_period=${endPeriod}`
            );
            return response.data;
        } catch (error) {
            console.error("Failed to fetch financial summaries", error);
            throw error;
        }
    },

    /**
     * Upload Financial Data File (Excel) to Backend for Processing
     * Triggers SGP Engine if org_id is SGP
     */
    uploadFinancialData: async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/api/v1/upload/financial-data', formData);
            return response;
        } catch (error) {
            console.error("Failed to upload financial data", error);
            throw error;
        }
    }
};
