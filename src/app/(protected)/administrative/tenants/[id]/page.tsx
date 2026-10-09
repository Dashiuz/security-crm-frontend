"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Paper,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  Avatar,
} from "@mui/material";
import {
  ArrowBackRounded as ArrowBackIcon,
  DashboardRounded as DashboardIcon,
  BusinessRounded as BusinessIcon,
  GavelRounded as GavelIcon,
  WorkspacePremiumRounded as PremiumIcon,
  TuneRounded as TuneIcon,
  ExtensionRounded as ExtensionIcon,
  ArrowForwardIosRounded as ArrowForwardIcon,
  LoginRounded as LoginIcon,
} from "@mui/icons-material";
import { useTenantDetail } from "./TenantContext";

export default function TenantHubPage() {
  const { tenantId, tenant, loading, handleImpersonate, featuresList } =
    useTenantDetail();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Desktop: Auto redirect to overview
  useEffect(() => {
    if (!isMobile && tenantId) {
      router.replace(`/administrative/tenants/${tenantId}/overview`);
    }
  }, [isMobile, tenantId, router]);

  if (!isMobile) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 300,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Redirigiendo a Resumen General...
        </Typography>
      </Box>
    );
  }

  const hubCards = [
    {
      id: "overview",
      title: "Resumen General",
      description: "Métricas clave, contacto y políticas activas",
      icon: <DashboardIcon color="primary" />,
      badge: `${tenant?.subscription?.planTier || "BASIC"} • ${tenant?.features?.length || 0} mods`,
    },
    {
      id: "identity",
      title: "Identidad General",
      description: "Nombre comercial, slug, colores de marca y estado",
      icon: <BusinessIcon color="info" />,
      badge: tenant?.isActive ? "Activo" : "Inactivo",
    },
    {
      id: "legal",
      title: "Perfil Legal",
      description: "Razón social, NIT, dirección fiscal y representante legal",
      icon: <GavelIcon color="warning" />,
      badge: tenant?.profile?.taxId ? `NIT: ${tenant.profile.taxId}` : "Sin NIT",
    },
    {
      id: "subscription",
      title: "Suscripción & Cuotas",
      description: "Plan de suscripción, límites de clientes y cuentas",
      icon: <PremiumIcon sx={{ color: "#ab47bc" }} />,
      badge: `${tenant?.subscription?.maxClients ?? 5} clientes max`,
    },
    {
      id: "settings",
      title: "Ajustes & Seguridad",
      description: "Zona horaria, moneda oficial, expiración de sesión y MFA",
      icon: <TuneIcon sx={{ color: "#00897b" }} />,
      badge: tenant?.settings?.mfaRequired ? "MFA Activo" : "MFA Opcional",
    },
    {
      id: "modules",
      title: "Módulos & Features",
      description: "Catálogo de módulos habilitados para esta empresa",
      icon: <ExtensionIcon sx={{ color: "#e65100" }} />,
      badge: `${tenant?.features?.length || 0} / ${featuresList.length || 0}`,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pb: 4 }}>
      {/* Mobile Top Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={() => router.push("/administrative/tenants")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "text.secondary",
            }}
          >
            Volver a Empresas
          </Button>
        </Box>

        {loading ? (
          <Box>
            <Skeleton width="70%" height={28} sx={{ mb: 1 }} />
            <Skeleton width="40%" height={20} />
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Avatar
                src={tenant?.logoUrl || undefined}
                alt={tenant?.name}
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: tenant?.primaryColor || theme.palette.primary.main,
                  fontWeight: 700,
                  fontSize: "1.3rem",
                }}
              >
                {tenant?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h6" fontWeight={700} noWrap>
                  {tenant?.name || "Empresa"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Slug: <code>{tenant?.slug}</code>
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              <Chip
                size="small"
                label={tenant?.isActive ? "Activo" : "Inactivo"}
                color={tenant?.isActive ? "success" : "default"}
              />
              <Chip
                size="small"
                label={tenant?.subscription?.planTier || "BASIC"}
                color="primary"
                variant="outlined"
              />
              <Chip
                size="small"
                label={tenant?.subscription?.status || "TRIAL"}
                color="secondary"
              />
            </Box>

            {tenant && tenant.slug !== "system" && tenant.id !== "system" && (
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={<LoginIcon />}
                onClick={handleImpersonate}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1,
                }}
              >
                Administrar (Impersonate)
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* Hub Navigation Cards */}
      <Box>
        <Typography
          variant="subtitle2"
          fontWeight={700}
          color="text.secondary"
          sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}
        >
          Secciones de Configuración
        </Typography>

        <Grid container spacing={1.5}>
          {hubCards.map((card) => (
            <Grid size={{ xs: 12, sm: 6 }} key={card.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() =>
                    router.push(
                      `/administrative/tenants/${tenantId}/${card.id}`
                    )
                  }
                  sx={{ p: 2 }}
                >
                  <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: "action.hover",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {card.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {card.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={card.badge}
                            sx={{ height: 20, fontSize: "0.7rem", mt: 0.3 }}
                          />
                        </Box>
                      </Box>
                      <ArrowForwardIcon
                        sx={{ fontSize: 16, color: "text.disabled", mt: 1 }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.82rem", mt: 0.5 }}
                    >
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
