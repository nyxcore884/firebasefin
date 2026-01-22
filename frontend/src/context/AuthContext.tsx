import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define User Role Types
export type UserRole = 'admin' | 'cfo' | 'manager' | 'viewer';

interface User {
    uid: string;
    email: string;
    role: UserRole;
    displayName: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (role?: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (requiredRole: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Mock Auth Provider for Demo
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate checking local storage or Firebase Auth state
        const storedUser = localStorage.getItem('firebasefin_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (role: UserRole = 'cfo') => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockUser: User = {
            uid: 'usr_' + Math.random().toString(36).substr(2, 9),
            email: `demo.${role}@socar.ge`,
            role: role,
            displayName: role.toUpperCase() + ' User'
        };

        setUser(mockUser);
        localStorage.setItem('firebasefin_user', JSON.stringify(mockUser));
        setLoading(false);
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('firebasefin_user');
    };

    const hasPermission = (allowedRoles: UserRole[]) => {
        if (!user) return false;
        if (user.role === 'admin') return true; // Admin has all permissions
        return allowedRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};
