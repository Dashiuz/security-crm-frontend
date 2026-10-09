"use client";

import React, { use } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
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
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
} from "@mui/material";
import {
  ArrowBackRounded as ArrowBackIcon,
  DashboardRounded as DashboardIcon,
  HomeWorkRounded as HomeWorkIcon,
  GavelRounded as GavelIcon,
  PeopleAltRounded as PeopleIcon,
  ShieldRounded as ShieldIcon,
  ApartmentRounded as ApartmentIcon,
  ArrowForwardIosRounded as ArrowForwardIcon,
} from "@mui/icons-material";
import { ClientProvider, useClientDetail } from "./ClientContext";

interface NavItem {
  id: string;
  label: string;
  pathSuffix: string;
  icon: React.ReactElement;
  description: string;
  visible: boolean;
}

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const { clientId, client, loading, permissions } = useClientDetail();
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
      description: "Datos básicos, ubicación y cuadrante policial",
      visible: permissions.canReadGeneral,
    },
    {
      id: "operations",
      label: "Operaciones y Estructura",
      pathSuffix: "operations",
      icon: <HomeWorkIcon fontSize="small" />,
      description: "Estructura física, amenidades y accesos",
      visible: permissions.canReadOperations,
    },
    {
      id: "legal",
      label: "Legal y Contratos",
      pathSuffix: "legal",
      icon: <GavelIcon fontSize="small" />,
      description: "Contrato, administración y consejo",
      visible: permissions.canReadLegal,
    },
    {
      id: "residents",
      label: "Residentes",
      pathSuffix: "residents",
      icon: <PeopleIcon fontSize="small" />,
      description: "Padrón y gestión de residentes",
      visible: permissions.canReadResidents,
    },
    {
      id: "security-studies",
      label: "Estudios de Seguridad",
      pathSuffix: "security-studies",
      icon: <ShieldIcon fontSize="small" />,
      description: "Informes de análisis de riesgo físico",
      visible: true,
    },
  ];

  const visibleNavItems = navItems.filter((i) => i.visible);

  const getIsActive = (pathSuffix: string) => {
    return pathname.endsWith(`/${pathSuffix}`);
  };

  const isRootLanding =
    pathname === `/administrative/clients/${clientId}` ||
    pathname === `/administrative/clients/${clientId}/`;

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
            width: 270,
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
          {/* Back to clients list */}
          <Box sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => router.push("/administrative/clients")}
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
              Volver a Clientes
            </Button>
          </Box>

          {/* Client Header Info */}
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
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <ApartmentIcon
                    fontSize="small"
                    sx={{ color: "primary.main" }}
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    noWrap
                    title={client?.name}
                    sx={{ flex: 1, fontSize: "0.95rem" }}
                  >
                    {client?.name || "Cliente"}
                  </Typography>
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
                    label={client?.nit ? `NIT: ${client.nit}` : "Sin NIT"}
                    variant="outlined"
                    sx={{ fontSize: "0.72rem", height: 22 }}
                  />
                  <Chip
                    size="small"
                    label={
                      client?.clientStatus === "ACTIVE" ? "Activo" : "Inactivo"
                    }
                    color={
                      client?.clientStatus === "ACTIVE" ? "success" : "default"
                    }
                    sx={{ fontSize: "0.72rem", height: 22, fontWeight: 600 }}
                  />
                </Box>
              </>
            )}
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          {/* Sidenav Items List */}
          <Typography
            variant="caption"
            sx={{
              px: 1,
              pb: 1,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "text.secondary",
              fontSize: "0.68rem",
            }}
          >
            Secciones del Cliente
          </Typography>

          <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.8 }}>
            {visibleNavItems.map((item) => {
              const active = getIsActive(item.pathSuffix);
              return (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    onClick={() =>
                      router.push(
                        `/administrative/clients/${clientId}/${item.pathSuffix}`,
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      py: 1.1,
                      px: 1.5,
                      bgcolor: active
                        ? theme.palette.mode === "dark"
                          ? "rgba(33, 150, 243, 0.15)"
                          : "rgba(25, 118, 210, 0.08)"
                        : "transparent",
                      color: active ? "primary.main" : "text.primary",
                      borderLeft: active
                        ? `3px solid ${theme.palette.primary.main}`
                        : "3px solid transparent",
                      transition: "all 0.18s ease-in-out",
                      "&:hover": {
                        bgcolor: active
                          ? theme.palette.mode === "dark"
                            ? "rgba(33, 150, 243, 0.22)"
                            : "rgba(25, 118, 210, 0.12)"
                          : theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.03)",
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
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: "0.85rem",
                        fontWeight: active ? 700 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile Sub-route Top Header (Only shown when not on Hub Landing) */}
        {isMobile && !isRootLanding && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              size="small"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => router.push(`/administrative/clients/${clientId}`)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Menú del Cliente
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ flex: 1, color: "text.secondary" }}
            >
              {client?.name || "Cliente"}
            </Typography>
          </Box>
        )}

        {children}
      </Box>
    </Box>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const clientId = params?.id as string;

  return (
    <ClientProvider clientId={clientId}>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </ClientProvider>
  );
}
