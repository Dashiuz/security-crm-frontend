"use client";

import React, { useState, useMemo } from "react";
import { Box, Typography, ButtonGroup, Button, Slider } from "@mui/material";
import { Security as SecurityIcon, TrendingUp as TrendingUpIcon } from "@mui/icons-material";

export default function LiveTariffWidget() {
  const SMMLV_2026 = 1750905;
  const [stratum, setStratum] = useState<"residential" | "commercial">("commercial");
  const [asRate, setAsRate] = useState<number>(10);
  const [postsCount, setPostsCount] = useState<number>(3);

  // Calculations
  const multiplier = stratum === "residential" ? 8.8 : 9.77;
  const directBase = SMMLV_2026 * multiplier;
  const asAmount = directBase * (asRate / 100);
  const subtotal = directBase + asAmount;
  const ivaOnAiu = subtotal * 0.1 * 0.19; // 10% AIU * 19% IVA
  const unitBilledPrice = Math.round(subtotal + ivaOnAiu);
  const totalBilled = unitBilledPrice * postsCount;

  // Estimated Guard Cost (3 guards for a 24-hour post with official SVSP surcharges)
  const estimatedPayrollPerPost = 9089346;
  const totalPayrollCost = estimatedPayrollPerPost * postsCount;

  // Gross Margin
  const grossProfit = totalBilled - totalPayrollCost;
  const marginPercentage = (grossProfit / totalBilled) * 100;

  const marginStatus = useMemo(() => {
    if (marginPercentage >= 15) return { color: "#10B981", label: "🟢 BUENA GANANCIA (>=15%)", bg: "rgba(16, 185, 129, 0.15)" };
    if (marginPercentage >= 8) return { color: "#F59E0B", label: "🟡 GANANCIA AJUSTADA (8-14.9%)", bg: "rgba(245, 158, 11, 0.15)" };
    return { color: "#EF4444", label: "🔴 CUIDADO: GANANCIA MUY BAJA (<8%)", bg: "rgba(239, 68, 68, 0.15)" };
  }, [marginPercentage]);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);

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
          <SecurityIcon sx={{ color: "#8B5CF6", fontSize: 26 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "18px" }}>
            Calculadora de Tarifas y Ganancia por Puesto
          </Typography>
        </Box>
        <span className="tactical-pill tactical-pill-violet">SIMULADOR EN VIVO</span>
      </Box>

      {/* Control Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1fr" },
          gap: 2.5,
          p: 2,
          backgroundColor: "rgba(10, 8, 25, 0.6)",
          borderRadius: "10px",
          border: "1px solid rgba(124, 58, 237, 0.2)",
          mb: 2.5,
        }}
      >
        {/* Puestos Slider */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 600 }}>
              Puestos de 24 horas:
            </Typography>
            <Typography sx={{ color: "#A78BFA", fontFamily: "monospace", fontWeight: 700, fontSize: "14px" }}>
              {postsCount} {postsCount === 1 ? "Puesto" : "Puestos"}
            </Typography>
          </Box>
          <Slider
            value={postsCount}
            min={1}
            max={20}
            step={1}
            onChange={(_, val) => setPostsCount(val as number)}
            sx={{
              color: "#8B5CF6",
              "& .MuiSlider-thumb": {
                width: 18,
                height: 18,
                boxShadow: "0 0 10px #8B5CF6",
              },
            }}
          />
        </Box>

        {/* Estrato Selector */}
        <Box>
          <Typography sx={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 600, mb: 0.8 }}>
            Tipo de Cliente:
          </Typography>
          <ButtonGroup size="small" fullWidth>
            <Button
              variant={stratum === "residential" ? "contained" : "outlined"}
              onClick={() => setStratum("residential")}
              sx={{
                fontSize: "11px",
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: stratum === "residential" ? "#7C3AED" : "transparent",
                borderColor: "rgba(124, 58, 237, 0.4)",
              }}
            >
              Residencial 1-3 (8.8)
            </Button>
            <Button
              variant={stratum === "commercial" ? "contained" : "outlined"}
              onClick={() => setStratum("commercial")}
              sx={{
                fontSize: "11px",
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: stratum === "commercial" ? "#7C3AED" : "transparent",
                borderColor: "rgba(124, 58, 237, 0.4)",
              }}
            >
              Comercial / Est. 4-6 (9.77)
            </Button>
          </ButtonGroup>
        </Box>

        {/* A&S Rate */}
        <Box>
          <Typography sx={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 600, mb: 0.8 }}>
            Margen de Administración (A&S):
          </Typography>
          <ButtonGroup size="small" fullWidth>
            {[8, 10, 11].map((r) => (
              <Button
                key={r}
                variant={asRate === r ? "contained" : "outlined"}
                onClick={() => setAsRate(r)}
                sx={{
                  fontSize: "11px",
                  fontWeight: 600,
                  backgroundColor: asRate === r ? "#7C3AED" : "transparent",
                  borderColor: "rgba(124, 58, 237, 0.4)",
                }}
              >
                {r}%
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      {/* KPI Results Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.2fr 1.2fr 1fr" },
          gap: 2,
        }}
      >
        {/* Total Billed */}
        <Box sx={{ p: 1.8, borderRadius: "8px", backgroundColor: "rgba(18, 14, 40, 0.8)", border: "1px solid rgba(124, 58, 237, 0.25)" }}>
          <Typography sx={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600, mb: 0.3 }}>
            PRECIO MENSUAL SUGERIDO A COBRAR
          </Typography>
          <Typography sx={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 800, color: "#F8FAFC" }}>
            {formatCOP(totalBilled)}
          </Typography>
          <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
            {formatCOP(unitBilledPrice)} por cada puesto al mes
          </Typography>
        </Box>

        {/* Estimated Payroll */}
        <Box sx={{ p: 1.8, borderRadius: "8px", backgroundColor: "rgba(18, 14, 40, 0.8)", border: "1px solid rgba(124, 58, 237, 0.25)" }}>
          <Typography sx={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600, mb: 0.3 }}>
            COSTO ESTIMADO DE LOS VIGILANTES
          </Typography>
          <Typography sx={{ fontFamily: "monospace", fontSize: "20px", fontWeight: 800, color: "#E2E8F0" }}>
            {formatCOP(totalPayrollCost)}
          </Typography>
          <Typography sx={{ fontSize: "11px", color: "#64748B" }}>
            {postsCount * 3} vigilantes (turnos de 12 horas / 44h ley)
          </Typography>
        </Box>

        {/* Margin Status */}
        <Box
          sx={{
            p: 1.8,
            borderRadius: "8px",
            backgroundColor: marginStatus.bg,
            border: `1px solid ${marginStatus.color}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.3 }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: marginStatus.color }} />
            <Typography sx={{ fontSize: "11px", fontWeight: 700, color: marginStatus.color }}>
              GANANCIA ESTIMADA
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: "monospace", fontSize: "22px", fontWeight: 900, color: marginStatus.color }}>
            {marginPercentage.toFixed(1)}%
          </Typography>
          <Typography sx={{ fontSize: "11px", color: "#F1F5F9", fontWeight: 600 }}>
            {marginStatus.label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
