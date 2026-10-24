"use client";

import React from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import {
  ShieldOutlined,
  VerifiedOutlined,
  BusinessOutlined,
  SecurityOutlined,
} from "@mui/icons-material";
import { DocumentHeaderLayout } from "@/lib/api/commercial-settings";

interface HeaderLayoutPreviewCardProps {
  layout: DocumentHeaderLayout;
  companyName: string;
  companyNit: string;
  supervigilanciaLicense: string;
  primaryColor: string;
  accentColor: string;
  city?: string;
  proposalNumber?: string;
}

export default function HeaderLayoutPreviewCard({
  layout,
  companyName,
  companyNit,
  supervigilanciaLicense,
  primaryColor,
  accentColor,
  city = "Bogotá D.C., Colombia",
  proposalNumber = "PROP-2026-0084",
}: HeaderLayoutPreviewCardProps) {
  const effectiveCompanyName = companyName || "Seguridad Explorer LTDA";
  const effectiveNit = companyNit || "900.000.000-1";
  const effectiveLicense = supervigilanciaLicense || "RES-2024-SVSP-004921";

  // 1. MINIMALISTA MODERNO
  if (layout === DocumentHeaderLayout.MODERN_MINIMALIST) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "#FFFFFF",
          borderLeft: `7px solid ${accentColor}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          transition: "all 0.25s ease",
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, color: primaryColor, letterSpacing: "0.02em" }}
            >
              {effectiveCompanyName}
            </Typography>
            <Chip
              label="MINIMALISTA MODERNO"
              size="small"
              sx={{
                bgcolor: `${accentColor}18`,
                color: accentColor,
                fontWeight: 700,
                fontSize: "0.62rem",
                height: 18,
              }}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            NIT: {effectiveNit} • SVSP: {effectiveLicense}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem" }}>
            {city}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <Chip
            label={proposalNumber}
            size="small"
            sx={{
              bgcolor: primaryColor,
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.75rem",
              borderRadius: 1.5,
            }}
          />
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
            Fecha de Emisión: 24/10/2026
          </Typography>
        </Box>
      </Paper>
    );
  }

  // 2. CLÁSICO CORPORATIVO
  if (layout === DocumentHeaderLayout.CLASSIC_CORPORATE) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          border: `1px solid ${primaryColor}40`,
          transition: "all 0.25s ease",
        }}
      >
        <Box
          sx={{
            p: 2.5,
            bgcolor: primaryColor,
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <BusinessOutlined sx={{ fontSize: 20, color: "#FFFFFF" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "0.03em" }}>
                {effectiveCompanyName}
              </Typography>
              <Chip
                label="CLÁSICO CORPORATIVO"
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.62rem",
                  height: 18,
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ opacity: 0.9, display: "block" }}>
              NIT: {effectiveNit} | SuperVigilancia: {effectiveLicense}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {proposalNumber}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block" }}>
              {city}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ height: 4, bgcolor: accentColor }} />
      </Paper>
    );
  }

  // 3. EDITORIAL CENTRADO
  if (layout === DocumentHeaderLayout.EDITORIAL_CENTERED) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "#FAFAFA",
          textAlign: "center",
          transition: "all 0.25s ease",
        }}
      >
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 0.5 }}>
          <ShieldOutlined sx={{ fontSize: 22, color: accentColor }} />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              color: primaryColor,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {effectiveCompanyName}
          </Typography>
        </Stack>

        <Box sx={{ maxWidth: 360, mx: "auto", my: 1 }}>
          <Divider sx={{ borderColor: primaryColor, borderWidth: 1, mb: 0.3 }} />
          <Divider sx={{ borderColor: accentColor, borderWidth: 1 }} />
        </Box>

        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block" }}>
          NIT: {effectiveNit} • RESOLUCIÓN SVSP: {effectiveLicense} • {city}
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
          <Chip
            label="EDITORIAL CENTRADO"
            size="small"
            sx={{
              bgcolor: `${primaryColor}15`,
              color: primaryColor,
              fontWeight: 700,
              fontSize: "0.62rem",
              height: 18,
            }}
          />
          <Chip
            label={proposalNumber}
            size="small"
            variant="outlined"
            sx={{
              borderColor: accentColor,
              color: accentColor,
              fontWeight: 700,
              fontSize: "0.62rem",
              height: 18,
            }}
          />
        </Stack>
      </Paper>
    );
  }

  // 4. MARCO CON ACREDITACIONES
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: `2px solid ${primaryColor}`,
        bgcolor: "#FFFFFF",
        position: "relative",
        transition: "all 0.25s ease",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <SecurityOutlined sx={{ color: primaryColor, fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: primaryColor }}>
              {effectiveCompanyName}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            NIT: {effectiveNit} • LICENCIA SVSP: {effectiveLicense}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem" }}>
            {city} • {proposalNumber}
          </Typography>
        </Box>

        {/* Sellos de Certificación y Acreditación */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            icon={<VerifiedOutlined sx={{ fontSize: "14px !important" }} />}
            label="ISO 9001:2015"
            size="small"
            sx={{ bgcolor: "#05966915", color: "#059669", fontWeight: 700, fontSize: "0.65rem", height: 22 }}
          />
          <Chip
            icon={<SecurityOutlined sx={{ fontSize: "14px !important" }} />}
            label="BASC CERTIFIED"
            size="small"
            sx={{ bgcolor: "#2563EB15", color: "#2563EB", fontWeight: 700, fontSize: "0.65rem", height: 22 }}
          />
          <Chip
            label="VIGILADA SUPERVIGILANCIA"
            size="small"
            sx={{ bgcolor: `${accentColor}18`, color: accentColor, fontWeight: 700, fontSize: "0.65rem", height: 22 }}
          />
        </Stack>
      </Box>
    </Paper>
  );
}
