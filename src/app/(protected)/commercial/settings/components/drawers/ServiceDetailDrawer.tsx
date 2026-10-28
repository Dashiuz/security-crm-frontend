"use client";

import React from "react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from "@mui/material";
import {
  EditOutlined,
  ShieldOutlined,
  AccessTimeOutlined,
  CalendarTodayOutlined,
  SecurityOutlined,
  PercentOutlined,
  WorkOutline,
} from "@mui/icons-material";
import ResponsiveDetailWrapper from "@/components/common/ResponsiveDetailWrapper";
import {
  SecurityServiceCatalogItem,
  CommercialSector,
  WeaponModality,
  ShiftScheduleType,
  WorkingDaysModality,
} from "@/lib/api/commercial-settings";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";

interface ServiceDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  service: SecurityServiceCatalogItem | null;
  onEdit: (service: SecurityServiceCatalogItem) => void;
}

const getSectorInfo = (sector: CommercialSector) => {
  switch (sector) {
    case CommercialSector.COMMERCIAL_PUBLIC:
      return { label: "Comercial y Público", color: "primary" as const };
    case CommercialSector.RESIDENTIAL_STRATA_4_6:
      return { label: "Residencial Estrato 4, 5 y 6", color: "info" as const };
    case CommercialSector.RESIDENTIAL_STRATA_1_3:
      return { label: "Residencial Estrato 1, 2 y 3", color: "default" as const };
    default:
      return { label: sector || "No especificado", color: "default" as const };
  }
};

const getWeaponLabel = (weapon: WeaponModality) => {
  switch (weapon) {
    case WeaponModality.LETHAL_WEAPON:
      return "Con Arma Letal";
    case WeaponModality.NO_WEAPON:
      return "Sin Arma";
    case WeaponModality.NON_LETHAL_WEAPON:
      return "Arma No Letal";
    case WeaponModality.CANINE_SUPPORT:
      return "Medio Canino";
    default:
      return weapon || "No especificado";
  }
};

const getScheduleLabel = (type: ShiftScheduleType) => {
  switch (type) {
    case ShiftScheduleType.SCHEDULE_2X2X2:
      return "Turno 2x2x2 (Rotativo 12h)";
    case ShiftScheduleType.SCHEDULE_3X3X2:
      return "Turno 3x3x2";
    case ShiftScheduleType.SCHEDULE_4X4X2:
      return "Turno 4x4x2";
    case ShiftScheduleType.SCHEDULE_5X2:
      return "Turno 5x2 (Oficina / Diurno)";
    case ShiftScheduleType.SCHEDULE_6X1:
      return "Turno 6x1";
    case ShiftScheduleType.SPECIAL_CUSTOM:
      return "Especial / A Medida";
    default:
      return type || "No especificado";
  }
};

const getDaysModalityLabel = (modality: WorkingDaysModality) => {
  switch (modality) {
    case WorkingDaysModality.DAYS_30_ALL_MONTH:
      return "30 Días (L-D Mes Completo)";
    case WorkingDaysModality.DAYS_26_MON_SAT_HOL:
      return "26 Días (L-S con Festivos)";
    case WorkingDaysModality.DAYS_24_MON_SAT_NO_HOL:
      return "24 Días (L-S sin Festivos)";
    case WorkingDaysModality.DAYS_22_MON_FRI_HOL:
      return "22 Días (L-V con Festivos)";
    case WorkingDaysModality.DAYS_20_MON_FRI_NO_HOL:
      return "20 Días (L-V sin Festivos)";
    case WorkingDaysModality.DAYS_10_WEEKEND_HOL:
      return "10 Días (S-D y Festivos)";
    case WorkingDaysModality.DAYS_8_WEEKEND_ONLY:
      return "8 Días (S-D)";
    case WorkingDaysModality.DAYS_2_HOLIDAYS_ONLY:
      return "2 Días (Solo Festivos)";
    default:
      return modality || "No especificado";
  }
};

