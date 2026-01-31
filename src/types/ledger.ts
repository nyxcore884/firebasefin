export interface LedgerHeader {
    ledger_id: string;
    company_code: string;
    ledger_type: 'LOCAL' | 'IFRS' | 'MGMT';
    fiscal_year: number;
    period: number;
    posting_date: string; // ISO Date
    document_type: string;
    source_module: string;
    reference_document?: string;
    currency_local: string;
    currency_group: string;
    created_by: string;
    approved_by?: string;
    approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    ai_risk_score?: number;
    created_at: string;
}

export interface LedgerLine {
    line_id: string;
    ledger_id: string;
    gl_account: string;
    debit_amount: number;
    credit_amount: number;
    transaction_currency: string;
    local_amount: number;
    group_amount: number;
    cost_center?: string;
    profit_center?: string;
    project_id?: string;
    asset_id?: string;
    vendor_id?: string;
    customer_id?: string;
    tax_code?: string;
    intercompany_partner?: string;
    statistical_flag?: boolean;
}

export interface LedgerEntry {
    header: LedgerHeader;
    lines: LedgerLine[];
}

export interface LedgerAudit {
    ledger_id: string;
    event_type: 'POST' | 'REVERSE' | 'ADJUST';
    user: string;
    timestamp: string;
    justification?: string;
    attachment_hash?: string;
}
