"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Sync as SynergyIcon,
  Storefront as CommercialIcon,
  Groups as HrIcon,
  Security as OperationsIcon,
  CheckCircle as CheckIcon,
  AccountBalanceWallet as AccountingIcon,
  ReceiptLong as BillingIcon,
  SupportAgent as WelfareIcon,
  Verified as QualityIcon,
} from "@mui/icons-material";

export default function Slide02Synergy() {
  const coreAreas = [
    {
      name: "COMERCIAL",
      tagline: "Vende con certeza y rentabilidad",
      desc: "Cotiza en línea con tarifas oficiales, registra cada compromiso adquirido con el cliente y envía contratos a firma digital sin tiempos muertos.",
      icon: <CommercialIcon sx={{ color: "#34D399", fontSize: { xs: 36, md: 44 } }} />,
      border: "#10B981",
      pill: "PASO 1 • PROMESA CLARA",
      pillClass: "tactical-pill tactical-pill-emerald",
    },
    {
      name: "RECURSOS HUMANOS",
      tagline: "Selecciona el guarda ideal",
      desc: "Dispone de una 'tienda de guardas' lista para el puesto o filtra candidatos rápido para contratar exactamente lo que el cliente necesita.",
      icon: <HrIcon sx={{ color: "#A78BFA", fontSize: { xs: 36, md: 44 } }} />,
      border: "#8B5CF6",
      pill: "PASO 2 • EQUIPO LISTO",
      pillClass: "tactical-pill tactical-pill-violet",
    },
    {
      name: "OPERACIONES",
      tagline: "Cumple en el puesto desde el día uno",
      desc: "Recibe toda la orden de servicio al instante, programa los turnos dinámicamente y controla las minutas y alertas críticas en tiempo real.",
      icon: <OperationsIcon sx={{ color: "#FBBF24", fontSize: { xs: 36, md: 44 } }} />,
      border: "#F59E0B",
      pill: "PASO 3 • EJECUCIÓN REAL",
      pillClass: "tactical-pill tactical-pill-amber",
    },
  ];

  const supportAreas = [
    { label: "Contabilidad", desc: "Costos y soportes al día", icon: <AccountingIcon sx={{ color: "#34D399", fontSize: 28 }} /> },
    { label: "Facturación", desc: "Cobros sin desfases", icon: <BillingIcon sx={{ color: "#60A5FA", fontSize: 28 }} /> },
    { label: "Asistenciales", desc: "Bienestar y novedades", icon: <WelfareIcon sx={{ color: "#F472B6", fontSize: 28 }} /> },
    { label: "Calidad", desc: "Auditoría y mejora continua", icon: <QualityIcon sx={{ color: "#FBBF24", fontSize: 28 }} /> },
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
            <span className="tactical-pill tactical-pill-emerald">
              <SynergyIcon sx={{ fontSize: 18 }} /> CONEXIÓN ÁGIL Y PRECISA
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
            Une Áreas que Siempre Deben Trabajar como una Sola
          </Typography>
          <Typography
            sx={{
              color: "#C4B5FD",
              fontWeight: 700,
              fontSize: { xs: "18px", sm: "21px", md: "25px", lg: "28px" },
              lineHeight: 1.35,
            }}
          >
            “Lo que vendo desde Comercial ya no es una promesa: es una realidad y Loro lo hace posible.”
          </Typography>
        </Box>

        {/* 3 Core Areas */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 3 },
            mb: { xs: 2.5, md: 3 },
          }}
        >
          {coreAreas.map((area, idx) => (
            <Box
              key={idx}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderTop: `5px solid ${area.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                {area.icon}
                <span className={area.pillClass}>{area.pill}</span>
              </Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontSize: { xs: "22px", sm: "25px", md: "28px", lg: "30px" },
                  lineHeight: 1.15,
                }}
              >
                {area.name}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#A78BFA",
                  fontSize: { xs: "16px", md: "19px", lg: "21px" },
                }}
              >
                {area.tagline}
              </Typography>
              <Typography
                sx={{
                  color: "#E2E8F0",
                  fontSize: { xs: "16px", sm: "18px", md: "20px", lg: "21.5px" },
                  lineHeight: 1.48,
                }}
              >
                {area.desc}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Support & Follow-up Areas Banner */}
        <Box
          className="bento-card bento-hero"
          sx={{
            p: { xs: 2.5, md: 3 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <CheckIcon sx={{ color: "#34D399", fontSize: 28 }} />
            <Typography
              sx={{
                fontWeight: 850,
                color: "#FFFFFF",
                fontSize: { xs: "18px", sm: "20px", md: "23px", lg: "25px" },
              }}
            >
              Permite generar apoyo y seguimiento continuo desde las demás áreas de la empresa:
            </Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {supportAreas.map((sup, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: { xs: 1.5, md: 2 },
                  borderRadius: "12px",
                  backgroundColor: "rgba(9, 7, 26, 0.7)",
                  border: "1.5px solid rgba(139, 92, 246, 0.3)",
                }}
              >
                {sup.icon}
                <Box>
                  <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "16px", md: "19px", lg: "21px" } }}>
                    {sup.label}
                  </Typography>
                  <Typography sx={{ color: "#CBD5E1", fontSize: { xs: "13.5px", md: "16px", lg: "17px" } }}>
                    {sup.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </section>
  );
}

