"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Map as MapIcon,
  Videocam as CameraIcon,
  CropFree as PerimeterIcon,
  Layers as LayersIcon,
} from "@mui/icons-material";

export default function Slide04SubCanva() {
  const features = [
    {
      title: "Mapa Satelital del Conjunto",
      desc: "Ubique el conjunto o empresa en el mapa satelital y dibuje el perímetro exacto de vigilancia para que el cliente vea el alcance de su servicio.",
      icon: <PerimeterIcon sx={{ color: "#38BDF8" }} />,
    },
    {
      title: "Ubicación de Cámaras y Equipos",
      desc: "Marque con íconos claros dónde están instaladas las cámaras fijas, domos, sensores de movimiento y talanqueras de parqueadero.",
      icon: <CameraIcon sx={{ color: "#34D399" }} />,
    },
    {
      title: "Carga de Planos y Fotos Reales",
      desc: "Puede subir planos de construcción o fotos tomadas en el sitio para resaltar puntos oscuros o zonas donde se requiere mayor vigilancia.",
      icon: <LayersIcon sx={{ color: "#A78BFA" }} />,
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
              <MapIcon sx={{ fontSize: 18 }} /> ESTUDIOS DE SEGURIDAD
            </span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <CameraIcon sx={{ fontSize: 18 }} /> PLANOS Y MAPAS
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
            Estudios de Seguridad Profesionales con Mapas y Cámaras
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            Presente propuestas que dejen a sus clientes con la boca abierta: mapas satelitales detallados con la ubicación de cada dispositivo de seguridad.
          </Typography>
        </Box>

        {/* 3 Columns */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {features.map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.8 },
                borderTop: "5px solid #8B5CF6",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ mb: 2, "& svg": { fontSize: { xs: 36, md: 44 } } }}>{item.icon}</Box>
              <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", md: "24px", lg: "27px" }, mb: 1.5, lineHeight: 1.2 }}>
                {item.title}
              </Typography>
              <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "16px", md: "19px", lg: "21.5px" }, lineHeight: 1.5 }}>
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
