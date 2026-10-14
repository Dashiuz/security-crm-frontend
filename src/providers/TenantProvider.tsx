"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Tenant } from "@/lib/api/auth";
import { useAuth } from "@/components/AuthContext";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

interface TenantContextType {
  tenant: Tenant | null;
  isFeatureEnabled: (featureKey: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const tenant = session?.user?.tenant ?? null;

  useEffect(() => {
    if (tenant) {
      document.title = `${tenant.name} | NOXIA CRM`;
    } else {
      document.title = "NOXIA CRM";
    }
  }, [tenant]);

  const isFeatureEnabled = (featureKey: string) => {
    if (!tenant) return false;
    // SuperAdmin / Master logic could be added here if needed
    return tenant.enabledFeatures.includes(featureKey);
  };

  // Dynamic Theme based on Tenant branding
  const theme = createTheme({
    palette: {
      primary: {
        main: tenant?.primaryColor || "#1976d2",
      },
      secondary: {
        main: tenant?.secondaryColor || "#9c27b0",
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: tenant?.primaryColor || "#1976d2",
          },
        },
      },
    },
  });

  const value = {
    tenant,
    isFeatureEnabled,
  };

  return (
    <TenantContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};
