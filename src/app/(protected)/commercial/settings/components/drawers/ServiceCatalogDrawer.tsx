"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import { ShieldOutlined } from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  SecurityServiceCatalogItem,
  CommercialSettingsApi,
  CommercialSector,
  WeaponModality,
  ShiftScheduleType,
  WorkingDaysModality,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";

interface ServiceCatalogDrawerProps {
  open: boolean;
  onClose: () => void;
  serviceItem?: SecurityServiceCatalogItem | null;
  onSuccess: () => void;
}

export default function ServiceCatalogDrawer({
  open,
  onClose,
  serviceItem,
  onSuccess,
}: ServiceCatalogDrawerProps) {
  const { showSuccess, showError } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    serviceCode: 1,
    name: "Servicio de Vigilancia 24 horas",
    targetPosition: "Guarda Portero",
    sector: CommercialSector.COMMERCIAL_PUBLIC,
    weaponModality: WeaponModality.LETHAL_WEAPON,
    scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
    daysModality: WorkingDaysModality.DAYS_30_ALL_MONTH,
    dailyTotalHours: 24,
    dayHours: 15,
    nightHours: 9,
    billableDaysPerMonth: 30,
    adminSupervisionPct: 0.10,
  });

  useEffect(() => {
    if (serviceItem) {
      const rawPct = Number(serviceItem.adminSupervisionPct);
      setFormData({
        serviceCode: Number(serviceItem.serviceCode) || 1,
        name: serviceItem.name || "",
        targetPosition: serviceItem.targetPosition || "",
        sector: serviceItem.sector,
        weaponModality: serviceItem.weaponModality,
        scheduleType: serviceItem.scheduleType,
        daysModality: serviceItem.daysModality,
        dailyTotalHours: Number(serviceItem.dailyTotalHours) || 24,
        dayHours: Number(serviceItem.dayHours) || 15,
        nightHours: Number(serviceItem.nightHours) || 9,
        billableDaysPerMonth: Number(serviceItem.billableDaysPerMonth) || 30,
        adminSupervisionPct: isNaN(rawPct)
          ? 0.10
          : rawPct > 1
          ? rawPct / 100
          : rawPct,
      });
    } else {
      setFormData({
        serviceCode: 1,
        name: "Servicio de Vigilancia 24 horas",
        targetPosition: "Guarda Portero",
        sector: CommercialSector.COMMERCIAL_PUBLIC,
        weaponModality: WeaponModality.LETHAL_WEAPON,
        scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
        daysModality: WorkingDaysModality.DAYS_30_ALL_MONTH,
        dailyTotalHours: 24,
        dayHours: 15,
        nightHours: 9,
        billableDaysPerMonth: 30,
        adminSupervisionPct: 0.10,
      });
    }
  }, [serviceItem, open]);

  const handleChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const rawAdminPct = Number(formData.adminSupervisionPct);
      const sanitizedAdminPct = isNaN(rawAdminPct)
        ? 0.10
        : rawAdminPct > 1
        ? rawAdminPct / 100
        : rawAdminPct;

      const payload = {
        ...formData,
        serviceCode: Number(formData.serviceCode) || 1,
        dailyTotalHours: Number(formData.dailyTotalHours) || 24,
        dayHours: Number(formData.dayHours) || 0,
        nightHours: Number(formData.nightHours) || 0,
        billableDaysPerMonth: Number(formData.billableDaysPerMonth) || 30,
        adminSupervisionPct: sanitizedAdminPct,
      };

      if (serviceItem?.id) {
        await CommercialSettingsApi.updateServiceCatalog(serviceItem.id, payload);
        showSuccess("Servicio actualizado correctamente");
      } else {
        await CommercialSettingsApi.createServiceCatalog(payload);
        showSuccess("Nuevo servicio agregado al catálogo");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Error al guardar el servicio");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={serviceItem ? "Editar Servicio de Seguridad" : "Nuevo Servicio de Seguridad"}
      subtitle="Parámetros operativos de cobertura y esquema de turno"
      headerIcon={<ShieldOutlined />}
      width={{ xs: "100%", sm: 540 }}
      isSubmitting={isSubmitting}
      submitButtonText={serviceItem ? "Actualizar Servicio" : "Crear Servicio"}
      formId="service-catalog-form"
    >
      <Box component="form" id="service-catalog-form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 1 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Código Interno"
              value={formData.serviceCode}
              onChange={(e) => handleChange("serviceCode", parseInt(e.target.value) || 1)}
              disabled={!!serviceItem}
              helperText="Identificador numérico"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              required
              size="small"
              label="Cargo Objetivo"
              value={formData.targetPosition}
              onChange={(e) => handleChange("targetPosition", e.target.value)}
              placeholder="Ej: Guarda Portero, Supervisor, OMT"
            />
          </Grid>
        </Grid>

        <TextField
          fullWidth
          required
          size="small"
          label="Nombre Comercial del Servicio"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Ej: Vigilancia 24 horas Armada"
        />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="srv-sector-label">Sector Económico</InputLabel>
              <Select
                labelId="srv-sector-label"
                value={formData.sector}
                label="Sector Económico"
                onChange={(e) => handleChange("sector", e.target.value as CommercialSector)}
              >
                <MenuItem value={CommercialSector.COMMERCIAL_PUBLIC}>Comercial y Público</MenuItem>
                <MenuItem value={CommercialSector.RESIDENTIAL_STRATA_4_6}>Residencial Estrato 4, 5 y 6</MenuItem>
                <MenuItem value={CommercialSector.RESIDENTIAL_STRATA_1_3}>Residencial Estrato 1, 2 y 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="srv-weapon-label">Modalidad de Arma</InputLabel>
              <Select
                labelId="srv-weapon-label"
                value={formData.weaponModality}
                label="Modalidad de Arma"
                onChange={(e) => handleChange("weaponModality", e.target.value as WeaponModality)}
              >
                <MenuItem value={WeaponModality.LETHAL_WEAPON}>Con Arma Letal</MenuItem>
                <MenuItem value={WeaponModality.NO_WEAPON}>Sin Arma</MenuItem>
                <MenuItem value={WeaponModality.NON_LETHAL_WEAPON}>Arma No Letal</MenuItem>
                <MenuItem value={WeaponModality.CANINE_SUPPORT}>Medio Canino</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="srv-schedule-label">Esquema de Turno</InputLabel>
              <Select
                labelId="srv-schedule-label"
                value={formData.scheduleType}
                label="Esquema de Turno"
                onChange={(e) => handleChange("scheduleType", e.target.value as ShiftScheduleType)}
              >
                <MenuItem value={ShiftScheduleType.SCHEDULE_2X2X2}>Turno 2x2x2 (Rotativo 12h)</MenuItem>
                <MenuItem value={ShiftScheduleType.SCHEDULE_3X3X2}>Turno 3x3x2</MenuItem>
                <MenuItem value={ShiftScheduleType.SCHEDULE_4X4X2}>Turno 4x4x2</MenuItem>
                <MenuItem value={ShiftScheduleType.SCHEDULE_5X2}>Turno 5x2 (Oficina / Diurno)</MenuItem>
                <MenuItem value={ShiftScheduleType.SCHEDULE_6X1}>Turno 6x1</MenuItem>
                <MenuItem value={ShiftScheduleType.SPECIAL_CUSTOM}>Especial / A Medida</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="srv-days-modality-label">Días Hábiles</InputLabel>
              <Select
                labelId="srv-days-modality-label"
                value={formData.daysModality}
                label="Días Hábiles"
                onChange={(e) => handleChange("daysModality", e.target.value as WorkingDaysModality)}
              >
                <MenuItem value={WorkingDaysModality.DAYS_30_ALL_MONTH}>30 Días (L-D Mes Completo)</MenuItem>
                <MenuItem value={WorkingDaysModality.DAYS_26_MON_SAT_HOL}>26 Días (L-S con Festivos)</MenuItem>
                <MenuItem value={WorkingDaysModality.DAYS_24_MON_SAT_NO_HOL}>24 Días (L-S sin Festivos)</MenuItem>
                <MenuItem value={WorkingDaysModality.DAYS_22_MON_FRI_HOL}>22 Días (L-V con Festivos)</MenuItem>
                <MenuItem value={WorkingDaysModality.DAYS_20_MON_FRI_NO_HOL}>20 Días (L-V sin Festivos)</MenuItem>
                <MenuItem value={WorkingDaysModality.DAYS_10_WEEKEND_HOL}>10 Días (S-D y Festivos)</MenuItem>
                <MenuItem value={WorkingDaysModality.DAYS_8_WEEKEND_ONLY}>8 Días (S-D)</MenuItem>
                <MenuItem value={WorkingDaysModality.DAYS_2_HOLIDAYS_ONLY}>2 Días (Solo Festivos)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider />
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
          Desglose Horario y Factor de A&S
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Horas Totales"
              value={formData.dailyTotalHours}
              onChange={(e) => handleChange("dailyTotalHours", parseInt(e.target.value) || 0)}
              inputProps={{ min: 1, max: 24 }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Horas Día"
              value={formData.dayHours}
              onChange={(e) => handleChange("dayHours", parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: 24 }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Horas Noche"
              value={formData.nightHours}
              onChange={(e) => handleChange("nightHours", parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: 24 }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              required
              size="small"
              type="number"
              label="Días Mes"
              value={formData.billableDaysPerMonth}
              onChange={(e) => handleChange("billableDaysPerMonth", parseInt(e.target.value) || 30)}
              inputProps={{ min: 1, max: 31 }}
            />
          </Grid>
        </Grid>

        <TextField
          fullWidth
          required
          size="small"
          type="number"
          label="% A&S (Administración y Supervisión)"
          value={
            formData.adminSupervisionPct !== undefined && formData.adminSupervisionPct !== null
              ? Math.round(Number(formData.adminSupervisionPct) * 100)
              : ""
          }
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              handleChange("adminSupervisionPct", 0);
            } else {
              const val = parseFloat(raw);
              handleChange("adminSupervisionPct", isNaN(val) ? 0 : val / 100);
            }
          }}
          helperText="Generalmente 8%, 10% u 11%"
          inputProps={{ min: 0, max: 50, step: 1 }}
        />
      </Box>
    </ResponsiveFormDrawer>
  );
}
