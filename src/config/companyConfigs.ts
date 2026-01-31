export interface CompanyConfig {
    org_id: string;
    features: {
        consolidation: boolean;
        intercompany_elimination: boolean;
        ai_assistant: boolean;
        budgeting: boolean;
        forecasting: boolean;
    };
    file_formats: {
        revenue_sheet: string;
        cogs_sheet: string;
        expense_sheet: string;
    };
    financial_structure: {
        revenue_breakdown: string[];
        cogs_breakdown: string[];
    };
}

export const COMPANY_CONFIGS: Record<string, CompanyConfig> = {
    'socar_georgia': {
        org_id: 'socar_georgia',
        features: {
            consolidation: true,
            intercompany_elimination: true,
            ai_assistant: true,
            budgeting: true,
            forecasting: true
        },
        file_formats: {
            revenue_sheet: 'Revenue',
            cogs_sheet: 'COGS',
            expense_sheet: 'Expenses'
        },
        financial_structure: {
            revenue_breakdown: [
                'Gas Sales - Social',
                'Gas Sales - Industrial',
                'Gas Sales - Commercial',
                'Other Revenue'
            ],
            cogs_breakdown: [
                'Gas Purchases',
                'Transportation',
                'Other COGS'
            ]
        }
    },

    'socar_petroleum': {
        org_id: 'socar_petroleum',
        features: {
            consolidation: true,
            intercompany_elimination: true,
            ai_assistant: true,
            budgeting: true,
            forecasting: true
        },
        file_formats: {
            revenue_sheet: 'Revenue Breakdown',
            cogs_sheet: 'COGS Breakdown',
            expense_sheet: 'Base'
        },
        financial_structure: {
            revenue_breakdown: [
                'Revenue Wholesale - Petrol',
                'Revenue Wholesale - Diesel',
                'Revenue Wholesale - Bitumen',
                'Revenue Retail - Petrol',
                'Revenue Retail - Diesel',
                'Revenue Retail - CNG',
                'Revenue Retail - LPG',
                'Other Revenue'
            ],
            cogs_breakdown: [
                'COGS Wholesale - Petrol',
                'COGS Wholesale - Diesel',
                'COGS Wholesale - Bitumen',
                'COGS Retail - Petrol',
                'COGS Retail - Diesel',
                'COGS Retail - CNG',
                'COGS Retail - LPG',
                'Other COGS'
            ]
        }
    }
};

export function getCompanyConfig(orgId: string): CompanyConfig {
    return COMPANY_CONFIGS[orgId] || COMPANY_CONFIGS['socar_georgia'];
}
