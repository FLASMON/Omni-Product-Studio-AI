import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'omni-auth-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [user]);

  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 900));
    if (!email.includes('@')) throw new Error('Email invalide');
    setUser({ email, name: email.split('@')[0] });
  };

  const signup = async (name: string, email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 1100));
    if (!email.includes('@')) throw new Error('Email invalide');
    if (!name.trim()) throw new Error('Nom requis');
    setUser({ email, name: name.trim() });
  };

  const loginWithGoogle = async () => {
    await new Promise((r) => setTimeout(r, 900));
    setUser({ email: 'studio@omni.ai', name: 'Omni Studio', avatar: 'OS' });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
