import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { api, setAuthToken } from "@/src/api/client";
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
  available?: boolean;
  reputation?: number;
  location?: string;
  level?: string;
  trust_score?: number;
  level_progress?: number;
  skills?: { name: string; level?: number }[];
  certificates?: { name: string; issuer?: string }[];
  portfolio?: { title: string; image?: string }[];
  languages?: string[];
  countries?: string[];
};

type LoginResponse = {
  token: string;
  user: User;
};

type AuthState = {
  user: User | null;
  token: string |null;
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
        await api.post<LoginResponse>(
          "/auth/login",
          {
            email: cleanEmail,
            password,
            user_type: role,
          }
        );

      const nextUser: User = {
        ...response.user,
        id: String(response.user.id),
      };

      await persistSession(
        response.token,
        nextUser
      );

      return nextUser;
    },
    []
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole
    ) => {
      const response = await api.post<LoginResponse>(
        "/auth/register",
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }
      );
      await persistSession(response.token, {
        ...response.user,
        id: String(response.user.id),
      });
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
    if (!token) return;
    const refreshedUser = await api.get<User>("/auth/me");
    setUserState(refreshedUser);
    await storage.setItem("workly_user", JSON.stringify(refreshedUser));
  }, [token]);

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
