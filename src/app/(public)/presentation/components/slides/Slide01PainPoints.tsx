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
      icon: <PaperIcon sx={{ fontSize: { xs: 30, md: 38 }, color: "#EF4444" }} />,
      tag: "QUEJAS DE CLIENTES",
    },
    {
      title: "Archivos de Excel que se Descuadran",
      desc: "Cotizar en hojas de cálculo con fórmulas viejas es un peligro. Si una fórmula falla, su empresa puede terminar cobrando por debajo del costo real del servicio.",
      icon: <ExcelIcon sx={{ fontSize: { xs: 30, md: 38 }, color: "#F59E0B" }} />,
      tag: "PÉRDIDA DE DINERO",
    },
    {
      title: "Enredos Pagando Turnos de 12 Horas",
      desc: "Calcular turnos rotativos, horas nocturnas, festivos y la nueva jornada de 44 horas a mano quita días enteros y expone a su empresa a demandas de guardas inconformes.",
      icon: <LegalIcon sx={{ fontSize: { xs: 30, md: 38 }, color: "#EF4444" }} />,
      tag: "DEMANDAS LABORALES",
    },
    {
      title: "El Estrés con la Superintendencia",
      desc: "Tener que armar reportes de personal (RENOVA) a última hora, vigilar que los cursos no se venzan y cuidar que las tarifas cumplan con la ley para evitar sanciones.",
      icon: <PenaltyIcon sx={{ fontSize: { xs: 30, md: 38 }, color: "#F59E0B" }} />,
      tag: "MULTAS Y SANCIONES",
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
            <span className="tactical-pill tactical-pill-rose" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <WarningIcon sx={{ fontSize: 18 }} /> LO QUE VIVIMOS A DIARIO
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
            Los 4 Dolores de Cabeza Más Comunes en Seguridad
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            Los programas de contabilidad genéricos no fueron hechos para empresas que cuidan vidas y bienes 24 horas al día.
          </Typography>
        </Box>

        {/* 4 Pain Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {pains.map((p, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderLeft: "6px solid #EF4444",
                backgroundColor: "rgba(20, 15, 35, 0.92)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.8, flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {p.icon}
                  <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", sm: "22px", md: "25px", lg: "27px" } }}>
                    {p.title}
                  </Typography>
                </Box>
                <span className="tactical-pill tactical-pill-rose" style={{ fontSize: "13px", padding: "4px 12px" }}>{p.tag}</span>
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
