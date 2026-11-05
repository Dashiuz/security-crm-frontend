"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  WarningAmber as WarningIcon,
  MenuBook as PaperIcon,
  TableChart as ExcelIcon,
  Gavel as LegalIcon,
  ReportProblem as PenaltyIcon,
} from "@mui/icons-material";

export default function Slide01PainPoints() {
  const pains = [
    {
      title: "Minutas y Cuadernos de Papel",
      desc: "Cuadernos manchados con letra difícil de entender. Cuando se pierde un paquete o hay un rayón en un carro, no hay foto ni prueba clara para responderle al cliente.",
      icon: <PaperIcon sx={{ fontSize: 26, color: "#EF4444" }} />,
      tag: "QUEJAS DE CLIENTES",
    },
    {
      title: "Archivos de Excel que se Descuadran",
      desc: "Cotizar en hojas de cálculo con fórmulas viejas es un peligro. Si una fórmula falla, su empresa puede terminar cobrando por debajo del costo real del servicio.",
      icon: <ExcelIcon sx={{ fontSize: 26, color: "#F59E0B" }} />,
      tag: "PÉRDIDA DE DINERO",
    },
    {
      title: "Enredos Pagando Turnos de 12 Horas",
      desc: "Calcular turnos rotativos, horas nocturnas, festivos y la nueva jornada de 44 horas a mano quita días enteros y expone a su empresa a demandas de guardas inconformes.",
      icon: <LegalIcon sx={{ fontSize: 26, color: "#EF4444" }} />,
      tag: "DEMANDAS LABORALES",
    },
    {
      title: "El Estrés con la Superintendencia",
      desc: "Tener que armar reportes de personal (RENOVA) a última hora, vigilar que los cursos no se venzan y cuidar que las tarifas cumplan con la ley para evitar sanciones.",
      icon: <PenaltyIcon sx={{ fontSize: 26, color: "#F59E0B" }} />,
      tag: "MULTAS Y SANCIONES",
    },
  ];

  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <span className="tactical-pill tactical-pill-rose">
              <WarningIcon sx={{ fontSize: 14 }} /> LO QUE VIVIMOS A DIARIO
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Los 4 Dolores de Cabeza Más Comunes en Seguridad
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Los programas de contabilidad genéricos no fueron hechos para empresas que cuidan vidas y bienes 24 horas al día.
          </Typography>
        </Box>

        {/* 4 Pain Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2.5,
          }}
        >
          {pains.map((p, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: 2.5,
                borderLeft: "4px solid #EF4444",
                backgroundColor: "rgba(20, 15, 35, 0.9)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {p.icon}
                  <Typography sx={{ fontWeight: 800, color: "#F8FAFC", fontSize: "16px" }}>
                    {p.title}
                  </Typography>
                </Box>
                <span className="tactical-pill tactical-pill-rose">{p.tag}</span>
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
