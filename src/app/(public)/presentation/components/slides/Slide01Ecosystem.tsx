"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Hub as EcosystemIcon,
  Apartment as ExternalClientIcon,
  Shield as InternalClientIcon,
  AccountBalance as AdminIcon,
  TrendingUp as DirectionIcon,
  Explore as CompassIcon,
} from "@mui/icons-material";

export default function Slide01Ecosystem() {
  const pillars = [
    {
      title: "1. Los Clientes Externos",
      badge: "CONJUNTOS Y EMPRESAS",
      badgeClass: "tactical-pill tactical-pill-emerald",
      desc: "Sus clientes reciben transparencia total: minutas en vivo, control de visitantes con foto, reportes claros y cumplimiento real de lo contratado.",
      icon: <ExternalClientIcon sx={{ color: "#10B981", fontSize: { xs: 34, md: 42 } }} />,
      borderColor: "rgba(16, 185, 129, 0.45)",
    },
    {
      title: "2. Los Clientes Internos",
      badge: "GUARDAS Y SUPERVISORES",
      badgeClass: "tactical-pill tactical-pill-violet",
      desc: "Su equipo operativo trabaja con herramientas fáciles en el celular, turnos claros, capacitaciones en su puesto y pagos de nómina exactos.",
      icon: <InternalClientIcon sx={{ color: "#A78BFA", fontSize: { xs: 34, md: 42 } }} />,
      borderColor: "rgba(139, 92, 246, 0.45)",
    },
    {
      title: "3. El Área Administrativa",
      badge: "PROCESOS Y GESTIÓN",
      badgeClass: "tactical-pill tactical-pill-amber",
      desc: "Gestión centralizada de la información y los procesos diarios desde la oficina, eliminando el desorden de papeles, correos sueltos y reprocesos.",
      icon: <AdminIcon sx={{ color: "#F59E0B", fontSize: { xs: 34, md: 42 } }} />,
      borderColor: "rgba(245, 158, 11, 0.45)",
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
            <span className="tactical-pill tactical-pill-violet">
              <EcosystemIcon sx={{ fontSize: 18 }} /> VISIÓN INTEGRAL • UN SOLO TODO
            </span>
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: "#FFFFFF",
              fontSize: { xs: "28px", sm: "38px", md: "46px", lg: "54px" },
              lineHeight: 1.12,
              mb: 1.5,
            }}
          >
            Una Plataforma que Integra Tres Partes que Forman un Todo
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
              maxWidth: 1450,
            }}
          >
            Loro conecta en un mismo sistema a quienes contratan el servicio, a quienes lo prestan en el puesto y a quienes administran la empresa.
          </Typography>
        </Box>

        {/* 3 Core Pillars */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 3 },
            mb: { xs: 2.5, md: 3.5 },
          }}
        >
          {pillars.map((item, idx) => (
            <Box
              key={idx}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderTop: `5px solid ${item.borderColor}`,
                display: "flex",
                flexDirection: "column",
                gap: 2,
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
                  fontSize: { xs: "20px", sm: "23px", md: "25px", lg: "28px" },
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

        {/* Executive Bottom Dual Banner: Direcciones & Gerencias */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box
            className="bento-card bento-hero"
            sx={{
              p: { xs: 2.5, md: 3 },
              display: "flex",
              alignItems: "center",
              gap: 2.5,
            }}
          >
            <DirectionIcon sx={{ color: "#34D399", fontSize: { xs: 38, md: 48 }, flexShrink: 0 }} />
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: "#34D399",
                  fontSize: { xs: "15px", md: "17px" },
                  letterSpacing: 0.8,
                  mb: 0.5,
                }}
              >
                PARA LAS DIRECCIONES
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: "#FFFFFF",
                  fontSize: { xs: "17px", sm: "19px", md: "21px", lg: "23px" },
                  lineHeight: 1.35,
                }}
              >
                Convierte los datos de todos los días en decisiones seguras y proyecciones claras de crecimiento.
              </Typography>
            </Box>
          </Box>

          <Box
            className="bento-card bento-hero"
            sx={{
              p: { xs: 2.5, md: 3 },
              display: "flex",
              alignItems: "center",
              gap: 2.5,
            }}
          >
            <CompassIcon sx={{ color: "#A78BFA", fontSize: { xs: 38, md: 48 }, flexShrink: 0 }} />
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: "#C4B5FD",
                  fontSize: { xs: "15px", md: "17px" },
                  letterSpacing: 0.8,
                  mb: 0.5,
                }}
              >
                PARA LAS GERENCIAS
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  color: "#FFFFFF",
                  fontSize: { xs: "17px", sm: "19px", md: "21px", lg: "23px" },
                  lineHeight: 1.35,
                }}
              >
                Controla en tiempo real toda la empresa para saber con certeza su norte y su rumbo financiero.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </section>
  );
}

