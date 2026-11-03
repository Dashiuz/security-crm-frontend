"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Card,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
  Tooltip,
  Tabs,
  Tab,
  Menu,
} from "@mui/material";
import {
  AddOutlined,
  RefreshOutlined,
  GridOnOutlined,
  PersonAddAlt1Outlined,
  TuneOutlined,
  AutoModeOutlined,
  FlashOnOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import {
  payrollShiftsApi,
  ShiftDayCode,
  DependencyAssignmentRole,
  PayrollShiftSequence,
  EmployeeDependencyAssignment,
  ShiftGridResponse,
} from "@/lib/api/payroll-shifts";
import { PayrollApi, PayrollDependency } from "@/lib/api/payroll";
import { PayrollEmployeesApi, PayrollEmployeeListItem } from "@/lib/api/payroll-employees";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { noxiaPalette } from "@/theme/noxiaTheme";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SHIFT_CODE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  D: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" }, // Diurno
  N: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" }, // Nocturno
  X: { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" }, // Descanso
  R: { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" }, // Refuerzo
  INC: { bg: "#FFFBEB", text: "#D97706", border: "#FCD34D" }, // Incapacidad EG
  AT: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" }, // Accidente Trabajo
  LMA: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" }, // Licencia Maternidad
  LR: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" }, // Licencia Remunerada
  LNR: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" }, // No Remunerada
  SAN: { bg: "#FFF1F2", text: "#E11D48", border: "#FECDD3" }, // Sanción
  AUS: { bg: "#450A0A", text: "#FECACA", border: "#7F1D1D" }, // Ausencia 504
  VAC: { bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" }, // Vacaciones
};

export default function PayrollShiftsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "rotation" ? 1 : 0;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Period selectors
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDepFilter, setSelectedDepFilter] = useState<string>("");

  // Catalogs
  const [employees, setEmployees] = useState<PayrollEmployeeListItem[]>([]);
  const [dependencies, setDependencies] = useState<PayrollDependency[]>([]);
  const [sequences, setSequences] = useState<PayrollShiftSequence[]>([]);
  const [assignments, setAssignments] = useState<EmployeeDependencyAssignment[]>([]);
  const [gridData, setGridData] = useState<ShiftGridResponse | null>(null);

  // Cell editing state
  const [cellMenuAnchor, setCellMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCellTarget, setSelectedCellTarget] = useState<{
    employeeId: string;
    dependencyId: string;
    shiftDate: string;
    currentCode: ShiftDayCode;
  } | null>(null);

  // Drawers
  const [generateDrawerOpen, setGenerateDrawerOpen] = useState(false);
  const [reinforcementDrawerOpen, setReinforcementDrawerOpen] = useState(false);
  const [assignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false);
  const [sequenceDrawerOpen, setSequenceDrawerOpen] = useState(false);

  // Forms
  const [generateForm, setGenerateForm] = useState<{
    dependencyId: string;
    sequenceCode: string;
    startStepOffset: number;
  }>({
    dependencyId: "",
    sequenceCode: "2X2X2",
    startStepOffset: 0,
  });

  const [reinfForm, setReinfForm] = useState<{
    employeeId: string;
    dependencyId: string;
    shiftDate: string;
    hours: number;
    notes: string;
  }>({
    employeeId: "",
    dependencyId: "",
    shiftDate: new Date().toISOString().split("T")[0],
    hours: 12,
    notes: "Refuerzo extraordinario de vigilancia",
  });

  const [assignForm, setAssignForm] = useState<{
    employeeId: string;
    dependencyId: string;
    assignmentRole: DependencyAssignmentRole;
    startDate: string;
    endDate: string;
    notes: string;
  }>({
    employeeId: "",
    dependencyId: "",
    assignmentRole: DependencyAssignmentRole.TITULAR,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "Asignación principal de puesto",
  });

  const [seqForm, setSeqForm] = useState<{
    code: string;
    name: string;
    pattern: string;
    dayHours: number;
    nightHours: number;
  }>({
    code: "4X2",
    name: "Secuencia 4 Días Turno, 2 Descansos (12H)",
    pattern: "D, D, N, N, X, X",
    dayHours: 12,
    nightHours: 12,
  });

  // Load Main Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [gridRes, seqRes, assignRes, depRes, empRes] = await Promise.all([
        payrollShiftsApi.getGrid({
          year: selectedYear,
          month: selectedMonth,
          dependencyId: selectedDepFilter || undefined,
        }),
        payrollShiftsApi.listSequences(),
        payrollShiftsApi.listAssignments({ isActive: true }),
        PayrollApi.listDependencies({ isActive: true }),
        PayrollEmployeesApi.findEmployees(),
      ]);

      setGridData(gridRes);
      setSequences(seqRes || []);
      setAssignments(assignRes || []);
      setDependencies(depRes || []);
      setEmployees(empRes || []);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al cargar la malla de turnos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, selectedDepFilter]);

  // Handle Generate Month
  const handleGenerateMonth = async () => {
    try {
      setSaving(true);
      const res = await payrollShiftsApi.generateMonth({
        year: selectedYear,
        month: selectedMonth,
        dependencyId: generateForm.dependencyId || undefined,
        sequenceCode: generateForm.sequenceCode || undefined,
        startStepOffset: Number(generateForm.startStepOffset) || 0,
      });
      setFeedback({
        type: "success",
        message: `${res.message} (${res.recordsUpserted} turnos procesados).`,
      });
      setGenerateDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al proyectar turnos." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Reinforcement
  const handleSaveReinforcement = async () => {
    if (!reinfForm.employeeId || !reinfForm.dependencyId) {
      setFeedback({ type: "error", message: "Selecciona el puesto y el guarda para el refuerzo." });
      return;
    }
    try {
      setSaving(true);
      await payrollShiftsApi.createReinforcement({
        employeeId: reinfForm.employeeId,
        dependencyId: reinfForm.dependencyId,
        shiftDate: reinfForm.shiftDate,
        shiftCode: ShiftDayCode.R,
        hours: Number(reinfForm.hours) || 12,
        notes: reinfForm.notes || undefined,
      });
      setFeedback({ type: "success", message: "Turno de refuerzo registrado en la malla." });
      setReinforcementDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al registrar refuerzo." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Assignment
  const handleSaveAssignment = async () => {
    if (!assignForm.employeeId || !assignForm.dependencyId) {
      setFeedback({ type: "error", message: "Selecciona el guarda y el puesto de destino." });
      return;
    }
    try {
      setSaving(true);
      await payrollShiftsApi.createAssignment({
        employeeId: assignForm.employeeId,
        dependencyId: assignForm.dependencyId,
        assignmentRole: assignForm.assignmentRole,
        startDate: assignForm.startDate,
        endDate: assignForm.endDate || undefined,
        notes: assignForm.notes || undefined,
      });
      setFeedback({ type: "success", message: "Guarda asignado al puesto correctamente." });
      setAssignmentDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al asignar puesto." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Sequence
  const handleSaveSequence = async () => {
    const patternArr = seqForm.pattern
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    if (patternArr.length === 0) {
      setFeedback({ type: "error", message: "Ingresa un patrón válido separado por comas (ej: D, D, N, N, X, X)." });
      return;
    }
    try {
      setSaving(true);
      await payrollShiftsApi.createSequence({
        code: seqForm.code.trim().toUpperCase(),
        name: seqForm.name.trim(),
        patternJson: patternArr,
        cycleDaysLength: patternArr.length,
        dayShiftHours: Number(seqForm.dayHours),
        nightShiftHours: Number(seqForm.nightHours),
      });
      setFeedback({ type: "success", message: "Secuencia cíclica registrada en el catálogo." });
      setSequenceDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al crear secuencia." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Inline Cell Shift Code Change
  const handleCellChange = async (newCode: ShiftDayCode) => {
    if (!selectedCellTarget) return;
    try {
      await payrollShiftsApi.bulkUpdateRecords({
        records: [
          {
            employeeId: selectedCellTarget.employeeId,
            dependencyId: selectedCellTarget.dependencyId,
            shiftDate: selectedCellTarget.shiftDate,
            shiftCode: newCode,
            notes: "Edición rápida en malla",
          },
        ],
      });
      setCellMenuAnchor(null);
      setSelectedCellTarget(null);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al actualizar turno en caliente." });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: noxiaPalette.background.default, minHeight: "100vh" }}>
      {/* Breadcrumb Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link href="/finance/payroll/settings" color="inherit" underline="hover">
            Dirección Financiera
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            Programación y Malla de Turnos
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, letterSpacing: "-0.5px" }}>
              Malla Operativa 24/7 y Rotación de Puestos
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Programación interactiva mensual (1..31), turnos Diurnos/Nocturnos, relevos y secuencias cíclicas.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={loadData}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Recargar
            </Button>
            {activeTab === 0 && (
              <>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<AutoModeOutlined />}
                  onClick={() => setGenerateDrawerOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  Generar Mes Automático
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FlashOnOutlined />}
                  onClick={() => setReinforcementDrawerOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: "#D97706" }}
                >
                  + Turno Refuerzo
                </Button>
              </>
            )}
            {activeTab === 1 && (
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={() => setAssignmentDrawerOpen(true)}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: noxiaPalette.primary.main }}
              >
                Asignar Puesto a Guarda
              </Button>
            )}
            {activeTab === 2 && (
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={() => setSequenceDrawerOpen(true)}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: noxiaPalette.primary.main }}
              >
                Nueva Secuencia
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Feedback Alert */}
      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, border: "1px solid #E2E8F0", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            px: 2,
            borderBottom: "1px solid #E2E8F0",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.95rem", py: 2 },
          }}
        >
          <Tab icon={<GridOnOutlined />} iconPosition="start" label="1. Malla Mensual 24/7 (Grilla 1..31)" />
          <Tab icon={<PersonAddAlt1Outlined />} iconPosition="start" label="2. Rotación y Asignación de Puestos" />
          <Tab icon={<TuneOutlined />} iconPosition="start" label="3. Catálogo de Secuencias (2x2x2, 4x2)" />
        </Tabs>

        {/* TAB 0: MALLA MENSUAL 1..31 */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Control Bar: Mes, Año, Dependencia */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 3 }}>
              <TextField
                select
                size="small"
                label="Mes"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                sx={{ minWidth: 160 }}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <MenuItem key={idx + 1} value={idx + 1}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Año"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{ minWidth: 110 }}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Filtrar por Puesto / Dependencia"
                value={selectedDepFilter}
                onChange={(e) => setSelectedDepFilter(e.target.value)}
                sx={{ minWidth: 260, flexGrow: 1 }}
              >
                <MenuItem value="">Todos los Puestos Operativos</MenuItem>
                {dependencies.map((dep) => (
                  <MenuItem key={dep.id} value={dep.id}>
                    [{dep.code}] {dep.name} ({dep.client?.name || "Interno"})
                  </MenuItem>
                ))}
              </TextField>

              {/* Leyenda de Códigos */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Chip size="small" label="D = Diurno (12h)" sx={{ bgcolor: SHIFT_CODE_COLORS.D.bg, color: SHIFT_CODE_COLORS.D.text, fontWeight: 700 }} />
                <Chip size="small" label="N = Nocturno (12h)" sx={{ bgcolor: SHIFT_CODE_COLORS.N.bg, color: SHIFT_CODE_COLORS.N.text, fontWeight: 700 }} />
                <Chip size="small" label="X = Descanso" sx={{ bgcolor: SHIFT_CODE_COLORS.X.bg, color: SHIFT_CODE_COLORS.X.text, fontWeight: 700 }} />
                <Chip size="small" label="R = Refuerzo" sx={{ bgcolor: SHIFT_CODE_COLORS.R.bg, color: SHIFT_CODE_COLORS.R.text, fontWeight: 700 }} />
                <Chip size="small" label="INC/AT = Incapacidad" sx={{ bgcolor: SHIFT_CODE_COLORS.INC.bg, color: SHIFT_CODE_COLORS.INC.text, fontWeight: 700 }} />
              </Box>
            </Box>

            {/* Interactive Grid Table */}
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                border: "1px solid #E2E8F0",
                maxHeight: 650,
                overflowX: "auto",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: "#475569",
                        minWidth: 220,
                        position: "sticky",
                        left: 0,
                        bgcolor: "#F8FAFC",
                        zIndex: 3,
                        borderRight: "2px solid #CBD5E1",
                      }}
                    >
                      PUESTO / GUARDA ASIGNADO
                    </TableCell>

                    {gridData?.daysHeader.map((d) => (
                      <TableCell
                        key={d.day}
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          minWidth: 42,
                          p: 0.5,
                          bgcolor: d.isHoliday ? "#FEF3C7" : d.isSunday ? "#F1F5F9" : "#F8FAFC",
                          color: d.isHoliday ? "#D97706" : d.isSunday ? "#E11D48" : "#475569",
                          borderRight: "1px solid #E2E8F0",
                        }}
                      >
                        <Tooltip title={d.holidayName || (d.isSunday ? "Domingo" : d.dateStr)}>
                          <Box>
                            <Typography variant="caption" sx={{ display: "block", fontWeight: 800 }}>
                              {d.day}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: "0.65rem", textTransform: "uppercase" }}>
                              {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"][d.dayOfWeek]}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                    ))}

                    <TableCell align="right" sx={{ fontWeight: 800, color: "#1E1B4B", minWidth: 90 }}>
                      TOTAL (H)
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={34} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={36} />
                      </TableCell>
                    </TableRow>
                  ) : !gridData || gridData.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={34} align="center" sx={{ py: 6, color: "text.secondary" }}>
                        No hay turnos registrados para este mes. Haz clic en &quot;Generar Mes Automático&quot; para poblar los turnos con las secuencias asignadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gridData.rows.map((row, idx) => (
                      <TableRow key={idx} hover>
                        {/* Sticky Left Column: Employee & Post */}
                        <TableCell
                          sx={{
                            position: "sticky",
                            left: 0,
                            bgcolor: "#FFFFFF",
                            zIndex: 1,
                            borderRight: "2px solid #CBD5E1",
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
                            {row.employee.firstName} {row.employee.lastName}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ color: "text.secondary" }}>
                            {row.dependencyName} ({row.role})
                          </Typography>
                        </TableCell>

                        {/* Days 1..31 Cells */}
                        {gridData.daysHeader.map((dh) => {
                          const record = row.days[dh.day];
                          const code = record?.shiftCode || "X";
                          const style = SHIFT_CODE_COLORS[code] || SHIFT_CODE_COLORS.X;

                          return (
                            <TableCell
                              key={dh.day}
                              align="center"
                              sx={{
                                p: 0.3,
                                borderRight: "1px solid #F1F5F9",
                                bgcolor: dh.isHoliday ? "#FFFBEB" : dh.isSunday ? "#FAFAFA" : "inherit",
                              }}
                            >
                              <Chip
                                label={code}
                                size="small"
                                onClick={(e) => {
                                  setCellMenuAnchor(e.currentTarget);
                                  setSelectedCellTarget({
                                    employeeId: row.employee.id,
                                    dependencyId: row.dependencyId,
                                    shiftDate: dh.dateStr,
                                    currentCode: code as ShiftDayCode,
                                  });
                                }}
                                sx={{
                                  width: 32,
                                  height: 26,
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  bgcolor: style.bg,
                                  color: style.text,
                                  border: `1px solid ${style.border}`,
                                  "&:hover": { filter: "brightness(0.95)" },
                                }}
                              />
                            </TableCell>
                          );
                        })}

                        {/* Totals */}
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: noxiaPalette.primary.main }}>
                            {row.totals.totalGrossHours}h
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                            {row.totals.totalNightHours}h RN | {row.totals.totalHolidayHours}h Dom
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Cell Quick Switch Context Menu */}
            <Menu
              anchorEl={cellMenuAnchor}
              open={Boolean(cellMenuAnchor)}
              onClose={() => {
                setCellMenuAnchor(null);
                setSelectedCellTarget(null);
              }}
            >
              <MenuItem onClick={() => handleCellChange(ShiftDayCode.D)}>
                <Chip size="small" label="D" sx={{ mr: 1, bgcolor: SHIFT_CODE_COLORS.D.bg, color: SHIFT_CODE_COLORS.D.text }} /> Turno Diurno (12h)
              </MenuItem>
              <MenuItem onClick={() => handleCellChange(ShiftDayCode.N)}>
                <Chip size="small" label="N" sx={{ mr: 1, bgcolor: SHIFT_CODE_COLORS.N.bg, color: SHIFT_CODE_COLORS.N.text }} /> Turno Nocturno (12h)
              </MenuItem>
              <MenuItem onClick={() => handleCellChange(ShiftDayCode.X)}>
                <Chip size="small" label="X" sx={{ mr: 1, bgcolor: SHIFT_CODE_COLORS.X.bg, color: SHIFT_CODE_COLORS.X.text }} /> Descanso Programado
              </MenuItem>
              <MenuItem onClick={() => handleCellChange(ShiftDayCode.R)}>
                <Chip size="small" label="R" sx={{ mr: 1, bgcolor: SHIFT_CODE_COLORS.R.bg, color: SHIFT_CODE_COLORS.R.text }} /> Refuerzo / Apoyo Extra
              </MenuItem>
            </Menu>
          </Box>
        )}

        {/* TAB 1: ROTACIÓN Y ASIGNACIÓN DE PUESTOS */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>PUESTO / DEPENDENCIA</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>CENTRO DE COSTO (CLIENTE)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>GUARDA ASIGNADO</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ROL EN PUESTO</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>FECHA VINCULACIÓN</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ESTADO</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ACCIONES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No hay guardas asignados a puestos de servicio.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((assign) => (
                      <TableRow key={assign.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
                            {assign.dependency?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                            Cód. {assign.dependency?.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {assign.dependency?.client?.name || "Interno / Administrativo"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {assign.employee?.firstName} {assign.employee?.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                            CC {assign.employee?.document}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={assign.assignmentRole}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor:
                                assign.assignmentRole === DependencyAssignmentRole.TITULAR
                                  ? "#F5F3FF"
                                  : "#ECFDF5",
                              color:
                                assign.assignmentRole === DependencyAssignmentRole.TITULAR
                                  ? noxiaPalette.primary.main
                                  : "#059669",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            Desde {new Date(assign.startDate).toISOString().split("T")[0]}
                          </Typography>
                          {assign.endDate && (
                            <Typography variant="caption" display="block" sx={{ color: "text.secondary" }}>
                              Hasta {new Date(assign.endDate).toISOString().split("T")[0]}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={assign.isActive ? "Activo" : "Inactivo"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: assign.isActive ? "#ECFDF5" : "#F1F5F9",
                              color: assign.isActive ? "#059669" : "#64748B",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Finalizar asignación (Rotar)">
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={async () => {
                                if (confirm("¿Finalizar asignación de este guarda en este puesto?")) {
                                  await payrollShiftsApi.updateAssignment(assign.id, {
                                    isActive: false,
                                    endDate: new Date().toISOString().split("T")[0],
                                  });
                                  loadData();
                                }
                              }}
                              sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 1.5 }}
                            >
                              Finalizar
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 2: CATÁLOGO DE SECUENCIAS */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {sequences.map((seq) => (
                <Grid key={seq.id} size={{ xs: 12, md: 6 }}>
                  <Card sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Chip
                          label={seq.code}
                          size="small"
                          sx={{ fontWeight: 800, bgcolor: "#F5F3FF", color: noxiaPalette.primary.main, mb: 1 }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {seq.name}
                        </Typography>
                      </Box>
                      <Chip label={`${seq.cycleDaysLength} días`} size="small" variant="outlined" />
                    </Box>

                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                      Horas por Turno: Diurno {seq.dayShiftHours}h | Nocturno {seq.nightShiftHours}h
                    </Typography>

                    {/* Pattern Visualizer */}
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
                      PATRÓN CÍCLICO:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {Array.isArray(seq.patternJson) &&
                        seq.patternJson.map((c, i) => {
                          const style = SHIFT_CODE_COLORS[c] || SHIFT_CODE_COLORS.X;
                          return (
                            <Chip
                              key={i}
                              label={`Día ${i + 1}: ${c}`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: style.bg,
                                color: style.text,
                                border: `1px solid ${style.border}`,
                              }}
                            />
                          );
                        })}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Card>

      {/* DRAWER: GENERAR MES AUTOMÁTICO */}
      <ResponsiveFormDrawer
        open={generateDrawerOpen}
        onClose={() => setGenerateDrawerOpen(false)}
        title="Generar Malla Mensual Automática"
        subtitle={`Proyecta los turnos del mes de ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} para las asignaciones activas`}
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setGenerateDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleGenerateMonth}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Generando..." : "Generar Malla"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Dependencia / Puesto a Generar"
              value={generateForm.dependencyId}
              onChange={(e) => setGenerateForm({ ...generateForm, dependencyId: e.target.value })}
              helperText="Deja vacío para generar todos los puestos de la empresa"
            >
              <MenuItem value="">-- Todos los Puestos Activos --</MenuItem>
              {dependencies.map((dep) => (
                <MenuItem key={dep.id} value={dep.id}>
                  [{dep.code}] {dep.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Secuencia Cíclica *"
              value={generateForm.sequenceCode}
              onChange={(e) => setGenerateForm({ ...generateForm, sequenceCode: e.target.value })}
            >
              {sequences.map((seq) => (
                <MenuItem key={seq.id} value={seq.code}>
                  [{seq.code}] {seq.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Offset de Inicio de la Secuencia"
              type="number"
              value={generateForm.startStepOffset}
              onChange={(e) => setGenerateForm({ ...generateForm, startStepOffset: Number(e.target.value) })}
              helperText="Paso de la secuencia correspondiente al día 1 del mes (0 = primer día del ciclo)"
            />
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>

      {/* DRAWER: REGISTRAR REFUERZO */}
      <ResponsiveFormDrawer
        open={reinforcementDrawerOpen}
        onClose={() => setReinforcementDrawerOpen(false)}
        title="Registrar Turno de Refuerzo Extraordinario"
        subtitle="Turnos adicionales facturables al cliente y reconocidos como horas extras al guarda"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setReinforcementDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveReinforcement}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#D97706" }}
            >
              {saving ? "Guardando..." : "Guardar Refuerzo"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Puesto o Dependencia *"
              value={reinfForm.dependencyId}
              onChange={(e) => setReinfForm({ ...reinfForm, dependencyId: e.target.value })}
            >
              {dependencies.map((dep) => (
                <MenuItem key={dep.id} value={dep.id}>
                  [{dep.code}] {dep.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Guarda Asignado *"
              value={reinfForm.employeeId}
              onChange={(e) => setReinfForm({ ...reinfForm, employeeId: e.target.value })}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} — CC {emp.document}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha del Refuerzo *"
              type="date"
              value={reinfForm.shiftDate}
              onChange={(e) => setReinfForm({ ...reinfForm, shiftDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Horas de Refuerzo *"
              type="number"
              value={reinfForm.hours}
              onChange={(e) => setReinfForm({ ...reinfForm, hours: Number(e.target.value) })}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Justificación / Motivo del Refuerzo"
              value={reinfForm.notes}
              onChange={(e) => setReinfForm({ ...reinfForm, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>

      {/* DRAWER: NUEVA ASIGNACIÓN DE PUESTO */}
      <ResponsiveFormDrawer
        open={assignmentDrawerOpen}
        onClose={() => setAssignmentDrawerOpen(false)}
        title="Asignar Guarda a Puesto de Servicio"
        subtitle="Vincula un guarda a un puesto físico por un periodo de tiempo determinado o indefinido"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setAssignmentDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveAssignment}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Guardando..." : "Asignar Puesto"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Puesto / Dependencia *"
              value={assignForm.dependencyId}
              onChange={(e) => setAssignForm({ ...assignForm, dependencyId: e.target.value })}
            >
              {dependencies.map((dep) => (
                <MenuItem key={dep.id} value={dep.id}>
                  [{dep.code}] {dep.name} ({dep.client?.name || "Interno"})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Empleado *"
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} — CC {emp.document}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Rol en el Puesto *"
              value={assignForm.assignmentRole}
              onChange={(e) => setAssignForm({ ...assignForm, assignmentRole: e.target.value as DependencyAssignmentRole })}
            >
              <MenuItem value={DependencyAssignmentRole.TITULAR}>Titular Fijo</MenuItem>
              <MenuItem value={DependencyAssignmentRole.RELEVANTE}>Relevante / Descansero</MenuItem>
              <MenuItem value={DependencyAssignmentRole.SUPERVISOR}>Supervisor</MenuItem>
              <MenuItem value={DependencyAssignmentRole.REFUERZO}>Refuerzo Temporal</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de Inicio *"
              type="date"
              value={assignForm.startDate}
              onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de Fin (Opcional)"
              type="date"
              value={assignForm.endDate}
              onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Deja vacío para asignación activa vigente"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Observaciones"
              value={assignForm.notes}
              onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>

      {/* DRAWER: NUEVA SECUENCIA */}
      <ResponsiveFormDrawer
        open={sequenceDrawerOpen}
        onClose={() => setSequenceDrawerOpen(false)}
        title="Crear Nueva Secuencia Cíclica"
        subtitle="Define un patrón recurrente de turnos diurnos, nocturnos y descansos"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setSequenceDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveSequence}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Guardando..." : "Guardar Secuencia"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Código de la Secuencia *"
              value={seqForm.code}
              onChange={(e) => setSeqForm({ ...seqForm, code: e.target.value })}
              placeholder="Ej: 5X2, 6X1_D"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre Descriptivo *"
              value={seqForm.name}
              onChange={(e) => setSeqForm({ ...seqForm, name: e.target.value })}
              placeholder="Ej: Secuencia 5 Diurnos 2 Descansos"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Patrón Cíclico (Separado por comas) *"
              value={seqForm.pattern}
              onChange={(e) => setSeqForm({ ...seqForm, pattern: e.target.value })}
              helperText="Códigos permitidos: D (Diurno), N (Nocturno), X (Descanso). Ej: D, D, N, N, X, X"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Horas Turno Diurno *"
              type="number"
              value={seqForm.dayHours}
              onChange={(e) => setSeqForm({ ...seqForm, dayHours: Number(e.target.value) })}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Horas Turno Nocturno *"
              type="number"
              value={seqForm.nightHours}
              onChange={(e) => setSeqForm({ ...seqForm, nightHours: Number(e.target.value) })}
            />
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>
    </Box>
  );
}
