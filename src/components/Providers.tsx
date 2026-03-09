"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme/theme";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AuthProvider } from "./AuthContext";
import { NotificationProvider } from "@/providers/NotificationProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <NotificationProvider>
            <AuthProvider>{children}</AuthProvider>
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
