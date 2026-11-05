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
      icon: <SignatureIcon sx={{ color: "#8B5CF6" }} />,
      tag: "CERO PAPEL",
    },
    {
      title: "Códigos para Puntos de Ronda y Armas",
      desc: "Genere e imprima en un clic códigos QR o de barras para pegar en puntos de control de ronda, placas de revólveres/escopetas o carnets de guardas.",
      icon: <QrIcon sx={{ color: "#10B981" }} />,
      tag: "CONTROL TOTAL",
    },
    {
      title: "Formatos y Cartas Personalizadas",
      desc: "Cree cartas laborales, llamados de atención o actas de entrega. Puede copiar tablas desde Excel o Word y pegarlas directamente sin que se desarmen.",
      icon: <FormatIcon sx={{ color: "#38BDF8" }} />,
      tag: "FÁCIL Y RÁPIDO",
    },
  ];

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
        <Box sx={{ mb: { xs: 2, md: 3.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
            <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <ToolsIcon sx={{ fontSize: 18 }} /> HERRAMIENTAS INCLUIDAS
            </span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <SignatureIcon sx={{ fontSize: 18 }} /> CERO PROGRAMAS EXTERNOS
            </span>
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: "#FFFFFF",
              fontSize: { xs: "28px", sm: "36px", md: "46px", lg: "54px" },
              lineHeight: 1.12,
              mb: 1,
            }}
          >
            Firmas Digitales, Códigos para Rondas y Formatos
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            No necesita pagar suscripciones adicionales a programas de firmas ni comprar costosos software de etiquetas: todo viene incluido.
          </Typography>
        </Box>

        {/* 3 Pillars Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {tools.map((t, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.8 },
                borderTop: "5px solid #8B5CF6",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ "& svg": { fontSize: { xs: 36, md: 44 } } }}>{t.icon}</Box>
                  <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "13px", padding: "4px 12px" }}>
                    {t.tag}
                  </span>
                </Box>
                <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", md: "24px", lg: "27px" }, mb: 1.5, lineHeight: 1.2 }}>
                  {t.title}
                </Typography>
                <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "16px", md: "19px", lg: "21.5px" }, lineHeight: 1.5 }}>
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
