"use client";

import React from "react";
import { Box, Stack, Typography, Avatar } from "@mui/material";
import { Shield, Business } from "@mui/icons-material";

export interface FormatHeaderBlockProps {
  title: string;
  code?: string;
  version?: string;
  companyName?: string;
  companyNit?: string;
  logoUrl?: string;
}

export default function FormatHeaderBlock({
  title,
  code = "FOR-GEN-01",
  version = "Versión 1.0",
  companyName = "{{empresa_razon_social}}",
  companyNit = "{{empresa_nit}}",
  logoUrl,
}: FormatHeaderBlockProps) {
  return (
    <Box
      sx={{
        border: "1px solid #CBD5E1",
        borderRadius: 1.5,
        p: 2,
        mb: 2.5,
        bgcolor: "#F8FAFC",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        {/* Identidad de la Empresa */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={logoUrl}
            sx={{
              width: 48,
              height: 48,
              bgcolor: "primary.main",
              color: "#FFFFFF",
              fontWeight: 700,
            }}
          >
            {logoUrl ? null : <Business />}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
              {companyName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
              NIT: {companyNit}
            </Typography>
          </Box>
        </Stack>

        {/* Título Central y Metadatos */}
        <Box sx={{ textAlign: { sm: "right" } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", lineHeight: 1.2 }}>
            {title || "FORMATO UNIVERSAL"}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ sm: "flex-end" }}
            sx={{ mt: 0.5 }}
          >
            <Typography
              variant="caption"
              sx={{
                bgcolor: "#E2E8F0",
                px: 1,
                py: 0.2,
                borderRadius: 1,
                fontWeight: 700,
                color: "#334155",
                fontFamily: "monospace",
              }}
            >
              {code}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
              {version}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
