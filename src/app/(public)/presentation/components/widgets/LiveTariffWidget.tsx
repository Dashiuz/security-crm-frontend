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
        p: { xs: 2.5, sm: 3, md: 4 },
        borderRadius: "20px",
        width: "100%",
        maxWidth: 1460,
        mx: "auto",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 2, md: 3 }, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <SecurityIcon sx={{ color: "#8B5CF6", fontSize: { xs: 32, md: 40 } }} />
          <Typography variant="h6" sx={{ fontWeight: 850, color: "#FFFFFF", fontSize: { xs: "20px", md: "26px", lg: "28px" } }}>
            Calculadora de Tarifas y Rentabilidad por Puesto
          </Typography>
        </Box>
        <span className="tactical-pill tactical-pill-violet" style={{ fontSize: "14px", padding: "6px 16px" }}>SIMULADOR EN VIVO</span>
      </Box>

      {/* Control Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.2fr 1.3fr 1fr" },
          gap: { xs: 2.5, md: 3.5 },
          p: { xs: 2, md: 3 },
          backgroundColor: "rgba(10, 8, 25, 0.65)",
          borderRadius: "14px",
          border: "1.5px solid rgba(124, 58, 237, 0.3)",
          mb: { xs: 2.5, md: 3.5 },
        }}
      >
        {/* Puestos Slider */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ color: "#FFFFFF", fontSize: { xs: "16px", md: "20px" }, fontWeight: 750 }}>
              Puestos de 24 horas:
            </Typography>
            <Typography sx={{ color: "#C4B5FD", fontFamily: "monospace", fontWeight: 900, fontSize: { xs: "18px", md: "22px" } }}>
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
              height: 8,
              "& .MuiSlider-thumb": {
                width: 26,
                height: 26,
                boxShadow: "0 0 14px #8B5CF6",
              },
            }}
          />
        </Box>

        {/* Estrato Selector */}
        <Box>
          <Typography sx={{ color: "#FFFFFF", fontSize: { xs: "16px", md: "20px" }, fontWeight: 750, mb: 1.2 }}>
            Tipo de Cliente:
          </Typography>
          <ButtonGroup size="large" fullWidth>
            <Button
              variant={stratum === "residential" ? "contained" : "outlined"}
              onClick={() => setStratum("residential")}
              sx={{
                fontSize: { xs: "14px", md: "17px" },
                textTransform: "none",
                fontWeight: 800,
                py: 1.2,
                backgroundColor: stratum === "residential" ? "#7C3AED" : "transparent",
                borderColor: "rgba(124, 58, 237, 0.5)",
              }}
            >
              Residencial 1-3 (8.8)
            </Button>
            <Button
              variant={stratum === "commercial" ? "contained" : "outlined"}
              onClick={() => setStratum("commercial")}
              sx={{
                fontSize: { xs: "14px", md: "17px" },
                textTransform: "none",
                fontWeight: 800,
                py: 1.2,
                backgroundColor: stratum === "commercial" ? "#7C3AED" : "transparent",
                borderColor: "rgba(124, 58, 237, 0.5)",
              }}
            >
              Comercial / Est. 4-6 (9.77)
            </Button>
          </ButtonGroup>
        </Box>

        {/* A&S Rate */}
        <Box>
          <Typography sx={{ color: "#FFFFFF", fontSize: { xs: "16px", md: "20px" }, fontWeight: 750, mb: 1.2 }}>
            Margen Administración (A&S):
          </Typography>
          <ButtonGroup size="large" fullWidth>
            {[8, 10, 11].map((r) => (
              <Button
                key={r}
                variant={asRate === r ? "contained" : "outlined"}
                onClick={() => setAsRate(r)}
                sx={{
                  fontSize: { xs: "15px", md: "18px" },
                  fontWeight: 800,
                  py: 1.2,
                  backgroundColor: asRate === r ? "#7C3AED" : "transparent",
                  borderColor: "rgba(124, 58, 237, 0.5)",
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
          gap: 3,
        }}
      >
        {/* Total Billed */}
        <Box sx={{ p: 3, borderRadius: "14px", backgroundColor: "rgba(18, 14, 40, 0.85)", border: "1.5px solid rgba(124, 58, 237, 0.35)" }}>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px", fontWeight: 800, mb: 0.8 }}>
            PRECIO MENSUAL A COBRAR
          </Typography>
          <Typography sx={{ fontFamily: "monospace", fontSize: { xs: "26px", md: "34px", lg: "38px" }, fontWeight: 900, color: "#FFFFFF" }}>
            {formatCOP(totalBilled)}
          </Typography>
          <Typography sx={{ fontSize: "16px", color: "#A78BFA", fontWeight: 600, mt: 0.8 }}>
            {formatCOP(unitBilledPrice)} por puesto/mes
          </Typography>
        </Box>

        {/* Estimated Payroll */}
        <Box sx={{ p: 3, borderRadius: "14px", backgroundColor: "rgba(18, 14, 40, 0.85)", border: "1.5px solid rgba(124, 58, 237, 0.35)" }}>
          <Typography sx={{ color: "#CBD5E1", fontSize: "16px", fontWeight: 800, mb: 0.8 }}>
            COSTO ESTIMADO DE GUARDAS
          </Typography>
          <Typography sx={{ fontFamily: "monospace", fontSize: { xs: "26px", md: "34px", lg: "38px" }, fontWeight: 900, color: "#E2E8F0" }}>
            {formatCOP(totalPayrollCost)}
          </Typography>
          <Typography sx={{ fontSize: "16px", color: "#94A3B8", fontWeight: 600, mt: 0.8 }}>
            {postsCount * 3} vigilantes (turnos 12h / 44h ley)
          </Typography>
        </Box>

        {/* Margin Status */}
        <Box
          sx={{
            p: 3,
            borderRadius: "14px",
            backgroundColor: marginStatus.bg,
            border: `2px solid ${marginStatus.color}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 24, color: marginStatus.color }} />
            <Typography sx={{ fontSize: "16px", fontWeight: 900, color: marginStatus.color }}>
              GANANCIA ESTIMADA
            </Typography>
          </Box>
          <Typography sx={{ fontFamily: "monospace", fontSize: { xs: "32px", md: "42px", lg: "46px" }, fontWeight: 950, color: marginStatus.color }}>
            {marginPercentage.toFixed(1)}%
          </Typography>
          <Typography sx={{ fontSize: "15.5px", color: "#FFFFFF", fontWeight: 800 }}>
            {marginStatus.label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
