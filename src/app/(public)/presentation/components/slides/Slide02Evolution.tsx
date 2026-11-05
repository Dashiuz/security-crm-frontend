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
      icon: <MinutaIcon sx={{ fontSize: 24, color: "#A78BFA" }} />,
      color: "#8B5CF6",
    },
    {
      year: "PASO 2",
      badge: "ORGANIZACIÓN",
      title: "Control de Clientes y Programaciones Dinámicas",
      desc: "Ampliamos para organizar conjuntos residenciales, residentes, hojas de vida del personal y programaciones dinámicas de turnos por puesto.",
      icon: <CrmIcon sx={{ fontSize: 24, color: "#818CF8" }} />,
      color: "#6366F1",
    },
    {
      year: "PASO 3",
      badge: "SISTEMA COMPLETO",
      title: "El ERP que Opera Hoy",
      desc: "Cotizador con tarifas de la Superintendencia, cálculo de nómina de 12 horas, reportes para la DIAN y firmas en el celular.",
      icon: <ErpIcon sx={{ fontSize: 24, color: "#34D399" }} />,
      color: "#10B981",
      highlight: true,
    },
    {
      year: "PASO 4",
      badge: "LO QUE VIENE",
      title: "Mejoras Continuas",
      desc: "Rondas con GPS, verificación de relevo en garita y citofonía para que sus clientes estén cada día más contentos con su servicio.",
      icon: <FutureIcon sx={{ fontSize: 24, color: "#FBBF24" }} />,
      color: "#F59E0B",
    },
  ];

  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <span className="tactical-pill tactical-pill-violet">
              <EvolutionIcon sx={{ fontSize: 14 }} /> NUESTRA HISTORIA
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Hecho en el Puesto de Guardia, No en una Oficina Lejana
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Loro ERP se construyó escuchando las necesidades reales de vigilantes, supervisores y gerentes de seguridad.
          </Typography>
        </Box>

        {/* 4 Steps Timeline Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {timeline.map((step, i) => (
            <Box
              key={i}
              className={`bento-card ${step.highlight ? "bento-hero" : ""}`}
              sx={{
                p: 2.2,
                borderTop: `4px solid ${step.color}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
                  <Typography sx={{ fontFamily: "monospace", fontWeight: 800, color: step.color, fontSize: "12px" }}>
                    {step.year}
                  </Typography>
                  <Box sx={{ display: "flex" }}>{step.icon}</Box>
                </Box>
                <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "10px", padding: "2px 8px", marginBottom: "8px" }}>
                  {step.badge}
                </span>
                <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "15px", mt: 1, mb: 0.8 }}>
                  {step.title}
                </Typography>
                <Typography sx={{ color: "#CBD5E1", fontSize: "12.5px", lineHeight: 1.45 }}>
                  {step.desc}
                </Typography>
              </Box>
              {step.highlight && (
                <Box sx={{ mt: 2, pt: 1, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <Typography sx={{ fontSize: "11px", color: "#34D399", fontWeight: 700 }}>
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
