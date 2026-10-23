"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Grid,
  Typography,
  Divider,
} from "@mui/material";
import { CalendarMonthOutlined } from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { TariffPeriodConfig, CommercialSettingsApi } from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";

interface TariffPeriodDrawerProps {
  open: boolean;
  onClose: () => void;
  period?: TariffPeriodConfig | null;
  onSuccess: () => void;
}

export default function TariffPeriodDrawer({
  open,
  onClose,
  period,
  onSuccess,
}: TariffPeriodDrawerProps) {
  const { showSuccess, showError } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    year: 2026,
    label: "Tarifa Vigencia Oficial SVSP 2026 (44 Horas)",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    smmlv: 1750905,
    monthlyTransportAux: 249095,
    dailyTransportAux: 8303.17,
    statutoryWeeklyHours: 44,
    commercialMultiplier: 8.8,
    strata46Multiplier: 8.6,
    strata13Multiplier: 7.66376105,
  });

  useEffect(() => {
    if (period) {
      setFormData({
        year: period.year,
        label: period.label,
        startDate: period.startDate ? period.startDate.split("T")[0] : "2026-01-01",
        endDate: period.endDate ? period.endDate.split("T")[0] : "2026-12-31",
        smmlv: period.smmlv,
        monthlyTransportAux: period.monthlyTransportAux,
        dailyTransportAux: period.dailyTransportAux,
        statutoryWeeklyHours: period.statutoryWeeklyHours,
        commercialMultiplier: period.commercialMultiplier,
        strata46Multiplier: period.strata46Multiplier,
        strata13Multiplier: period.strata13Multiplier,
      });
    } else {
      setFormData({
        year: 2026,
        label: "Tarifa Vigencia Oficial SVSP 2026 (44 Horas)",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        smmlv: 1750905,
        monthlyTransportAux: 249095,
        dailyTransportAux: 8303.17,
        statutoryWeeklyHours: 44,
        commercialMultiplier: 8.8,
        strata46Multiplier: 8.6,
        strata13Multiplier: 7.66376105,
      });
    }
  }, [period, open]);

  const handleChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (period?.id) {
        await CommercialSettingsApi.updateTariffPeriod(period.id, formData);
        showSuccess("Tramo tarifario actualizado correctamente");
      } else {
        await CommercialSettingsApi.createTariffPeriod(formData);
        showSuccess("Vigencia tarifaria registrada exitosamente");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Error al guardar el tramo tarifario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={period ? "Editar Vigencia Tarifaria" : "Nueva Vigencia Tarifaria"}
      subtitle="Parámetros macroeconómicos y jornada legal oficial"
      headerIcon={<CalendarMonthOutlined />}
      width={{ xs: "100%", sm: 540 }}
      isSubmitting={isSubmitting}
      submitButtonText={period ? "Actualizar Vigencia" : "Crear Vigencia"}
      formId="tariff-period-form"
    >
      <Box component="form" id="tariff-period-form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 1 }}>
        <TextField
          fullWidth
          required
          size="small"
          label="Etiqueta Descriptiva"
          value={formData.label}
          onChange={(e) => handleChange("label", e.target.value)}
          placeholder="Ej: Tarifa 01 Julio al 31 Diciembre 2026 (44 Horas)"
        />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Año Fiscal"
              value={formData.year}
              onChange={(e) => handleChange("year", parseInt(e.target.value) || 2026)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="date"
              label="Fecha Inicio"
              slotProps={{ inputLabel: { shrink: true } }}
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="date"
              label="Fecha Fin"
              slotProps={{ inputLabel: { shrink: true } }}
              value={formData.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider />
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
          Variables Macroeconómicas Oficiales (SuperVigilancia)
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="SMMLV (COP)"
              value={formData.smmlv}
              onChange={(e) => handleChange("smmlv", parseFloat(e.target.value) || 0)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Auxilio Transporte Mensual"
              value={formData.monthlyTransportAux}
              onChange={(e) => handleChange("monthlyTransportAux", parseFloat(e.target.value) || 0)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Auxilio Transporte Diario"
              value={formData.dailyTransportAux}
              onChange={(e) => handleChange("dailyTransportAux", parseFloat(e.target.value) || 0)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Jornada Legal Semanal (Horas)"
              value={formData.statutoryWeeklyHours}
              onChange={(e) => handleChange("statutoryWeeklyHours", parseInt(e.target.value) || 44)}
              helperText="Ley 2101: 44h en 2026 (divisor 220h)"
            />
          </Grid>
        </Grid>

        <Divider />
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
          Multiplicadores Sectoriales (En número de SMMLV)
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Comercial y Público"
              value={formData.commercialMultiplier}
              onChange={(e) => handleChange("commercialMultiplier", parseFloat(e.target.value) || 8.8)}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Residencial E4-6"
              value={formData.strata46Multiplier}
              onChange={(e) => handleChange("strata46Multiplier", parseFloat(e.target.value) || 8.6)}
              inputProps={{ step: 0.1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Residencial E1-3"
              value={formData.strata13Multiplier}
              onChange={(e) => handleChange("strata13Multiplier", parseFloat(e.target.value) || 7.66)}
              inputProps={{ step: 0.01 }}
            />
          </Grid>
        </Grid>
      </Box>
    </ResponsiveFormDrawer>
  );
}