export default function ServiceDetailDrawer({
  open,
  onClose,
  service,
  onEdit,
}: ServiceDetailDrawerProps) {
  if (!service) return null;

  const sectorInfo = getSectorInfo(service.sector);

  const handleEditClick = () => {
    onEdit(service);
  };

  return (
    <ResponsiveDetailWrapper
      open={open}
      onClose={onClose}
      title="Detalle del Servicio de Vigilancia"
      headerActions={
        <Tooltip title="Editar Servicio">
          <IconButton
            size="small"
            onClick={handleEditClick}
            sx={{
              color: noxiaPalette.primary.main,
              bgcolor: "rgba(124, 58, 237, 0.08)",
              "&:hover": {
                bgcolor: "rgba(124, 58, 237, 0.16)",
              },
            }}
          >
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      }
      actions={
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Button variant="outlined" color="inherit" onClick={onClose} sx={{ borderRadius: 2 }}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<EditOutlined />}
            onClick={handleEditClick}
            sx={{
              bgcolor: noxiaPalette.primary.main,
              "&:hover": { bgcolor: noxiaPalette.primary.dark },
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Editar Servicio
          </Button>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Encabezado Principal / Hero Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            bgcolor: "#F8FAFC",
            border: "1px solid #E2E8F0",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Chip
                  label={`#${service.serviceCode}`}
                  size="small"
                  sx={{
                    fontFamily: jetBrainsMono.style.fontFamily,
                    fontWeight: 700,
                    bgcolor: "rgba(124, 58, 237, 0.12)",
                    color: noxiaPalette.primary.main,
                  }}
                />
                <Chip
                  label={sectorInfo.label}
                  size="small"
                  color={sectorInfo.color}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
                {service.name}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <WorkOutline sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  Cargo: <b>{service.targetPosition}</b>
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Especificaciones Operativas y Armamento */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "text.secondary",
              display: "block",
              mb: 1.5,
            }}
          >
            Especificaciones Operativas
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <SecurityOutlined sx={{ color: noxiaPalette.primary.main }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Modalidad de Arma
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getWeaponLabel(service.weaponModality)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AccessTimeOutlined sx={{ color: noxiaPalette.primary.main }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Esquema de Turno
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getScheduleLabel(service.scheduleType)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CalendarTodayOutlined sx={{ color: noxiaPalette.primary.main }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Días Hábiles
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getDaysModalityLabel(service.daysModality)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <PercentOutlined sx={{ color: noxiaPalette.primary.main }} />
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Factor A&S (Supervisión)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: noxiaPalette.primary.dark,
                      fontFamily: jetBrainsMono.style.fontFamily,
                    }}
                  >
                    {(Number(service.adminSupervisionPct) * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Box>

        <Divider />

        {/* Desglose Horario y Facturación */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "text.secondary",
              display: "block",
              mb: 1.5,
            }}
          >
            Desglose Horario de Facturación
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Horas Totales Diarias
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontFamily: jetBrainsMono.style.fontFamily,
                    color: "#1E293B",
                  }}
                >
                  {service.dailyTotalHours}h
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Diurnas / Nocturnas
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontFamily: jetBrainsMono.style.fontFamily,
                    color: "#475569",
                  }}
                >
                  {service.dayHours}D / {service.nightHours}N
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Días al Mes
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontFamily: jetBrainsMono.style.fontFamily,
                    color: noxiaPalette.primary.main,
                  }}
                >
                  {service.billableDaysPerMonth} días
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Banner Informativo SVSP */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "rgba(124, 58, 237, 0.04)",
            border: "1px dashed rgba(124, 58, 237, 0.3)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ShieldOutlined sx={{ color: noxiaPalette.primary.main }} />
            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4 }}>
              Este servicio es utilizado por el <b>Motor Tarifario SVSP</b> para calcular el salario base, auxilio de transporte, recargos nocturnos, festivos y factor multiplicador de cotización oficial.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </ResponsiveDetailWrapper>
  );
}
