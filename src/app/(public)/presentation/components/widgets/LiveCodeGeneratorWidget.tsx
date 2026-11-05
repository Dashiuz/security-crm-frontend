"use client";

import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import {
  QrCode2 as QrCodeIcon,
  Autorenew as RenewIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";

const PURPOSES = [
  { id: "PATROL", label: "Punto de Marcación de Ronda (Garita, Parqueadero o Terraza)", prefix: "RND" },
  { id: "WEAPON", label: "Control de Armamento (Revólver .38 / Escopeta)", prefix: "ARM" },
  { id: "CREDENTIAL", label: "Carnet de Guardia con su Acreditación", prefix: "CRD" },
  { id: "BIKE", label: "Control de Bicicleta o Vehículo del Residente", prefix: "VEH" },
];

export default function LiveCodeGeneratorWidget() {
  const [purpose, setPurpose] = useState(PURPOSES[0].id);
  const [code, setCode] = useState("LORO-RND-2026-9A4B");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const p = PURPOSES.find((item) => item.id === purpose) || PURPOSES[0];
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const newCode = `LORO-${p.prefix}-2026-${randomHex}`;
    setCode(newCode);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      className="bento-card bento-hero"
      sx={{
        p: { xs: 2.5, sm: 3, md: 4 },
        borderRadius: "20px",
        width: "100%",
        maxWidth: 1380,
        mx: "auto",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, md: 3 }, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <QrCodeIcon sx={{ color: "#10B981", fontSize: { xs: 32, md: 40 } }} />
          <Typography variant="h6" sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", md: "26px", lg: "28px" } }}>
            Generador de Códigos para Rondas, Armas y Personal
          </Typography>
        </Box>
        <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "14px", padding: "6px 16px" }}>CONTROL Y ORDEN</span>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" },
          gap: { xs: 2.5, md: 4 },
          alignItems: "center",
        }}
      >
        {/* Controls */}
        <Box>
          <Typography sx={{ color: "#FFFFFF", fontSize: { xs: "16px", md: "20px" }, mb: 1.5, fontWeight: 750 }}>
            ¿Para qué necesita el código? Seleccione una opción:
          </Typography>

          {/* Clean Native Select */}
          <select
            className="loro-native-select"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            style={{ marginBottom: "20px", fontSize: "18px", padding: "14px 18px" }}
          >
            {PURPOSES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="contained"
            fullWidth
            startIcon={<RenewIcon sx={{ fontSize: 24 }} />}
            onClick={handleGenerate}
            sx={{
              backgroundColor: "#7C3AED",
              color: "#FFFFFF",
              fontWeight: 850,
              textTransform: "none",
              py: 1.6,
              fontSize: { xs: "16px", md: "20px" },
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(124, 58, 237, 0.45)",
              "&:hover": { backgroundColor: "#6D28D9" },
            }}
          >
            Crear Código en 1 Clic
          </Button>

          <Box sx={{ mt: 2, display: "flex", gap: 1.2, flexWrap: "wrap" }}>
            <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "13px", padding: "4px 12px" }}>CÓDIGO ÚNICO</span>
            <span className="tactical-pill tactical-pill-emerald" style={{ fontSize: "13px", padding: "4px 12px" }}>GUARDADO EN EL SISTEMA</span>
            <span className="tactical-pill tactical-pill-amber" style={{ fontSize: "13px", padding: "4px 12px" }}>LEÍBLE CON CELULAR</span>
          </Box>
        </Box>

        {/* Visual Code Badge */}
        <Box
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "16px",
            backgroundColor: "rgba(15, 23, 42, 0.92)",
            border: "2px solid rgba(16, 185, 129, 0.45)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: { xs: 110, md: 135 },
              height: { xs: 110, md: 135 },
              backgroundColor: "#FFFFFF",
              p: 1.2,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.8,
              boxShadow: "0 0 24px rgba(16, 185, 129, 0.25)",
            }}
          >
            <QrCodeIcon sx={{ fontSize: { xs: 95, md: 120 }, color: "#0F172A" }} />
          </Box>

          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: { xs: "18px", md: "23px" },
              fontWeight: 900,
              color: "#34D399",
              letterSpacing: 1.2,
              mb: 1.5,
            }}
          >
            {code}
          </Typography>

          <Button
            size="medium"
            variant="outlined"
            startIcon={copied ? <CheckCircleIcon /> : <CopyIcon />}
            onClick={handleCopy}
            sx={{
              borderColor: copied ? "#10B981" : "rgba(148, 163, 184, 0.4)",
              color: copied ? "#10B981" : "#FFFFFF",
              fontSize: "15px",
              fontWeight: 700,
              textTransform: "none",
              py: 0.8,
              px: 2.5,
              borderRadius: "8px",
            }}
          >
            {copied ? "¡Copiado!" : "Copiar Código"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
