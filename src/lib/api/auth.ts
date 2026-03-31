import { HttpClient } from "./client";
import { tokenStore } from "./token-store";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  enabledFeatures: string[];
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sidebarColor?: string;
}

export interface User {
  id: string;
  fullName: string;
  tenantId: string;
  isActive: boolean;
  tenant: Tenant;
}

export interface SessionInfo {
  user: User;
  tenantId: string;
  permissions: string[];
  isImpersonating?: boolean;
  originalTenantId?: string | null;
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

  static async impersonate(tenantId: string): Promise<LoginResponse> {
    const res = await HttpClient.post<LoginResponse>(
      `/auth/impersonate/${tenantId}`
    );
    tokenStore.setToken(res.accessToken);
    return res;
  }

  static async exitImpersonation(): Promise<LoginResponse> {
    const res = await HttpClient.post<LoginResponse>("/auth/impersonate-exit");
    tokenStore.setToken(res.accessToken);
    return res;
  }
}
