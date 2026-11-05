"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Lock as SecurityIcon,
  CloudDone as CloudIcon,
  VerifiedUser as TrustIcon,
  HistoryEdu as AuditIcon,
} from "@mui/icons-material";

export default function Slide03Architecture() {
  const pillars = [
    {
      title: "Su Información es Solo Suya y de Nadie Más",
      desc: "Cada empresa de seguridad tiene un espacio privado y aislado. Ningún cliente, competidor ni usuario no autorizado puede ver sus tarifas, contratos o empleados.",
      icon: <SecurityIcon sx={{ fontSize: 32, color: "#8B5CF6" }} />,
    },
    {
      title: "Cero Trampas: Nada se Borra a Escondidas",
      desc: "Si alguien intenta cambiar o anular un registro, el sistema guarda de inmediato quién fue, a qué hora exacta y con qué justificación. Todo queda registrado.",
      icon: <AuditIcon sx={{ fontSize: 32, color: "#10B981" }} />,
    },
    {
      title: "Fotos y Firmas Guardadas para Siempre",
      desc: "Las fotos de paquetes, cédulas, daños o carros no se borran ni llenan la memoria de los celulares. Quedan archivadas en la nube para cuando las necesite.",
      icon: <CloudIcon sx={{ fontSize: 32, color: "#38BDF8" }} />,
    },
    {
      title: "Funciona 24 Horas sin Caerse ni Ponerse Lento",
      desc: "Usted no tiene que comprar servidores costosos ni contratar técnicos. Puede entrar desde su celular, tablet o computador en cualquier momento con total rapidez.",
      icon: <TrustIcon sx={{ fontSize: 32, color: "#F59E0B" }} />,
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
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <TrustIcon sx={{ fontSize: 18 }} /> TRANQUILIDAD Y CONFIANZA
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
            ¿Por Qué su Información Está 100% Segura?
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            Usted no tiene que preocuparse por servidores, virus ni respaldos manuales. Nosotros nos encargamos de que todo esté disponible cuando lo necesite.
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
                borderLeft: "6px solid #8B5CF6",
                display: "flex",
                gap: { xs: 2, md: 2.8 },
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: { xs: 52, md: 62 },
                  height: { xs: 52, md: 62 },
                  borderRadius: "14px",
                  backgroundColor: "rgba(124, 58, 237, 0.18)",
                  border: "1.5px solid rgba(124, 58, 237, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", sm: "22px", md: "25px", lg: "27px" }, mb: 1, lineHeight: 1.2 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "16px", sm: "18px", md: "20px", lg: "22px" }, lineHeight: 1.5 }}>
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
