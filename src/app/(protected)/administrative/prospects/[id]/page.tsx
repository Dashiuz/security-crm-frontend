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
  ReceiptLongRounded as ReceiptLongIcon,
  HandshakeRounded as HandshakeIcon,
  ApartmentRounded as ApartmentIcon,
  ArrowForwardIosRounded as ArrowForwardIcon,
  LocationOnRounded as LocationIcon,
  PhoneRounded as PhoneIcon,
} from "@mui/icons-material";
import { useProspectDetail } from "./ProspectContext";

export default function ProspectHubPage() {
  const { prospectId, prospect, loading, permissions } = useProspectDetail();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Desktop: Auto redirect to overview
  useEffect(() => {
    if (!isMobile && prospectId) {
      router.replace(`/administrative/prospects/${prospectId}/overview`);
    }
  }, [isMobile, prospectId, router]);

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
      description: "Datos básicos, NIT, ubicación geográfica, cuadrante policial y contactos comerciales.",
      icon: <DashboardIcon sx={{ fontSize: 28, color: "primary.main" }} />,
      badge: prospect?.sector || "Residencial",
      path: `/administrative/prospects/${prospectId}/overview`,
      visible: permissions.canRead,
      color: theme.palette.primary.main,
    },
    {
      id: "operations",
      title: "Operaciones y Estructura",
      description: "Estructura física, torres, pisos, amenidades, zonas comunes y puntos de acceso.",
      icon: <HomeWorkIcon sx={{ fontSize: 28, color: "#00b0ff" }} />,
      badge: `${prospect?.clientProperties?.towersAmount || 0} Torres`,
      path: `/administrative/prospects/${prospectId}/operations`,
      visible: permissions.canRead,
      color: "#00b0ff",
    },
    {
      id: "commercial",
      title: "Gestión Comercial y CRM",
      path: `/administrative/prospects/${prospectId}/commercial`,
      description: "Bitácora de seguimiento comercial, cotizaciones, propuestas y campaña de recaptación.",
      icon: <ReceiptLongIcon sx={{ fontSize: 28, color: "#2e7d32" }} />,
      badge: "CRM / Cotizaciones",
      visible: true,
      color: "#2e7d32",
    },
  ];

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Top back button */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => router.push("/administrative/prospects")}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Volver a Prospectos
        </Button>
      </Box>

      {/* Prospect Overview Card */}
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
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(33, 150, 243, 0.15)"
                      : "rgba(25, 118, 210, 0.1)",
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ApartmentIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                  {prospect?.name || "Prospecto"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    size="small"
                    label={prospect?.nit ? `NIT: ${prospect.nit}` : "Sin NIT"}
                    variant="outlined"
                    sx={{ fontSize: "0.72rem", height: 22 }}
                  />
                  <Chip
                    size="small"
                    label="Prospecto en Negociación"
                    color="warning"
                    sx={{ fontSize: "0.72rem", height: 22, fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    label={`Omega: ${prospect?.internalCode || "N/A"}`}
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: "0.72rem", height: 22, fontWeight: 700 }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mt: 2 }}>
              {prospect?.address && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary">
                    {prospect.address}
                    {prospect.neighborhood ? `, ${prospect.neighborhood}` : ""}
                    {prospect.city ? ` - ${prospect.city}` : ""}
                  </Typography>
                </Box>
              )}
              {prospect?.phone && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary">
                    {prospect.phone}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Hub Spoke Cards Navigation */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "text.secondary",
          px: 0.5,
        }}
      >
        Módulos y Secciones
      </Typography>

      <Grid container spacing={2}>
        {hubCards
          .filter((c) => c.visible)
          .map((card) => (
            <Grid key={card.id} size={{ xs: 12 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: card.color,
                    boxShadow: `0 4px 16px ${card.color}22`,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => router.push(card.path)}
                  sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: `${card.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {card.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={card.badge}
                          sx={{
                            height: 20,
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            bgcolor: `${card.color}15`,
                            color: card.color,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                        {card.description}
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForwardIcon sx={{ fontSize: 16, color: "text.secondary", ml: 1 }} />
                </CardActionArea>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}
