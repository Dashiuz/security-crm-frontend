"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Stack,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  InfoOutlined,
  SaveOutlined,
  AccessTimeFilled,
  AddOutlined,
  DeleteOutline,
  AutoFixHighOutlined,
  CalendarMonthOutlined,
} from "@mui/icons-material";
import {
  PositionSalaryMatrixItem,
  CommercialSettingsApi,
  SalarySimulationResult,
  ShiftScheduleType,
  TariffPeriodConfig,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";

interface SalaryMatrixTabProps {
  salaryMatrix: PositionSalaryMatrixItem[];
  tariffPeriods?: TariffPeriodConfig[];
  onRefresh: () => void;
}

const formatCOP = (val?: number) => {
  if (val === undefined || val === null || isNaN(val)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(val);
};

export const SHIFT_SCHEDULE_CONFIG: Record<
  ShiftScheduleType,
  { label: string; shortLabel: string; guards: number; ordHours: number; extHours: number; description: string }
> = {
  [ShiftScheduleType.SCHEDULE_2X2X2]: {
    label: "Turno 2x2x2 (24 Horas Rotativo)",
    shortLabel: "2x2x2 (24h Rotativo)",
    guards: 3.0,
    ordHours: 8,
    extHours: 4,
    description: "2 días, 2 noches, 2 descansos - Factor 3.0 guardas",
  },
  [ShiftScheduleType.SCHEDULE_3X3X2]: {
    label: "Turno 3x3x2 (24 Horas Relevos)",
    shortLabel: "3x3x2 (24h Relevos)",
    guards: 2.8,
    ordHours: 8,
    extHours: 4,
    description: "3 días, 3 noches, 2 descansos - Factor 2.8 guardas",
  },
  [ShiftScheduleType.SCHEDULE_4X4X2]: {
    label: "Turno 4x4x2 (24 Horas Extendido)",
    shortLabel: "4x4x2 (24h Extendido)",
    guards: 3.0,
    ordHours: 8,
    extHours: 4,
    description: "4 días, 4 noches, 2 descansos - Factor 3.0 guardas",
  },
  [ShiftScheduleType.SCHEDULE_5X1]: {
    label: "Turno 5x1 (12 Horas Lunes a Sábado)",
    shortLabel: "5x1 (12h Lun-Sáb)",
    guards: 1.2,
    ordHours: 8,
    extHours: 4,
    description: "12 horas diurno/nocturno - Factor 1.2 guardas",
  },
  [ShiftScheduleType.SCHEDULE_5X2]: {
    label: "Turno 5x2 (12 Horas Hábil)",
    shortLabel: "5x2 (12h Hábil)",
    guards: 1.0,
    ordHours: 8,
    extHours: 0,
    description: "Lunes a viernes 12h - Factor 1.0 guarda",
  },
  [ShiftScheduleType.SCHEDULE_6X1]: {
    label: "Turno 6x1 (8 Horas Ordinario)",
    shortLabel: "6x1 (8h Ordinario)",
    guards: 1.0,
    ordHours: 8,
    extHours: 0,
    description: "6 días trabajo, 1 descanso - Factor 1.0 guarda",
  },
  [ShiftScheduleType.SCHEDULE_6X2]: {
    label: "Turno 6x2 (Rotativo 8 Horas)",
    shortLabel: "6x2 (8h Rotativo)",
    guards: 1.2,
    ordHours: 8,
    extHours: 0,
    description: "6 días trabajo, 2 descansos - Factor 1.2 guardas",
  },
  [ShiftScheduleType.SCHEDULE_7X1]: {
    label: "Turno 7x1 (Relevo Semanal)",
    shortLabel: "7x1 (Relevo Semanal)",
    guards: 1.0,
    ordHours: 8,
    extHours: 0,
    description: "Turno corrido semanal - Factor 1.0 guarda",
  },
  [ShiftScheduleType.SPECIAL_CUSTOM]: {
    label: "Turno Especial / A la Medida",
    shortLabel: "Especial Personalizado",
    guards: 3.0,
    ordHours: 8,
    extHours: 4,
    description: "Configuración personalizada según pliego",
  },
};

/**
 * Calcula de manera inteligente las horas extras y recargos según el turno y tarifas oficiales SVSP
 */
export const calculateSmartOvertime = (
  baseSalary: number,
  scheduleType: ShiftScheduleType,
  simulation: SalarySimulationResult | null
): number => {
  const baseHourlyRate = simulation?.reference?.baseHourlyRate || (baseSalary > 0 ? baseSalary / 220 : 7959);

  switch (scheduleType) {
    case ShiftScheduleType.SCHEDULE_5X2:
    case ShiftScheduleType.SCHEDULE_6X1:
    case ShiftScheduleType.SCHEDULE_6X2:
    case ShiftScheduleType.SCHEDULE_7X1:
      // Turnos ordinarios de 8h o 5x2 sin horas extras
      return 0;

    case ShiftScheduleType.SCHEDULE_5X1: {
      // 12h diurno lunes a sábado: ~48 horas extras diurnas al mes (recargo 25%)
      const overtimeRate = simulation?.reference?.hourlyRates?.overtimeDay?.totalHourlyRate || (baseHourlyRate * 1.25);
      return Math.round(48 * overtimeRate);
    }

    case ShiftScheduleType.SCHEDULE_3X3X2: {
      // 24h relevos: ~50h nocturnas, ~25h extra diurna, ~25h extra nocturna, ~12h dominicales
      const nightSurcharge = simulation?.reference?.hourlyRates?.ordinaryNight?.surchargeValue || (baseHourlyRate * 0.35);
      const extDay = simulation?.reference?.hourlyRates?.overtimeDay?.totalHourlyRate || (baseHourlyRate * 1.25);
      const extNight = simulation?.reference?.hourlyRates?.overtimeNight?.totalHourlyRate || (baseHourlyRate * 1.75);
      const domNight = simulation?.reference?.hourlyRates?.sundayHolidayOrdNight?.surchargeValue || (baseHourlyRate * 1.15);
      return Math.round(50 * nightSurcharge + 25 * extDay + 25 * extNight + 12 * domNight);
    }

    case ShiftScheduleType.SCHEDULE_2X2X2:
    case ShiftScheduleType.SCHEDULE_4X4X2:
    default: {
      // 24h rotativo estándar: ~60h nocturnas, ~30h extra diurna, ~30h extra nocturna, ~16h dominicales
      const nightSurcharge = simulation?.reference?.hourlyRates?.ordinaryNight?.surchargeValue || (baseHourlyRate * 0.35);
      const extDay = simulation?.reference?.hourlyRates?.overtimeDay?.totalHourlyRate || (baseHourlyRate * 1.25);
      const extNight = simulation?.reference?.hourlyRates?.overtimeNight?.totalHourlyRate || (baseHourlyRate * 1.75);
      const domNight = simulation?.reference?.hourlyRates?.sundayHolidayOrdNight?.surchargeValue || (baseHourlyRate * 1.15);
      return Math.round(60 * nightSurcharge + 30 * extDay + 30 * extNight + 16 * domNight);
    }
  }
};

export default function SalaryMatrixTab({
  salaryMatrix,
  tariffPeriods = [],
  onRefresh,
}: SalaryMatrixTabProps) {
  const { showSuccess, showError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [simulation, setSimulation] = useState<SalarySimulationResult | null>(null);

  // Vigencia seleccionada para referencia y cálculos
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  // Posición seleccionada para confirmación de eliminación
  const [deleteCandidate, setDeleteCandidate] = useState<{ index: number; position: PositionSalaryMatrixItem } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editable local state for positions
  const [positions, setPositions] = useState<PositionSalaryMatrixItem[]>([]);

  // Determinar vigencia activa o por defecto
  useEffect(() => {
    if (tariffPeriods && tariffPeriods.length > 0) {
      const active = tariffPeriods.find((p) => p.isActive) || tariffPeriods[0];
      if (active && (!selectedPeriodId || !tariffPeriods.some((p) => p.id === selectedPeriodId))) {
        setSelectedPeriodId(active.id);
      }
    }
  }, [tariffPeriods, selectedPeriodId]);

  const activePeriod = useMemo(() => {
    return (
      tariffPeriods.find((p) => p.id === selectedPeriodId) ||
      tariffPeriods.find((p) => p.isActive) ||
      tariffPeriods[0]
    );
  }, [tariffPeriods, selectedPeriodId]);

  // Cargar simulación oficial SVSP con base en la vigencia seleccionada
  useEffect(() => {
    const smmlv = activePeriod ? Number(activePeriod.smmlv) : 1750905;
    const transport = activePeriod ? Number(activePeriod.monthlyTransportAux) : 249095;

    CommercialSettingsApi.simulateSalary({
      smmlv,
      transportAllowance: transport,
      statutoryWeeklyHours: 44,
    })
      .then((res) => setSimulation(res))
      .catch((err) => {
        console.error("Error cargando simulación salarial:", err);
      });
  }, [activePeriod]);

  // Sincronizar positions desde prop
  useEffect(() => {
    if (salaryMatrix && salaryMatrix.length > 0) {
      setPositions(salaryMatrix);
    } else {
      const defaultSmmlv = activePeriod ? Number(activePeriod.smmlv) : 1750905;
      const defaultTrans = activePeriod ? Number(activePeriod.monthlyTransportAux) : 249095;

      setPositions([
        {
          positionTitle: "Guarda Portero",
          scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
          guardsRequiredPerPost: 3.0,
          baseSalary: defaultSmmlv,
          transportAllowance: defaultTrans,
          shiftOrdinaryHours: 8,
          shiftExtraHours: 4,
          estimatedOvertimePay: 680000,
          grossSalary: defaultSmmlv + defaultTrans + 680000,
          healthDeductionPct: 0.04,
          pensionDeductionPct: 0.04,
          healthDeduction: Math.round((defaultSmmlv + 680000) * 0.04),
          pensionDeduction: Math.round((defaultSmmlv + 680000) * 0.04),
          totalDeductions: Math.round((defaultSmmlv + 680000) * 0.08),
          fixedBonusNonSalary: 0,
          vehicleAllowance: 0,
          netTakeHomePay: (defaultSmmlv + defaultTrans + 680000) - Math.round((defaultSmmlv + 680000) * 0.08),
        },
        {
          positionTitle: "Supervisor Motorizado",
          scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
          guardsRequiredPerPost: 3.0,
          baseSalary: defaultSmmlv + 200000,
          transportAllowance: defaultTrans,
          shiftOrdinaryHours: 8,
          shiftExtraHours: 4,
          estimatedOvertimePay: 780000,
          grossSalary: defaultSmmlv + 200000 + defaultTrans + 780000 + 150000 + 650000,
          healthDeductionPct: 0.04,
          pensionDeductionPct: 0.04,
          healthDeduction: Math.round((defaultSmmlv + 200000 + 780000) * 0.04),
          pensionDeduction: Math.round((defaultSmmlv + 200000 + 780000) * 0.04),
          totalDeductions: Math.round((defaultSmmlv + 200000 + 780000) * 0.08),
          fixedBonusNonSalary: 150000,
          vehicleAllowance: 650000,
          netTakeHomePay: (defaultSmmlv + 200000 + defaultTrans + 780000 + 150000 + 650000) - Math.round((defaultSmmlv + 200000 + 780000) * 0.08),
        },
        {
          positionTitle: "Operador de Medios Tecnológicos (OMT)",
          scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
          guardsRequiredPerPost: 3.0,
          baseSalary: defaultSmmlv + 100000,
          transportAllowance: defaultTrans,
          shiftOrdinaryHours: 8,
          shiftExtraHours: 4,
          estimatedOvertimePay: 710000,
          grossSalary: defaultSmmlv + 100000 + defaultTrans + 710000 + 50000,
          healthDeductionPct: 0.04,
          pensionDeductionPct: 0.04,
          healthDeduction: Math.round((defaultSmmlv + 100000 + 710000) * 0.04),
          pensionDeduction: Math.round((defaultSmmlv + 100000 + 710000) * 0.04),
          totalDeductions: Math.round((defaultSmmlv + 100000 + 710000) * 0.08),
          fixedBonusNonSalary: 50000,
          vehicleAllowance: 0,
          netTakeHomePay: (defaultSmmlv + 100000 + defaultTrans + 710000 + 50000) - Math.round((defaultSmmlv + 100000 + 710000) * 0.08),
        },
        {
          positionTitle: "Recepcionista / Control de Acceso",
          scheduleType: ShiftScheduleType.SCHEDULE_5X2,
          guardsRequiredPerPost: 1.0,
          baseSalary: defaultSmmlv,
          transportAllowance: defaultTrans,
          shiftOrdinaryHours: 8,
          shiftExtraHours: 0,
          estimatedOvertimePay: 0,
          grossSalary: defaultSmmlv + defaultTrans,
          healthDeductionPct: 0.04,
          pensionDeductionPct: 0.04,
          healthDeduction: Math.round(defaultSmmlv * 0.04),
          pensionDeduction: Math.round(defaultSmmlv * 0.04),
          totalDeductions: Math.round(defaultSmmlv * 0.08),
          fixedBonusNonSalary: 0,
          vehicleAllowance: 0,
          netTakeHomePay: (defaultSmmlv + defaultTrans) - Math.round(defaultSmmlv * 0.08),
        },
      ]);
    }
  }, [salaryMatrix, activePeriod]);

  const recalculatePositionTotals = (item: PositionSalaryMatrixItem): PositionSalaryMatrixItem => {
    const baseSalary = Number(item.baseSalary) || 0;
    const transportAllowance = Number(item.transportAllowance) || 0;
    const overtimePay = Number(item.estimatedOvertimePay) || 0;
    const bonus = Number(item.fixedBonusNonSalary) || 0;
    const vehicle = Number(item.vehicleAllowance) || 0;

    const taxableBase = baseSalary + overtimePay;
    const health = Math.round(taxableBase * 0.04);
    const pension = Math.round(taxableBase * 0.04);
    const totalDed = health + pension;

    return {
      ...item,
      healthDeduction: health,
      pensionDeduction: pension,
      totalDeductions: totalDed,
      grossSalary: taxableBase + transportAllowance + bonus + vehicle,
      netTakeHomePay: (taxableBase + transportAllowance + bonus + vehicle) - totalDed,
    };
  };

  const handlePositionChange = (index: number, field: keyof PositionSalaryMatrixItem, val: any) => {
    setPositions((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      updated[index] = recalculatePositionTotals(item);
      return updated;
    });
  };

  const handleScheduleChange = (index: number, newSchedule: ShiftScheduleType) => {
    const scheduleCfg = SHIFT_SCHEDULE_CONFIG[newSchedule] || SHIFT_SCHEDULE_CONFIG[ShiftScheduleType.SCHEDULE_2X2X2];
    setPositions((prev) => {
      const updated = [...prev];
      const current = updated[index];
      const smartOvertime = calculateSmartOvertime(Number(current.baseSalary) || 0, newSchedule, simulation);

      const modified: PositionSalaryMatrixItem = {
        ...current,
        scheduleType: newSchedule,
        guardsRequiredPerPost: scheduleCfg.guards,
        shiftOrdinaryHours: scheduleCfg.ordHours,
        shiftExtraHours: scheduleCfg.extHours,
        estimatedOvertimePay: smartOvertime,
      };

      updated[index] = recalculatePositionTotals(modified);
      return updated;
    });
  };

  const handleAutoCalculateOvertime = (index: number) => {
    setPositions((prev) => {
      const updated = [...prev];
      const current = updated[index];
      const targetSchedule = current.scheduleType || ShiftScheduleType.SCHEDULE_2X2X2;
      const calculated = calculateSmartOvertime(
        Number(current.baseSalary) || 0,
        targetSchedule,
        simulation
      );

      const modified: PositionSalaryMatrixItem = {
        ...current,
        estimatedOvertimePay: calculated,
      };

      updated[index] = recalculatePositionTotals(modified);
      return updated;
    });
    showSuccess("Horas extras y recargos calculados según tarifas oficiales");
  };

  const handleAddPosition = () => {
    const defaultSmmlv = activePeriod ? Number(activePeriod.smmlv) : 1750905;
    const defaultTrans = activePeriod ? Number(activePeriod.monthlyTransportAux) : 249095;
    const scheduleType = ShiftScheduleType.SCHEDULE_2X2X2;
    const scheduleCfg = SHIFT_SCHEDULE_CONFIG[scheduleType];
    const initialOvertime = calculateSmartOvertime(defaultSmmlv, scheduleType, simulation);

    const newPosition: PositionSalaryMatrixItem = {
      positionTitle: "Nuevo Cargo Operativo",
      scheduleType,
      guardsRequiredPerPost: scheduleCfg.guards,
      baseSalary: defaultSmmlv,
      transportAllowance: defaultTrans,
      shiftOrdinaryHours: scheduleCfg.ordHours,
      shiftExtraHours: scheduleCfg.extHours,
      estimatedOvertimePay: initialOvertime,
      grossSalary: 0,
      healthDeductionPct: 0.04,
      pensionDeductionPct: 0.04,
      healthDeduction: 0,
      pensionDeduction: 0,
      totalDeductions: 0,
      fixedBonusNonSalary: 0,
      vehicleAllowance: 0,
      netTakeHomePay: 0,
      isActive: true,
    };

    setPositions((prev) => [...prev, recalculatePositionTotals(newPosition)]);
    showSuccess("Nuevo cargo agregado a la matriz. Recuerda guardar los cambios.");
  };

  const handleRequestDelete = (index: number, pos: PositionSalaryMatrixItem) => {
    if (!pos.id) {
      // Row local no persistida
      setPositions((prev) => prev.filter((_, i) => i !== index));
      showSuccess("Fila descartada de la matriz");
      return;
    }
    // Requiere confirmación
    setDeleteCandidate({ index, position: pos });
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setIsDeleting(true);
      if (deleteCandidate.position.id) {
        await CommercialSettingsApi.deleteSalaryMatrix(deleteCandidate.position.id);
      }
      setPositions((prev) => prev.filter((_, i) => i !== deleteCandidate.index));
      showSuccess(`Cargo "${deleteCandidate.position.positionTitle}" eliminado correctamente`);
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al eliminar el cargo de la matriz salarial");
    } finally {
      setIsDeleting(false);
      setDeleteCandidate(null);
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      const payload: PositionSalaryMatrixItem[] = positions.map((p) => ({
        ...p,
        guardsRequiredPerPost: Number(p.guardsRequiredPerPost) || 3.0,
        baseSalary: Number(p.baseSalary) || 0,
        transportAllowance: Number(p.transportAllowance) || 0,
        shiftOrdinaryHours: Number(p.shiftOrdinaryHours) || 8,
        shiftExtraHours: Number(p.shiftExtraHours) || 0,
        estimatedOvertimePay: Number(p.estimatedOvertimePay) || 0,
        grossSalary: Number(p.grossSalary) || 0,
        healthDeductionPct: Number(p.healthDeductionPct) || 0.04,
        pensionDeductionPct: Number(p.pensionDeductionPct) || 0.04,
        healthDeduction: Number(p.healthDeduction) || 0,
        pensionDeduction: Number(p.pensionDeduction) || 0,
        totalDeductions: Number(p.totalDeductions) || 0,
        fixedBonusNonSalary: Number(p.fixedBonusNonSalary) || 0,
        vehicleAllowance: Number(p.vehicleAllowance) || 0,
        netTakeHomePay: Number(p.netTakeHomePay) || 0,
      }));
      await CommercialSettingsApi.upsertSalaryMatrix(payload);
      showSuccess("Matriz salarial actualizada correctamente");
      onRefresh();
    } catch (err: any) {
      showError(err?.message || "Error al guardar la matriz salarial");
    } finally {
      setIsSaving(false);
    }
  };

  const refRates = simulation?.reference?.hourlyRates;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* 1. Bloque Superior de Referencia Salarial Oficial (SuperVigilancia) */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${noxiaPalette.primary.main}40`,
          background: `linear-gradient(135deg, ${noxiaPalette.secondary.main} 0%, #2E1065 100%)`,
          color: "#FFFFFF",
          p: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
            mb: 2.5,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex" }}>
              <InfoOutlined />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                REFERENCIA SALARIAL {activePeriod?.year || "OFICIAL"} (SUPERINTENDENCIA DE VIGILANCIA)
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                Parámetros de ley laboral: 44 Horas Semanales (Ley 2101) | Divisor Mensual: 220 Horas
              </Typography>
            </Box>
          </Stack>

          {/* Selector de Vigencia Tarifaria */}
          {tariffPeriods && tariffPeriods.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Select
                value={activePeriod?.id || ""}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                sx={{
                  color: "#FFFFFF",
                  bgcolor: "rgba(255,255,255,0.12)",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.25)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.5)",
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#FFFFFF",
                  },
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {tariffPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarMonthOutlined fontSize="small" />
                      <span>
                        Vigencia {period.year} {period.isActive ? "(Activa)" : ""}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }}>
                SMMLV {activePeriod?.year || "Oficial"}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(simulation?.reference.smmlv || Number(activePeriod?.smmlv) || 1750905)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }}>
                Auxilio de Transporte Mensual
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(simulation?.reference.transportAllowance || Number(activePeriod?.monthlyTransportAux) || 249095)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.12)", p: 1.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.2)" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }}>
                Total Mínimo Devengado
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: "#FDE047" }}>
                {formatCOP(simulation?.reference.totalMinimumGross || (Number(activePeriod?.smmlv || 1750905) + Number(activePeriod?.monthlyTransportAux || 249095)))}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* 2. Matriz de Valor por Hora Trabajada (8 Tarjetas Oficiales SVSP) */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: noxiaPalette.secondary.main }}>
          Matriz de Valor por Hora Trabajada (Leyenda Oficial SVSP)
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
          Valores base y recargos exactos por cada una de las 8 tipologías horarias reguladas
        </Typography>

        <Grid container spacing={1.5}>
          {/* 1. Ord. Diurna */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${noxiaPalette.warning.main}60`, bgcolor: "#FFFDF5" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                1. Ord. Diurna (Base)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.warning.dark }}>
                {formatCOP(refRates?.ordinaryDay.totalHourlyRate || 7959)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Factor 1.0 (Sin recargo)
              </Typography>
            </Card>
          </Grid>

          {/* 2. Ord. Nocturna */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${noxiaPalette.info.main}60`, bgcolor: "#F8FAFC" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                2. Ord. Nocturna (+35%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.info.dark }}>
                {formatCOP(refRates?.ordinaryNight.totalHourlyRate || 10744)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Recargo: {formatCOP(refRates?.ordinaryNight.surchargeValue || 2785)}
              </Typography>
            </Card>
          </Grid>

          {/* 3. Extra Diurna */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${noxiaPalette.warning.dark}60`, bgcolor: "#FFFBEB" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                3. Extra Diurna (+25%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.warning.dark }}>
                {formatCOP(refRates?.overtimeDay.totalHourlyRate || 9948)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Recargo: {formatCOP(refRates?.overtimeDay.surchargeValue || 1989)}
              </Typography>
            </Card>
          </Grid>

          {/* 4. Extra Nocturna */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${noxiaPalette.secondary.light}60`, bgcolor: "#F5F3FF" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                4. Extra Nocturna (+75%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.primary.dark }}>
                {formatCOP(refRates?.overtimeNight.totalHourlyRate || 13927)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Recargo: {formatCOP(refRates?.overtimeNight.surchargeValue || 5968)}
              </Typography>
            </Card>
          </Grid>

          {/* 5. Dom/Fest Ord. Diur */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${noxiaPalette.error.light}80`, bgcolor: "#FFF1F2" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                5. Dom/Fest Ord. Diur (+80%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.error.dark }}>
                {formatCOP(refRates?.sundayHolidayOrdDay.totalHourlyRate || 14325)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Recargo: {formatCOP(refRates?.sundayHolidayOrdDay.surchargeValue || 6366)}
              </Typography>
            </Card>
          </Grid>

          {/* 6. Dom/Fest Ord. Noct */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${noxiaPalette.primary.main}60`, bgcolor: "#FAF5FF" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                6. Dom/Fest Ord. Noct (+115%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.primary.main }}>
                {formatCOP(refRates?.sundayHolidayOrdNight.totalHourlyRate || 17111)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Recargo: {formatCOP(refRates?.sundayHolidayOrdNight.surchargeValue || 9152)}
              </Typography>
            </Card>
          </Grid>

          {/* 7. Dom/Fest Extra D. */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${noxiaPalette.error.main}60`, bgcolor: "#FFF1F2" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                7. Dom/Fest Extra D. (+105%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.error.main }}>
                {formatCOP(refRates?.sundayHolidayExtDay.totalHourlyRate || 16315)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Recargo: {formatCOP(refRates?.sundayHolidayExtDay.surchargeValue || 8356)}
              </Typography>
            </Card>
          </Grid>

          {/* 8. Dom/Fest Extra N. */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card elevation={0} sx={{ p: 1.5, borderRadius: 2, border: `1px solid #4C1D95`, bgcolor: "#F3E8FF" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                8. Dom/Fest Extra N. (+155%)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: "#581C87" }}>
                {formatCOP(refRates?.sundayHolidayExtNight.totalHourlyRate || 20294)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Recargo: {formatCOP(refRates?.sundayHolidayExtNight.surchargeValue || 12335)}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Badges de Reglas Operativas */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
        <Chip
          icon={<AccessTimeFilled sx={{ fontSize: "16px !important" }} />}
          label="Estructura de Turno Base: [ 8h ord. ] + [ 4h ext. ] = 12h/turno"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Chip
          label="Deducción Salud: 4.0% sobre devengado (excluye auxilio de transporte)"
          size="small"
          sx={{ bgcolor: `${noxiaPalette.info.main}15`, color: noxiaPalette.info.dark, fontWeight: 600 }}
        />
        <Chip
          label="Deducción Pensión: 4.0% sobre devengado (excluye auxilio de transporte)"
          size="small"
          sx={{ bgcolor: `${noxiaPalette.info.main}15`, color: noxiaPalette.info.dark, fontWeight: 600 }}
        />
      </Stack>

      {/* 3. Tabla Editable por Cargo Operativo */}
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
              Matriz Salarial por Cargo Operativo
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
              Personalización de devengados, turnos, horas extras y deducciones por rol operativo
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddOutlined />}
              onClick={handleAddPosition}
              sx={{
                borderColor: noxiaPalette.primary.main,
                color: noxiaPalette.primary.main,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
                px: 2,
                height: 36,
                "&:hover": {
                  borderColor: noxiaPalette.primary.dark,
                  bgcolor: `${noxiaPalette.primary.main}08`,
                },
              }}
            >
              Nuevo Cargo Operativo
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              onClick={handleSaveAll}
              disabled={isSaving}
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
              Guardar Matriz Salarial
            </Button>
          </Stack>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid rgba(0,0,0,0.08)" }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Cargo Operativo</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 190 }}>Esquema de Turno</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 130 }}>Sueldo Base</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Aux. Transporte</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Horas Extras / Recargos</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Bonif. / Rodamiento</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Deducciones (8%)</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: `${noxiaPalette.primary.main}10`, minWidth: 150 }}>
                  Sueldo Neto Libre
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, width: 60 }}>
                  Acción
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {positions.map((pos, idx) => (
                <TableRow key={(pos.id || pos.positionTitle) + idx} hover>
                  {/* Cargo Operativo editable */}
                  <TableCell>
                    <TextField
                      size="small"
                      value={pos.positionTitle}
                      onChange={(e) => handlePositionChange(idx, "positionTitle", e.target.value)}
                      placeholder="Ej. Guarda Canino, Escolta VIP..."
                      fullWidth
                      sx={{
                        "& .MuiInputBase-input": {
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        },
                      }}
                    />
                  </TableCell>

                  {/* Selector Dinámico de Esquema de Turno */}
                  <TableCell>
                    <Select
                      size="small"
                      value={pos.scheduleType || ShiftScheduleType.SCHEDULE_2X2X2}
                      onChange={(e) => handleScheduleChange(idx, e.target.value as ShiftScheduleType)}
                      fullWidth
                      sx={{ fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      {Object.entries(SHIFT_SCHEDULE_CONFIG).map(([key, cfg]) => (
                        <MenuItem key={key} value={key} sx={{ fontSize: "0.82rem" }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {cfg.shortLabel}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Factor: {cfg.guards} guardas/puesto
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  {/* Sueldo Base */}
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={pos.baseSalary}
                      onChange={(e) => handlePositionChange(idx, "baseSalary", parseFloat(e.target.value) || 0)}
                      sx={{ width: 125 }}
                      slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.85rem" } } }}
                    />
                  </TableCell>

                  {/* Auxilio Transporte */}
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={pos.transportAllowance}
                      onChange={(e) => handlePositionChange(idx, "transportAllowance", parseFloat(e.target.value) || 0)}
                      sx={{ width: 115 }}
                      slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.85rem" } } }}
                    />
                  </TableCell>

                  {/* Horas Extras / Recargos con botón inteligente */}
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <TextField
                        size="small"
                        type="number"
                        value={pos.estimatedOvertimePay}
                        onChange={(e) => handlePositionChange(idx, "estimatedOvertimePay", parseFloat(e.target.value) || 0)}
                        sx={{ width: 115 }}
                        slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.85rem" } } }}
                      />
                      <Tooltip title="Calcular automáticamente según turno y tarifas oficiales SVSP">
                        <IconButton
                          size="small"
                          onClick={() => handleAutoCalculateOvertime(idx)}
                          sx={{
                            color: noxiaPalette.primary.main,
                            bgcolor: `${noxiaPalette.primary.main}10`,
                            "&:hover": { bgcolor: `${noxiaPalette.primary.main}20` },
                          }}
                        >
                          <AutoFixHighOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>

                  {/* Bonif. / Rodamiento */}
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <TextField
                        size="small"
                        type="number"
                        label="Bono"
                        value={pos.fixedBonusNonSalary || 0}
                        onChange={(e) => handlePositionChange(idx, "fixedBonusNonSalary", parseFloat(e.target.value) || 0)}
                        sx={{ width: 75 }}
                        slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.75rem" } } }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Rodam."
                        value={pos.vehicleAllowance || 0}
                        onChange={(e) => handlePositionChange(idx, "vehicleAllowance", parseFloat(e.target.value) || 0)}
                        sx={{ width: 75 }}
                        slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.75rem" } } }}
                      />
                    </Stack>
                  </TableCell>

                  {/* Deducciones */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.error.main, fontWeight: 600 }}>
                      - {formatCOP(pos.totalDeductions)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                      Salud: {formatCOP(pos.healthDeduction)} | Pens: {formatCOP(pos.pensionDeduction)}
                    </Typography>
                  </TableCell>

                  {/* Sueldo Neto Libre */}
                  <TableCell sx={{ bgcolor: `${noxiaPalette.primary.main}08` }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        fontFamily: jetBrainsMono.style.fontFamily,
                        color: noxiaPalette.primary.main,
                        fontSize: "0.92rem",
                      }}
                    >
                      {formatCOP(pos.netTakeHomePay)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                      Bruto: {formatCOP(pos.grossSalary)}
                    </Typography>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="center">
                    <Tooltip title="Eliminar cargo">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRequestDelete(idx, pos)}
                        sx={{
                          "&:hover": { bgcolor: `${noxiaPalette.error.main}15` },
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={Boolean(deleteCandidate)}
        onClose={() => !isDeleting && setDeleteCandidate(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirmar Eliminación de Cargo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar permanentemente el cargo operativo{" "}
            <strong>&quot;{deleteCandidate?.position.positionTitle}&quot;</strong> de la matriz salarial?
            Esta acción no se puede deshacer si ya está guardado en el servidor.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button
            onClick={() => setDeleteCandidate(null)}
            disabled={isDeleting}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutline />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {isDeleting ? "Eliminando..." : "Eliminar Cargo"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
