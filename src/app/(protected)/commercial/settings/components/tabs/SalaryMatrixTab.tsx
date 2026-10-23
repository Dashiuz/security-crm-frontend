"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  InfoOutlined,
  SaveOutlined,
  AccessTimeFilled,
} from "@mui/icons-material";
import {
  PositionSalaryMatrixItem,
  CommercialSettingsApi,
  SalarySimulationResult,
  ShiftScheduleType,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";
import { noxiaPalette, jetBrainsMono } from "@/theme/noxiaTheme";

interface SalaryMatrixTabProps {
  salaryMatrix: PositionSalaryMatrixItem[];
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

export default function SalaryMatrixTab({ salaryMatrix, onRefresh }: SalaryMatrixTabProps) {
  const { showSuccess, showError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [simulation, setSimulation] = useState<SalarySimulationResult | null>(null);

  // Editable local state for positions
  const [positions, setPositions] = useState<PositionSalaryMatrixItem[]>([]);

  useEffect(() => {
    // Cargar simulación oficial SVSP 2026
    CommercialSettingsApi.simulateSalary({ smmlv: 1750905, transportAllowance: 249095, statutoryWeeklyHours: 44 })
      .then((res) => setSimulation(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (salaryMatrix && salaryMatrix.length > 0) {
      setPositions(salaryMatrix);
    } else {
      // Default positions if empty
      setPositions([
        {
          positionTitle: "Guarda Portero",
          scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
          guardsRequiredPerPost: 3.0,
          baseSalary: 1750905,
          transportAllowance: 249095,
          shiftOrdinaryHours: 8,
          shiftExtraHours: 4,
          estimatedOvertimePay: 680000,
          grossSalary: 2680000,
          healthDeductionPct: 0.04,
          pensionDeductionPct: 0.04,
          healthDeduction: 97236,
          pensionDeduction: 97236,
          totalDeductions: 194472,
          fixedBonusNonSalary: 0,
          vehicleAllowance: 0,
          netTakeHomePay: 2485528,
        },
        {
          positionTitle: "Supervisor Motorizado",
          scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
          guardsRequiredPerPost: 3.0,
          baseSalary: 1950000,
          transportAllowance: 249095,
          shiftOrdinaryHours: 8,
          shiftExtraHours: 4,
          estimatedOvertimePay: 780000,
          grossSalary: 2979095,
          healthDeductionPct: 0.04,
          pensionDeductionPct: 0.04,
          healthDeduction: 109200,
          pensionDeduction: 109200,
          totalDeductions: 218400,
          fixedBonusNonSalary: 150000,
          vehicleAllowance: 650000,
          netTakeHomePay: 3560695,
        },
        {
          positionTitle: "Operador de Medios Tecnológicos (OMT)",
          scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
          guardsRequiredPerPost: 3.0,
          baseSalary: 1850000,
          transportAllowance: 249095,
          shiftOrdinaryHours: 8,
          shiftExtraHours: 4,
          estimatedOvertimePay: 710000,
          grossSalary: 2809095,
          healthDeductionPct: 0.04,
          pensionDeductionPct: 0.04,
          healthDeduction: 102400,
          pensionDeduction: 102400,
          totalDeductions: 204800,
          fixedBonusNonSalary: 50000,
          vehicleAllowance: 0,
          netTakeHomePay: 2654295,
        },
        {
          positionTitle: "Recepcionista / Control de Acceso",
          scheduleType: ShiftScheduleType.SCHEDULE_5X2,
          guardsRequiredPerPost: 1.0,
          baseSalary: 1750905,
          transportAllowance: 249095,
          shiftOrdinaryHours: 8,
          shiftExtraHours: 0,
          estimatedOvertimePay: 0,
          grossSalary: 2000000,
          healthDeductionPct: 0.04,
          pensionDeductionPct: 0.04,
          healthDeduction: 70036,
          pensionDeduction: 70036,
          totalDeductions: 140072,
          fixedBonusNonSalary: 0,
          vehicleAllowance: 0,
          netTakeHomePay: 1859928,
        },
      ]);
    }
  }, [salaryMatrix]);

  const handlePositionChange = (index: number, field: keyof PositionSalaryMatrixItem, val: any) => {
    setPositions((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      // Recalcular devengado, deducciones y neto automáticamente
      const baseSalary = Number(item.baseSalary) || 0;
      const transportAllowance = Number(item.transportAllowance) || 0;
      const overtimePay = Number(item.estimatedOvertimePay) || 0;
      const bonus = Number(item.fixedBonusNonSalary) || 0;
      const vehicle = Number(item.vehicleAllowance) || 0;

      const taxableBase = baseSalary + overtimePay;
      const health = Math.round(taxableBase * 0.04);
      const pension = Math.round(taxableBase * 0.04);
      const totalDed = health + pension;

      item.healthDeduction = health;
      item.pensionDeduction = pension;
      item.totalDeductions = totalDed;
      item.grossSalary = taxableBase + transportAllowance + bonus + vehicle;
      item.netTakeHomePay = item.grossSalary - totalDed;

      updated[index] = item;
      return updated;
    });
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await CommercialSettingsApi.upsertSalaryMatrix(positions);
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
      {/* 1. Bloque Superior de Referencia Salarial Oficial (SuperVigilancia 2026) */}
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
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex" }}>
            <InfoOutlined />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
              REFERENCIA SALARIAL 2026 (SUPERINTENDENCIA DE VIGILANCIA)
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Parámetros de ley laboral: 44 Horas Semanales (Ley 2101) | Divisor Mensual: 220 Horas
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }}>
                SMMLV 2026 Oficial
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(simulation?.reference.smmlv || 1750905)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }}>
                Auxilio de Transporte Mensual
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily }}>
                {formatCOP(simulation?.reference.transportAllowance || 249095)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.12)", p: 1.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.2)" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }}>
                Total Mínimo Devengado
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: jetBrainsMono.style.fontFamily, color: "#FDE047" }}>
                {formatCOP(simulation?.reference.totalMinimumGross || 2000000)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* 2. Matriz de Valor por Hora Trabajada (8 Tarjetas Oficiales SVSP) */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: noxiaPalette.secondary.main }}>
          Matriz de Valor por Hora Trabajada (Leyenda Oficial SVSP 2026)
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
          label="Estructura de Turno: [ 8h ord. ] + [ 4h ext. ] = 12h/turno"
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
              Personalización de devengados, turnos y deducciones por rol operativo
            </Typography>
          </Box>
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
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid rgba(0,0,0,0.08)" }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Cargo Operativo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sueldo Base</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Aux. Transporte</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Horas Extras / Recargos</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Bonificación / Rodamiento</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Deducciones (8%)</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: `${noxiaPalette.primary.main}10` }}>Sueldo Neto Libre</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {positions.map((pos, idx) => (
                <TableRow key={pos.positionTitle + idx} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {pos.positionTitle}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {pos.scheduleType} | Factor: {pos.guardsRequiredPerPost} guardas
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={pos.baseSalary}
                      onChange={(e) => handlePositionChange(idx, "baseSalary", parseFloat(e.target.value) || 0)}
                      sx={{ width: 130 }}
                      slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.85rem" } } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={pos.transportAllowance}
                      onChange={(e) => handlePositionChange(idx, "transportAllowance", parseFloat(e.target.value) || 0)}
                      sx={{ width: 120 }}
                      slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.85rem" } } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={pos.estimatedOvertimePay}
                      onChange={(e) => handlePositionChange(idx, "estimatedOvertimePay", parseFloat(e.target.value) || 0)}
                      sx={{ width: 130 }}
                      slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.85rem" } } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        type="number"
                        label="Bono"
                        value={pos.fixedBonusNonSalary || 0}
                        onChange={(e) => handlePositionChange(idx, "fixedBonusNonSalary", parseFloat(e.target.value) || 0)}
                        sx={{ width: 100 }}
                        slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.8rem" } } }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Rodam."
                        value={pos.vehicleAllowance || 0}
                        onChange={(e) => handlePositionChange(idx, "vehicleAllowance", parseFloat(e.target.value) || 0)}
                        sx={{ width: 100 }}
                        slotProps={{ htmlInput: { style: { fontFamily: jetBrainsMono.style.fontFamily, fontSize: "0.8rem" } } }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: jetBrainsMono.style.fontFamily, color: noxiaPalette.error.main, fontWeight: 600 }}>
                      - {formatCOP(pos.totalDeductions)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Salud: {formatCOP(pos.healthDeduction)} | Pens: {formatCOP(pos.pensionDeduction)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ bgcolor: `${noxiaPalette.primary.main}08` }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        fontFamily: jetBrainsMono.style.fontFamily,
                        color: noxiaPalette.primary.main,
                        fontSize: "0.95rem",
                      }}
                    >
                      {formatCOP(pos.netTakeHomePay)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Bruto: {formatCOP(pos.grossSalary)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
