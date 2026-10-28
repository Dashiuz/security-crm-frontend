"use client";

import React from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
  TextField,
  Collapse,
} from "@mui/material";
import { VerifiedUser, Security } from "@mui/icons-material";

export interface SvspCredentialsData {
  mode: "AUTO" | "MANUAL";
  license?: string;
  licenseDate?: string;
  licenseExpiry?: string;
  uniformsResolution?: string;
  overtimeResolution?: string;
}

export interface FormatSvspCredentialsBlockProps {
  data?: SvspCredentialsData;
  onChange?: (data: SvspCredentialsData) => void;
  isEditable?: boolean;
}

export default function FormatSvspCredentialsBlock({
  data = { mode: "AUTO" },
  onChange,
  isEditable = false,
}: FormatSvspCredentialsBlockProps) {
  const isAuto = data.mode === "AUTO";

  const handleToggleMode = (checked: boolean) => {
    if (!onChange) return;
    onChange({
      ...data,
      mode: checked ? "AUTO" : "MANUAL",
    });
  };

  const handleFieldChange = (field: keyof SvspCredentialsData, val: string) => {
    if (!onChange) return;
    onChange({
      ...data,
      [field]: val,
    });
  };

  return (
    <Box
      sx={{
        border: "1px solid #BFDBFE",
        borderRadius: 2,
        p: 2,
        mb: 2.5,
        bgcolor: "#EFF6FF",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Security sx={{ color: "#2563EB", fontSize: 24 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1E40AF" }}>
            Credenciales SuperVigilancia (SVSP)
          </Typography>
          <Chip
            size="small"
            label={isAuto ? "Automático (BD Empresa)" : "Manual / Personalizado"}
            color={isAuto ? "primary" : "secondary"}
            sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }}
          />
        </Stack>

        {isEditable && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isAuto}
                onChange={(e) => handleToggleMode(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#1E3A8A" }}>
                Usar datos automáticos de la empresa
              </Typography>
            }
          />
        )}
      </Stack>

      {/* Vista de credenciales en bloque */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 1.5,
          p: 1.5,
          bgcolor: "#FFFFFF",
          borderRadius: 1.5,
          border: "1px solid #DBEAFE",
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "block" }}>
            Licencia de Funcionamiento:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
            {isAuto ? "{{empresa_licencia_svsp}}" : data.license || "No especificada"}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "block" }}>
            Vigencia Licencia:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
            {isAuto
              ? "{{empresa_licencia_fecha}} al {{empresa_licencia_vence}}"
              : `${data.licenseDate || "--"} al ${data.licenseExpiry || "--"}`}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "block" }}>
            Resolución de Uniformes & Horas Extras:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
            {isAuto
              ? "Uniformes: {{empresa_res_uniformes}} / HE: {{empresa_res_horas_extras}}"
              : `Uniformes: ${data.uniformsResolution || "--"} / HE: ${data.overtimeResolution || "--"}`}
          </Typography>
        </Box>
      </Box>

      {/* Editor desplegable cuando es Manual */}
      {isEditable && !isAuto && (
        <Collapse in={!isAuto}>
          <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed #BFDBFE" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#1D4ED8", display: "block", mb: 1 }}>
              Campos manuales de acreditación:
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  label="Número Licencia SVSP"
                  size="small"
                  fullWidth
                  value={data.license || ""}
                  onChange={(e) => handleFieldChange("license", e.target.value)}
                  placeholder="Ej: RES-2024-SVSP-9842"
                />
                <TextField
                  label="Fecha Expedición"
                  size="small"
                  fullWidth
                  value={data.licenseDate || ""}
                  onChange={(e) => handleFieldChange("licenseDate", e.target.value)}
                  placeholder="DD/MM/AAAA"
                />
                <TextField
                  label="Fecha Vencimiento"
                  size="small"
                  fullWidth
                  value={data.licenseExpiry || ""}
                  onChange={(e) => handleFieldChange("licenseExpiry", e.target.value)}
                  placeholder="DD/MM/AAAA"
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  label="Resolución Uniformes"
                  size="small"
                  fullWidth
                  value={data.uniformsResolution || ""}
                  onChange={(e) => handleFieldChange("uniformsResolution", e.target.value)}
                  placeholder="Ej: RES-00123"
                />
                <TextField
                  label="Resolución Horas Extras"
                  size="small"
                  fullWidth
                  value={data.overtimeResolution || ""}
                  onChange={(e) => handleFieldChange("overtimeResolution", e.target.value)}
                  placeholder="Ej: RES-HE-0045"
                />
              </Stack>
            </Stack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
