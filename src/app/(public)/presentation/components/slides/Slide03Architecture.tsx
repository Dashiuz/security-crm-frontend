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
      icon: <SecurityIcon sx={{ fontSize: 24, color: "#8B5CF6" }} />,
    },
    {
      title: "Cero Trampas: Nada se Borra a Escondidas",
      desc: "Si alguien intenta cambiar o anular un registro, el sistema guarda de inmediato quién fue, a qué hora exacta y con qué justificación. Todo queda registrado.",
      icon: <AuditIcon sx={{ fontSize: 24, color: "#10B981" }} />,
    },
    {
      title: "Fotos y Firmas Guardadas para Siempre",
      desc: "Las fotos de paquetes, cédulas, daños o carros no se borran ni llenan la memoria de los celulares. Quedan archivadas en la nube para cuando las necesite.",
      icon: <CloudIcon sx={{ fontSize: 24, color: "#38BDF8" }} />,
    },
    {
      title: "Funciona 24 Horas sin Caerse ni Ponerse Lento",
      desc: "Usted no tiene que comprar servidores costosos ni contratar técnicos. Puede entrar desde su celular, tablet o computador en cualquier momento con total rapidez.",
      icon: <TrustIcon sx={{ fontSize: 24, color: "#F59E0B" }} />,
    },
  ];

  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <span className="tactical-pill tactical-pill-emerald">
              <TrustIcon sx={{ fontSize: 14 }} /> TRANQUILIDAD Y CONFIANZA
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            ¿Por Qué su Información Está 100% Segura?
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Usted no tiene que preocuparse por servidores, virus ni respaldos manuales. Nosotros nos encargamos de que todo esté disponible cuando lo necesite.
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
                borderLeft: "3px solid #8B5CF6",
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "10px",
                  backgroundColor: "rgba(124, 58, 237, 0.15)",
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "16px", mb: 0.6 }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: "#CBD5E1", fontSize: "13.5px", lineHeight: 1.45 }}>
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
