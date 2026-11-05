"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Shield as ShieldIcon, CheckCircle as CheckIcon } from "@mui/icons-material";

export default function Slide00Hero() {
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
          alignItems: "center",
          textAlign: "center",
          py: { xs: 2, md: 1 },
        }}
      >
        {/* Top Badges */}
        <Box sx={{ display: "flex", gap: 2, mb: { xs: 1.5, md: 2.5 }, flexWrap: "wrap", justifyContent: "center" }}>
          <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "16px", padding: "6px 18px" }}>
            <ShieldIcon sx={{ fontSize: 18 }} /> PLATAFORMA INTEGRAL PARA SEGURIDAD PRIVADA
          </span>
          <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "16px", padding: "6px 18px" }}>
            <CheckIcon sx={{ fontSize: 18 }} /> ALINEADO CON LA SUPERINTENDENCIA Y EL MINISTERIO DE TRABAJO
          </span>
        </Box>

        {/* Prominent LORO ERP Brand */}
        <Typography
          variant="h1"
          className="hero-brand-title"
          sx={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 950,
            fontSize: { xs: "56px", sm: "84px", md: "108px", lg: "126px" },
            lineHeight: 1.02,
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
            fontWeight: 850,
            fontSize: { xs: "26px", sm: "36px", md: "44px", lg: "52px" },
            lineHeight: 1.2,
            color: "#FFFFFF",
            maxWidth: 1450,
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
            color: "#E2E8F0",
            fontSize: { xs: "17px", sm: "20px", md: "24px", lg: "27px" },
            maxWidth: 1400,
            lineHeight: 1.45,
            mb: { xs: 2.5, md: 3.5 },
          }}
        >
          Integra a sus clientes externos, sus guardas y su área administrativa en un solo todo: convirtiendo datos en decisiones para las Direcciones y control en tiempo real para las Gerencias.
        </Typography>

        {/* 4 Bottom Highlights */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
            gap: { xs: 2, md: 3 },
            width: "100%",
            maxWidth: 1580,
          }}
        >
          {[
            { label: "COMERCIAL REAL", sub: "Lo que vende se cumple desde el día uno" },
            { label: "TIENDA DE GUARDAS", sub: "Selección ágil y cero papel en RRHH" },
            { label: "OPERACIÓN EN VIVO", sub: "Novedades desde el minuto cero y alertas" },
            { label: "NÓMINA EXACTA 24/7", sub: "Basada en tiempos reales y tarifas de ley" },
          ].map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: "16px 18px", md: "22px 26px" },
                textAlign: "left",
                borderLeft: "5px solid #8B5CF6",
              }}
            >
              <Typography sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "15px", md: "18px", lg: "20px" } }}>
                {item.label}
              </Typography>
              <Typography sx={{ color: "#CBD5E1", fontSize: { xs: "13.5px", md: "16px", lg: "17.5px" }, mt: 0.8, lineHeight: 1.35 }}>
                {item.sub}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography
          sx={{
            mt: { xs: 2, md: 3 },
            fontSize: "16px",
            color: "#94A3B8",
            fontFamily: "monospace",
            fontWeight: 600,
          }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Presione [Espacio] o la flecha [→] para avanzar
          </Box>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            Deslice horizontalmente o use la barra inferior para avanzar
          </Box>
        </Typography>
      </Box>
    </section>
  );
}
