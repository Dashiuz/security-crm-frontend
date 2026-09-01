import { tokenStore } from "./token-store";

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

export class HttpClient {
  private static refreshPromise: Promise<string | null> | null = null;

  public static async handleRefresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        tokenStore.setToken(data.accessToken);
        return data.accessToken;
      } catch (error) {
        tokenStore.clearToken();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit & { _retry?: boolean } = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = tokenStore.getToken();

    const headers: Record<string, string> = {};

    // Only set Content-Type to JSON if body is NOT FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Merge provided headers
    if (options.headers) {
      const extraHeaders = options.headers as Record<string, string>;
      Object.keys(extraHeaders).forEach((key) => {
        headers[key] = extraHeaders[key];
      });
    }

    const defaultOptions: RequestInit = {
      ...options,
      headers,
      credentials: "include",
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (
        response.status === 401 &&
        !options._retry &&
        !endpoint.includes("/auth/refresh") &&
        !endpoint.includes("/auth/login")
      ) {
        // Attempt refresh (locked to one at a time)
        const newToken = await this.handleRefresh();

        if (newToken) {
          // Retry original request with new token
          return this.request<T>(endpoint, { ...options, _retry: true });
        }
      }

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: "An unexpected error occurred",
            statusCode: response.status,
          };
        }
        throw errorData;
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if ((error as ApiError).statusCode) {
        throw error as ApiError;
      }
      throw {
        message: error instanceof Error ? error.message : "Network error",
        statusCode: 500,
      } as ApiError;
    }
  }

  static get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  static post<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }

  static upload<T>(endpoint: string, formData: FormData, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  }

  static patch<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static put<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}
