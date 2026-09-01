"use client";

import { useState } from "react";
import { Box, Toolbar, Container } from "@mui/material";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar onMenuClick={handleDrawerToggle} />
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { xs: "100%", lg: `calc(100% - 260px)` },
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <Toolbar />
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
      </Box>
    </Box>
  );
}
