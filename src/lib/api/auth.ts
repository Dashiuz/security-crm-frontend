import { HttpClient } from "./client";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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
    return HttpClient.post<LoginResponse>("/auth/login", credentials);
  }

  static async me(): Promise<SessionInfo> {
    return HttpClient.get<SessionInfo>("/auth/me");
  }

  static async logout(): Promise<{ ok: boolean }> {
    // The backend uses cookies for refresh token, so we call logout to clear them
    return HttpClient.post<{ ok: boolean }>("/auth/logout");
  }
}
