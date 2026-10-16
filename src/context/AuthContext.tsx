import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

export type AdminUser = {
  id: number;
  username: string;
  fullname: string;
  position: string;
};

type AuthContextType = {
  user: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'kiosk_permit_admin_session';

function loadStoredUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(loadStoredUser());
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, remember = false) => {
    const admin = await api<AdminUser>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(admin));
    setUser(admin);
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
