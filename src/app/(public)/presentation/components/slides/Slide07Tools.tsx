"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Build as ToolsIcon,
  Draw as SignatureIcon,
  QrCode2 as QrIcon,
  Article as FormatIcon,
} from "@mui/icons-material";

export default function Slide07Tools() {
  const tools = [
    {
      title: "Firmas en el Celular con Validez Legal",
      desc: "Sus clientes y guardas pueden firmar contratos, actas o autorizaciones directo en la pantalla del celular o computador con plena validez de ley (Ley 527).",
      icon: <SignatureIcon sx={{ fontSize: 26, color: "#8B5CF6" }} />,
      tag: "CERO PAPEL",
    },
    {
      title: "Códigos para Puntos de Ronda y Armas",
      desc: "Genere e imprima en un clic códigos QR o de barras para pegar en puntos de control de ronda, placas de revólveres/escopetas o carnets de guardas.",
      icon: <QrIcon sx={{ fontSize: 26, color: "#10B981" }} />,
      tag: "CONTROL TOTAL",
    },
    {
      title: "Formatos y Cartas Personalizadas",
      desc: "Cree cartas laborales, llamados de atención o actas de entrega. Puede copiar tablas desde Excel o Word y pegarlas directamente sin que se desarmen.",
      icon: <FormatIcon sx={{ fontSize: 26, color: "#38BDF8" }} />,
      tag: "FÁCIL Y RÁPIDO",
    },
  ];

  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <span className="tactical-pill tactical-pill-violet">
              <ToolsIcon sx={{ fontSize: 14 }} /> HERRAMIENTAS INCLUIDAS
            </span>
            <span className="tactical-pill tactical-pill-emerald">
              <SignatureIcon sx={{ fontSize: 14 }} /> CERO PROGRAMAS EXTERNOS
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Firmas Digitales, Códigos para Rondas y Formatos
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            No necesita pagar suscripciones adicionales a programas de firmas ni comprar costosos software de etiquetas: todo viene incluido.
          </Typography>
        </Box>

        {/* 3 Pillars Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2.5,
          }}
        >
          {tools.map((t, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: 2.5,
                borderTop: "3.5px solid #7C3AED",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Box>{t.icon}</Box>
                  <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "10px" }}>
                    {t.tag}
                  </span>
                </Box>
                <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "16px", mb: 1 }}>
                  {t.title}
                </Typography>
                <Typography sx={{ color: "#CBD5E1", fontSize: "13.5px", lineHeight: 1.45 }}>
                  {t.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
