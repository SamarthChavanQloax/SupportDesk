import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, configureApiAuth } from './api-client';

export type UserRole = 'customer' | 'agent' | 'admin';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: AuthUser;
}

interface StoredSession {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => void;
}

const STORAGE_KEY = 'supportdesk_auth_session';

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (
      typeof parsed?.accessToken === 'string' &&
      parsed.accessToken.length > 0 &&
      parsed.user &&
      typeof parsed.user.id === 'number' &&
      typeof parsed.user.email === 'string'
    ) {
      return parsed as StoredSession;
    }
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  useEffect(() => {
    configureApiAuth(
      () => session?.accessToken ?? null,
      () => {
        logout();
      }
    );
  }, [session?.accessToken, logout]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    const response = await apiClient.post<LoginResponseData>(
      '/auth/login',
      {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      },
      { skipAuth: true }
    );

    const nextSession: StoredSession = {
      accessToken: response.data.accessToken,
      user: response.data.user,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    return response.data.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken && session?.user),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

