"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  LocalPostOffice as MailIcon,
  Badge as VisitorIcon,
  CheckCircle as SuccessIcon,
} from "@mui/icons-material";

export default function Slide04SubVisitors() {
  return (
    <section>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <span className="tactical-pill tactical-pill-violet">
              <VisitorIcon sx={{ fontSize: 14 }} /> TRANQUILIDAD EN PORTERÍA
            </span>
            <span className="tactical-pill tactical-pill-emerald">
              <SuccessIcon sx={{ fontSize: 14 }} /> CERO RECLAMOS POR PAQUETES
            </span>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "28px", md: "38px" } }}>
            Control de Visitantes y Paquetería con Evidencia en Foto
          </Typography>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px" }}>
            Se acabaron los reclamos de residentes diciendo que su encomienda se perdió o que dejaron entrar a personas desconocidas.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {/* Box 1: Visitantes */}
          <Box className="bento-card" sx={{ p: 2.5, borderLeft: "4px solid #8B5CF6" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <VisitorIcon sx={{ color: "#A78BFA", fontSize: 26 }} />
              <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "17px" }}>
                Ingreso Claro de Visitantes
              </Typography>
            </Box>
            <Typography sx={{ color: "#CBD5E1", fontSize: "13.5px", mb: 2, lineHeight: 1.5 }}>
              Todo ingreso queda vinculado directamente a la torre y apartamento exacto que autorizó:
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {[
                "Registro rápido de cédula o documento de identidad",
                "Verificación con el residente que dio el permiso de ingreso",
                "Registro de placa si el visitante ingresa con vehículo",
                "Salida confirmada para saber exactamente quién sigue adentro",
              ].map((text, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SuccessIcon sx={{ fontSize: 16, color: "#34D399" }} />
                  <Typography sx={{ color: "#E2E8F0", fontSize: "13px" }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Box 2: Correspondencia */}
          <Box className="bento-card" sx={{ p: 2.5, borderLeft: "4px solid #10B981" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <MailIcon sx={{ color: "#34D399", fontSize: 26 }} />
              <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "17px" }}>
                Paquetes con Foto y Firma de Entrega
              </Typography>
            </Box>
            <Typography sx={{ color: "#CBD5E1", fontSize: "13.5px", mb: 2, lineHeight: 1.5 }}>
              El paquete se recibe, se fotografía y se entrega con la firma del residente en la pantalla:
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
              {[
                "Foto clara de la guía de Servientrega, Envia o paquete",
                "Identificación rápida del apartamento destinatario",
                "Firma del residente en el celular cuando lo recoge",
                "Historial completo con fecha, hora y guarda que lo entregó",
              ].map((text, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SuccessIcon sx={{ fontSize: 16, color: "#34D399" }} />
                  <Typography sx={{ color: "#E2E8F0", fontSize: "13px" }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </section>
  );
}
