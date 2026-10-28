"use client";

import React from "react";
import { Box, Toolbar, Container, useTheme, useMediaQuery } from "@mui/material";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import DualRailNavigation, {
  RAIL_WIDTH,
  SUBMENU_WIDTH,
} from "@/components/navigation/DualRailNavigation";
import { SseProvider } from "@/providers/SseProvider";
import { NavigationProvider, useNavigation } from "@/providers/NavigationContext";

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isSubmenuPinned, toggleSubmenu, toggleMobile, setCommandPaletteOpen, currentDirectionId } = useNavigation();

  const isFullBleed =
    Boolean(pathname?.includes("/commercial/proposals/new")) ||
    Boolean(pathname?.includes("/commercial/proposals/") && pathname?.includes("/edit")) ||
    Boolean(pathname?.includes("/tools/formats/new")) ||
    Boolean(pathname?.includes("/tools/formats/") && pathname?.includes("/edit"));

  const hasSubmenu = currentDirectionId !== "dashboard" && currentDirectionId !== "clients" && currentDirectionId !== "employees";
  const isSubmenuVisible = isSubmenuPinned && hasSubmenu;

  const handleMenuClick = () => {
    if (isMobile) {
      toggleMobile();
    } else if (hasSubmenu) {
      toggleSubmenu();
    }
  };

  const desktopLeftMargin = isSubmenuVisible ? RAIL_WIDTH + SUBMENU_WIDTH : RAIL_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar
        onMenuClick={handleMenuClick}
        onSearchClick={() => setCommandPaletteOpen(true)}
        hasSubmenu={hasSubmenu}
      />
      <DualRailNavigation />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: isFullBleed ? 0 : { xs: 1, sm: 2, md: 3 },
          width: {
            xs: "100%",
            md: `calc(100% - ${desktopLeftMargin}px)`,
          },
          maxWidth: {
            xs: "100%",
            md: `calc(100% - ${desktopLeftMargin}px)`,
          },
          ml: {
            xs: 0,
            md: `${desktopLeftMargin}px`,
          },
          transition:
            "margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1), width 0.22s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <Toolbar />
        {isFullBleed ? (
          children
        ) : (
          <Container
            maxWidth="xl"
            disableGutters
            sx={{
              px: { xs: 0.5, sm: 1.5, md: 2 },
              mt: { xs: 1, sm: 2 },
              mb: { xs: 2, sm: 4 },
            }}
          >
            {children}
          </Container>
        )}
      </Box>
    </Box>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SseProvider>
      <NavigationProvider>
        <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
      </NavigationProvider>
    </SseProvider>
  );
}
