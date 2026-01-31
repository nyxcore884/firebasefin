import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FinancialRecord } from './financialService';

export interface QualityIssue {
    id: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    title: string;
    count: number;
    desc: string;
    source: string;
    autoFix: boolean;
}

export interface QualityMetrics {
    overallScore: number;
    dimensions: {
        completeness: number;
        accuracy: number;
        consistency: number;
        timeliness: number;
    };
    trend: { day: string; score: number }[];
    issues: QualityIssue[];
}

export const dataQualityService = {
    /**
     * Conducts a full scan of financial records for a given organization
     * and generates deterministic quality metrics.
     */
    async runFullScan(orgId: string): Promise<QualityMetrics> {
        const colRef = collection(db, 'financial_records');
        const q = query(colRef, where('orgId', '==', orgId));
        const snapshot = await getDocs(q);
        const records = snapshot.docs.map(doc => doc.data() as FinancialRecord);

        if (records.length === 0) {
            return this.getEmptyState();
        }

        // 1. Detect Issues
        const issues: QualityIssue[] = [];

        // Check for negative revenue
        const negativeRevenue = records.filter(r =>
            (r.accountType === 'revenue' || (r.accountName || '').toLowerCase().includes('revenue')) && r.amount < 0
        );
        if (negativeRevenue.length > 0) {
            issues.push({
                id: 'iss_neg_rev',
                severity: 'CRITICAL',
                title: 'Negative Revenue Detected',
                count: negativeRevenue.length,
                desc: 'Revenue accounts should typically have positive credit balances.',
                source: 'Financial Records',
                autoFix: false
            });
        }

        // Check for unclassified accounts
        const unclassified = records.filter(r => r.accountType === 'unclassified' || r.accountName === 'Unmapped');
        if (unclassified.length > 0) {
            issues.push({
                id: 'iss_unmapped',
                severity: 'WARNING',
                title: 'Unmapped GL Accounts',
                count: unclassified.length,
                desc: 'Transactions found with unclassified account types, affecting reporting accuracy.',
                source: 'Ingestion Engine',
                autoFix: true
            });
        }

        // Check for missing descriptions
        const missingDesc = records.filter(r => !r.description || r.description.trim() === '');
        if (missingDesc.length > 0) {
            issues.push({
                id: 'iss_missing_desc',
                severity: 'INFO',
                title: 'Incomplete Metadata',
                count: missingDesc.length,
                desc: 'Records missing descriptions or reference strings.',
                source: 'Source Systems',
                autoFix: false
            });
        }

        // 2. Calculate Scores (Mock logic based on issue density for now, but deterministic from records)
        const totalPossibleScore = 100;
        const penaltyPerCritical = 15;
        const penaltyPerWarning = 5;
        const penaltyPerInfo = 1;

        const totalPenalty = (negativeRevenue.length > 0 ? penaltyPerCritical : 0) +
            (unclassified.length > 0 ? penaltyPerWarning : 0) +
            (missingDesc.length > 0 ? penaltyPerInfo : 0);

        const overallScore = Math.max(0, totalPossibleScore - totalPenalty);

        return {
            overallScore,
            dimensions: {
                completeness: 100 - (missingDesc.length / records.length * 100),
                accuracy: 100 - (negativeRevenue.length / records.length * 100),
                consistency: unclassified.length === 0 ? 100 : 85,
                timeliness: 95 // Hardcoded for now
            },
            trend: [
                { day: 'Mon', score: overallScore - 2 },
                { day: 'Tue', score: overallScore - 1 },
                { day: 'Wed', score: overallScore },
                { day: 'Thu', score: overallScore },
                { day: 'Fri', score: overallScore },
                { day: 'Sat', score: overallScore },
                { day: 'Sun', score: overallScore },
            ],
            issues
        };
    },

    getEmptyState(): QualityMetrics {
        return {
            overallScore: 0,
            dimensions: { completeness: 0, accuracy: 0, consistency: 0, timeliness: 0 },
            trend: [],
            issues: []
        };
    }
};
