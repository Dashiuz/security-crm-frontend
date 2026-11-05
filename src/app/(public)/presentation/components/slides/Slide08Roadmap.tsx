"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  RocketLaunch as RoadmapIcon,
  Sensors as PatrolIcon,
  FaceRetouchingNatural as BiometricIcon,
  PhoneInTalk as IntercomIcon,
  Psychology as AiIcon,
  Inventory as WarehouseIcon,
  School as ElearningIcon,
} from "@mui/icons-material";

export default function Slide08Roadmap() {
  const items = [
    {
      title: "Rondas en Vivo con GPS",
      desc: "Supervise en tiempo real que el vigilante cumpla los recorridos nocturnos marcando cada punto desde su celular con ubicación exacta.",
      icon: <PatrolIcon sx={{ color: "#38BDF8" }} />,
      tag: "EN DESARROLLO",
    },
    {
      title: "Relevo con Foto y Ubicación",
      desc: "El guarda se toma una foto al iniciar y terminar el turno. Así usted sabe con certeza quién está en el puesto y a qué hora llegó.",
      icon: <BiometricIcon sx={{ color: "#818CF8" }} />,
      tag: "PRÓXIMAMENTE",
    },
    {
      title: "Citofonía en el Celular",
      desc: "La portería se comunica directo con los residentes sin necesidad de cables viejos ni conmutadores costosos que se dañan con la lluvia.",
      icon: <IntercomIcon sx={{ color: "#A78BFA" }} />,
      tag: "COMODIDAD",
    },
    {
      title: "Programaciones Dinámicas con el 'Guarda Ideal'",
      desc: "Asignación ágil y programaciones dinámicas de turnos: si un cliente le pide un vigilante con libreta de primera clase o curso de escolta, el sistema se lo encuentra y programa en segundos.",
      icon: <AiIcon sx={{ color: "#34D399" }} />,
      tag: "RAPIDEZ",
    },
    {
      title: "Control de Armamento y Dotación",
      desc: "Inventario claro de revólveres, escopetas, chalecos y uniformes con alertas de vencimiento de salvoconductos para evitar decomisos.",
      icon: <WarehouseIcon sx={{ color: "#FBBF24" }} />,
      tag: "INVENTARIO AL DÍA",
    },
    {
      title: "Cursos y Capacitación en Video",
      desc: "Videos cortos y evaluaciones desde el celular para que sus guardas refuercen atención al cliente, primeros auxilios y protocolos de seguridad.",
      icon: <ElearningIcon sx={{ color: "#F472B6" }} />,
      tag: "MEJOR SERVICIO",
    },
  ];

  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <span className="tactical-pill tactical-pill-violet">
              <RoadmapIcon sx={{ fontSize: 14 }} /> LO QUE VIENE MUY PRONTO
            </span>
            <span className="tactical-pill tactical-pill-emerald">
              <PatrolIcon sx={{ fontSize: 14 }} /> SIEMPRE MEJORANDO
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Nuevas Funciones para Seguir Facilitando su Trabajo
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Un sistema que crece con su empresa: continuamente agregamos herramientas prácticas para que su operación sea la más moderna del mercado.
          </Typography>
        </Box>

        {/* 6 Grid items */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {items.map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                borderTop: "3px solid rgba(124, 58, 237, 0.4)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Box>{item.icon}</Box>
                <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "9.5px", padding: "1px 7px" }}>
                  {item.tag}
                </span>
              </Box>
              <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "15px", mb: 0.5 }}>
                {item.title}
              </Typography>
              <Typography sx={{ color: "#CBD5E1", fontSize: "12.5px", lineHeight: 1.4 }}>
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
