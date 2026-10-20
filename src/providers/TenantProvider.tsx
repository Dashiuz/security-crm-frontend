"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { Tenant } from "@/lib/api/auth";
import { useAuth } from "@/components/AuthContext";
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  alpha,
  darken,
  lighten,
} from "@mui/material";
import noxiaTheme, { noxiaPalette } from "@/theme/noxiaTheme";

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

  // Dynamic Theme inheriting the full architectural foundation of noxiaTheme
  const theme = useMemo(() => {
    const rawPrimary = tenant?.primaryColor;
    const isLegacyOrSystemGreen =
      rawPrimary === "#224229" || rawPrimary === "#1976d2";
    const hasCustomPrimary = Boolean(
      rawPrimary &&
        !isLegacyOrSystemGreen &&
        rawPrimary.toLowerCase() !== noxiaPalette.primary.main.toLowerCase()
    );
    const primaryMain =
      rawPrimary && !isLegacyOrSystemGreen
        ? rawPrimary
        : noxiaPalette.primary.main;

    const rawSecondary = tenant?.secondaryColor;
    const isLegacySecondary =
      rawSecondary === "#24b343" || rawSecondary === "#9c27b0";
    const hasCustomSecondary = Boolean(
      rawSecondary &&
        !isLegacySecondary &&
        rawSecondary.toLowerCase() !== noxiaPalette.secondary.main.toLowerCase()
    );
    const secondaryMain =
      rawSecondary && !isLegacySecondary
        ? rawSecondary
        : noxiaPalette.secondary.main;

    const rawSidebar = tenant?.sidebarColor;
    const isLegacySidebar = rawSidebar === "#252b27";
    const appBarBg =
      rawSidebar && !isLegacySidebar
        ? rawSidebar
        : hasCustomSecondary
        ? secondaryMain
        : noxiaPalette.secondary.main; // Default: Midnight Obsidian (#1E1B4B)

    // Calculate dynamic primary palette (harmonic shades for custom tenant colors)
    const primaryPalette = hasCustomPrimary
      ? {
          main: primaryMain,
          light: lighten(primaryMain, 0.2),
          dark: darken(primaryMain, 0.2),
          soft: alpha(primaryMain, 0.08),
          contrastText: "#FFFFFF",
        }
      : noxiaPalette.primary;

    const secondaryPalette = hasCustomSecondary
      ? {
          main: secondaryMain,
          light: lighten(secondaryMain, 0.2),
          dark: darken(secondaryMain, 0.2),
          contrastText: "#FFFFFF",
        }
      : noxiaPalette.secondary;

    return createTheme(noxiaTheme, {
      palette: {
        primary: primaryPalette,
        secondary: secondaryPalette,
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: appBarBg,
            },
          },
        },
      },
    });
  }, [tenant?.primaryColor, tenant?.secondaryColor, tenant?.sidebarColor]);

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
