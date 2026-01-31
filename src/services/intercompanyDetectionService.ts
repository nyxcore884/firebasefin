import Decimal from 'decimal.js';

// --- TYPES ---

export interface FinancialRecord {
    id: string;
    entityId: string;
    accountId: string;
    accountType: string;
    amount: number;
    date: string;
    description: string | null;
    reference: string | null;
    currency: string;
}

export interface IntercompanyTransaction {
    id: string;
    orgId: string;
    period: string;
    entityFromId: string;
    entityToId: string;
    transactionType: 'sale' | 'purchase' | 'loan' | 'dividend' | 'fee' | 'transfer';
    date: string;
    amount: number;
    currency: string;
    accountDebit: string;
    accountCredit: string;
    sourceType: 'auto_detected' | 'manual' | 'imported';
    matchConfidence: number; // 0.0 to 1.0
    matchMethod: 'account_code' | 'amount' | 'description' | 'reference';
    requiresElimination: boolean;
    eliminationStatus: 'pending' | 'approved' | 'rejected' | 'eliminated';
}

export interface DetectionConfig {
    amountTolerance: number; // e.g., 0.01 for 1%
    dateTolerance: number; // Days
    minimumAmount: number;
    minConfidenceThreshold: number;
}

// --- SERVICE ---

export class IntercompanyDetectionService {
    private config: DetectionConfig;

    constructor(config?: Partial<DetectionConfig>) {
        this.config = {
            amountTolerance: 0.01,
            dateTolerance: 5,
            minimumAmount: 100,
            minConfidenceThreshold: 0.70,
            ...config
        };
    }

    /**
     * Detects IC transactions between entities based on raw records.
     */
    async detect(
        orgId: string,
        period: string,
        records: FinancialRecord[]
    ): Promise<IntercompanyTransaction[]> {
        console.log(`[IC Detection] Analyzing ${records.length} records for ${period}`);

        const detected: IntercompanyTransaction[] = [];

        // 1. Amount Matching (Main Algorithm)
        const amountBased = this.detectByAmountMatching(orgId, period, records);
        detected.push(...amountBased);

        // 2. Reference/Description Matching
        const metaBased = this.detectByMetadataMatching(orgId, period, records);
        detected.push(...metaBased);

        // Deduplicate
        return this.deduplicate(detected);
    }

    private detectByAmountMatching(orgId: string, period: string, records: FinancialRecord[]): IntercompanyTransaction[] {
        const detected: IntercompanyTransaction[] = [];
        const eligible = records.filter(r => Math.abs(r.amount) >= this.config.minimumAmount);

        // Group by approximate amount to optimize N^2
        const amountMap = new Map<string, FinancialRecord[]>();
        eligible.forEach(r => {
            const key = Math.abs(r.amount).toFixed(0); // Bucket by integer value
            if (!amountMap.has(key)) amountMap.set(key, []);
            amountMap.get(key)!.push(r);
        });

        for (const [_, bucket] of amountMap.entries()) {
            if (bucket.length < 2) continue;

            for (let i = 0; i < bucket.length; i++) {
                for (let j = i + 1; j < bucket.length; j++) {
                    const r1 = bucket[i];
                    const r2 = bucket[j];

                    if (r1.entityId === r2.entityId) continue; // Same entity
                    if ((r1.amount > 0 && r2.amount > 0) || (r1.amount < 0 && r2.amount < 0)) continue; // Same sign

                    // Check amount tolerance
                    const a1 = new Decimal(Math.abs(r1.amount));
                    const a2 = new Decimal(Math.abs(r2.amount));
                    const diff = a1.minus(a2).abs();
                    const tolerance = a1.plus(a2).div(2).times(this.config.amountTolerance);

                    if (diff.gt(tolerance)) continue;

                    // Date check
                    const d1 = new Date(r1.date).getTime();
                    const d2 = new Date(r2.date).getTime();
                    const daysDiff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
                    if (daysDiff > this.config.dateTolerance) continue;

                    // Confidence calculation
                    let confidence = 0.5;
                    if (diff.lt(1)) confidence += 0.2; // Very close amount
                    if (daysDiff === 0) confidence += 0.2; // Same day

                    // Description similarity
                    if (r1.description && r2.description) {
                        const sim = this.calculateStringSimilarity(r1.description, r2.description);
                        confidence += sim * 0.2;
                    }

                    if (confidence >= this.config.minConfidenceThreshold) {
                        detected.push(this.createTransactionObject(orgId, period, r1, r2, confidence, 'amount'));
                    }
                }
            }
        }

        return detected;
    }

    private detectByMetadataMatching(orgId: string, period: string, records: FinancialRecord[]): IntercompanyTransaction[] {
        const detected: IntercompanyTransaction[] = [];
        const withRef = records.filter(r => r.reference && r.reference.length > 3);

        const refMap = new Map<string, FinancialRecord[]>();
        withRef.forEach(r => {
            const ref = r.reference!.toLowerCase().trim();
            if (!refMap.has(ref)) refMap.set(ref, []);
            refMap.get(ref)!.push(r);
        });

        for (const [ref, group] of refMap.entries()) {
            if (group.length < 2) continue;
            // Similar logic to amount matching but keyed by reference
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    const r1 = group[i];
                    const r2 = group[j];
                    if (r1.entityId === r2.entityId) continue;
                    if ((r1.amount > 0 && r2.amount > 0) || (r1.amount < 0 && r2.amount < 0)) continue;

                    detected.push(this.createTransactionObject(orgId, period, r1, r2, 0.95, 'reference'));
                }
            }
        }

        return detected;
    }

    private createTransactionObject(
        orgId: string,
        period: string,
        r1: FinancialRecord,
        r2: FinancialRecord,
        confidence: number,
        method: IntercompanyTransaction['matchMethod']
    ): IntercompanyTransaction {
        return {
            id: `ic_${Math.random().toString(36).substr(2, 9)}`,
            orgId,
            period,
            entityFromId: r1.amount > 0 ? r1.entityId : r2.entityId,
            entityToId: r1.amount > 0 ? r2.entityId : r1.entityId,
            transactionType: 'transfer',
            date: r1.date,
            amount: Math.abs(r1.amount),
            currency: r1.currency,
            accountDebit: r1.amount > 0 ? r1.accountId : r2.accountId,
            accountCredit: r1.amount > 0 ? r2.accountId : r1.accountId,
            sourceType: 'auto_detected',
            matchConfidence: confidence,
            matchMethod: method,
            requiresElimination: true,
            eliminationStatus: 'pending'
        };
    }

    private calculateStringSimilarity(s1: string, s2: string): number {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        if (longer.length === 0) return 1.0;
        const distance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
        return (longer.length - distance) / longer.length;
    }

    private levenshteinDistance(s1: string, s2: string): number {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    private deduplicate(txns: IntercompanyTransaction[]): IntercompanyTransaction[] {
        const seen = new Set<string>();
        return txns.filter(t => {
            const key = [t.entityFromId, t.entityToId, t.amount.toFixed(0), t.date].sort().join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}

export const intercompanyService = new IntercompanyDetectionService();
