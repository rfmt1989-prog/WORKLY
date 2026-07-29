import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as requestLogin,
} from "@/src/api/auth";
import { setAuthToken } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

export type UserRole = "worker" | "company";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: number | null;
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

  login: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<User>;

  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<void>;

  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthState>(
  {} as AuthState
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUserState] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken =
          await storage.secureGet<string>(
            "workly_token",
            ""
          );

        const savedUserJson =
          await storage.getItem<string>(
            "workly_user",
            ""
          );

        if (savedToken && savedUserJson) {
          const savedUser =
            JSON.parse(savedUserJson) as User;

          setAuthToken(savedToken);
          setToken(savedToken);
          setUserState(savedUser);
        }
      } catch (error) {
        console.error(
          "Erro ao restaurar sessão:",
          error
        );

        await storage.secureRemove(
          "workly_token"
        );

        await storage.removeItem(
          "workly_user"
        );

        setAuthToken(null);
        setToken(null);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const persistSession = async (
    nextToken: string,
    nextUser: User
  ) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUserState(nextUser);

    await storage.secureSet(
      "workly_token",
      nextToken
    );

    await storage.setItem(
      "workly_user",
      JSON.stringify(nextUser)
    );

    await storage.setItem(
      "workly_last_email",
      nextUser.email
    );
  };

  const login = useCallback(
    async (
      email: string,
      password: string,
      role: UserRole
    ): Promise<User> => {
      const cleanEmail =
        email.trim().toLowerCase();

      const response =
        await requestLogin({
          email: cleanEmail,
          password,
          user_type: role,
        });

      const nextUser: User = {
        id: String(response.user_id),
        name: response.name,
        email: response.email,
        role: response.user_type,
        company_id: response.company_id,
      };

      await persistSession(
        response.access_token,
        nextUser
      );

      return nextUser;
    },
    []
  );

  const register = useCallback(
    async (
      _name: string,
      _email: string,
      _password: string,
      _role: UserRole
    ) => {
      throw new Error(
        "O registo ainda não está disponível no novo backend."
      );
    },
    []
  );

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUserState(null);

    await storage.secureRemove(
      "workly_token"
    );

    await storage.removeItem(
      "workly_user"
    );
  }, []);

  const refresh = useCallback(async () => {
    // Será ligado ao endpoint /auth/me futuramente.
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refresh,
        setUser: setUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
