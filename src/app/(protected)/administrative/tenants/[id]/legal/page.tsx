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
  Divider,
  Button,
  CircularProgress,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  SaveRounded as SaveIcon,
  GavelRounded as GavelIcon,
} from "@mui/icons-material";
import { useTenantDetail } from "../TenantContext";
import {
  tenantProfileSchema,
  TenantProfileFormData,
} from "@/lib/schemas/tenant.schema";

export default function TenantLegalPage() {
  const { tenant, loading, savingSection, handleSaveProfile } = useTenantDetail();
  const theme = useTheme();

  const form = useForm<TenantProfileFormData>({
    resolver: zodResolver(tenantProfileSchema),
    mode: "onTouched",
    defaultValues: {
      legalName: "",
      taxId: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "Bogotá",
      country: "Colombia",
      legalRepresentative: "",
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        legalName: tenant.profile?.legalName || tenant.name || "",
        taxId: tenant.profile?.taxId || "",
        contactEmail: tenant.profile?.contactEmail || "",
        contactPhone: tenant.profile?.contactPhone || "",
        address: tenant.profile?.address || "",
        city: tenant.profile?.city || "Bogotá",
        country: tenant.profile?.country || "Colombia",
        legalRepresentative: tenant.profile?.legalRepresentative || "",
      });
    }
  }, [tenant, form]);

  const onSubmit = async (data: TenantProfileFormData) => {
    await handleSaveProfile(data);
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
          Perfil Legal e Información Fiscal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure los datos de personería jurídica, NIT, domicilio fiscal y representación legal.
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
          <GavelIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Datos Jurídicos y de Contacto Institucional
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Controller
                name="legalName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Razón Social Oficial"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Controller
                name="taxId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="NIT / RUT / Identificador Fiscal"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="contactEmail"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Correo Electrónico Institucional"
                    type="email"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="contactPhone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Teléfono Principal de Contacto"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="legalRepresentative"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Representante Legal"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Dirección Principal / Domicilio Fiscal"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Ciudad"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="country"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="País"
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
                  savingSection === "profile" ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={savingSection === "profile"}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
              >
                Guardar Perfil Legal
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
