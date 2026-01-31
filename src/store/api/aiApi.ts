import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const aiApi = createApi({
    reducerPath: 'aiApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/v1/ai' }),
    endpoints: (builder) => ({
        chat: builder.mutation<{ answer: string; confidence: number; sources: string[] }, { orgId: string; question: string; context: any }>({
            query: (body) => ({
                url: 'chat',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const { useChatMutation } = aiApi;
