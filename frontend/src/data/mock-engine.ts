import { Company, PaymentCategory, FinancialNode } from "../types/structure";

// Helper to create valid nodes with GL Codes
const node = (id: string, name: string, budget: number, actual: number, children: FinancialNode[] = [], glCode?: string): FinancialNode => ({
    id, name, glCode,
    value: { budget, actual, variance: actual - budget },
    children
});

// SOCAR Georgia HQ Structure (Full Scope)
const createSocarHQFinancials = () => ({
    assets: node('ast', 'Assets', 0, 0, [
        node('curr', 'Current Assets', 5000000, 4800000, [
            node('rec', 'Trade Receivables', 3000000, 2900000, [], '1-1001'),
            node('cash', 'Cash & Equivalents', 2000000, 1900000, [], '1-1002')
        ], '1-1000'),
        node('noncurr', 'Non-Current Assets', 15000000, 15000000, [
            node('ppe', 'Property, Plant & Equip', 14000000, 14000000, [], '1-1003'),
            node('intangible', 'Intangible Assets', 1000000, 1000000, [], '1-1004')
        ], '1-2000')
    ], '1-0000'),

    liabilities: node('liab', 'Liabilities', 0, 0, [
        node('curr_liab', 'Current Liabilities', 2000000, 2100000, [
            node('payables', 'Accounts Payable', 1500000, 1600000, [], '2-2001'),
            node('st_debt', 'Short-term Debt', 500000, 500000, [], '2-2002')
        ], '2-2000'),
        node('lt_liab', 'Long-Term Liabilities', 5000000, 5000000, [], '2-3000')
    ], '2-0000'),

    equity: node('eq', 'Equity', 0, 0, [
        node('share_cap', 'Share Capital', 8000000, 8000000, [], '3-3001'),
        node('retained', 'Retained Earnings', 5000000, 4700000, [], '3-3002')
    ], '3-0000'),

    incomeStatement: node('inc', 'Income Statement', 0, 0, [
        node('rev', 'Revenue', 10000000, 9500000, [
            node('soc_gas', 'Social Gas Sales', 6000000, 5800000, [], '4-4001'),
            node('comm_gas', 'Commercial Gas Sales', 3000000, 2800000, [], '4-4002'),
            node('dist_serv', 'Gas Distribution Service', 1000000, 900000, [], '4-4003')
        ], '4-4000'),
        node('exp', 'Expenses', 8000000, 8200000, [
            node('cogs', 'COGS', 6000000, 6100000, [
                node('cost_soc', 'Cost of Social Gas', 4000000, 4100000, [], '5-5001'),
                node('cost_comm', 'Cost of Commercial Gas', 1500000, 1400000, [], '5-5002'),
                node('trans_cost', 'Gas Transportation Cost', 500000, 600000, [], '5-5003')
            ], '5-5000'),
            node('opex', 'Operating Expenses', 1500000, 1600000, [], '6-6000'),
            node('ga', 'G&A Expenses', 300000, 320000, [], '6-6001'),
            node('depr', 'Depreciation & Amortization', 200000, 180000, [], '6-6002')
        ], '6-0000')
    ], 'PL-ROOT')
});

// SGG/SOG Structure (Limited Scope)
const createSubsidiaryFinancials = () => ({
    assets: node('ast', 'Assets', 0, 0, [
        node('curr', 'Current Assets', 2000000, 1900000, [
            node('rec', 'Trade Receivables', 1000000, 950000, [], '1-1001'),
            node('cash', 'Cash & Equivalents', 1000000, 950000, [], '1-1002')
        ], '1-1000')
    ], '1-0000'),

    liabilities: node('liab', 'Liabilities', 0, 0, [], '2-0000'),
    equity: node('eq', 'Equity', 0, 0, [], '3-0000'),

    incomeStatement: node('inc', 'Income Statement', 0, 0, [
        node('rev', 'Revenue', 5000000, 4800000, [
            node('soc_gas', 'Social Gas Sales', 4000000, 3900000, [], '4-4001'),
            node('comm_gas', 'Commercial Gas Sales', 1000000, 900000, [], '4-4002')
            // No Distribution Service
        ], '4-4000'),
        node('exp', 'Expenses', 4000000, 4100000, [
            node('cogs', 'COGS', 3000000, 3100000, [
                node('cost_soc', 'Cost of Social Gas', 2500000, 2600000, [], '5-5001'),
                node('cost_comm', 'Cost of Commercial Gas', 500000, 500000, [], '5-5002')
                // No Transportation Cost
            ], '5-5000'),
            node('opex', 'Operating Expenses', 1000000, 1000000, [], '6-6000')
        ], '6-0000')
    ], 'PL-ROOT')
});

const createDepartment = (id: string, name: string, isHQ: boolean = false) => ({
    id, name, financials: isHQ ? createSocarHQFinancials() : createSubsidiaryFinancials()
});

export const MOCK_COMPANY_STRUCTURE: Company[] = [
    {
        id: 'socar_ge', name: 'SOCAR Georgia (Headquarters)', departments: [
            createDepartment('tech_hq', 'Technical Department', true),
            createDepartment('fin_hq', 'Finance Department', true),
            createDepartment('ops_hq', 'Operations Department', true)
        ],
        subsidiaries: [
            {
                id: 'sgg', name: 'SGG (Socar Gas Georgia)',
                departments: [
                    createDepartment('tech_sgg', 'Technical Department'),
                    createDepartment('fin_sgg', 'Finance Department'),
                    createDepartment('ops_sgg', 'Operations Department')
                ]
            },
            {
                id: 'sog', name: 'SOG (Socar Operating Georgia)',
                departments: [
                    createDepartment('tech_sog', 'Technical Department'),
                    createDepartment('fin_sog', 'Finance Department'),
                    createDepartment('ops_sog', 'Operations Department')
                ]
            },
            {
                id: 'telav', name: 'TelavGas',
                departments: [
                    createDepartment('tech_tel', 'Technical Department'),
                    createDepartment('fin_tel', 'Finance Department'),
                    createDepartment('ops_tel', 'Operations Department')
                ]
            }
        ]
    }
];

export const PAYMENT_TREE: PaymentCategory[] = [
    {
        id: 'vendor', name: 'Vendor Payments', glAccountCode: '2-2001', approvalLevel: 'Dept',
        children: [
            { id: 'util', name: 'Utilities', glAccountCode: '6-6005', approvalLevel: 'Dept' },
            { id: 'supp', name: 'Gas Suppliers', glAccountCode: '5-5001', approvalLevel: 'Manager' },
            { id: 'maint', name: 'Pipeline Maintenance', glAccountCode: '6-6006', approvalLevel: 'Manager' }
        ]
    },
    {
        id: 'pay', name: 'Payroll', glAccountCode: '6-6003', approvalLevel: 'CFO',
        children: [
            { id: 'sal', name: 'Department Salaries', glAccountCode: '6-6003-01', approvalLevel: 'Manager' },
            { id: 'tax', name: 'Payroll Taxes', glAccountCode: '2-2005', approvalLevel: 'CFO' }
        ]
    },
    {
        id: 'inter', name: 'Intercompany', glAccountCode: '2-2010', approvalLevel: 'CFO',
        children: [
            { id: 'set_sgg', name: 'Settlement SGG -> SOG', glAccountCode: '2-2010-01', approvalLevel: 'CFO' },
            { id: 'set_tel', name: 'Settlement TelavGas -> HQ', glAccountCode: '2-2010-02', approvalLevel: 'CFO' }
        ]
    }
];
