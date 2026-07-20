import { api } from "./client";

export type LoginRequest = {
  email: string;
  password: string;
  user_type: "worker" | "company";
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "worker" | "company";
    company_id?: number | null;
  };
};

export function login(
  data: LoginRequest
): Promise<LoginResponse> {
  return api.post<LoginResponse>(
    "/auth/login",
    data
  );
}
