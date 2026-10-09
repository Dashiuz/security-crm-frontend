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
  Switch,
  InputAdornment,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  SaveRounded as SaveIcon,
  PaletteRounded as PaletteIcon,
  BusinessRounded as BusinessIcon,
} from "@mui/icons-material";
import { useTenantDetail } from "../TenantContext";
import {
  tenantGeneralSchema,
  TenantGeneralFormData,
} from "@/lib/schemas/tenant.schema";

export default function TenantIdentityPage() {
  const { tenant, loading, savingSection, handleSaveGeneral } = useTenantDetail();
  const theme = useTheme();

  const form = useForm<TenantGeneralFormData>({
    resolver: zodResolver(tenantGeneralSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      slug: "",
      isActive: true,
      logoUrl: "",
      primaryColor: "#1a237e",
      secondaryColor: "#455a64",
      sidebarColor: "",
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name || "",
        slug: tenant.slug || "",
        isActive: tenant.isActive ?? true,
        logoUrl: tenant.logoUrl || "",
        primaryColor: tenant.primaryColor || "#1a237e",
        secondaryColor: tenant.secondaryColor || "#455a64",
        sidebarColor: tenant.sidebarColor || "",
      });
    }
  }, [tenant, form]);

  const onSubmit = async (data: TenantGeneralFormData) => {
    await handleSaveGeneral(data);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="rounded" height={80} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Identidad General y Marca
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure el nombre comercial, slug URL, logotipo y paleta cromática de la empresa.
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
          <BusinessIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Datos Principales de la Marca
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nombre Comercial"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="isActive"
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
                        Estado de Operación
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {field.value ? "Habilitado (Activo)" : "Deshabilitado"}
                      </Typography>
                    </Box>
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      color="success"
                    />
                  </Box>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Slug Identificador (Subdominio / URL)"
                    fullWidth
                    required
                    error={Boolean(fieldState.error)}
                    helperText={
                      fieldState.error?.message ||
                      "Solo letras minúsculas, números y guiones"
                    }
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="logoUrl"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="URL del Logotipo"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "Enlace HTTPS a imagen PNG o SVG"}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1.5 }}>
                <Chip icon={<PaletteIcon />} label="Paleta de Colores Corporativos" size="small" />
              </Divider>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="primaryColor"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Color Primario"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "4px",
                              bgcolor: field.value || "#1a237e",
                              border: "1px solid rgba(0,0,0,0.2)",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="secondaryColor"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Color Secundario"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "4px",
                              bgcolor: field.value || "#455a64",
                              border: "1px solid rgba(0,0,0,0.2)",
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="sidebarColor"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Color de Barra Lateral"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "Opcional"}
                    InputProps={{
                      startAdornment: field.value ? (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: "4px",
                              bgcolor: field.value,
                              border: "1px solid rgba(0,0,0,0.2)",
                            }}
                          />
                        </InputAdornment>
                      ) : undefined,
                    }}
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
                  savingSection === "general" ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={savingSection === "general"}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
              >
                Guardar Identidad General
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
