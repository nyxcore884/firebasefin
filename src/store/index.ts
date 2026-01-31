import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { aiApi } from './api/aiApi';
import financialReducer from './financialSlice';
import templateReducer from './templateSlice';
import authReducer from './authSlice';
import entityReducer from './entitySlice';
import companyReducer from './companySlice';

export const store = configureStore({
    reducer: {
        [aiApi.reducerPath]: aiApi.reducer,
        financial: financialReducer,
        templates: templateReducer,
        auth: authReducer,
        entities: entityReducer,
        company: companyReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(aiApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
