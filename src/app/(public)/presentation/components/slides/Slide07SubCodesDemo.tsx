"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { QrCode2 as QrIcon } from "@mui/icons-material";
import LiveCodeGeneratorWidget from "../widgets/LiveCodeGeneratorWidget";

export default function Slide07SubCodesDemo() {
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
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <QrIcon sx={{ fontSize: 18 }} /> PRUEBA EN VIVO
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
            Cree un Código para Rondas o Armas en 1 Clic
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "16px", sm: "19px", md: "22px", lg: "25px" },
              lineHeight: 1.4,
              maxWidth: 1320,
              mx: "auto",
            }}
          >
            Seleccione para qué necesita el código y presione el botón para ver cómo el sistema crea el código listo para imprimir o escanear con el celular.
          </Typography>
        </Box>

        {/* Live Widget */}
        <LiveCodeGeneratorWidget />
      </Box>
    </section>
  );
}
