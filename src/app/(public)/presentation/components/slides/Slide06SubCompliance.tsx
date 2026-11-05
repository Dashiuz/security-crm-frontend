"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  CheckCircle as VerifiedIcon,
  ReceiptLong as DianIcon,
  TableChart as ExcelIcon,
  AccountBalanceWallet as PilaIcon,
} from "@mui/icons-material";

export default function Slide06SubCompliance() {
  const standards = [
    {
      title: "Reporte RENOVA para la Superintendencia",
      desc: "Genera con un clic el archivo de Excel oficial de 22 columnas con el estado de su personal y alertas de cursos de vigilancia que están por vencerse.",
      icon: <ExcelIcon sx={{ color: "#34D399" }} />,
    },
    {
      title: "Nómina Electrónica para la DIAN",
      desc: "Emite el archivo oficial exigido por la DIAN para deducir los costos laborales de su empresa en la declaración de renta sin complicaciones.",
      icon: <DianIcon sx={{ color: "#38BDF8" }} />,
    },
    {
      title: "Planilla de Seguridad Social (PILA)",
      desc: "Calcula los aportes a salud, pensión, ARL y caja de compensación separando automáticamente los días trabajados de las incapacidades.",
      icon: <PilaIcon sx={{ color: "#FBBF24" }} />,
    },
    {
      title: "Certificados 220 y Cartas Laborales",
      desc: "Los empleados o supervisores pueden descargar constancias laborales y certificados de ingresos oficiales con firma digital y código de verificación.",
      icon: <VerifiedIcon sx={{ color: "#A78BFA" }} />,
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
              <VerifiedIcon sx={{ fontSize: 18 }} /> CUMPLIMIENTO LEGAL
            </span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <DianIcon sx={{ fontSize: 18 }} /> CERO MULTAS
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
            Tranquilidad Total con la SuperVigilancia, la DIAN y la UGPP
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            Duerma tranquilo sabiendo que todos los reportes obligatorios se generan en minutos y cumplen estrictamente con la ley colombiana.
          </Typography>
        </Box>

        {/* 4 Standards Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {standards.map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderLeft: "6px solid #10B981",
                display: "flex",
                gap: { xs: 2, md: 2.8 },
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: { xs: 52, md: 62 },
                  height: { xs: 52, md: 62 },
                  borderRadius: "14px",
                  backgroundColor: "rgba(16, 185, 129, 0.16)",
                  border: "1.5px solid rgba(16, 185, 129, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  "& svg": { fontSize: { xs: 30, md: 38 } },
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", sm: "22px", md: "25px", lg: "27px" }, mb: 1, lineHeight: 1.2 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "16px", sm: "18px", md: "20px", lg: "22px" }, lineHeight: 1.5 }}>
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
