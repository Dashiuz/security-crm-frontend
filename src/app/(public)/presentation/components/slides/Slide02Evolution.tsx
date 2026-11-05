"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  TrendingUp as EvolutionIcon,
  MenuBook as MinutaIcon,
  Badge as CrmIcon,
  Domain as ErpIcon,
  RocketLaunch as FutureIcon,
} from "@mui/icons-material";

export default function Slide02Evolution() {
  const timeline = [
    {
      year: "PASO 1",
      badge: "EL INICIO",
      title: "Minuta en la Garita",
      desc: "Nació en la portería: cambiar cuadernos de papel por una aplicación donde el guarda toma fotos y registra lo que pasa sin complicaciones.",
      icon: <MinutaIcon sx={{ fontSize: 32, color: "#A78BFA" }} />,
      color: "#8B5CF6",
    },
    {
      year: "PASO 2",
      badge: "ORGANIZACIÓN",
      title: "Control de Clientes y Programaciones Dinámicas",
      desc: "Ampliamos para organizar conjuntos residenciales, residentes, hojas de vida del personal y programaciones dinámicas de turnos por puesto.",
      icon: <CrmIcon sx={{ fontSize: 32, color: "#818CF8" }} />,
      color: "#6366F1",
    },
    {
      year: "PASO 3",
      badge: "SISTEMA COMPLETO",
      title: "El ERP que Conecta Toda la Empresa Hoy",
      desc: "Une Comercial, RRHH y Operaciones con cotizador oficial, nómina de 12 horas basada en tiempos reales y reportes legales listos.",
      icon: <ErpIcon sx={{ fontSize: 32, color: "#34D399" }} />,
      color: "#10B981",
      highlight: true,
    },
    {
      year: "PASO 4",
      badge: "LO QUE VIENE",
      title: "Mejoras Continuas",
      desc: "Rondas con GPS, verificación de relevo en garita y citofonía para que sus clientes estén cada día más contentos con su servicio.",
      icon: <FutureIcon sx={{ fontSize: 32, color: "#FBBF24" }} />,
      color: "#F59E0B",
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <EvolutionIcon sx={{ fontSize: 18 }} /> NUESTRA HISTORIA
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
            Hecho en el Puesto de Guarda, No en una Oficina Lejana
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            Loro ERP se construyó escuchando las necesidades reales de vigilantes, supervisores, directores y gerentes de seguridad.
          </Typography>
        </Box>

        {/* 4 Steps Timeline Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {timeline.map((step, i) => (
            <Box
              key={i}
              className={`bento-card ${step.highlight ? "bento-hero" : ""}`}
              sx={{
                p: { xs: 2.5, md: 3.2 },
                borderTop: `5px solid ${step.color}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={{ fontFamily: "monospace", fontWeight: 900, color: step.color, fontSize: "18px" }}>
                    {step.year}
                  </Typography>
                  <Box sx={{ display: "flex" }}>{step.icon}</Box>
                </Box>
                <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "13px", padding: "4px 12px", marginBottom: "12px" }}>
                  {step.badge}
                </span>
                <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "19px", md: "22px", lg: "24px" }, mt: 1.2, mb: 1.2, lineHeight: 1.2 }}>
                  {step.title}
                </Typography>
                <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "15.5px", md: "18px", lg: "20px" }, lineHeight: 1.48 }}>
                  {step.desc}
                </Typography>
              </Box>
              {step.highlight && (
                <Box sx={{ mt: 2.5, pt: 1.5, borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
                  <Typography sx={{ fontSize: "15px", color: "#34D399", fontWeight: 850 }}>
                    ★ LISTO Y DISPONIBLE PARA SU EMPRESA
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
