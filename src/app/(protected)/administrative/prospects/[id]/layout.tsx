"use client";

import React, { useState } from "react";
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
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
} from "@mui/material";
import {
  ArrowBackRounded as ArrowBackIcon,
  DashboardRounded as DashboardIcon,
  HomeWorkRounded as HomeWorkIcon,
  ReceiptLongRounded as ReceiptLongIcon,
  HandshakeRounded as HandshakeIcon,
  ApartmentRounded as ApartmentIcon,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { ProspectProvider, useProspectDetail } from "./ProspectContext";

interface NavItem {
  id: string;
  label: string;
  pathSuffix: string;
  icon: React.ReactElement;
  description: string;
  visible: boolean;
}

function ProspectLayoutContent({ children }: { children: React.ReactNode }) {
  const { prospectId, prospect, loading, saving, convertProspect, permissions } =
    useProspectDetail();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Convert Contract Drawer State
  const [convertDrawerOpen, setConvertDrawerOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({
    contractNumber: "",
    contractDate: new Date().toISOString().split("T")[0],
    lastContractDate: new Date().toISOString().split("T")[0],
    contractEndDate: "",
    renewedContract: false,
  });

  const handleOpenConvertDrawer = () => {
    setConvertForm({
      contractNumber: "",
      contractDate: new Date().toISOString().split("T")[0],
      lastContractDate: new Date().toISOString().split("T")[0],
      contractEndDate: "",
      renewedContract: false,
    });
    setConvertDrawerOpen(true);
  };

  const handleConfirmConvert = async () => {
    if (!convertForm.contractNumber.trim()) {
      return;
    }
    const success = await convertProspect(convertForm);
    if (success) {
      setConvertDrawerOpen(false);
      router.push("/administrative/clients");
    }
  };

  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Resumen General",
      pathSuffix: "overview",
      icon: <DashboardIcon fontSize="small" />,
      description: "Datos básicos, ubicación y asignación comercial",
      visible: permissions.canRead,
    },
    {
      id: "operations",
      label: "Operaciones y Estructura",
      pathSuffix: "operations",
      icon: <HomeWorkIcon fontSize="small" />,
      description: "Estructura física, amenidades y accesos",
      visible: permissions.canRead,
    },
    {
      id: "commercial",
      label: "Gestión Comercial y CRM",
      pathSuffix: "commercial",
      icon: <ReceiptLongIcon fontSize="small" />,
      description: "Bitácora de seguimiento, propuestas y recaptación",
      visible: true,
    },
  ];

  const visibleNavItems = navItems.filter((i) => i.visible);

  const getIsActive = (pathSuffix: string) => {
    return pathname.endsWith(`/${pathSuffix}`);
  };

  const isRootLanding =
    pathname === `/administrative/prospects/${prospectId}` ||
    pathname === `/administrative/prospects/${prospectId}/`;

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
          {/* Back to prospects list */}
          <Box sx={{ mb: 2 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => router.push("/administrative/prospects")}
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
              Volver a Prospectos
            </Button>
          </Box>

          {/* Prospect Header Info */}
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
                    title={prospect?.name}
                    sx={{
                      flex: 1,
                      fontSize: "0.95rem",
                      lineHeight: 1.3,
                      wordBreak: "break-word",
                    }}
                  >
                    {prospect?.name || "Prospecto"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    flexWrap: "wrap",
                    mb: 1.5,
                  }}
                >
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

                {/* Formalizar Contrato Action */}
                {permissions.canConvert && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<HandshakeIcon />}
                    onClick={handleOpenConvertDrawer}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      boxShadow: "0 4px 12px rgba(46, 125, 50, 0.25)",
                      "&:hover": {
                        boxShadow: "0 6px 16px rgba(46, 125, 50, 0.35)",
                      },
                    }}
                  >
                    Formalizar Contrato
                  </Button>
                )}
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
            Secciones del Prospecto
          </Typography>

          <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.8 }}>
            {visibleNavItems.map((item) => {
              const active = getIsActive(item.pathSuffix);
              return (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    onClick={() =>
                      router.push(
                        `/administrative/prospects/${prospectId}/${item.pathSuffix}`,
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      py: 1.1,
                      px: 1.5,
                      bgcolor: active
                        ? theme.palette.mode === "dark"
                          ? "rgba(33, 150, 243, 0.15)"
                          : "rgba(255, 255, 255, 0.08)"
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
              onClick={() => router.push(`/administrative/prospects/${prospectId}`)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Menú del Prospecto
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ flex: 1, color: "text.secondary" }}
            >
              {prospect?.name || "Prospecto"}
            </Typography>
            {permissions.canConvert && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<HandshakeIcon fontSize="small" />}
                onClick={handleOpenConvertDrawer}
                sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
              >
                Formalizar
              </Button>
            )}
          </Box>
        )}

        {children}
      </Box>

      {/* Convert Contract Drawer */}
      <ResponsiveFormDrawer
        open={convertDrawerOpen}
        onClose={() => !saving && setConvertDrawerOpen(false)}
        title={`Formalizar Contrato: ${prospect?.name || ""}`}
        subtitle="Al formalizar el contrato, el prospecto se convertirá en un Cliente Activo del CRM."
        isSubmitting={saving}
        submitButtonText="Cerrar y Convertir a Cliente"
        formId="convert-prospect-form"
        width={{ xs: "100%", sm: 540 }}
      >
        <Box
          component="form"
          id="convert-prospect-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmConvert();
          }}
          sx={{ p: 2 }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Número de Contrato"
                value={convertForm.contractNumber}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, contractNumber: e.target.value })
                }
                required
                placeholder="Ej. CTR-2026-0089"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Firma del Contrato"
                value={convertForm.contractDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, contractDate: e.target.value })
                }
                slotProps={{ inputLabel: { shrink: true } }}
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Inicio del Servicio"
                value={convertForm.lastContractDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, lastContractDate: e.target.value })
                }
                slotProps={{ inputLabel: { shrink: true } }}
                required
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Terminación (Opcional)"
                value={convertForm.contractEndDate}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, contractEndDate: e.target.value })
                }
                slotProps={{ inputLabel: { shrink: true } }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={convertForm.renewedContract}
                    onChange={(e) =>
                      setConvertForm({
                        ...convertForm,
                        renewedContract: e.target.checked,
                      })
                    }
                  />
                }
                label="¿Es Renovación Contractual?"
              />
            </Grid>
          </Grid>
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}

export default function ProspectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const prospectId = params?.id as string;

  return (
    <ProspectProvider prospectId={prospectId}>
      <ProspectLayoutContent>{children}</ProspectLayoutContent>
    </ProspectProvider>
  );
}
