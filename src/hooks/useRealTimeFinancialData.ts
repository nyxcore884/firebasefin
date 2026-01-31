import { useEffect, useState, useRef } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UseRealTimeFinancialDataProps {
    orgId: string;
    entityIds?: string[];
    accountIds?: string[];
    periodIds?: string[];
    dataType?: 'actual' | 'budget' | 'forecast';
}

export interface FinancialRecord {
    id: string;
    entity_id: string;
    account_id: string;
    period_id: string;
    metrics: {
        amount: number;
        [key: string]: any;
    };
    entity: {
        entity_name: string;
        [key: string]: any;
    };
    account: {
        account_name: string;
        account_type: string;
        [key: string]: any;
    };
    period: {
        month: number;
        year: number;
        [key: string]: any;
    };
    updated_at?: any;
    [key: string]: any;
}

// Production Reactivity: Real-time Firestore Stream

export const useRealTimeFinancialData = ({
    orgId,
    entityIds,
    accountIds,
    periodIds,
    dataType = 'actual'
}: UseRealTimeFinancialDataProps) => {
    const [data, setData] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setIsLive(true);
        setLoading(true);

        const colRef = collection(db, 'financial_records');

        // Build dynamic query
        let q = query(
            colRef,
            where('orgId', '==', orgId),
            orderBy('createdAt', 'desc')
        );

        if (dataType) {
            q = query(q, where('type', '==', dataType));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(doc => {
                const data = doc.data();
                // Defensive parsing to prevent crashes
                const safePeriod = data.period || '2025-01';
                const [yearStr, monthStr] = safePeriod.includes('-') ? safePeriod.split('-') : ['2025', '1'];

                return {
                    id: doc.id,
                    entity_id: data.entityId || 'unknown_entity',
                    account_id: data.accountId || 'unknown_account',
                    period_id: data.period || 'unknown_period',
                    metrics: { amount: Number(data.amount) || 0 },
                    entity: { entity_name: data.entityName || data.entityId || 'Unknown Entity' },
                    account: { account_name: data.accountName || 'Unknown Account', account_type: data.accountType || 'unclassified' },
                    period: {
                        month: parseInt(monthStr) || 1,
                        year: parseInt(yearStr) || 2025
                    },
                    ...data
                };
            }) as FinancialRecord[];

            setData(records);
            setLoading(false);
            setLastUpdate(new Date());
        }, (err) => {
            console.error("Firestore Streaming Error:", err);
            setError(err);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            setIsLive(false);
        };
    }, [orgId, dataType]); // Re-run if org or type changes

    return { data, loading, error, isLive, lastUpdate };
};
