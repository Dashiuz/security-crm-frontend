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
        p: { xs: 2, md: 3 },
        borderRadius: "14px",
        width: "100%",
        maxWidth: 960,
        mx: "auto",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <QrCodeIcon sx={{ color: "#10B981", fontSize: 26 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "18px" }}>
            Generador de Códigos para Rondas, Armas y Personal
          </Typography>
        </Box>
        <span className="tactical-pill tactical-pill-emerald">CONTROL Y ORDEN</span>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" },
          gap: 3,
          alignItems: "center",
        }}
      >
        {/* Controls */}
        <Box>
          <Typography sx={{ color: "#E2E8F0", fontSize: "13.5px", mb: 1, fontWeight: 600 }}>
            ¿Para qué necesita el código? Seleccione una opción:
          </Typography>

          {/* Clean Native Select (Zero Z-Index or Portal conflicts) */}
          <select
            className="loro-native-select"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            style={{ marginBottom: "16px" }}
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
            startIcon={<RenewIcon />}
            onClick={handleGenerate}
            sx={{
              backgroundColor: "#7C3AED",
              color: "#FFFFFF",
              fontWeight: 700,
              textTransform: "none",
              py: 1.2,
              fontSize: "14px",
              boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)",
              "&:hover": { backgroundColor: "#6D28D9" },
            }}
          >
            Crear Código en 1 Clic
          </Button>

          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <span className="tactical-pill tactical-pill-violet">CÓDIGO ÚNICO</span>
            <span className="tactical-pill tactical-pill-emerald">GUARDADO EN EL SISTEMA</span>
            <span className="tactical-pill tactical-pill-amber">LEÍBLE CON PISTOLA O CELULAR</span>
          </Box>
        </Box>

        {/* Visual Code Badge */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: "10px",
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: "1.5px solid rgba(16, 185, 129, 0.4)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: 105,
              height: 105,
              backgroundColor: "#FFFFFF",
              p: 1,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)",
            }}
          >
            <QrCodeIcon sx={{ fontSize: 92, color: "#0F172A" }} />
          </Box>

          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "16px",
              fontWeight: 800,
              color: "#34D399",
              letterSpacing: 1,
              mb: 1,
            }}
          >
            {code}
          </Typography>

          <Button
            size="small"
            variant="outlined"
            startIcon={copied ? <CheckCircleIcon /> : <CopyIcon />}
            onClick={handleCopy}
            sx={{
              borderColor: copied ? "#10B981" : "rgba(148, 163, 184, 0.3)",
              color: copied ? "#10B981" : "#E2E8F0",
              fontSize: "12px",
              textTransform: "none",
              py: 0.4,
              px: 1.5,
            }}
          >
            {copied ? "¡Copiado!" : "Copiar Código"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
