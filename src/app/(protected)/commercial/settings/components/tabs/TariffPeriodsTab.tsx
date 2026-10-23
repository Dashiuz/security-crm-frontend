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

      {/* Widget Flotante del Simulador */}
      <LiveTariffSimulator activePeriod={activePeriod} />

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
