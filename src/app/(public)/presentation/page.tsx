"use client";

import dynamic from "next/dynamic";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Shield as ShieldIcon } from "@mui/icons-material";

const PresentationDeck = dynamic(
  () => import("./components/PresentationDeck"),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09071A",
          color: "#FFFFFF",
          gap: 2,
        }}
      >
        <ShieldIcon sx={{ fontSize: 48, color: "#8B5CF6", animation: "pulse 1.5s infinite" }} />
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>
          CARGANDO LORO ERP DECK...
        </Typography>
        <CircularProgress size={28} sx={{ color: "#7C3AED" }} />
      </Box>
    ),
  }
);

export default function PresentationPage() {
  return <PresentationDeck />;
}

