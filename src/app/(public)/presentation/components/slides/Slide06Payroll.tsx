"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  AccountBalance as BankIcon,
  Schedule as ClockIcon,
  MedicalServices as MedicalIcon,
  MonetizationOn as SalaryIcon,
  CheckCircle as ComplianceIcon,
  EventRepeat as ShiftIcon,
} from "@mui/icons-material";

export default function Slide06Payroll() {
  const pillars = [
    {
      title: "Programaciones Dinámicas y Turnos 24/7 (Ley 2101)",
      desc: "Malla flexible para programaciones dinámicas y rotación de guardas por puesto. Calcula con exactitud recargos nocturnos, dominicales y festivos según la ley colombiana.",
      icon: <ClockIcon sx={{ color: "#38BDF8", fontSize: { xs: 30, md: 36 } }} />,
      tag: "LEGISLACIÓN LABORAL",
    },
    {
      title: "Incapacidades Médicas y Cobro a la EPS",
      desc: "Lleva el control de los días que paga la empresa y los que debe pagar la EPS o la ARL, para que no pierda ese dinero y pueda radicar el cobro a tiempo.",
      icon: <MedicalIcon sx={{ color: "#F87171", fontSize: { xs: 30, md: 36 } }} />,
      tag: "RECUPERE SU DINERO",
    },
    {
      title: "Control de Préstamos y Descuentos",
      desc: "Descuenta cuotas quincenales automáticamente respetando el límite legal para que el trabajador reciba lo justo sin problemas con el Ministerio de Trabajo.",
      icon: <SalaryIcon sx={{ color: "#FBBF24", fontSize: { xs: 30, md: 36 } }} />,
      tag: "TODO EN ORDEN",
    },
    {
      title: "Pagos a Bancos en un Solo Clic",
      desc: "Genera el archivo para Bancolombia, Banco de Bogotá, Davivienda o Caja Social. Sube el archivo al portal de su banco y paga la nómina en segundos.",
      icon: <BankIcon sx={{ color: "#34D399", fontSize: { xs: 30, md: 36 } }} />,
      tag: "PAGO PUNTUAL",
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
              <BankIcon sx={{ fontSize: 18 }} /> DIRECCIÓN DE FINANZAS
            </span>
            <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <ShiftIcon sx={{ fontSize: 18 }} /> PROGRAMACIONES DINÁMICAS
            </span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <ComplianceIcon sx={{ fontSize: 18 }} /> NÓMINA BASADA EN TIEMPOS REALES
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
            Nómina Especializada y Programaciones Dinámicas
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            Liquidación precisa de turnos y programaciones dinámicas de guardas 24/7 sin planillas enredadas de Excel ni riesgos de reclamos laborales.
          </Typography>
        </Box>

        {/* 4 Pillars Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {pillars.map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderLeft: "6px solid #7C3AED",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {item.icon}
                  <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", sm: "22px", md: "24px", lg: "26px" }, lineHeight: 1.2 }}>
                    {item.title}
                  </Typography>
                </Box>
                <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "13px", padding: "4px 12px" }}>
                  {item.tag}
                </span>
              </Box>
              <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "16px", sm: "18px", md: "20px", lg: "22px" }, lineHeight: 1.5 }}>
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
