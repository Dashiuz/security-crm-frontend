"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { QrCode2 as QrIcon } from "@mui/icons-material";
import LiveCodeGeneratorWidget from "../widgets/LiveCodeGeneratorWidget";

export default function Slide07SubCodesDemo() {
  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <span className="tactical-pill tactical-pill-emerald">
              <QrIcon sx={{ fontSize: 14 }} /> PRUEBA EN VIVO
            </span>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "24px", md: "30px" } }}>
            Cree un Código para Rondas o Armas en 1 Clic
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "14.5px" }}>
            Seleccione para qué necesita el código y presione el botón para ver cómo el sistema crea el código listo para imprimir o escanear con el celular.
          </Typography>
        </Box>

        {/* Live Widget */}
        <LiveCodeGeneratorWidget />
      </Box>
    </section>
  );
}
