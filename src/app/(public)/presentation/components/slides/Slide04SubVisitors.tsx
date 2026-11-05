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
            <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <VisitorIcon sx={{ fontSize: 18 }} /> TRANQUILIDAD EN PORTERÍA
            </span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "15px", padding: "6px 16px" }}>
              <SuccessIcon sx={{ fontSize: 18 }} /> CERO RECLAMOS POR PAQUETES
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
            Control de Visitantes y Paquetería con Evidencia en Foto
          </Typography>
          <Typography
            sx={{
              color: "#E2E8F0",
              fontSize: { xs: "17px", sm: "20px", md: "23px", lg: "26px" },
              lineHeight: 1.45,
            }}
          >
            Se acabaron los reclamos de residentes diciendo que su encomienda se perdió o que dejaron entrar a personas desconocidas.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 2.5, md: 3.5 },
          }}
        >
          {/* Box 1: Visitantes */}
          <Box className="bento-card" sx={{ p: { xs: 2.5, md: 3.5 }, borderLeft: "6px solid #8B5CF6" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <VisitorIcon sx={{ color: "#A78BFA", fontSize: { xs: 32, md: 40 } }} />
              <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "21px", md: "25px", lg: "28px" } }}>
                Ingreso Claro de Visitantes
              </Typography>
            </Box>
            <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "16px", md: "19px", lg: "21px" }, mb: 2.5, lineHeight: 1.5 }}>
              Todo ingreso queda vinculado directamente a la torre y apartamento exacto que autorizó:
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
              {[
                "Registro rápido de cédula o documento de identidad",
                "Verificación con el residente que dio el permiso de ingreso",
                "Registro de placa si el visitante ingresa con vehículo",
                "Salida confirmada para saber exactamente quién sigue adentro",
              ].map((text, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <SuccessIcon sx={{ fontSize: 22, color: "#34D399", flexShrink: 0 }} />
                  <Typography sx={{ color: "#FFFFFF", fontSize: { xs: "15.5px", md: "18.5px", lg: "20.5px" } }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Box 2: Correspondencia */}
          <Box className="bento-card" sx={{ p: { xs: 2.5, md: 3.5 }, borderLeft: "6px solid #10B981" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <MailIcon sx={{ color: "#34D399", fontSize: { xs: 32, md: 40 } }} />
              <Typography sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "21px", md: "25px", lg: "28px" } }}>
                Paquetes con Foto y Firma de Entrega
              </Typography>
            </Box>
            <Typography sx={{ color: "#E2E8F0", fontSize: { xs: "16px", md: "19px", lg: "21px" }, mb: 2.5, lineHeight: 1.5 }}>
              El paquete se recibe, se fotografía y se entrega con la firma del residente en la pantalla:
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
              {[
                "Foto clara de la guía de Servientrega, Envia o paquete",
                "Identificación rápida del apartamento destinatario",
                "Firma del residente en el celular cuando lo recoge",
                "Historial completo con fecha, hora y guarda que lo entregó",
              ].map((text, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <SuccessIcon sx={{ fontSize: 22, color: "#34D399", flexShrink: 0 }} />
                  <Typography sx={{ color: "#FFFFFF", fontSize: { xs: "15.5px", md: "18.5px", lg: "20.5px" } }}>{text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </section>
  );
}
