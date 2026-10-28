"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Lock } from "@mui/icons-material";

export interface FormatFooterBlockProps {
  customNotice?: string;
  showDate?: boolean;
}

export default function FormatFooterBlock({
  customNotice = "DOCUMENTO CONFIDENCIAL - PROPIEDAD EXCLUSIVA. PROHIBIDA SU REPRODUCCIÓN TOTAL O PARCIAL SIN AUTORIZACIÓN EXPRESA.",
  showDate = true,
}: FormatFooterBlockProps) {
  return (
    <Box
      sx={{
        mt: 4,
        pt: 2,
        borderTop: "1px solid #E2E8F0",
        textAlign: "center",
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mb: 0.5 }}>
        <Lock sx={{ fontSize: 13, color: "#64748B" }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "#64748B",
            letterSpacing: "0.04em",
          }}
        >
          {customNotice}
        </Typography>
      </Stack>

      {showDate && (
        <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "#94A3B8" }}>
          Generado el {"{{fecha_hoy_formal}}"} a las {"{{hora_actual}}"} por el Sistema de Gestión NOXIA.
        </Typography>
      )}
    </Box>
  );
}
