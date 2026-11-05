"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  AutoGraph as GraphIcon,
  PersonAddAlt1 as ProspectIcon,
  RequestQuote as ProposalIcon,
  CardGiftcard as ValueAddedIcon,
  Draw as DigitalSignIcon,
} from "@mui/icons-material";

export default function Slide05Commercial() {
  const points = [
    {
      title: "Seguimiento de Prospectos desde el Minuto Uno",
      desc: "Gestión ordenada de clientes y prospectos desde el primer contacto para que ninguna oportunidad de negocio se enfríe ni quede olvidada.",
      tag: "GESTIÓN DE PROSPECTOS",
      color: "#8B5CF6",
      icon: <ProspectIcon sx={{ color: "#A78BFA", fontSize: { xs: 30, md: 36 } }} />,
    },
    {
      title: "Propuestas Dinámicas en Línea y Análisis de Rentabilidad",
      desc: "Cotice en minutos con las tarifas oficiales de la Superintendencia 2026 (8.8 y 9.77 SMMLV) y vea en un semáforo en vivo si el contrato le deja ganancia real.",
      tag: "RENTABILIDAD CLARA",
      color: "#10B981",
      icon: <ProposalIcon sx={{ color: "#34D399", fontSize: { xs: 30, md: 36 } }} />,
    },
    {
      title: "Registro de Cada Valor Agregado Entregado",
      desc: "Lleve control exacto de cámaras, equipos o beneficios adicionales prometidos al cliente para que se cumplan sin afectar la utilidad de su empresa.",
      tag: "CONTROL DE COMPROMISOS",
      color: "#38BDF8",
      icon: <ValueAddedIcon sx={{ color: "#38BDF8", fontSize: { xs: 30, md: 36 } }} />,
    },
    {
      title: "Cero Tiempos Muertos con Firma Digital y Puesta en Marcha",
      desc: "Envíe propuestas y contratos digitales para firma desde el celular. Al aprobarse, Operaciones y RRHH reciben aviso inmediato para instalar el puesto.",
      tag: "FIRMA DIGITAL ÁGIL",
      color: "#F59E0B",
      icon: <DigitalSignIcon sx={{ color: "#FBBF24", fontSize: { xs: 30, md: 36 } }} />,
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
              <MoneyIcon sx={{ fontSize: 18 }} /> DESDE COMERCIAL
            </span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <GraphIcon sx={{ fontSize: 18 }} /> RENTABILIDAD Y TARIFAS DE LEY 2026
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
            Lo que Vendo desde Comercial ya no es una Promesa: es una Realidad
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
              maxWidth: 1450,
            }}
          >
            Loro conecta el seguimiento comercial, las propuestas en línea, el análisis de ganancia y la firma digital sin tiempos muertos.
          </Typography>
        </Box>

        {/* 4 Points Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {points.map((p, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderLeft: `6px solid ${p.color}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {p.icon}
                  <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", sm: "22px", md: "24px", lg: "26px" }, lineHeight: 1.2 }}>
                    {p.title}
                  </Typography>
                </Box>
                <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "13px", padding: "4px 12px" }}>
                  {p.tag}
                </span>
              </Box>
              <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "16px", sm: "18px", md: "20px", lg: "22px" }, lineHeight: 1.5 }}>
                {p.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
