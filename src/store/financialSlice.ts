import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FinancialRecord {
    id: string;
    date: string;
    entity: string;
    account: string;
    description: string;
    amount: number;
    type: 'actual' | 'budget' | 'forecast';
}

interface FinancialState {
    records: FinancialRecord[];
    meta: {
        fileName: string | null;
        uploadDate: string | null;
        rowCount: number;
        lastUpdated: string | null;
    };
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: FinancialState = {
    records: [],
    meta: {
        fileName: null,
        uploadDate: null,
        rowCount: 0,
        lastUpdated: null,
    },
    status: 'idle',
    error: null,
};

const financialSlice = createSlice({
    name: 'financial',
    initialState,
    reducers: {
        startUpload: (state) => {
            state.status = 'loading';
            state.error = null;
        },
        uploadSuccess: (state, action: PayloadAction<{ fileName: string; records: FinancialRecord[] }>) => {
            state.status = 'succeeded';
            state.records = action.payload.records;
            state.meta.fileName = action.payload.fileName;
            state.meta.uploadDate = new Date().toISOString();
            state.meta.rowCount = action.payload.records.length;
            state.meta.lastUpdated = new Date().toISOString();
        },
        uploadFailure: (state, action: PayloadAction<string>) => {
            state.status = 'failed';
            state.error = action.payload;
        },
        clearData: (state) => {
            state.records = [];
            state.meta = initialState.meta;
            state.status = 'idle';
        },
    },
});

export const { startUpload, uploadSuccess, uploadFailure, clearData } = financialSlice.actions;
export default financialSlice.reducer;
