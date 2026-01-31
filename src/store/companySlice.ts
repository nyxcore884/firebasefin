import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Company {
    org_id: string;
    org_name: string;
    org_code: string;
    company_type: string;
}

interface CompanyState {
    currentCompany: Company | null;
    companies: Company[];
    loading: boolean;
}

const initialState: CompanyState = {
    currentCompany: null,
    companies: [],
    loading: false
};

import { api } from '../services/api';

// Connection to real FastAPI backend
export const fetchCompanies = createAsyncThunk(
    'company/fetchCompanies',
    async () => {
        return (await api.get('/api/v1/companies')) as Company[];
    }
);

const companySlice = createSlice({
    name: 'company',
    initialState,
    reducers: {
        setCurrentCompany(state, action: PayloadAction<Company>) {
            state.currentCompany = action.payload;
            localStorage.setItem('selected_company', action.payload.org_id);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCompanies.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCompanies.fulfilled, (state, action: PayloadAction<Company[]>) => {
                state.companies = action.payload;
                state.loading = false;

                // Auto-select based on localStorage or default to first
                const savedOrgId = localStorage.getItem('selected_company');
                if (savedOrgId) {
                    const saved = action.payload.find((c: Company) => c.org_id === savedOrgId);
                    if (saved) {
                        state.currentCompany = saved;
                    } else {
                        state.currentCompany = action.payload[0];
                    }
                } else if (!state.currentCompany && action.payload.length > 0) {
                    state.currentCompany = action.payload[0];
                }
            });
    }
});

export const { setCurrentCompany } = companySlice.actions;
export default companySlice.reducer;
