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
  Divider,
  Button,
  CircularProgress,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  SaveRounded as SaveIcon,
  WorkspacePremiumRounded as PremiumIcon,
} from "@mui/icons-material";
import { useTenantDetail } from "../TenantContext";
import {
  tenantSubscriptionSchema,
  TenantSubscriptionFormData,
} from "@/lib/schemas/tenant.schema";

export default function TenantSubscriptionPage() {
  const { tenant, loading, savingSection, handleSaveSubscription } =
    useTenantDetail();
  const theme = useTheme();

  const form = useForm<TenantSubscriptionFormData>({
    resolver: zodResolver(tenantSubscriptionSchema),
    mode: "onTouched",
    defaultValues: {
      planTier: "BASIC",
      status: "TRIAL",
      maxClients: 5,
      maxUsers: 50,
      maxEmployees: 50,
      subscriptionEndsAt: "",
      paymentGatewayId: "",
    },
  });

  useEffect(() => {
    if (tenant?.subscription) {
      form.reset({
        planTier: tenant.subscription.planTier || "BASIC",
        status: tenant.subscription.status || "TRIAL",
        maxClients: tenant.subscription.maxClients ?? 5,
        maxUsers: tenant.subscription.maxUsers ?? 50,
        maxEmployees: tenant.subscription.maxEmployees ?? 50,
        subscriptionEndsAt: tenant.subscription.subscriptionEndsAt
          ? new Date(tenant.subscription.subscriptionEndsAt)
              .toISOString()
              .split("T")[0]
          : "",
        paymentGatewayId: tenant.subscription.paymentGatewayId || "",
      });
    }
  }, [tenant, form]);

  const onSubmit = async (data: TenantSubscriptionFormData) => {
    await handleSaveSubscription(data);
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
          Suscripción y Cuotas de Capacidad
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione el nivel de plan (Tier), límites de cuota de clientes y usuarios, vigencia y facturación.
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
          <PremiumIcon sx={{ color: "#ab47bc" }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Plan Contratado y Topes de Cuota
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="planTier"
                control={form.control}
                render={({ field }) => (
                  <TextField select label="Plan de Suscripción" fullWidth {...field}>
                    <MenuItem value="BASIC">Básico (BASIC)</MenuItem>
                    <MenuItem value="PRO">Profesional (PRO)</MenuItem>
                    <MenuItem value="ENTERPRISE">Empresarial (ENTERPRISE)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <TextField select label="Estado de Facturación" fullWidth {...field}>
                    <MenuItem value="TRIAL">Periodo de Prueba (TRIAL)</MenuItem>
                    <MenuItem value="ACTIVE">Activa (ACTIVE)</MenuItem>
                    <MenuItem value="PAST_DUE">En Mora (PAST_DUE)</MenuItem>
                    <MenuItem value="CANCELED">Cancelada (CANCELED)</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="maxClients"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : "")
                    }
                    label="Máximo de Clientes / Conjuntos"
                    type="number"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="maxUsers"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : "")
                    }
                    label="Máximo de Cuentas de Acceso"
                    type="number"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="maxEmployees"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : "")
                    }
                    label="Máximo de Empleados"
                    type="number"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    inputProps={{ min: 1 }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="subscriptionEndsAt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Vencimiento de la Suscripción"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || "Dejar vacío si no expira"}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="paymentGatewayId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="ID de Pasarela de Pagos (Stripe / Wompi)"
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
                  savingSection === "subscription" ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={savingSection === "subscription"}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
              >
                Guardar Suscripción & Límites
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
