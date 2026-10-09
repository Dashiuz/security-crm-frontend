"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Divider,
  Button,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  EditRounded as EditIcon,
  ContactMailRounded as ContactMailIcon,
  SecurityRounded as SecurityIcon,
  PaletteRounded as PaletteIcon,
  BusinessRounded as BusinessIcon,
} from "@mui/icons-material";
import { useTenantDetail } from "../TenantContext";

export default function TenantOverviewPage() {
  const { tenantId, tenant, loading, featuresList } = useTenantDetail();
  const router = useRouter();
  const theme = useTheme();

  const renderInfoTile = (
    label: string,
    value: React.ReactNode,
    chip?: { label: string; color?: "default" | "primary" | "secondary" | "success" | "warning" | "error" }
  ) => {
    const isValEmpty = value === undefined || value === null || value === "";
    return (
      <Box
        sx={{
          p: 1.75,
          borderRadius: 2,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
          border: `1px solid ${theme.palette.divider}`,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: "0.68rem",
            mb: 0.6,
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {chip && !isValEmpty ? (
            <Chip
              size="small"
              label={chip.label}
              color={chip.color || "default"}
              sx={{ fontWeight: 600, fontSize: "0.75rem", height: 24 }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: isValEmpty ? "text.disabled" : "text.primary",
                wordBreak: "break-word",
              }}
            >
              {!isValEmpty ? value : "No especificado"}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={260} />
        <Skeleton variant="rounded" height={260} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Title */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          Resumen General de la Empresa
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Métricas clave, capacidad contratada, perfiles legales y directivas activas de {tenant?.name}.
        </Typography>
      </Box>

      {/* Top 4 Metric Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Plan Contratado
              </Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mt: 0.5 }}>
                {tenant?.subscription?.planTier || "BASIC"}
              </Typography>
              <Chip
                label={tenant?.subscription?.status || "TRIAL"}
                size="small"
                color="secondary"
                sx={{ mt: 1, fontWeight: 700, height: 22 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Límite de Clientes
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                {tenant?.subscription?.maxClients ?? 5}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Conjuntos / propiedades
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Límite de Usuarios
              </Typography>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                {tenant?.subscription?.maxUsers ?? 50}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Cuentas de acceso
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Módulos Habilitados
              </Typography>
              <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
                {tenant?.features?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                De {featuresList.length} disponibles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card 1: Información de Contacto & Legal */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <ContactMailIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Información de Contacto & Legal
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/administrative/tenants/${tenantId}/legal`)}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Editar Legal
          </Button>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Razón Social Oficial", tenant?.profile?.legalName || tenant?.name)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("NIT / Identificación Fiscal", tenant?.profile?.taxId)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Correo Electrónico Institucional", tenant?.profile?.contactEmail)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Teléfono Principal", tenant?.profile?.contactPhone)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile(
              "Ciudad / País",
              tenant?.profile?.city || tenant?.profile?.country
                ? `${tenant?.profile?.city || "Bogotá"} - ${tenant?.profile?.country || "Colombia"}`
                : null
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Representante Legal", tenant?.profile?.legalRepresentative)}
          </Grid>
        </Grid>
      </Paper>

      {/* Card 2: Políticas & Seguridad */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <SecurityIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Políticas & Parámetros del Sistema
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/administrative/tenants/${tenantId}/settings`)}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Editar Ajustes
          </Button>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Zona Horaria", tenant?.settings?.timezone || "America/Bogota")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Moneda Oficial", tenant?.settings?.currency || "COP")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Formato de Fecha", tenant?.settings?.dateFormat || "DD/MM/YYYY")}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile(
              "Expiración de Sesión",
              `${tenant?.settings?.sessionTimeoutMinutes || 60} minutos`
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile(
              "MFA Obligatorio",
              tenant?.settings?.mfaRequired ? "Obligatorio" : "Opcional",
              {
                label: tenant?.settings?.mfaRequired ? "Obligatorio" : "Opcional",
                color: tenant?.settings?.mfaRequired ? "primary" : "default",
              }
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Política de Claves", tenant?.settings?.passwordPolicy || "MEDIUM")}
          </Grid>
        </Grid>
      </Paper>

      {/* Card 3: Identidad y Marca */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <PaletteIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Identidad Comercial y Estilo
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/administrative/tenants/${tenantId}/identity`)}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          >
            Editar Identidad
          </Button>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Nombre Comercial", tenant?.name)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile("Slug Identificador", tenant?.slug)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {renderInfoTile(
              "Estado Operativo",
              tenant?.isActive ? "Habilitado" : "Deshabilitado",
              {
                label: tenant?.isActive ? "Activo" : "Inactivo",
                color: tenant?.isActive ? "success" : "default",
              }
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${theme.palette.divider}`,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "0.68rem",
                  mb: 0.6,
                }}
              >
                Color Primario
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: 1,
                    bgcolor: tenant?.primaryColor || "#1a237e",
                    border: "1px solid rgba(0,0,0,0.15)",
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {tenant?.primaryColor || "#1a237e"}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${theme.palette.divider}`,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "0.68rem",
                  mb: 0.6,
                }}
              >
                Color Secundario
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: 1,
                    bgcolor: tenant?.secondaryColor || "#455a64",
                    border: "1px solid rgba(0,0,0,0.15)",
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {tenant?.secondaryColor || "#455a64"}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
                border: `1px solid ${theme.palette.divider}`,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "0.68rem",
                  mb: 0.6,
                }}
              >
                Color Barra Lateral
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: 1,
                    bgcolor: tenant?.sidebarColor || "transparent",
                    border: "1px solid rgba(0,0,0,0.15)",
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {tenant?.sidebarColor || "Heredado"}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
