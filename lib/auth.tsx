"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, AUTH_TOKENS_CHANGED_EVENT, clearAuthTokens, getSessionExpiryTime, getStoredAccessToken, getStoredRefreshToken, login as apiLogin, persistAuthTokens, refreshAccessToken, register as apiRegister, getMe } from "./api";
import { queueNextHealthTip } from "./health-tips";
import type { UserResponse } from "./types";

type AuthContextValue = {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    display_name?: string;
    consent_data_storage?: boolean;
    consent_model_training?: boolean;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = getStoredAccessToken();
      const storedRefreshToken = getStoredRefreshToken();

      if (storedToken && storedRefreshToken) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        try {
          await refreshUser(storedToken);
        } catch {
          if (!isMounted) return;
          clearAuthTokens();
          setToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } else {
        clearAuthTokens();
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      }

      if (isMounted) {
        setInitializing(false);
      }
    };

    initializeAuth();

    const handleTokenChange = (event: Event) => {
      const detail = (event as CustomEvent<{ accessToken: string | null; refreshToken: string | null }>).detail;
      setToken(detail?.accessToken ?? null);
      setRefreshToken(detail?.refreshToken ?? null);
    };

    const handleSessionExpiry = () => {
      const expiresAt = getSessionExpiryTime();
      if (!expiresAt) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        clearAuthTokens();
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        router.replace("/login");
      }
    };

    handleSessionExpiry();
    const expiryTimer = window.setInterval(handleSessionExpiry, 1000 * 60);
    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleTokenChange as EventListener);
    return () => {
      isMounted = false;
      window.clearInterval(expiryTimer);
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, handleTokenChange as EventListener);
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const tokens = await apiLogin(email, password);
      persistAuthTokens(tokens.access_token, tokens.refresh_token);
      setToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);
      try {
        const profile = await getMe(tokens.access_token);
        setUser(profile);
        queueNextHealthTip();
        router.replace("/dashboard");
      } catch (err) {
        // If the user has no health profile yet, send them to the setup flow
        if (err instanceof ApiError && err.status === 404) {
          queueNextHealthTip();
          router.replace("/setup");
          return;
        }
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    display_name?: string;
    consent_data_storage?: boolean;
    consent_model_training?: boolean;
  }) => {
    setLoading(true);
    try {
      await apiRegister(payload);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthTokens();
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    router.replace("/login");
  };

  const refreshUser = async (accessTokenOverride?: string) => {
    const currentToken = accessTokenOverride ?? token;
    if (!currentToken) return;
    try {
      const profile = await getMe(currentToken);
      setUser(profile);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          const refreshed = await refreshAccessToken();
          const profile = await getMe(refreshed.access_token);
          setUser(profile);
          setToken(refreshed.access_token);
          setRefreshToken(refreshed.refresh_token);
          return;
        } catch {
          logout();
          throw error;
        }
      }
      throw error;
    }
  };

  const value = useMemo(
    () => ({ token, user, loading, initializing, login, register, logout, refreshUser }),
    [token, user, loading, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
