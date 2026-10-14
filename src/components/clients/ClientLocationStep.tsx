"use client";

import React from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";

export interface ClientLocationData {
  sector: string;
  name: string;
  nit: string;
  address: string;
  city: string;
  state: string;
  commune: string;
  neighborhood: string;
  cai: string;
  quadrant: string;
  quadrantPhone: string;
  phone: string;
  email: string;
  observations: string;
}

export interface ClientLocationStepProps {
  data: ClientLocationData;
  onChange: (field: keyof ClientLocationData, value: string) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export default function ClientLocationStep({
  data,
  onChange,
  errors = {},
  disabled = false,
}: ClientLocationStepProps) {
  const handleNumericChange = (field: keyof ClientLocationData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, "");
    onChange(field, clean);
  };

  const handleNitChange = (field: keyof ClientLocationData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9kK\-.]/g, "");
    onChange(field, clean);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
          📍 1. Información de Ubicación y Contacto
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingrese los datos generales, identificación fiscal y localización del cliente.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            fullWidth
            size="small"
            required
            label="Sector"
            value={data.sector || "RESIDENTIAL"}
            onChange={(e) => onChange("sector", e.target.value)}
            disabled={disabled}
          >
            <MenuItem value="RESIDENTIAL">Residencial</MenuItem>
            <MenuItem value="COMMERCIAL">Comercial</MenuItem>
            <MenuItem value="INDUSTRIAL">Industrial</MenuItem>
            <MenuItem value="MIXED">Mixto</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            size="small"
            required
            label="Nombre o Razón Social"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name}
            disabled={disabled}
            placeholder="Ej: Conjunto Residencial Las Palmas"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            required
            label="NIT / Identificación Fiscal"
            value={data.nit}
            onChange={handleNitChange("nit")}
            error={Boolean(errors.nit)}
            helperText={errors.nit}
            disabled={disabled}
            placeholder="900.123.456-7"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            required
            label="Dirección Principal"
            value={data.address}
            onChange={(e) => onChange("address", e.target.value)}
            error={Boolean(errors.address)}
            helperText={errors.address}
            disabled={disabled}
            placeholder="Calle 123 # 45-67"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            required
            label="Teléfono Principal"
            value={data.phone}
            onChange={handleNumericChange("phone")}
            slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
            error={Boolean(errors.phone)}
            helperText={errors.phone}
            disabled={disabled}
            placeholder="6012345678"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            required
            type="email"
            label="Correo Electrónico"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            disabled={disabled}
            placeholder="contacto@cliente.com"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Ciudad"
            value={data.city || "Bogotá"}
            onChange={(e) => onChange("city", e.target.value)}
            disabled={disabled}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Localidad / Comuna"
            value={data.commune}
            onChange={(e) => onChange("commune", e.target.value)}
            disabled={disabled}
            placeholder="Ej: Usaquén / Chapinero"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Barrio"
            value={data.neighborhood}
            onChange={(e) => onChange("neighborhood", e.target.value)}
            disabled={disabled}
            placeholder="Ej: Cedritos"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="CAI Cercano"
            value={data.cai}
            onChange={(e) => onChange("cai", e.target.value)}
            disabled={disabled}
            placeholder="Ej: CAI Cedritos"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Cuadrante"
            value={data.quadrant}
            onChange={(e) => onChange("quadrant", e.target.value)}
            disabled={disabled}
            placeholder="Ej: Cuadrante 12"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Teléfono del Cuadrante"
            value={data.quadrantPhone}
            onChange={handleNumericChange("quadrantPhone")}
            slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]*" } }}
            disabled={disabled}
            placeholder="3101234567"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Observaciones Generales"
            value={data.observations}
            onChange={(e) => onChange("observations", e.target.value)}
            disabled={disabled}
            placeholder="Detalles adicionales, referencias de acceso, notas del cliente..."
          />
        </Grid>
      </Grid>
    </Box>
  );
}
