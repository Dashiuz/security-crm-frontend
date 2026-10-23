"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  Slider,
  TextField,
  Button,
  Chip,
  IconButton,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  EditOutlined,
  DeleteOutline,
  SaveOutlined,
} from "@mui/icons-material";
import {
  ValueAddedCatalogItem,
  CommercialSettings,
  CommercialSettingsApi,
} from "@/lib/api/commercial-settings";
import ValueAddedDrawer from "../drawers/ValueAddedDrawer";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";

interface ValueAddedTabProps {
  settings: CommercialSettings;
  onRefresh: () => void;
}

const formatCOP = (val: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(val);
};

export default function ValueAddedTab({ settings, onRefresh }: ValueAddedTabProps) {
  const { showSuccess, showError } = useNotification();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ValueAddedCatalogItem | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ValueAddedCatalogItem | null>(null);

  const [isSavingCaps, setIsSavingCaps] = useState(false);
  const [caps, setCaps] = useState({
    maxReinvestmentPct1Yr: Number(settings.maxReinvestmentPct1Yr) || 0.8,
    maxReinvestmentPct2Yr: Number(settings.maxReinvestmentPct2Yr) || 1.6,
    defaultQuoteValidityDays: settings.defaultQuoteValidityDays || 15,
  });

  const handleSaveCaps = async () => {
    try {
      setIsSavingCaps(true);
      await CommercialSettingsApi.updateSettings(caps);
      showSuccess("Topes de reinversión actualizados exitosamente");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al actualizar topes de reinversión");
    } finally {
      setIsSavingCaps(false);
    }
  };

  const handleEdit = (item: ValueAddedCatalogItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setDrawerOpen(true);
  };

  const handleDeleteClick = (item: ValueAddedCatalogItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await CommercialSettingsApi.deleteValueAdded(itemToDelete.id);
      showSuccess("Elemento eliminado del catálogo de valores agregados");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al eliminar el elemento");
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* 1. Bloque de Topes Financieros de Reinversión */}
      <Card elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid rgba(0,0,0,0.08)", bgcolor: "#FFFFFF" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2.5,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
              Políticas Comerciales y Topes de Reinversión
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Porcentaje máximo permitido sobre la primera factura sin requerir autorización de Gerencia General
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={isSavingCaps ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined />}
            onClick={handleSaveCaps}
            disabled={isSavingCaps}
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
            Guardar Topes
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Tope Contratos a 1 Año: {(caps.maxReinvestmentPct1Yr * 100).toFixed(0)}%
            </Typography>
            <Slider
              value={caps.maxReinvestmentPct1Yr}
              min={0}
              max={1.5}
              step={0.05}
              onChange={(_, v) => setCaps((p) => ({ ...p, maxReinvestmentPct1Yr: v as number }))}
              sx={{ color: noxiaPalette.primary.main }}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Hasta el {(caps.maxReinvestmentPct1Yr * 100).toFixed(0)}% del valor de la 1ra factura
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Tope Contratos a 2 Años: {(caps.maxReinvestmentPct2Yr * 100).toFixed(0)}%
            </Typography>
            <Slider
              value={caps.maxReinvestmentPct2Yr}
              min={0}
              max={3.0}
              step={0.1}
              onChange={(_, v) => setCaps((p) => ({ ...p, maxReinvestmentPct2Yr: v as number }))}
              sx={{ color: noxiaPalette.primary.main }}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Hasta el {(caps.maxReinvestmentPct2Yr * 100).toFixed(0)}% acumulado
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Validez de Ofertas (Días Hábiles)"
              value={caps.defaultQuoteValidityDays}
              onChange={(e) => setCaps((p) => ({ ...p, defaultQuoteValidityDays: parseInt(e.target.value) || 15 }))}
              helperText="Vigencia por defecto en cartas comerciales"
            />
          </Grid>
        </Grid>
      </Card>

      {/* 2. Catálogo de Bienes en Especie y Valores Agregados */}
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2.5,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
              Catálogo de Bienes en Especie y Valores Agregados ({settings.valueAddedCatalog?.length || 0})
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Dotaciones, comodato y servicios que pueden ofrecerse al prospecto con su costo interno de referencia
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
            Nuevo Valor Agregado
          </Button>
        </Box>

        <Grid container spacing={2}>
          {(settings.valueAddedCatalog || []).map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid rgba(0,0,0,0.08)",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: noxiaPalette.primary.light },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Chip
                      label={item.category}
                      size="small"
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        bgcolor: `${noxiaPalette.primary.main}12`,
                        color: noxiaPalette.primary.main,
                      }}
                    />
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => handleEdit(item)}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(item)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {item.name}
                  </Typography>

                  {item.description && (
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                      {item.description}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ bgcolor: "rgba(0,0,0,0.02)", p: 1.5, borderRadius: 2, mt: 1 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Costo Interno P&L:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.secondary.main }}>
                    {formatCOP(item.internalReferenceCost)}
                  </Typography>
                  {item.isStandardBenefit && (
                    <Chip label="Beneficio Estándar" size="small" color="success" variant="outlined" sx={{ mt: 1, fontSize: "0.65rem", fontWeight: 700 }} />
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Drawer */}
      <ValueAddedDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={selectedItem}
        onSuccess={onRefresh}
      />

      {/* Confirmación Eliminación */}
      <PromptConfirmDialog
        open={deleteConfirmOpen}
        title="Eliminar Valor Agregado"
        description={`Para confirmar la eliminación de "${itemToDelete?.name}", escriba ELIMINAR:`}
        expectedValue="ELIMINAR"
        inputLabel="Confirmación"
        confirmButtonText="Eliminar Valor Agregado"
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
}
