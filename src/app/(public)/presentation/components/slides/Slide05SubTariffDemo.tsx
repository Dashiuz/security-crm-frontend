"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Calculate as CalcIcon } from "@mui/icons-material";
import LiveTariffWidget from "../widgets/LiveTariffWidget";

export default function Slide05SubTariffDemo() {
  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <span className="tactical-pill tactical-pill-violet">
              <CalcIcon sx={{ fontSize: 14 }} /> SIMULADOR EN VIVO
            </span>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "24px", md: "30px" } }}>
            Haga la Prueba: Cotice un Servicio en Tiempo Real
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "14.5px" }}>
            Mueva el control de puestos, elija el tipo de cliente y observe cómo el sistema calcula el precio de ley y su ganancia estimada.
          </Typography>
        </Box>

        {/* Live Widget */}
        <LiveTariffWidget />
      </Box>
    </section>
  );
}
