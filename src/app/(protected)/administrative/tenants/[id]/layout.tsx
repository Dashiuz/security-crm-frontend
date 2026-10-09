"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
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
  LoginRounded as LoginIcon,
  ArrowForwardIosRounded as ArrowForwardIcon,
} from "@mui/icons-material";
import { TenantProvider, useTenantDetail } from "./TenantContext";

interface NavItem {
  id: string;
  label: string;
  pathSuffix: string;
  icon: React.ReactElement;
  description: string;
}

function TenantLayoutContent({ children }: { children: React.ReactNode }) {
  const { tenantId, tenant, loading, handleImpersonate } = useTenantDetail();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Resumen General",
      pathSuffix: "overview",
      icon: <DashboardIcon fontSize="small" />,
      description: "Métricas clave, contacto y políticas",
    },
    {
      id: "identity",
      label: "Identidad General",
      pathSuffix: "identity",
      icon: <BusinessIcon fontSize="small" />,
      description: "Nombre, logo, colores y estado",
    },
    {
      id: "legal",
      label: "Perfil Legal",
      pathSuffix: "legal",
      icon: <GavelIcon fontSize="small" />,
      description: "Razón social, NIT y datos fiscales",
    },
    {
      id: "subscription",
      label: "Suscripción & Cuotas",
      pathSuffix: "subscription",
      icon: <PremiumIcon fontSize="small" />,
      description: "Plan, límites y ciclo de cobro",
    },
    {
      id: "settings",
      label: "Ajustes & Seguridad",
      pathSuffix: "settings",
      icon: <TuneIcon fontSize="small" />,
      description: "Zona horaria, MFA y directivas",
    },
    {
      id: "modules",
      label: "Módulos & Features",
      pathSuffix: "modules",
      icon: <ExtensionIcon fontSize="small" />,
      description: "Gestión de funciones activas",
    },
  ];

  const getIsActive = (pathSuffix: string) => {
    return pathname.endsWith(`/${pathSuffix}`);
  };

  const isRootLanding =
    pathname === `/administrative/tenants/${tenantId}` ||
    pathname === `/administrative/tenants/${tenantId}/`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "calc(100vh - 120px)",
        width: "100%",
        bgcolor: "background.default",
        gap: isMobile ? 2 : 3,
        pt: 1,
      }}
    >
      {/* Desktop Left Sidenav */}
      {!isMobile && (
        <Paper
          elevation={0}
          sx={{
            width: 280,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(22, 27, 34, 0.7)"
                : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            p: 2,
            position: "sticky",
            top: 80,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
          }}
        >
          {/* Back to tenants list */}
          <Box sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => router.push("/administrative/tenants")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "text.secondary",
                px: 1,
                py: 0.5,
                borderRadius: 2,
                "&:hover": {
                  color: "primary.main",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              Volver a Empresas
            </Button>
          </Box>

          {/* Tenant Header Info */}
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2.5,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.02)",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {loading ? (
              <Box>
                <Skeleton width="80%" height={24} sx={{ mb: 1 }} />
                <Skeleton width="50%" height={16} />
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  <Avatar
                    src={tenant?.logoUrl || undefined}
                    alt={tenant?.name}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: tenant?.primaryColor || theme.palette.primary.main,
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    {tenant?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      noWrap
                      title={tenant?.name}
                      sx={{ fontSize: "0.95rem" }}
                    >
                      {tenant?.name || "Empresa"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block", fontSize: "0.73rem" }}
                    >
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
                  }}
                >
                  <Chip
                    size="small"
                    label={tenant?.isActive ? "Activo" : "Inactivo"}
                    color={tenant?.isActive ? "success" : "default"}
                    sx={{ fontSize: "0.72rem", height: 22 }}
                  />
                  <Chip
                    size="small"
                    label={tenant?.subscription?.planTier || "BASIC"}
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: "0.72rem", height: 22 }}
                  />
                </Box>

                {/* Impersonate button in sidebar */}
                {tenant && tenant.slug !== "system" && tenant.id !== "system" && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    fullWidth
                    startIcon={<LoginIcon fontSize="small" />}
                    onClick={handleImpersonate}
                    sx={{
                      mt: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Administrar
                  </Button>
                )}
              </>
            )}
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          {/* Navigation Items */}
          <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
            {navItems.map((item) => {
              const active = getIsActive(item.pathSuffix);
              return (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    onClick={() =>
                      router.push(
                        `/administrative/tenants/${tenantId}/${item.pathSuffix}`
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      px: 1.5,
                      borderLeft: active
                        ? `3px solid ${theme.palette.primary.main}`
                        : "3px solid transparent",
                      bgcolor: active
                        ? theme.palette.mode === "dark"
                          ? "rgba(25, 118, 210, 0.16)"
                          : "rgba(25, 118, 210, 0.08)"
                        : "transparent",
                      color: active ? "primary.main" : "text.primary",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: active
                          ? theme.palette.mode === "dark"
                            ? "rgba(25, 118, 210, 0.22)"
                            : "rgba(25, 118, 210, 0.12)"
                          : theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? "primary.main" : "text.secondary",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={active ? 700 : 500}
                          sx={{ fontSize: "0.875rem" }}
                        >
                          {item.label}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.72rem", display: "block" }}
                          noWrap
                        >
                          {item.description}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Mobile Top Header (when NOT on root landing Hub) */}
      {isMobile && !isRootLanding && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2.5,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Button
            size="small"
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={() => router.push(`/administrative/tenants/${tenantId}`)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "text.secondary",
              py: 0.5,
            }}
          >
            Secciones
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Avatar
              src={tenant?.logoUrl || undefined}
              alt={tenant?.name}
              sx={{
                width: 28,
                height: 28,
                bgcolor: tenant?.primaryColor || theme.palette.primary.main,
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {tenant?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              sx={{ maxWidth: 140 }}
            >
              {tenant?.name || "Empresa"}
            </Typography>
          </Box>

          {tenant && tenant.slug !== "system" && tenant.id !== "system" && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<LoginIcon fontSize="small" />}
              onClick={handleImpersonate}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                py: 0.4,
                px: 1,
              }}
            >
              Admin
            </Button>
          )}
        </Paper>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          width: "100%",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function TenantDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantProvider>
      <TenantLayoutContent>{children}</TenantLayoutContent>
    </TenantProvider>
  );
}
