import { toast } from "sonner";

/**
 * Normalized Metric Keys (UI typically expects lowercase/snake_case)
 * Backend (Controller) uses UPPERCASE Semantic Keys.
 */
export const normalizeMetrics = (backendMetrics: any) => {
    if (!backendMetrics) return {};
    const normalized: any = {};
    Object.keys(backendMetrics).forEach(key => {
        normalized[key.toLowerCase()] = backendMetrics[key];
    });
    // Add specific aliases if needed
    normalized['net_income'] = normalized['net_income'] || normalized['net_profit'] || 0;
    return normalized;
};

/**
 * Fetch Financial Truth Object (Single Source)
 */
export const fetchFinancialTruth = async (
    companyId: string,
    period: string,
    currency: string = 'GEL',
    department: string = 'All'
) => {
    try {
        const res = await fetch('/api/financial-truth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entity: companyId,
                period: period,
                currency: currency,
                department: department
            })
        });

        if (res.status === 409) {
            toast.error('Data not locked. Please lock in Governance.');
            return null;
        }

        if (!res.ok) {
            // throw new Error(`Controller Error: ${res.status}`);
            console.warn(`Controller returned ${res.status}. Falling back to empty state.`);
            return null;
        }

        const truth = await res.json();

        // Normalize keys for frontend component compatibility
        if (truth) {
            truth.metrics = normalizeMetrics(truth.metrics);
            if (truth.variance) {
                const normVar: any = {};
                Object.keys(truth.variance).forEach(k => {
                    normVar[k.toLowerCase()] = truth.variance[k];
                });
                truth.variance = normVar;
            }
        }

        return truth;
    } catch (e) {
        console.error("Truth Fetch Error:", e);
        return null;
    }
};
