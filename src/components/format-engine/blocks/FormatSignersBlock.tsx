"use client";

import React from "react";
import { Box, Stack, Typography, Grid } from "@mui/material";
import { Draw, Verified } from "@mui/icons-material";

export interface FormatSignersBlockProps {
  leftSignerName?: string;
  leftSignerTitle?: string;
  leftSignerDoc?: string;
  rightSignerName?: string;
  rightSignerTitle?: string;
  rightSignerDoc?: string;
  isSigned?: boolean;
}

export default function FormatSignersBlock({
  leftSignerName = "{{empresa_representante}}",
  leftSignerTitle = "Representante Legal / Dirección de Operaciones",
  leftSignerDoc = "NIT: {{empresa_nit}}",
  rightSignerName = "{{cliente_administrador}}",
  rightSignerTitle = "Aceptado y Recibido a Conformidad por el Cliente",
  rightSignerDoc = "C.C. / NIT: {{cliente_nit}}",
  isSigned = false,
}: FormatSignersBlockProps) {
  return (
    <Box sx={{ mt: 4, pt: 2, borderTop: "1px dashed #CBD5E1" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <Draw fontSize="small" sx={{ color: "primary.main" }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A" }}>
          Constancia y Firmas de Aceptación
        </Typography>
        {isSigned && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Verified sx={{ color: "#059669", fontSize: 18 }} />
            <Typography variant="caption" sx={{ color: "#059669", fontWeight: 700 }}>
              Firmado digitalmente con Noxia Sign
            </Typography>
          </Stack>
        )}
      </Stack>

      <Grid container spacing={4}>
        {/* Firma Izquierda (Empresa) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box
            sx={{
              p: 2,
              border: "1px solid #E2E8F0",
              borderRadius: 2,
              bgcolor: "#F8FAFC",
              textAlign: "center",
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <Box
              sx={{
                width: "80%",
                mx: "auto",
                borderBottom: "1px solid #0F172A",
                mb: 1.5,
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 800, color: "#0F172A" }}>
              {leftSignerName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600, display: "block" }}>
              {leftSignerTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              {leftSignerDoc}
            </Typography>
          </Box>
        </Grid>

        {/* Firma Derecha (Cliente / Tercero) */}
        <Grid size={{ xs: 12, sm: 6 }}>

          <Box
            sx={{
              p: 2,
              border: "1px solid #E2E8F0",
              borderRadius: 2,
              bgcolor: "#F8FAFC",
              textAlign: "center",
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <Box
              sx={{
                width: "80%",
                mx: "auto",
                borderBottom: "1px solid #0F172A",
                mb: 1.5,
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 800, color: "#0F172A" }}>
              {rightSignerName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600, display: "block" }}>
              {rightSignerTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              {rightSignerDoc}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
