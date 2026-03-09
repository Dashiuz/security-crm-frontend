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
    <Box sx={{ display: "flex" }}>
      <Navbar onMenuClick={handleDrawerToggle} />
      <Sidebar open={mobileOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 260px)` },
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
