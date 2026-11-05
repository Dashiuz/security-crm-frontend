"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  MenuBook as LogbookIcon,
  Mic as MicIcon,
  NotificationsActive as AlertIcon,
  FlashOn as FlashIcon,
  Timeline as TraceIcon,
  FolderDelete as NoPaperIcon,
  OndemandVideo as LiveTrainingIcon,
  FactCheck as GuideIcon,
} from "@mui/icons-material";

export default function Slide04Operations() {
  const minutas = [
    {
      title: "Registros Digitales de Inicio a Fin",
      desc: "Trazabilidad completa de la información desde que el guarda recibe hasta que entrega el turno, con dictado por voz y fotos en tiempo real.",
      icon: <TraceIcon />,
    },
    {
      title: "Reducción de Espacio y Papel de Minutas",
      desc: "Elimine bodegas llenas de cuadernos de papel manchados. Todo el historial del conjunto o empresa se consulta en segundos desde el celular.",
      icon: <NoPaperIcon />,
    },
    {
      title: "Capacitaciones en Vivo por Plataformas",
      desc: "Formación continua y directa con su equipo operativo a través de plataformas digitales para mantener la excelencia en el servicio.",
      icon: <LiveTrainingIcon />,
    },
    {
      title: "Capacitaciones en Puesto con Temas Reales",
      desc: "Guías prácticas generadas con las situaciones y consignas reales de cada puesto, para que el guarda sepa siempre cómo actuar.",
      icon: <GuideIcon />,
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
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
            <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <LogbookIcon sx={{ fontSize: 18 }} /> DESDE OPERACIONES
            </span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <FlashIcon sx={{ fontSize: 18 }} /> NOVEDADES DESDE EL MINUTO CERO
            </span>
            <span className="tactical-pill tactical-pill-amber" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <MicIcon sx={{ fontSize: 18 }} /> DICTADO POR VOZ Y TRAZABILIDAD
            </span>
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: "#FFFFFF",
              fontSize: { xs: "28px", sm: "36px", md: "46px", lg: "52px" },
              lineHeight: 1.12,
              mb: 1,
            }}
          >
            La Operación Nace desde las Anotaciones del Guarda y el Día a Día
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.42,
              maxWidth: 1500,
            }}
          >
            Novedades desde el minuto cero con trazabilidad total, capacitación en el puesto y{" "}
            <Box component="span" sx={{ color: "#C4B5FD", fontWeight: 800 }}>
              “todo lo que sabes que es importante para ti”
            </Box>
            .
          </Typography>
        </Box>

        {/* 4 Operations Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: { xs: 2, md: 2.8 },
            mb: { xs: 2, md: 3 },
          }}
        >
          {minutas.map((m, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: 2.2, md: 3 },
                display: "flex",
                flexDirection: "column",
                borderTop: "5px solid #8B5CF6",
              }}
            >
              <Box sx={{ color: "#A78BFA", mb: 1.5, "& svg": { fontSize: { xs: 32, md: 38 } } }}>{m.icon}</Box>
              <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "19px", md: "22px", lg: "24px" }, mb: 1.2, lineHeight: 1.2 }}>
                {m.title}
              </Typography>
              <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "15.5px", md: "18px", lg: "20px" }, lineHeight: 1.48 }}>
                {m.desc}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Escalation Alert Bar */}
        <Box
          className="bento-card bento-hero"
          sx={{
            p: { xs: 2.5, md: 3 },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2.5,
            borderLeft: "6px solid #F59E0B",
          }}
        >
          <AlertIcon sx={{ color: "#F59E0B", fontSize: { xs: 36, md: 46 }, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "18px", md: "22px", lg: "24px" }, mb: 0.5 }}>
              Alertas CRÍTICAS Directas a los que Debemos Actuar
            </Typography>
            <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "15.5px", md: "19px", lg: "21px" }, lineHeight: 1.45 }}>
              Ante cualquier novedad urgente o incidente delicado en el conjunto, el sistema envía alerta inmediata a quienes deben tomar acción (supervisores, coordinación y gerencia).
            </Typography>
          </Box>
        </Box>
      </Box>
    </section>
  );
}
