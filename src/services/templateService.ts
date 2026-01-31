
export interface FieldMapping {
    sourceColumn: string;
    targetField: string;
    transform?: string;
}

export interface DataTemplate {
    id: string;
    name: string;
    description: string;
    format: 'csv' | 'json' | 'xml';
    sourceSystem: 'SAP' | 'Oracle' | 'Quickbooks' | 'Custom';
    mappings: FieldMapping[];
    lastModified: string;
}

export const templateService = {
    getTemplates: async (): Promise<DataTemplate[]> => {
        // Mock Data
        return [
            {
                id: 'tmpl_01',
                name: 'Quickbooks GL Export',
                description: 'Standard mapping for QB General Ledger CSV exports.',
                format: 'csv',
                sourceSystem: 'Quickbooks',
                mappings: [
                    { sourceColumn: 'Date', targetField: 'transaction_date' },
                    { sourceColumn: 'Amount', targetField: 'amount' },
                    { sourceColumn: 'Desc', targetField: 'narration' }
                ],
                lastModified: '2025-12-15'
            },
            {
                id: 'tmpl_02',
                name: 'SAP Trial Balance',
                description: 'Consolidated trial balance import from SAP S/4HANA.',
                format: 'xml',
                sourceSystem: 'SAP',
                mappings: [],
                lastModified: '2026-01-10'
            },
            {
                id: 'tmpl_03',
                name: 'Bank Statement (MT940)',
                description: 'Swift MT940 format for cash reconciliation.',
                format: 'json',
                sourceSystem: 'Custom',
                mappings: [],
                lastModified: '2026-01-20'
            }
        ];
    }
};
