const BASE_URL = import.meta.env.PROD
    ? 'https://firebasefin-backend-733431756980.us-central1.run.app'
    : '';

export const api = {
    get: async (endpoint: string) => {
        const headers = getHeaders();
        const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
        const response = await fetch(url, { headers });
        return handleResponse(response);
    },

    post: async (endpoint: string, data: any) => {
        const headers = getHeaders();
        // If data is FormData (file upload), don't set Content-Type header (browser handles it)
        if (!(data instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const body = data instanceof FormData ? data : JSON.stringify(data);
        const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: data instanceof FormData ? { 'X-Company-ID': headers['X-Company-ID'] } : headers,
            body
        });
        return handleResponse(response);
    }
};

const getHeaders = (): Record<string, string> => {
    const orgId = localStorage.getItem('selected_company');
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (orgId) {
        headers['X-Company-ID'] = orgId;
    }
    return headers;
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { detail: response.statusText };
        }
        throw new Error(errorData.detail || 'API request failed');
    }
    return response.json();
};
