"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Forum as CommIcon,
  History as HistoryIcon,
  AccessTimeFilled as RealTimePayIcon,
  RuleFolder as NoveltyControlIcon,
  AutoMode as NoReworkIcon,
} from "@mui/icons-material";

export default function Slide06OtherAreas() {
  const items = [
    {
      title: "Comunicación a Todo Nivel y Cero Reprocesos",
      badge: "SIN DOBLE TRABAJO",
      badgeClass: "tactical-pill tactical-pill-violet",
      desc: "Disposición inmediata de la información para apoyar los procesos diarios de Contabilidad, Facturación, Asistenciales y Calidad, evitando pedir dos veces el mismo dato.",
      icon: <NoReworkIcon sx={{ color: "#A78BFA", fontSize: { xs: 34, md: 42 } }} />,
      border: "rgba(139, 92, 246, 0.45)",
    },
    {
      title: "Historial Completo del Cliente en un Solo Lugar",
      badge: "MEMORIA TOTAL",
      badgeClass: "tactical-pill tactical-pill-emerald",
      desc: "Consulte en segundos toda la trazabilidad del cliente: propuestas, contratos, puestos activos, valores agregados entregados, quejas atendidas y bitácoras históricas.",
      icon: <HistoryIcon sx={{ color: "#10B981", fontSize: { xs: 34, md: 42 } }} />,
      border: "rgba(16, 185, 129, 0.45)",
    },
    {
      title: "Pago de Nómina Basado en Tiempos Reales de Trabajo",
      badge: "PAGO EXACTO",
      badgeClass: "tactical-pill tactical-pill-amber",
      desc: "La liquidación ya no se hace a ojo ni con planillas sueltas: se alimenta directamente de los turnos y tiempos reales trabajados por cada guarda en su puesto.",
      icon: <RealTimePayIcon sx={{ color: "#F59E0B", fontSize: { xs: 34, md: 42 } }} />,
      border: "rgba(245, 158, 11, 0.45)",
    },
    {
      title: "Control de Cambios y Novedades que Afectan la Nómina",
      badge: "CONTROL DIRECTO",
      badgeClass: "tactical-pill tactical-pill-emerald",
      desc: "Cada incapacidad, relevo, permiso, hora extra o cambio de turno queda registrado desde el momento en que ocurre e impacta la nómina directamente sin descuadres.",
      icon: <NoveltyControlIcon sx={{ color: "#34D399", fontSize: { xs: 34, md: 42 } }} />,
      border: "rgba(52, 211, 153, 0.45)",
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
            <span className="tactical-pill tactical-pill-emerald">
              <CommIcon sx={{ fontSize: 18 }} /> LAS DEMÁS ÁREAS • APOYO TRANSVERSAL
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
            Información al Instante para Todas las Áreas y Cero Reprocesos
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
              maxWidth: 1450,
            }}
          >
            Contabilidad, Facturación, Asistenciales y Calidad trabajan conectadas sobre una misma verdad, desde el historial del cliente hasta el pago exacto de la nómina.
          </Typography>
        </Box>

        {/* 2x2 Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {items.map((item, idx) => (
            <Box
              key={idx}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderLeft: `6px solid ${item.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                {item.icon}
                <span className={item.badgeClass}>{item.badge}</span>
              </Box>
              <Typography
                sx={{
                  fontWeight: 850,
                  color: "#FFFFFF",
                  fontSize: { xs: "20px", sm: "22px", md: "25px", lg: "27px" },
                  lineHeight: 1.2,
                }}
              >
                {item.title}
              </Typography>
              <Typography
                sx={{
                  color: "#E2E8F0",
                  fontSize: { xs: "16px", sm: "18px", md: "20px", lg: "22px" },
                  lineHeight: 1.5,
                }}
              >
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}

