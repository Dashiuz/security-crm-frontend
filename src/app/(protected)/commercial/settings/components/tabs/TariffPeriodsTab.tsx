"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  EditOutlined,
  DeleteOutline,
  VerifiedOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import { TariffPeriodConfig, CommercialSettingsApi } from "@/lib/api/commercial-settings";
import LiveTariffSimulator from "../widgets/LiveTariffSimulator";
import TariffPeriodDrawer from "../drawers/TariffPeriodDrawer";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";

interface TariffPeriodsTabProps {
  periods: TariffPeriodConfig[];
  onRefresh: () => void;
}

const formatCOP = (val: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(val);
};

export default function TariffPeriodsTab({ periods, onRefresh }: TariffPeriodsTabProps) {
  const { showSuccess, showError } = useNotification();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TariffPeriodConfig | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<TariffPeriodConfig | null>(null);

  const activePeriod = periods.find((p) => p.isActive) || periods[0] || null;

  const handleEdit = (p: TariffPeriodConfig) => {
    setSelectedPeriod(p);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedPeriod(null);
    setDrawerOpen(true);
  };

  const handleActivate = async (p: TariffPeriodConfig) => {
    try {
      await CommercialSettingsApi.updateTariffPeriod(p.id, { isActive: true });
      showSuccess(`Vigencia "${p.label}" establecida como activa exitosamente`);
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al activar la vigencia");
    }
  };

  const handleDeleteClick = (p: TariffPeriodConfig) => {
    setPeriodToDelete(p);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!periodToDelete) return;
    try {
      await CommercialSettingsApi.deleteTariffPeriod(periodToDelete.id);
      showSuccess("Vigencia tarifaria eliminada exitosamente");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al eliminar la vigencia");
    } finally {
      setDeleteConfirmOpen(false);
      setPeriodToDelete(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Cabecera y Botón Nueva Vigencia */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
            Vigencias y Parámetros Tarifarios SVSP
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Administración de decretos salariales, tramos de jornada legal y multiplicadores oficiales
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{
            bgcolor: noxiaPalette.primary.main,
            "&:hover": {
              bgcolor: noxiaPalette.primary.dark,
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.35)",
            },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.82rem",
            px: 2.2,
            height: 36,
            whiteSpace: "nowrap",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(124, 58, 237, 0.2)",
          }}
        >
          Nueva Vigencia
        </Button>
      </Box>

      {/* Banner de Vigencia Oficial Activa en el Sistema */}
      {activePeriod && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${noxiaPalette.primary.main}30`,
            background: `linear-gradient(135deg, ${noxiaPalette.secondary.main} 0%, #1E1B4B 100%)`,
            color: "#FFFFFF",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "rgba(16, 185, 129, 0.2)",
                  color: "#34D399",
                  display: "flex",
                }}
              >
                <VerifiedOutlined />
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" sx={{ color: "#34D399", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    VIGENCIA OFICIAL ACTIVA EN EL SISTEMA
                  </Typography>
                  <Chip
                    label="ACTIVA GLOBAL"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      bgcolor: "#10B981",
                      color: "#FFFFFF",
                    }}
                  />
                </Stack>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#FFFFFF" }}>
                  {activePeriod.label} (Año Fiscal {activePeriod.year})
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
              <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", px: 1.5, py: 0.75, borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block", fontSize: "0.68rem" }}>
                  SMMLV Base
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily }}>
                  {formatCOP(activePeriod.smmlv)}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", px: 1.5, py: 0.75, borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block", fontSize: "0.68rem" }}>
                  Jornada Semanal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#38BDF8" }}>
                  {activePeriod.statutoryWeeklyHours} Horas
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", px: 1.5, py: 0.75, borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block", fontSize: "0.68rem" }}>
                  Comercial
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#A78BFA" }}>
                  {activePeriod.commercialMultiplier}x
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", px: 1.5, py: 0.75, borderRadius: 1.5 }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block", fontSize: "0.68rem" }}>
                  Residencial E4-6
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#F472B6" }}>
                  {activePeriod.strata46Multiplier}x
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      )}

      {/* Widget Flotante del Simulador */}
      <LiveTariffSimulator periods={periods} activePeriod={activePeriod} />

      {/* Listado de Vigencias Configuradas */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: noxiaPalette.secondary.main }}>
          Historial de Vigencias ({periods.length})
        </Typography>

        <Grid container spacing={2}>
          {periods.map((p) => (
            <Grid size={{ xs: 12, md: 6 }} key={p.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${p.isActive ? noxiaPalette.primary.main : "rgba(0,0,0,0.1)"}`,
                  boxShadow: p.isActive ? `0 4px 12px ${noxiaPalette.primary.main}15` : "none",
                  position: "relative",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: noxiaPalette.primary.light,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {p.label}
                        </Typography>
                        <Chip
                          label={p.isActive ? "ACTIVA" : "HISTÓRICA"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            bgcolor: p.isActive ? `${noxiaPalette.success.main}15` : "rgba(0,0,0,0.06)",
                            color: p.isActive ? noxiaPalette.success.dark : "text.secondary",
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Año Fiscal: {p.year} | Período: {p.startDate.split("T")[0]} al {p.endDate.split("T")[0]}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Editar tramo">
                        <IconButton size="small" onClick={() => handleEdit(p)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar tramo">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(p)}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  <Grid container spacing={1.5} sx={{ mt: 1, bgcolor: "rgba(0,0,0,0.02)", p: 1.5, borderRadius: 2 }}>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        SMMLV Base
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: jetBrainsMono.style.fontFamily }}>
                        {formatCOP(p.smmlv)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Aux. Transporte
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: jetBrainsMono.style.fontFamily }}>
                        {formatCOP(p.monthlyTransportAux)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Jornada Semanal
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: noxiaPalette.primary.main }}>
                        {p.statutoryWeeklyHours} Horas / Sem
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Comercial (SMMLV)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.commercialMultiplier}x
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Residencial E4-6
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.strata46Multiplier}x
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                        Residencial E1-3
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {Number(p.strata13Multiplier).toFixed(2)}x
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Estatus y Botón Establecer como Activa */}
                  <Box sx={{ mt: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {p.isActive ? (
                      <Typography variant="caption" sx={{ color: noxiaPalette.success.dark, fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 }}>
                        <VerifiedOutlined sx={{ fontSize: 16 }} /> Vigencia rectora del cotizador y simulador
                      </Typography>
                    ) : (
                      <Box sx={{ ml: "auto" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CheckCircleOutline fontSize="small" />}
                          onClick={() => handleActivate(p)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            borderRadius: 1.5,
                            color: noxiaPalette.primary.main,
                            borderColor: `${noxiaPalette.primary.main}40`,
                            "&:hover": { borderColor: noxiaPalette.primary.main, bgcolor: `${noxiaPalette.primary.main}08` },
                          }}
                        >
                          Establecer como Activa
                        </Button>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Drawer de Creación/Edición */}
      <TariffPeriodDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        period={selectedPeriod}
        onSuccess={onRefresh}
      />

      {/* Dialog de Confirmación de Eliminación */}
      <PromptConfirmDialog
        open={deleteConfirmOpen}
        title="Eliminar Tramo Tarifario"
        description={`Para confirmar la eliminación del tramo "${periodToDelete?.label}", escriba ELIMINAR:`}
        expectedValue="ELIMINAR"
        inputLabel="Confirmación"
        confirmButtonText="Eliminar Vigencia"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
}
