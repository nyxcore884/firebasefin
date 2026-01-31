


export interface RawTransaction {
    id: string;
    source: string; // "SGG:Sales"
    category: string; // "Social Gas Sales"
    amount: number;
    currency: string;
    counterparty?: string;
}

export interface MappedTransaction {
    source_entity: {
        type: 'company' | 'department';
        company: string;
        department?: string;
    };
    target_account: string; // GL Code
    department: string;
    currency: {
        original: string;
        converted: number;
        rate: number;
    };
    validation: {
        status: 'ok' | 'error';
        checks: string[];
        errors: string[];
    };
}

// Mock Forex Service
const getExchangeRate = (from: string, to: string) => {
    if (from === to) return 1;
    if (from === 'USD' && to === 'GEL') return 2.7;
    if (from === 'EUR' && to === 'GEL') return 2.9;
    return 1;
};

export class FinancialMapper {
    // Hardcoded mapping table as per blueprint "Brain"
    private gl_mapping: Record<string, string> = {
        "Social Gas Sales": "4-4001-01",
        "Commercial Gas Sales": "4-4001-02",
        "Cost of Social Gas": "5-5001-01",
        "Gas Transportation Cost": "5-5001-03",
        "Salaries (gross)": "5-5005-01",
        "Social Security": "5-5005-03",
        "Utilities": "5-5002-01", // Mapped to Vendor Payments > Utilities
        "Supplies": "5-5001-05"
    };

    private resolveEntity(source: string) {
        const parts = source.split(':');
        if (parts.length === 1) {
            return { type: 'company' as const, company: parts[0] };
        }
        return {
            type: 'department' as const,
            company: parts[0],
            department: parts[1]
        };
    }

    private resolveCurrency(amount: number, currency: string) {
        const rate = getExchangeRate(currency, 'GEL');
        return {
            original: currency,
            converted: amount * rate,
            rate
        };
    }

    private validate(mapped: MappedTransaction, raw: RawTransaction): { status: 'ok' | 'error'; checks: string[]; errors: string[] } {
        const checks: string[] = [];
        const errors: string[] = [];

        // Rule 1: Budget Limit Check (Mocked Logic)
        // In a real app, we'd fetch the budget from Firestore.
        // For simulation: Flag if Revenue > 200k (just an arbitrary rule for demo)
        if (mapped.target_account.startsWith('4-')) {
            checks.push("Budget Limit Check: Active");
            if (mapped.currency.converted > 250000) {
                // Warning, but maybe not error? Blueprint says "Revenue cannot exceed budget by >15%"
                errors.push("Volume Check: Transaction exceeds 115% of historical norms");
            } else {
                checks.push("Volume Check: Within normal limits");
            }
        }

        // Rule 2: Intercompany Approval
        // If source is a Company (not Dept), require explicit approval check
        if (mapped.source_entity.type === 'company' && raw.category.includes('Settlement')) {
            checks.push("Intercompany Policy: Checking Approvals...");
            // Mock check
            if (raw.amount > 10000) {
                errors.push("Missing CFO Approval for large intercompany settlement");
            } else {
                checks.push("Intercompany: Auto-approved (< 10k)");
            }
        } else {
            checks.push("Intercompany Policy: N/A");
        }

        return {
            status: errors.length > 0 ? 'error' : 'ok',
            checks,
            errors
        };
    }

    public mapTransaction(transaction: RawTransaction): MappedTransaction {
        const entity = this.resolveEntity(transaction.source);
        const glCode = this.gl_mapping[transaction.category] || "9-9999 (Unmapped)";
        const currencyData = this.resolveCurrency(transaction.amount, transaction.currency);

        const partialMapped: MappedTransaction = {
            source_entity: entity,
            target_account: glCode,
            department: entity.department || 'Headquarters',
            currency: currencyData,
            validation: { status: 'ok', checks: [], errors: [] }
        };

        const validation = this.validate(partialMapped, transaction);
        partialMapped.validation = validation;

        return partialMapped;
    }
}

export const financialMapper = new FinancialMapper();
