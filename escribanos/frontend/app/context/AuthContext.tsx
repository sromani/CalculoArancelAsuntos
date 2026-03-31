'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../services/api';

async function syncEstudioSession(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/sync-estudio', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) {
      return { ok: true };
    }
    let message = `Error ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (typeof j.error === 'string' && j.error.length > 0) {
        message = j.error;
      }
    } catch {
      /* ignore */
    }
    return { ok: false, error: message };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de red';
    return { ok: false, error: msg };
  }
}

interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  ci: string;
  planType: string;
  calculosRealizados: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  /** Cookies de estudio sincronizadas (misma sesión Nest → gestión). */
  estudioSessionReady: boolean;
  /** Fuerza cookies `estudio_session` + `nest_access` antes de entrar a /estudio. */
  syncEstudioCookies: () => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  ci: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [estudioSessionReady, setEstudioSessionReady] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      getMe(savedToken)
        .then(async (userData) => {
          setUser(userData);
          setToken(savedToken);
          const synced = await syncEstudioSession(savedToken);
          setEstudioSessionReady(synced.ok);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setEstudioSessionReady(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      setEstudioSessionReady(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
    const synced = await syncEstudioSession(response.token);
    setEstudioSessionReady(synced.ok);
  };

  const register = async (data: RegisterData) => {
    const response = await apiRegister(data);
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
    const synced = await syncEstudioSession(response.token);
    setEstudioSessionReady(synced.ok);
  };

  const logout = () => {
    void (async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch {
        /* ignore */
      }
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setEstudioSessionReady(false);
    })();
  };

  const syncEstudioCookies = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!t) {
      return { ok: false, error: 'No hay token de sesión. Iniciá sesión de nuevo.' };
    }
    const result = await syncEstudioSession(t);
    if (result.ok) {
      setEstudioSessionReady(true);
    }
    return result;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        estudioSessionReady,
        syncEstudioCookies,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
