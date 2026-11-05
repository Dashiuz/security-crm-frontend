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
      icon: <ClockIcon sx={{ color: "#38BDF8" }} />,
      tag: "LEGISLACIÓN LABORAL",
    },
    {
      title: "Incapacidades Médicas y Cobro a la EPS",
      desc: "Lleva el control de los días que paga la empresa y los que debe pagar la EPS o la ARL, para que no pierda ese dinero y pueda radicar el cobro a tiempo.",
      icon: <MedicalIcon sx={{ color: "#F87171" }} />,
      tag: "RECUPERE SU DINERO",
    },
    {
      title: "Control de Préstamos y Descuentos",
      desc: "Descuenta cuotas quincenales automáticamente respetando el límite legal para que el trabajador reciba lo justo sin problemas con el Ministerio de Trabajo.",
      icon: <SalaryIcon sx={{ color: "#FBBF24" }} />,
      tag: "TODO EN ORDEN",
    },
    {
      title: "Pagos a Bancos en un Solo Clic",
      desc: "Genera el archivo para Bancolombia, Banco de Bogotá, Davivienda o Caja Social. Sube el archivo al portal de su banco y paga la nómina en segundos.",
      icon: <BankIcon sx={{ color: "#34D399" }} />,
      tag: "PAGO PUNTUAL",
    },
  ];

  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <span className="tactical-pill tactical-pill-violet">
              <BankIcon sx={{ fontSize: 14 }} /> DIRECCIÓN DE FINANZAS
            </span>
            <span className="tactical-pill tactical-pill-violet">
              <ShiftIcon sx={{ fontSize: 14 }} /> PROGRAMACIONES DINÁMICAS
            </span>
            <span className="tactical-pill tactical-pill-emerald">
              <ComplianceIcon sx={{ fontSize: 14 }} /> NÓMINA EXACTA SIN DEMANDAS
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Nómina Especializada y Programaciones Dinámicas
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Liquidación precisa de turnos y programaciones dinámicas de guardas 24/7 sin planillas enredadas de Excel ni riesgos de reclamos laborales.
          </Typography>
        </Box>

        {/* 4 Pillars Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2.5,
          }}
        >
          {pillars.map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: 2.5,
                borderLeft: "4px solid #7C3AED",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  {item.icon}
                  <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "16px" }}>
                    {item.title}
                  </Typography>
                </Box>
                <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "10px" }}>
                  {item.tag}
                </span>
              </Box>
              <Typography sx={{ color: "#CBD5E1", fontSize: "13.5px", lineHeight: 1.45 }}>
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
