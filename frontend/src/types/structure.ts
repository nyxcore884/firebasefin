export type Currency = 'USD' | 'GEL' | 'EUR';

// --- Data Types for Financial Values ---
export interface FinancialValue {
    budget: number;
    actual: number;
    variance: number; // calculated: actual - budget
}

export interface FinancialNode {
    id: string;
    name: string;
    glCode?: string; // e.g., "1-1001"
    value: FinancialValue;
    children?: FinancialNode[];
}

// --- Company Structure ---
export interface Department {
    id: string;
    name: string;
    // Each department holds its own financial data tree
    financials: FinancialHierarchy;
}

export interface Company {
    id: string;
    name: string; // e.g., "SGG", "SOCAR Energy Georgia"
    departments: Department[];
    subsidiaries?: Company[]; // Recursive for SGG -> SGGD if needed, though structure implied flat list under Parent
}

// --- Financial Hierarchy (The "Nested Tree") ---
export interface FinancialHierarchy {
    assets: FinancialNode;
    liabilities: FinancialNode;
    equity: FinancialNode;
    incomeStatement: FinancialNode; // Revenue, COGS, OPEX, etc.
}

// --- Payment Tree ---
export interface PaymentCategory {
    id: string;
    name: string; // e.g., "Vendor Payments", "Utility"
    glAccountCode: string; // Link to GL
    approvalLevel: 'Dept' | 'Manager' | 'CFO' | 'CEO';
    children?: PaymentCategory[];
}

export interface PaymentTransaction {
    id: string;
    date: string;
    amount: number;
    currency: Currency;
    description: string;
    categoryPath: string[]; // ["Vendor Payments", "Utilities", "Electricity"]
    status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
    companyId: string;
    departmentId: string;
}
