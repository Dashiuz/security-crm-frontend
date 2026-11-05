"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  AutoGraph as GraphIcon,
} from "@mui/icons-material";

export default function Slide05Commercial() {
  const points = [
    {
      title: "Tarifas Oficiales de la Superintendencia 2026",
      desc: "El sistema ya tiene cargados los valores legales: 8.8 salarios mínimos para estratos 1 a 3 y 9.77 salarios mínimos para comercio y estratos 4 a 6.",
      tag: "CUMPLIMIENTO DE LEY",
      color: "#10B981",
    },
    {
      title: "Semáforo de Ganancia en Vivo",
      desc: "Le muestra en verde, amarillo o rojo si el negocio le deja dinero o si está cobrando muy barato. Nunca más firme un contrato a pérdida.",
      tag: "CUIDE SU DINERO",
      color: "#8B5CF6",
    },
    {
      title: "Cotizaciones Elegantes en Minutos",
      desc: "Genere propuestas formales con el membrete de su empresa, desglose de puestos de vigilancia y valores agregados listas para enviar al cliente.",
      tag: "IMAGEN PROFESIONAL",
      color: "#38BDF8",
    },
    {
      title: "Puesta en Marcha Inmediata",
      desc: "Apenas el cliente acepta la cotización, se genera la orden de servicio y le llega aviso a operaciones y a talento humano para asignar los vigilantes.",
      tag: "CERO DEMORAS",
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
              <MoneyIcon sx={{ fontSize: 14 }} /> DIRECCIÓN COMERCIAL
            </span>
            <span className="tactical-pill tactical-pill-emerald">
              <GraphIcon sx={{ fontSize: 14 }} /> PRECIOS JUSTOS Y GANANCIA CLARA
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Cotice con las Tarifas de Ley sin Perder Dinero
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Calcule en segundos el valor exacto a cobrar a cada cliente según el estrato y el tipo de servicio, asegurando la rentabilidad de su empresa.
          </Typography>
        </Box>

        {/* 4 Points Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2.5,
          }}
        >
          {points.map((p, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: 2.5,
                borderLeft: `4px solid ${p.color}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "16px" }}>
                  {p.title}
                </Typography>
                <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "10px" }}>
                  {p.tag}
                </span>
              </Box>
              <Typography sx={{ color: "#CBD5E1", fontSize: "13.5px", lineHeight: 1.45 }}>
                {p.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
