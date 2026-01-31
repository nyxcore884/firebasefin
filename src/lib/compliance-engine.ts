

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    vat?: number;
    glAccount: string;
    variance?: number; // Pre-calculated variance percentage for SOX check
}

export interface ComplianceRule {
    id: string;
    name: string;
    validate: (trx: Transaction) => boolean;
    errorMessage: string;
}

export class ComplianceModule {
    private rules: ComplianceRule[];

    constructor() {
        this.rules = [
            {
                id: "GE_TAX_123",
                name: "Georgian VAT Check",
                validate: (trx) => {
                    if (trx.vat === undefined) return true; // Skip if no VAT involved
                    // VAT must be positive and <= 18% of amount (approx)
                    // Simplified: VAT rate shouldn't exceed 18%
                    const rate = trx.vat / trx.amount;
                    return rate > 0 && rate <= 0.18;
                },
                errorMessage: "VAT Validation Failed: Rate exceeds 18% or is invalid."
            },
            {
                id: "SOX_404",
                name: "SOX Significant Variance",
                validate: (trx) => {
                    if (trx.variance === undefined) return true;
                    // Flag if variance > 5%
                    return Math.abs(trx.variance) <= 0.05;
                },
                errorMessage: "SOX 404 Alert: Significant variance (>5%) detected."
            }
        ];
    }

    validate(transaction: Transaction): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        for (const rule of this.rules) {
            if (!rule.validate(transaction)) {
                errors.push(`[${rule.id}] ${rule.errorMessage}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }

    logCompliance(transaction: Transaction, result: { valid: boolean; errors: string[] }) {
        console.log(`[Compliance Log] Trx: ${transaction.id} | Valid: ${result.valid} | Errors: ${result.errors.join(", ")}`);
        // In real app, write to Firestore 'audit_logs'
    }
}

export const complianceEngine = new ComplianceModule();
