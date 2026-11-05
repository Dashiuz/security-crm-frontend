"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  MenuBook as LogbookIcon,
  Mic as MicIcon,
  NotificationsActive as AlertIcon,
  LocalPostOffice as MailIcon,
  DirectionsCar as CarIcon,
  Badge as VisitorIcon,
  FlashOn as FlashIcon,
} from "@mui/icons-material";

export default function Slide04Operations() {
  const minutas = [
    {
      title: "Control de Visitantes",
      desc: "El guarda anota la cédula, toma la foto y el sistema verifica con el apartamento que autoriza el ingreso.",
      icon: <VisitorIcon />,
    },
    {
      title: "Control de Paquetes",
      desc: "Foto de la guía de la encomienda. El residente firma en el celular al recibirlo y queda constancia real.",
      icon: <MailIcon />,
    },
    {
      title: "Control de Parqueaderos",
      desc: "Registro de placas, tipo de vehículo y hora exacta de entrada y salida para evitar pérdidas y confusiones.",
      icon: <CarIcon />,
    },
    {
      title: "Minuta General del Turno",
      desc: "Novedades desde el minuto cero: el vigilante dicta con su voz y el sistema transcribe el texto al instante.",
      icon: <LogbookIcon />,
    },
  ];

  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <span className="tactical-pill tactical-pill-violet">
              <LogbookIcon sx={{ fontSize: 14 }} /> OPERACIÓN EN PORTERÍAS
            </span>
            <span className="tactical-pill tactical-pill-emerald">
              <FlashIcon sx={{ fontSize: 14 }} /> NOVEDADES DESDE EL MINUTO CERO
            </span>
            <span className="tactical-pill tactical-pill-amber">
              <MicIcon sx={{ fontSize: 14 }} /> DICTADO POR VOZ FÁCIL
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "26px", md: "36px" }, mb: 0.8 }}>
            Novedades desde el Minuto Cero: Minutas con Fotos y Dictado por Voz
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "15.5px" }}>
            Desde el primer minuto del servicio, el guarda reporta lo que sucede en tiempo real: habla a la aplicación, adjunta fotografías de evidencia y la gerencia se entera de inmediato.
          </Typography>
        </Box>

        {/* 4 Operations Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {minutas.map((m, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: 2.2,
                display: "flex",
                flexDirection: "column",
                borderTop: "3px solid #7C3AED",
              }}
            >
              <Box sx={{ color: "#A78BFA", mb: 1.5 }}>{m.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "15px", mb: 0.8 }}>
                {m.title}
              </Typography>
              <Typography sx={{ color: "#CBD5E1", fontSize: "12.8px", lineHeight: 1.45 }}>
                {m.desc}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Escalation Alert Bar */}
        <Box
          className="bento-card"
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            backgroundColor: "rgba(30, 20, 60, 0.7)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
          }}
        >
          <AlertIcon sx={{ color: "#F59E0B", fontSize: 26, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, color: "#FFFFFF", fontSize: "14px" }}>
              Alertas Automáticas para Incidentes Graves
            </Typography>
            <Typography sx={{ color: "#CBD5E1", fontSize: "12.5px" }}>
              Si ocurre una novedad delicada (un conato de robo, daño o emergencia), el sistema le avisa de inmediato al supervisor y a la gerencia por correo y notificación en la aplicación.
            </Typography>
          </Box>
        </Box>
      </Box>
    </section>
  );
}
