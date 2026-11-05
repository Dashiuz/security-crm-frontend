"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Groups as HrIcon,
  PersonSearch as StoreIcon,
  ManageSearch as FilterIcon,
  School as CultureIcon,
  FolderSpecial as PaperlessIcon,
} from "@mui/icons-material";

export default function Slide04Rrhh() {
  const pillars = [
    {
      title: "Una 'Tienda de Guardas' Lista para el Cliente",
      badge: "SELECCIÓN ÁGIL",
      badgeClass: "tactical-pill tactical-pill-emerald",
      desc: "Usted cuenta con un catálogo organizado de su personal donde puede seleccionar en segundos al guarda cuyo perfil, cursos y experiencia se adecuan exactamente a lo que pide el potencial cliente.",
      icon: <StoreIcon sx={{ color: "#10B981", fontSize: { xs: 34, md: 42 } }} />,
      border: "rgba(16, 185, 129, 0.45)",
    },
    {
      title: "Si No Existe, lo Contratamos con Motores de Búsqueda",
      badge: "ANTICIPACIÓN REAL",
      badgeClass: "tactical-pill tactical-pill-violet",
      desc: "Creamos listas de postulados y con filtros inteligentes buscamos exactamente lo que necesitamos, anticipándonos a lo que el cliente quiere aunque no lo tengamos contratado hoy.",
      icon: <FilterIcon sx={{ color: "#A78BFA", fontSize: { xs: 34, md: 42 } }} />,
      border: "rgba(139, 92, 246, 0.45)",
    },
    {
      title: "Cultura Organizacional y Capacitación Constante",
      badge: "SELLO DE CALIDAD",
      badgeClass: "tactical-pill tactical-pill-amber",
      desc: "Seguimiento continuo a la cultura de su empresa mediante capacitaciones permanentes para que cada guarda represente con orgullo los valores y el buen trato hacia el cliente.",
      icon: <CultureIcon sx={{ color: "#F59E0B", fontSize: { xs: 34, md: 42 } }} />,
      border: "rgba(245, 158, 11, 0.45)",
    },
    {
      title: "Reducción de Espacio y Papel en Historias Laborales",
      badge: "CERO ARCHIVO MUERTO",
      badgeClass: "tactical-pill tactical-pill-emerald",
      desc: "Libere oficinas llenas de archivadores y carpetas colgantes. Toda la hoja de vida, soportes, contratos y antecedentes del guarda viven digitales y seguros en un clic.",
      icon: <PaperlessIcon sx={{ color: "#34D399", fontSize: { xs: 34, md: 42 } }} />,
      border: "rgba(52, 211, 153, 0.45)",
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
              <HrIcon sx={{ fontSize: 18 }} /> DESDE RECURSOS HUMANOS • EL TALENTO PRECISO
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
            Su Propia “Tienda de Guardas”, Selección Inteligente y Cero Papel
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
              maxWidth: 1450,
            }}
          >
            Encuentre de inmediato al vigilante ideal para cada puesto o anticípese contratando el perfil exacto que su nuevo cliente exige.
          </Typography>
        </Box>

        {/* 2x2 Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          {pillars.map((item, idx) => (
            <Box
              key={idx}
              className="bento-card"
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderLeft: `6px solid ${item.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
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
                  fontSize: { xs: "20px", sm: "22px", md: "25px", lg: "27px" },
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
      </Box>
    </section>
  );
}

