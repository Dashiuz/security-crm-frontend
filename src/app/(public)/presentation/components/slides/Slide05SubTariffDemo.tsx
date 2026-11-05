"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Calculate as CalcIcon } from "@mui/icons-material";
import LiveTariffWidget from "../widgets/LiveTariffWidget";

export default function Slide05SubTariffDemo() {
  return (
    <section>
      <Box
        sx={{
          width: "100%",
          maxWidth: 1660,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: { xs: 2, md: 1 },
        }}
      >
        {/* Header */}
        <Box sx={{ mb: { xs: 2, md: 3 }, textAlign: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <CalcIcon sx={{ fontSize: 18 }} /> SIMULADOR EN VIVO
            </span>
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: "#FFFFFF",
              fontSize: { xs: "26px", sm: "36px", md: "44px", lg: "52px" },
              lineHeight: 1.15,
              mb: 1,
            }}
          >
            Haga la Prueba: Cotice y Analice su Rentabilidad en Tiempo Real
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "16px", sm: "19px", md: "22px", lg: "25px" },
              maxWidth: 1320,
              mx: "auto",
              lineHeight: 1.4,
            }}
          >
            Mueva el control de puestos, elija el tipo de cliente y observe cómo el sistema calcula el precio de ley y su ganancia estimada.
          </Typography>
        </Box>

        {/* Live Widget */}
        <LiveTariffWidget />
      </Box>
    </section>
  );
}
