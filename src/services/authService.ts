import { UserRole } from '../store/authSlice';

export const authService = {
    login: async (email: string, password: string): Promise<any> => {
        // Simulated delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock logic based on email prefix
        if (password === 'password123') {
            if (email.startsWith('admin')) {
                return { id: '1', name: 'Nino Admin', email, role: 'Admin' };
            } else if (email.startsWith('analyst')) {
                return { id: '2', name: 'Saba Analyst', email, role: 'Analyst' };
            } else {
                return { id: '3', name: 'Gio Viewer', email, role: 'Viewer' };
            }
        }

        throw new Error('Invalid credentials');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('finsight_user');
        return user ? JSON.parse(user) : null;
    }
};
