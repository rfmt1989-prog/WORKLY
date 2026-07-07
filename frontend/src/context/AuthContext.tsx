import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { api, setAuthToken } from "@/src/api/client";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "worker" | "company";
  avatar?: string;
  title?: string;
  trust_score?: number;
  reputation?: number;
  level?: string;
  level_progress?: number;
  location?: string;
  available?: boolean;
  skills?: { name: string; level: number }[];
  certificates?: any[];
  languages?: string[];
  countries?: string[];
  portfolio?: any[];
  timeline?: any[];
  achievements?: any[];
  training?: any[];
  industry?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "worker" | "company") => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
};

const AuthCtx = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await storage.secureGet<string>("workly_token", "");
      if (saved) {
        setAuthToken(saved);
        setToken(saved);
        try {
          const me = await api.get<User>("/auth/me");
          setUserState(me);
        } catch {
          await storage.secureRemove("workly_token");
          setAuthToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (tok: string, u: User) => {
    setAuthToken(tok);
    setToken(tok);
    setUserState(u);
    await storage.secureSet("workly_token", tok);
    await storage.setItem("workly_last_email", u.email);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    await persist(res.token, res.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: "worker" | "company") => {
      const res = await api.post<{ token: string; user: User }>("/auth/register", { name, email, password, role });
      await persist(res.token, res.user);
    },
    []
  );

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUserState(null);
    await storage.secureRemove("workly_token");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<User>("/auth/me");
      setUserState(me);
    } catch {}
  }, []);

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, register, logout, refresh, setUser: setUserState }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
