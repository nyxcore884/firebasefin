import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FieldMapping {
    sourceColumn: string;
    targetField: string;
    transform?: string;
}

export interface DataTemplate {
    id: string;
    name: string;
    description: string;
    format: 'csv' | 'json' | 'xml' | 'xlsx';
    sourceSystem: string;
    mappings: FieldMapping[];
    lastModified: string;
}

interface TemplateState {
    templates: DataTemplate[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: TemplateState = {
    templates: [
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
        }
    ],
    status: 'idle',
    error: null,
};

const templateSlice = createSlice({
    name: 'templates',
    initialState,
    reducers: {
        addTemplate: (state, action: PayloadAction<DataTemplate>) => {
            state.templates.push(action.payload);
        },
        updateTemplate: (state, action: PayloadAction<DataTemplate>) => {
            const index = state.templates.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
                state.templates[index] = action.payload;
            }
        },
        deleteTemplate: (state, action: PayloadAction<string>) => {
            state.templates = state.templates.filter(t => t.id !== action.payload);
        },
    },
});

export const { addTemplate, updateTemplate, deleteTemplate } = templateSlice.actions;
export default templateSlice.reducer;
