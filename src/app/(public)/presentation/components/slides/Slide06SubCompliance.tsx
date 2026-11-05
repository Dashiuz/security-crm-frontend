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
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <span className="tactical-pill tactical-pill-violet">
              <VerifiedIcon sx={{ fontSize: 14 }} /> CUMPLIMIENTO LEGAL
            </span>
            <span className="tactical-pill tactical-pill-emerald">
              <DianIcon sx={{ fontSize: 14 }} /> CERO MULTAS
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Tranquilidad Total con la SuperVigilancia, la DIAN y la UGPP
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Duerma tranquilo sabiendo que todos los reportes obligatorios se generan en minutos y cumplen estrictamente con la ley colombiana.
          </Typography>
        </Box>

        {/* 4 Standards Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2.5,
          }}
        >
          {standards.map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: 2.5,
                borderLeft: "3px solid #10B981",
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "8px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "16px", mb: 0.5 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: "#CBD5E1", fontSize: "13.5px", lineHeight: 1.45 }}>
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
