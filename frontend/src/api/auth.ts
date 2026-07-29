import { api } from "./client";

export type LoginRequest = {
  email: string;
  password: string;
  user_type: "worker" | "company";
};

export type LoginResponse = {
  access_token: string;
  token_type?: string;
  user_id: number;
  name: string;
  email: string;
  user_type: "worker" | "company";
  company_id: number | null;
};

export function login(
  data: LoginRequest
): Promise<LoginResponse> {
  return api.post<LoginResponse>(
    "/auth/login",
    data
  );
}
