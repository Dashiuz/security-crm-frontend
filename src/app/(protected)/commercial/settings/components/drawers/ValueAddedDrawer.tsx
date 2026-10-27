"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
} from "@mui/material";
import { CardGiftcardOutlined } from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  ValueAddedCatalogItem,
  CommercialSettingsApi,
  ValueAddedCategory,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";

interface ValueAddedDrawerProps {
  open: boolean;
  onClose: () => void;
  item?: ValueAddedCatalogItem | null;
  onSuccess: () => void;
}

export default function ValueAddedDrawer({
  open,
  onClose,
  item,
  onSuccess,
}: ValueAddedDrawerProps) {
  const { showSuccess, showError } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: ValueAddedCategory.POST_EQUIPMENT,
    description: "",
    internalReferenceCost: 0,
    isStandardBenefit: false,
    defaultQuantity: 1,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        description: item.description || "",
        internalReferenceCost: Number(item.internalReferenceCost) || 0,
        isStandardBenefit: item.isStandardBenefit,
        defaultQuantity: Number(item.defaultQuantity) || 1,
      });
    } else {
      setFormData({
        name: "",
        category: ValueAddedCategory.POST_EQUIPMENT,
        description: "",
        internalReferenceCost: 0,
        isStandardBenefit: false,
        defaultQuantity: 1,
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        internalReferenceCost: Number(formData.internalReferenceCost) || 0,
        defaultQuantity: Number(formData.defaultQuantity) || 1,
      };
      if (item?.id) {
        await CommercialSettingsApi.updateValueAdded(item.id, payload);
        showSuccess("Valor agregado actualizado");
      } else {
        await CommercialSettingsApi.createValueAdded(payload);
        showSuccess("Valor agregado registrado");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Error al guardar el valor agregado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={item ? "Editar Valor Agregado" : "Nuevo Valor Agregado"}
      subtitle="Dotación en especie o beneficio comercial para ofertas"
      headerIcon={<CardGiftcardOutlined />}
      width={{ xs: "100%", sm: 500 }}
      isSubmitting={isSubmitting}
      submitButtonText={item ? "Actualizar" : "Crear"}
      formId="value-added-form"
    >
      <Box component="form" id="value-added-form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 1 }}>
        <TextField
          fullWidth
          required
          size="small"
          label="Nombre del Bien o Servicio"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ej: Locker metálico 4 puestos"
        />

        <FormControl fullWidth size="small">
          <InputLabel id="category-label">Categoría</InputLabel>
          <Select
            labelId="category-label"
            value={formData.category}
            label="Categoría"
            onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as ValueAddedCategory }))}
          >
            <MenuItem value={ValueAddedCategory.POST_EQUIPMENT}>Dotación de Puesto (Lockers, Microondas)</MenuItem>
            <MenuItem value={ValueAddedCategory.SERVICE_SUPPORT}>Apoyo Operativo (Turno 12h adicional)</MenuItem>
            <MenuItem value={ValueAddedCategory.TECHNOLOGY_COMODATO}>Tecnología en Comodato (Cámaras, DVR)</MenuItem>
            <MenuItem value={ValueAddedCategory.SECURITY_STUDY}>Estudios de Seguridad y Análisis de Riesgo</MenuItem>
            <MenuItem value={ValueAddedCategory.CASH_REINVESTMENT}>Reinversión en Efectivo / Adecuaciones</MenuItem>
          </Select>
        </FormControl>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Costo Interno P&L (COP)"
              value={formData.internalReferenceCost}
              onChange={(e) => setFormData((p) => ({ ...p, internalReferenceCost: parseFloat(e.target.value) || 0 }))}
              helperText="Costo real para balance financiero"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Cantidad Sugerida"
              value={formData.defaultQuantity}
              onChange={(e) => setFormData((p) => ({ ...p, defaultQuantity: parseInt(e.target.value) || 1 }))}
              inputProps={{ min: 1 }}
            />
          </Grid>
        </Grid>

        <TextField
          fullWidth
          multiline
          rows={3}
          size="small"
          label="Descripción o Ficha Técnica"
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          placeholder="Ej: Metálico calibre 22 con cerrojo de seguridad..."
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.isStandardBenefit}
              onChange={(e) => setFormData((p) => ({ ...p, isStandardBenefit: e.target.checked }))}
            />
          }
          label="Incluir por defecto como beneficio estándar en propuestas"
        />
      </Box>
    </ResponsiveFormDrawer>
  );
}
