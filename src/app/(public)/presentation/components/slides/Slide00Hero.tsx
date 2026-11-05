"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Shield as ShieldIcon, CheckCircle as CheckIcon } from "@mui/icons-material";

export default function Slide00Hero() {
  return (
    <section>
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Top Badges */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap", justifyContent: "center" }}>
          <span className="tactical-pill tactical-pill-violet">
            <ShieldIcon sx={{ fontSize: 14 }} /> PLATAFORMA INTEGRAL PARA SEGURIDAD PRIVADA
          </span>
          <span className="tactical-pill tactical-pill-emerald">
            <CheckIcon sx={{ fontSize: 14 }} /> ALINEADO CON LA SUPERINTENDENCIA Y EL MINISTERIO DE TRABAJO
          </span>
        </Box>

        {/* Prominent LORO ERP Brand */}
        <Typography
          variant="h1"
          sx={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 950,
            fontSize: { xs: "52px", md: "82px" },
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #FFFFFF 15%, #C4B5FD 55%, #8B5CF6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "#FFFFFF",
            mb: 1.5,
          }}
        >
          LORO ERP
        </Typography>

        {/* Main Title */}
        <Typography
          variant="h2"
          sx={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: { xs: "22px", md: "32px" },
            lineHeight: 1.25,
            color: "#FFFFFF",
            maxWidth: 960,
            mb: 2,
          }}
        >
          El Sistema de Gestión Creado para Empresas de{" "}
          <Box
            component="span"
            sx={{
              background: "linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Seguridad y Vigilancia
          </Box>
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            color: "#CBD5E1",
            fontSize: { xs: "15px", md: "17.5px" },
            maxWidth: 860,
            lineHeight: 1.5,
            mb: 3.5,
          }}
        >
          Controle sus puestos en tiempo real, cotice con tarifas oficiales de la Superintendencia, gestione programaciones dinámicas de turnos y liquide la nómina de sus guardas sin demandas ni errores.
        </Typography>

        {/* 4 Bottom Highlights */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
            gap: 2,
            width: "100%",
            maxWidth: 1060,
          }}
        >
          {[
            { label: "MINUTAS EN EL CELULAR", sub: "Novedades desde el minuto cero y voz" },
            { label: "TARIFAS OFICIALES 2026", sub: "Cotice con la ley y cuide su ganancia" },
            { label: "PROGRAMACIONES DINÁMICAS", sub: "Rotación de turnos y nómina 24/7" },
            { label: "PLANOS Y MAPAS", sub: "Ubique cámaras y garitas del cliente" },
          ].map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: "14px 16px",
                textAlign: "left",
                borderLeft: "3px solid #7C3AED",
              }}
            >
              <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "12px" }}>
                {item.label}
              </Typography>
              <Typography sx={{ color: "#94A3B8", fontSize: "11px", mt: 0.3 }}>
                {item.sub}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography
          sx={{
            mt: 3.5,
            fontSize: "12px",
            color: "#64748B",
            fontFamily: "monospace",
          }}
        >
          Presione [Espacio] o la flecha [→] para avanzar
        </Typography>
      </Box>
    </section>
  );
}
