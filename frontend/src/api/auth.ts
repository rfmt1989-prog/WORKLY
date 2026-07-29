import type { AuthUser, UserRole } from "@/src/demo/types";

import { api } from "./client";

export type LoginPayload = {
  email: string;
  password: string;
  user_type: UserRole;
};

export type RegisterPayload = LoginPayload & {
  name: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user_id: string;
  name: string;
  email: string;
  user_type: UserRole;
  company_id: string | null;
  user: AuthUser;
};

export function login(data: LoginPayload) {
  return api.post<LoginResponse>("/auth/login", data);
}

export function register(data: RegisterPayload) {
  return api.post<LoginResponse>("/auth/register", data);
}

export function getMe() {
  return api.get<AuthUser>("/auth/me");
}
