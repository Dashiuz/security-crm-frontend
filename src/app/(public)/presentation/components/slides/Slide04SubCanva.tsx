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
      icon: <PerimeterIcon sx={{ color: "#38BDF8", fontSize: 26 }} />,
    },
    {
      title: "Ubicación de Cámaras y Equipos",
      desc: "Marque con íconos claros dónde están instaladas las cámaras fijas, domos, sensores de movimiento y talanqueras de parqueadero.",
      icon: <CameraIcon sx={{ color: "#34D399", fontSize: 26 }} />,
    },
    {
      title: "Carga de Planos y Fotos Reales",
      desc: "Puede subir planos de construcción o fotos tomadas en el sitio para resaltar puntos oscuros o zonas donde se requiere mayor vigilancia.",
      icon: <LayersIcon sx={{ color: "#A78BFA", fontSize: 26 }} />,
    },
  ];

  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <span className="tactical-pill tactical-pill-violet">
              <MapIcon sx={{ fontSize: 14 }} /> ESTUDIOS DE SEGURIDAD
            </span>
            <span className="tactical-pill tactical-pill-emerald">
              <CameraIcon sx={{ fontSize: 14 }} /> PLANOS Y MAPAS
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Estudios de Seguridad Profesionales con Mapas y Cámaras
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Presente propuestas que dejen a sus clientes con la boca abierta: mapas satelitales detallados con la ubicación de cada dispositivo de seguridad.
          </Typography>
        </Box>

        {/* 3 Columns */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2.5,
          }}
        >
          {features.map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: 2.5,
                borderTop: "3.5px solid #7C3AED",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ mb: 1.5 }}>{item.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "16px", mb: 1 }}>
                {item.title}
              </Typography>
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
