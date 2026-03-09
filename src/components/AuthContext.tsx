"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthService, SessionInfo } from "@/lib/api/auth";
import { tokenStore } from "@/lib/api/token-store";
import { CircularProgress, Box } from "@mui/material";

interface AuthContextType {
  session: SessionInfo | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSession = async () => {
    try {
      // Rehydration: If no token in memory, try to refresh from cookie
      if (!tokenStore.getToken()) {
        try {
          await AuthService.refresh();
        } catch (refreshError) {
          // Silent fail if refresh fails on initial boot
        }
      }

      const data = await AuthService.me();
      setSession(data);
    } catch (error) {
      setSession(null);
      if (!pathname.startsWith("/login")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      setSession(null);
      router.push("/login");
    }
  };

  const value = {
    session,
    loading,
    logout,
    refreshSession: fetchSession,
  };

  if (loading && !pathname.startsWith("/login")) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
