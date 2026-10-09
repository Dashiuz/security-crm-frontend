"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Switch,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  SaveRounded as SaveIcon,
  TuneRounded as TuneIcon,
  SecurityRounded as SecurityIcon,
  SupportAgentRounded as SupportAgentIcon,
} from "@mui/icons-material";
import { useTenantDetail } from "../TenantContext";
import {
  tenantSettingsSchema,
  TenantSettingsFormData,
} from "@/lib/schemas/tenant.schema";

export default function TenantSettingsPage() {
  const { tenant, loading, savingSection, handleSaveSettings } =
    useTenantDetail();
  const theme = useTheme();

  const form = useForm<TenantSettingsFormData>({
    resolver: zodResolver(tenantSettingsSchema),
    mode: "onTouched",
    defaultValues: {
      timezone: "America/Bogota",
      currency: "COP",
      dateFormat: "DD/MM/YYYY",
      mfaRequired: false,
      sessionTimeoutMinutes: 60,
      passwordPolicy: "MEDIUM",
      faviconUrl: "",
      loginBackgroundUrl: "",
      supportEmail: "",
      supportPhone: "",
    },
  });

  useEffect(() => {
    if (tenant?.settings) {
      form.reset({
        timezone: tenant.settings.timezone || "America/Bogota",
        currency: tenant.settings.currency || "COP",
        dateFormat: tenant.settings.dateFormat || "DD/MM/YYYY",
        mfaRequired: tenant.settings.mfaRequired ?? false,
        sessionTimeoutMinutes: tenant.settings.sessionTimeoutMinutes ?? 60,
        passwordPolicy: tenant.settings.passwordPolicy || "MEDIUM",
        faviconUrl: tenant.settings.faviconUrl || "",
        loginBackgroundUrl: tenant.settings.loginBackgroundUrl || "",
        supportEmail: tenant.settings.supportEmail || "",
        supportPhone: tenant.settings.supportPhone || "",
      });
    }
  }, [tenant, form]);

  const onSubmit = async (data: TenantSettingsFormData) => {
    await handleSaveSettings(data);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="rounded" height={80} />
        <Skeleton variant="rounded" height={420} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Ajustes y Parámetros del Sistema
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure la zona horaria, moneda operativa, directivas de seguridad de contraseñas y canales de soporte.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
          <TuneIcon sx={{ color: "#00897b" }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Configuración Regional y Operativa
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="timezone"
                control={form.control}
                render={({ field }) => (
                  <TextField select label="Zona Horaria" fullWidth {...field}>
                    <MenuItem value="America/Bogota">Bogotá / Lima (UTC-5)</MenuItem>
                    <MenuItem value="America/Mexico_City">Ciudad de México (UTC-6)</MenuItem>
                    <MenuItem value="America/Santiago">Santiago de Chile (UTC-3)</MenuItem>
                    <MenuItem value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</MenuItem>
                    <MenuItem value="America/New_York">Nueva York (UTC-5 / UTC-4)</MenuItem>
                    <MenuItem value="UTC">UTC Universal</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="currency"
                control={form.control}
                render={({ field }) => (
                  <TextField select label="Moneda Predeterminada" fullWidth {...field}>
                    <MenuItem value="COP">Peso Colombiano (COP)</MenuItem>
                    <MenuItem value="USD">Dólar Estadounidense (USD)</MenuItem>
                    <MenuItem value="EUR">Euro (EUR)</MenuItem>
                    <MenuItem value="MXN">Peso Mexicano (MXN)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="dateFormat"
                control={form.control}
                render={({ field }) => (
                  <TextField select label="Formato de Fecha" fullWidth {...field}>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }}>
                <Chip icon={<SecurityIcon />} label="Políticas de Acceso y Sesión" size="small" />
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="passwordPolicy"
                control={form.control}
                render={({ field }) => (
                  <TextField select label="Política de Contraseñas" fullWidth {...field}>
                    <MenuItem value="LOW">Baja (Mínimo 6 caracteres)</MenuItem>
                    <MenuItem value="MEDIUM">Media (8 caracteres + mayúsculas y números)</MenuItem>
                    <MenuItem value="STRICT">Estricta (10 caracteres + símbolos y rotación)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="sessionTimeoutMinutes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : "")
                    }
                    label="Tiempo de Inactividad de Sesión (Min)"
                    type="number"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    inputProps={{ min: 5, max: 1440 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="mfaRequired"
                control={form.control}
                render={({ field }) => (
                  <Box
                    sx={{
                      p: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      height: "100%",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Autenticación MFA
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {field.value ? "Obligatorio" : "Opcional"}
                      </Typography>
                    </Box>
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      color="primary"
                    />
                  </Box>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }}>
                <Chip icon={<SupportAgentIcon />} label="Canales de Soporte al Usuario" size="small" />
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="supportEmail"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Correo Electrónico de Soporte"
                    type="email"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="supportPhone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Línea Telefónica de Soporte"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={
                  savingSection === "settings" ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={savingSection === "settings"}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
              >
                Guardar Ajustes & Seguridad
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
