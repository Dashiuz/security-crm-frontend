import { HttpClient } from "./client";
import { tokenStore } from "./token-store";

export interface User {
  id: string;
  fullName: string;
  role: string;
}

export interface SessionInfo {
  user: User;
  tenantId: string;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
}

export class AuthService {
  static async login(credentials: any): Promise<LoginResponse> {
    const res = await HttpClient.post<LoginResponse>(
      "/auth/login",
      credentials,
    );
    tokenStore.setToken(res.accessToken);
    return res;
  }

  static async me(): Promise<SessionInfo> {
    return HttpClient.get<SessionInfo>("/auth/me");
  }

  static async logout(): Promise<{ ok: boolean }> {
    try {
      return await HttpClient.post<{ ok: boolean }>("/auth/logout");
    } finally {
      tokenStore.clearToken();
    }
  }

  static async refresh(): Promise<LoginResponse> {
    const accessToken = await HttpClient.handleRefresh();
    if (!accessToken) throw new Error("Refresh failed");
    return { accessToken };
  }
}
