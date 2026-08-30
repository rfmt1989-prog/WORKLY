import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMe,
  login as requestLogin,
  register as requestRegister,
} from "@/src/api/auth";
import { ApiError, setAuthToken } from "@/src/api/client";
import type { AuthUser, UserRole } from "@/src/demo/types";
import { storage } from "@/src/utils/storage";

export type { UserRole };

export type User = AuthUser & {
  available?: boolean;
  availability?: boolean;
  reputation?: number;
  level?: string;
  level_progress?: number;
  location?: string;
  skills?: { name: string; level: number }[];
  certificates?: unknown[];
  languages?: string[];
  countries?: string[];
  portfolio?: unknown[];
  timeline?: unknown[];
  achievements?: unknown[];
  training?: unknown[];
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    inviteToken?: string,
  ) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "workly_token";
const USER_KEY = "workly_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback(
    async (nextToken: string, nextUser: User) => {
      setAuthToken(nextToken);
      setToken(nextToken);
      setUserState(nextUser);
      await Promise.all([
        storage.secureSet(TOKEN_KEY, nextToken),
        storage.setItem(USER_KEY, JSON.stringify(nextUser)),
        storage.setItem("workly_last_email", nextUser.email),
        storage.setItem("workly_last_role", nextUser.role),
      ]);
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const [savedToken, savedUserJson] = await Promise.all([
          storage.secureGet<string>(TOKEN_KEY, ""),
          storage.getItem<string>(USER_KEY, ""),
        ]);

        if (savedToken && savedUserJson && active) {
          const savedUser = JSON.parse(savedUserJson) as User;
          setAuthToken(savedToken);
          setToken(savedToken);
          setUserState(savedUser);

          try {
            const current = await getMe();
            if (active) {
              setUserState(current);
              await storage.setItem(USER_KEY, JSON.stringify(current));
            }
          } catch (caughtError) {
            const invalidSession =
              caughtError instanceof ApiError &&
              (caughtError.status === 401 || caughtError.status === 403);

            if (invalidSession && active) {
              await Promise.all([
                storage.secureRemove(TOKEN_KEY),
                storage.removeItem(USER_KEY),
              ]);
              setAuthToken(null);
              setToken(null);
              setUserState(null);
            }
            // Network failures keep a valid local session usable offline.
          }
        }
      } catch {
        await Promise.all([
          storage.secureRemove(TOKEN_KEY),
          storage.removeItem(USER_KEY),
        ]);
        setAuthToken(null);
        setToken(null);
        setUserState(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, role: UserRole): Promise<User> => {
      const response = await requestLogin({
        email: email.trim().toLowerCase(),
        password,
        user_type: role,
      });
      const nextUser = response.user as User;
      await persistSession(response.access_token, nextUser);
      return nextUser;
    },
    [persistSession],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole,
      inviteToken?: string,
    ): Promise<User> => {
      const response = await requestRegister({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        user_type: role,
        invite_token: inviteToken?.trim() || undefined,
      });
      const nextUser = response.user as User;
      await persistSession(response.access_token, nextUser);
      return nextUser;
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUserState(null);
    await Promise.all([
      storage.secureRemove(TOKEN_KEY),
      storage.removeItem(USER_KEY),
    ]);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return null;
    try {
      const current = (await getMe()) as User;
      setUserState(current);
      await storage.setItem(USER_KEY, JSON.stringify(current));
      return current;
    } catch {
      return user;
    }
  }, [token, user]);

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    if (nextUser) {
      void storage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refresh,
      setUser,
    }),
    [loading, login, logout, refresh, register, setUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
