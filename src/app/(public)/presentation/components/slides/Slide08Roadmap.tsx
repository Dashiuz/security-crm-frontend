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
      desc: "Asignación ágil y programaciones dinámicas de turnos: si un cliente le pide un vigilante con perfil específico, el sistema lo encuentra y programa en segundos.",
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
      desc: "Videos cortos y evaluaciones desde el celular para que sus guardas refuercen atención al cliente, primeros auxilios y protocolos del puesto.",
      icon: <ElearningIcon sx={{ color: "#F472B6" }} />,
      tag: "MEJOR SERVICIO",
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
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
            <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <RoadmapIcon sx={{ fontSize: 18 }} /> LO QUE VIENE MUY PRONTO
            </span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <PatrolIcon sx={{ fontSize: 18 }} /> SIEMPRE MEJORANDO
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
            Nuevas Funciones para Seguir Facilitando su Trabajo
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            Un sistema que crece con su empresa: continuamente agregamos herramientas prácticas para que su operación sea la más moderna del mercado.
          </Typography>
        </Box>

        {/* 6 Grid items */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 2.8 },
          }}
        >
          {items.map((item, i) => (
            <Box
              key={i}
              className="bento-card"
              sx={{
                p: { xs: 2.2, md: 3 },
                display: "flex",
                flexDirection: "column",
                borderTop: "5px solid rgba(124, 58, 237, 0.55)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 0.8 }}>
                <Box sx={{ "& svg": { fontSize: { xs: 32, md: 38 } } }}>{item.icon}</Box>
                <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "12.5px", padding: "3px 10px" }}>
                  {item.tag}
                </span>
              </Box>
              <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "19px", md: "22px", lg: "24px" }, mb: 1, lineHeight: 1.2 }}>
                {item.title}
              </Typography>
              <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "15.5px", md: "18px", lg: "19.5px" }, lineHeight: 1.48 }}>
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
