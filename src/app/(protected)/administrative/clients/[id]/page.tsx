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
  LocationOnRounded as LocationIcon,
  PhoneRounded as PhoneIcon,
  CheckCircleRounded as CheckCircleIcon,
} from "@mui/icons-material";
import { useClientDetail } from "./ClientContext";

export default function ClientHubPage() {
  const { clientId, client, loading, permissions } = useClientDetail();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Desktop: Auto redirect to overview
  useEffect(() => {
    if (!isMobile && clientId) {
      router.replace(`/administrative/clients/${clientId}/overview`);
    }
  }, [isMobile, clientId, router]);

  if (!isMobile) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center" }}>
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
      description: "Datos de identificación, ubicación geográfica, cuadrante policial y teléfonos.",
      icon: <DashboardIcon sx={{ fontSize: 28, color: "primary.main" }} />,
      badge: client?.sector || "Residencial",
      path: `/administrative/clients/${clientId}/overview`,
      visible: permissions.canReadGeneral,
      color: theme.palette.primary.main,
    },
    {
      id: "operations",
      title: "Operaciones y Estructura",
      description: "Estructura física, torres, pisos, amenidades, zonas comunes y puntos de acceso.",
      icon: <HomeWorkIcon sx={{ fontSize: 28, color: "#00b0ff" }} />,
      badge: `${client?.clientProperties?.towersAmount || client?.towers?.length || 0} Torres`,
      path: `/administrative/clients/${clientId}/operations`,
      visible: permissions.canReadOperations,
      color: "#00b0ff",
    },
    {
      id: "legal",
      title: "Legal y Contratos",
      description: "Condiciones contractuales, administración del conjunto y consejo de administración.",
      icon: <GavelIcon sx={{ fontSize: 28, color: "#ab47bc" }} />,
      badge: client?.contractStatus === "ACTIVE" ? "Contrato Activo" : "Contrato",
      path: `/administrative/clients/${clientId}/legal`,
      visible: permissions.canReadLegal,
      color: "#ab47bc",
    },
    {
      id: "residents",
      title: "Residentes",
      description: "Listado completo de residentes, asignación a unidades y gestión de accesos.",
      icon: <PeopleIcon sx={{ fontSize: 28, color: "#2e7d32" }} />,
      badge: "Directorio",
      path: `/administrative/clients/${clientId}/residents`,
      visible: permissions.canReadResidents,
      color: "#2e7d32",
    },
    {
      id: "security-studies",
      title: "Estudios de Seguridad",
      description: "Informes de análisis de vulnerabilidades, riesgos y recomendaciones físicas.",
      icon: <ShieldIcon sx={{ fontSize: 28, color: "#ed6c02" }} />,
      badge: "Seguridad",
      path: `/administrative/clients/${clientId}/security-studies`,
      visible: true,
      color: "#ed6c02",
    },
  ];

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Top back button */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => router.push("/administrative/clients")}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Volver a Mis Clientes
        </Button>
      </Box>

      {/* Client Overview Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(22, 27, 34, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        {loading ? (
          <Box>
            <Skeleton width="70%" height={28} sx={{ mb: 1 }} />
            <Skeleton width="40%" height={20} sx={{ mb: 1 }} />
            <Skeleton width="90%" height={16} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ApartmentIcon fontSize="medium" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  {client?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  NIT: {client?.nit} • Código: {client?.internalCode}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
              <Chip
                size="small"
                icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                label={client?.clientStatus === "ACTIVE" ? "Cliente Activo" : "Inactivo"}
                color={client?.clientStatus === "ACTIVE" ? "success" : "default"}
                sx={{ fontWeight: 600, fontSize: "0.72rem" }}
              />
              <Chip
                size="small"
                label={client?.sector || "Residencial"}
                variant="outlined"
                sx={{ fontSize: "0.72rem" }}
              />
            </Box>

            {client?.address && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "text.secondary" }}>
                <LocationIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" noWrap>
                  {client.address}, {client.city}
                </Typography>
              </Box>
            )}
            {client?.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "text.secondary", mt: 0.5 }}>
                <PhoneIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">{client.phone}</Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Hub Spokes Title */}
      <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: "0.02em" }}>
        Módulos y Secciones
      </Typography>

      {/* Hub Spokes Grid */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {hubCards
          .filter((c) => c.visible)
          .map((card) => (
            <Card
              key={card.id}
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: card.color,
                  boxShadow: `0 4px 16px ${card.color}22`,
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardActionArea
                onClick={() => router.push(card.path)}
                sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1, pr: 1 }}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.03)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {card.title}
                      </Typography>
                      {card.badge && (
                        <Chip
                          size="small"
                          label={card.badge}
                          sx={{
                            height: 18,
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            bgcolor: `${card.color}15`,
                            color: card.color,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
                      {card.description}
                    </Typography>
                  </Box>
                </Box>
                <ArrowForwardIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
              </CardActionArea>
            </Card>
          ))}
      </Box>
    </Box>
  );
}
