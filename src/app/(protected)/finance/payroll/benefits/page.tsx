"use client";

import React, { useState, useEffect } from "react";
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
  IconButton,
  CircularProgress,
  Alert,
  MenuItem,
  Tooltip,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  SearchOutlined,
  RefreshOutlined,
  AccountBalanceWalletOutlined,
  CalculateOutlined,
  LockOutlined,
  PictureAsPdfOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  EditOutlined,
  AddOutlined,
  AccountBalanceOutlined,
  AttachMoneyOutlined,
  BeachAccessOutlined,
  WorkOffOutlined,
  TrendingUpOutlined,
  BadgeOutlined,
  SavingsOutlined,
  SendOutlined,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  payrollBenefitsApi,
  BenefitsKpis,
  VacationBookItem,
  VacationSettlement,
  VacationCalculationResult,
  SocialBenefitBatch,
  SocialBenefitItem,
  FinalContractSettlement,
  FinalLiquidationSimulationResult,
} from "@/lib/api/payroll-benefits";
import { PayrollApi } from "@/lib/api/payroll";

export default function PayrollBenefitsPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Global State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // KPIs
  const [kpis, setKpis] = useState<BenefitsKpis | null>(null);

  // Catalogs
  const [employees, setEmployees] = useState<any[]>([]);
  const [exitReasons, setExitReasons] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);

  // Tab 0: Vacations
  const [vacationBook, setVacationBook] = useState<VacationBookItem[]>([]);
  const [vacationHistory, setVacationHistory] = useState<VacationSettlement[]>([]);
  const [vacationSearch, setVacationSearch] = useState("");
  const [vacationDrawerOpen, setVacationDrawerOpen] = useState(false);

  // Vacation Form & Simulation
  const [selectedVacationEmp, setSelectedVacationEmp] = useState("");
  const [vacationType, setVacationType] = useState<"ENJOYED_IN_TIME" | "COMPENSATED_IN_CASH">("ENJOYED_IN_TIME");
  const [enjoymentStartDate, setEnjoymentStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [businessDays, setBusinessDays] = useState(15);
  const [accrualStartDate, setAccrualStartDate] = useState("2025-01-01");
  const [accrualEndDate, setAccrualEndDate] = useState("2025-12-31");
  const [loansToDeduct, setLoansToDeduct] = useState(0);
  const [vacationSimResult, setVacationSimResult] = useState<VacationCalculationResult | null>(null);

  // Tab 1: Prima de Servicios
  const [primaBatches, setPrimaBatches] = useState<SocialBenefitBatch[]>([]);
  const [selectedPrimaYear, setSelectedPrimaYear] = useState(new Date().getFullYear());
  const [selectedPrimaSemester, setSelectedPrimaSemester] = useState<"PRIMA_FIRST_SEMESTER" | "PRIMA_SECOND_SEMESTER">("PRIMA_FIRST_SEMESTER");
  const [primaCutoffDate, setPrimaCutoffDate] = useState(`${new Date().getFullYear()}-05-31`);
  const [primaProjectionDate, setPrimaProjectionDate] = useState(`${new Date().getFullYear()}-06-30`);
  const [activePrimaBatch, setActivePrimaBatch] = useState<SocialBenefitBatch | null>(null);

  // Tab 2: Cesantías e Intereses
  const [severanceBatches, setSeveranceBatches] = useState<SocialBenefitBatch[]>([]);
  const [selectedSeveranceYear, setSelectedSeveranceYear] = useState(new Date().getFullYear());
  const [severanceCutoffDate, setSeveranceCutoffDate] = useState(`${new Date().getFullYear()}-11-30`);
  const [severanceProjectionDate, setSeveranceProjectionDate] = useState(`${new Date().getFullYear()}-12-31`);
  const [activeSeveranceBatch, setActiveSeveranceBatch] = useState<SocialBenefitBatch | null>(null);

  // Drawers for batches
  const [adjustItemDrawerOpen, setAdjustItemDrawerOpen] = useState(false);
  const [editingBenefitItem, setEditingBenefitItem] = useState<SocialBenefitItem | null>(null);
  const [adjustedBenefitAmount, setAdjustedBenefitAmount] = useState(0);
  const [adjustedInterestAmount, setAdjustedInterestAmount] = useState(0);
  const [adjustedNotes, setAdjustedNotes] = useState("");

  const [injectDrawerOpen, setInjectDrawerOpen] = useState(false);
  const [injectingBatch, setInjectingBatch] = useState<SocialBenefitBatch | null>(null);
  const [targetPeriodId, setTargetPeriodId] = useState("");

  // Tab 3: Liquidación Definitiva de Contrato
  const [finalSettlements, setFinalSettlements] = useState<FinalContractSettlement[]>([]);
  const [finalSettlementDrawerOpen, setFinalSettlementDrawerOpen] = useState(false);

  // Final Settlement Form & Simulation
  const [finalEmpId, setFinalEmpId] = useState("");
  const [finalRetirementDate, setFinalRetirementDate] = useState(new Date().toISOString().split("T")[0]);
  const [finalExitReasonId, setFinalExitReasonId] = useState("");
  const [includePendingPayroll, setIncludePendingPayroll] = useState(true);
  const [applyIndemnification, setApplyIndemnification] = useState(false);
  const [blockForRehireBdn, setBlockForRehireBdn] = useState(false);
  const [finalOtherEarnings, setFinalOtherEarnings] = useState(0);
  const [finalOtherEarningsConcept, setFinalOtherEarningsConcept] = useState("");
  const [finalOtherDeductions, setFinalOtherDeductions] = useState(0);
  const [finalOtherDeductionsConcept, setFinalOtherDeductionsConcept] = useState("");
  const [finalSimResult, setFinalSimResult] = useState<FinalLiquidationSimulationResult | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [kpisRes, bookRes, historyRes, pBatchesRes, sBatchesRes, finalRes, empRes, exitsRes, perRes] =
        await Promise.all([
          payrollBenefitsApi.getKpis().catch(() => null),
          payrollBenefitsApi.getVacationBook().catch(() => []),
          payrollBenefitsApi.listVacations().catch(() => []),
          payrollBenefitsApi.listBatches(new Date().getFullYear()).catch(() => []),
          payrollBenefitsApi.listBatches(new Date().getFullYear()).catch(() => []),
          payrollBenefitsApi.listFinalContractSettlements().catch(() => []),
          PayrollApi.listEmployees().catch(() => []),
          PayrollApi.listExitReasons().catch(() => []),
          PayrollApi.listPeriods().catch(() => []),
        ]);

      setKpis(kpisRes);
      setVacationBook(bookRes);
      setVacationHistory(historyRes);
      setFinalSettlements(finalRes);
      setEmployees(empRes);
      setExitReasons(exitsRes);
      setPeriods(perRes);

      // Separate batches
      const prima = (pBatchesRes || []).filter(
        (b) => b.benefitType === "PRIMA_FIRST_SEMESTER" || b.benefitType === "PRIMA_SECOND_SEMESTER",
      );
      setPrimaBatches(prima);
      if (prima.length > 0) {
        loadPrimaBatchDetails(prima[0].id);
      }

      const severance = (sBatchesRes || []).filter(
        (b) => b.benefitType === "SEVERANCE_ANNUAL" || b.benefitType === "SEVERANCE_INTERESTS",
      );
      setSeveranceBatches(severance);
      if (severance.length > 0) {
        loadSeveranceBatchDetails(severance[0].id);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al cargar datos del módulo de prestaciones." });
    } finally {
      setLoading(false);
    }
  };

  const loadPrimaBatchDetails = async (batchId: string) => {
    try {
      const batch = await payrollBenefitsApi.getBatch(batchId);
      setActivePrimaBatch(batch);
    } catch (e: any) {
      setFeedback({ type: "error", message: `Error cargando lote de prima: ${e.message}` });
    }
  };

  const loadSeveranceBatchDetails = async (batchId: string) => {
    try {
      const batch = await payrollBenefitsApi.getBatch(batchId);
      setActiveSeveranceBatch(batch);
    } catch (e: any) {
      setFeedback({ type: "error", message: `Error cargando lote de cesantías: ${e.message}` });
    }
  };

  // =========================================================================
  // VACATION HANDLERS
  // =========================================================================

  const handleOpenVacationDrawer = (empId?: string) => {
    if (empId) {
      setSelectedVacationEmp(empId);
      const empBook = vacationBook.find((b) => b.employeeId === empId);
      if (empBook) {
        setBusinessDays(empBook.pendingBusinessDays > 0 ? Math.min(15, empBook.pendingBusinessDays) : 15);
      }
    } else if (employees.length > 0) {
      setSelectedVacationEmp(employees[0].id);
    }
    setVacationDrawerOpen(true);
    setVacationSimResult(null);
  };

  const handleSimulateVacation = async () => {
    if (!selectedVacationEmp) {
      setFeedback({ type: "error", message: "Seleccione un empleado para simular." });
      return;
    }
    setActionLoading(true);
    try {
      const sim = await payrollBenefitsApi.simulateVacation({
        employeeId: selectedVacationEmp,
        vacationType,
        enjoymentStartDate,
        businessDays: Number(businessDays),
        loansToDeduct: Number(loansToDeduct) || 0,
      });
      setVacationSimResult(sim);
      setFeedback({ type: "info", message: `Simulación exitosa: Fecha de retorno calculada para el ${sim.returnDate}.` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al simular vacaciones." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveVacation = async (approveImmediate: boolean) => {
    if (!selectedVacationEmp) return;
    setActionLoading(true);
    try {
      const created = await payrollBenefitsApi.createVacation({
        employeeId: selectedVacationEmp,
        vacationType,
        enjoymentStartDate,
        businessDays: Number(businessDays),
        accrualStartDate,
        accrualEndDate,
        loansToDeduct: Number(loansToDeduct) || 0,
        notes: `Vacaciones liquidadas el ${new Date().toLocaleDateString("es-CO")}`,
      });

      if (approveImmediate) {
        await payrollBenefitsApi.approveVacation(created.id);
        setFeedback({
          type: "success",
          message: "Vacaciones aprobadas con éxito. Se ejecutó la sincronización 3-en-1 con novedades y malla de turnos.",
        });
      } else {
        setFeedback({ type: "success", message: "Liquidación de vacaciones guardada en borrador." });
      }

      setVacationDrawerOpen(false);
      // Reload lists
      const [book, history] = await Promise.all([
        payrollBenefitsApi.getVacationBook(),
        payrollBenefitsApi.listVacations(),
      ]);
      setVacationBook(book);
      setVacationHistory(history);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al guardar vacaciones." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadVacationPdf = async (id: string) => {
    try {
      const blob = await payrollBenefitsApi.downloadVacationPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comprobante-vacaciones-${id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setFeedback({ type: "error", message: `Error al descargar PDF: ${e.message}` });
    }
  };

  // =========================================================================
  // PRIMA & CESANTÍAS HANDLERS
  // =========================================================================

  const handleCalculatePrimaBatch = async () => {
    setActionLoading(true);
    try {
      const batch = await payrollBenefitsApi.generateBatch({
        benefitType: selectedPrimaSemester,
        year: Number(selectedPrimaYear),
        cutoffDate: primaCutoffDate,
        projectionEndDate: primaProjectionDate,
      });
      setFeedback({ type: "success", message: `Lote ${batch.label} calculado con ${batch.totalEmployees} empleados.` });
      await loadPrimaBatchDetails(batch.id);
      const batches = await payrollBenefitsApi.listBatches(Number(selectedPrimaYear));
      setPrimaBatches(batches.filter((b) => b.benefitType === "PRIMA_FIRST_SEMESTER" || b.benefitType === "PRIMA_SECOND_SEMESTER"));
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "Error calculando prima." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCalculateSeveranceBatch = async () => {
    setActionLoading(true);
    try {
      const batch = await payrollBenefitsApi.generateBatch({
        benefitType: "SEVERANCE_ANNUAL",
        year: Number(selectedSeveranceYear),
        cutoffDate: severanceCutoffDate,
        projectionEndDate: severanceProjectionDate,
      });
      setFeedback({
        type: "success",
        message: `Lote de Cesantías e Intereses 12% calculado con éxito (${batch.totalEmployees} empleados).`,
      });
      await loadSeveranceBatchDetails(batch.id);
      const batches = await payrollBenefitsApi.listBatches(Number(selectedSeveranceYear));
      setSeveranceBatches(batches.filter((b) => b.benefitType === "SEVERANCE_ANNUAL" || b.benefitType === "SEVERANCE_INTERESTS"));
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "Error calculando cesantías." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveBatch = async (batchId: string, isPrima: boolean) => {
    setActionLoading(true);
    try {
      await payrollBenefitsApi.approveBatch(batchId);
      setFeedback({ type: "success", message: "Lote de prestaciones aprobado oficialmente." });
      if (isPrima) {
        await loadPrimaBatchDetails(batchId);
      } else {
        await loadSeveranceBatchDetails(batchId);
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "Error aprobando lote." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditItem = (item: SocialBenefitItem) => {
    setEditingBenefitItem(item);
    setAdjustedBenefitAmount(item.approvedBenefitAmount);
    setAdjustedInterestAmount(item.approvedInterestAmount);
    setAdjustedNotes(item.notes || "");
    setAdjustItemDrawerOpen(true);
  };

  const handleSaveItemAdjustment = async () => {
    if (!editingBenefitItem) return;
    setActionLoading(true);
    try {
      await payrollBenefitsApi.updateBatchItem(editingBenefitItem.id, {
        approvedBenefitAmount: Number(adjustedBenefitAmount),
        approvedInterestAmount: Number(adjustedInterestAmount),
        notes: adjustedNotes,
      });
      setFeedback({ type: "success", message: "Valor de prestación ajustado exitosamente." });
      setAdjustItemDrawerOpen(false);
      if (activePrimaBatch && activePrimaBatch.id === editingBenefitItem.batchId) {
        await loadPrimaBatchDetails(activePrimaBatch.id);
      }
      if (activeSeveranceBatch && activeSeveranceBatch.id === editingBenefitItem.batchId) {
        await loadSeveranceBatchDetails(activeSeveranceBatch.id);
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "Error ajustando ítem." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenInjectDrawer = (batch: SocialBenefitBatch) => {
    setInjectingBatch(batch);
    const openPeriod = periods.find((p) => p.status === "OPEN");
    if (openPeriod) setTargetPeriodId(openPeriod.id);
    setInjectDrawerOpen(true);
  };

  const handleExecuteInjection = async () => {
    if (!injectingBatch || !targetPeriodId) {
      setFeedback({ type: "error", message: "Seleccione el periodo abierto destino." });
      return;
    }
    setActionLoading(true);
    try {
      const res = await payrollBenefitsApi.injectToPayroll(injectingBatch.id, {
        targetPeriodId,
      });
      setFeedback({ type: "success", message: res.message });
      setInjectDrawerOpen(false);
      if (activePrimaBatch?.id === injectingBatch.id) {
        await loadPrimaBatchDetails(injectingBatch.id);
      }
      if (activeSeveranceBatch?.id === injectingBatch.id) {
        await loadSeveranceBatchDetails(injectingBatch.id);
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "Error inyectando prestaciones a nómina." });
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // FINAL LIQUIDATION HANDLERS
  // =========================================================================

  const handleOpenFinalSettlementDrawer = () => {
    if (employees.length > 0) setFinalEmpId(employees[0].id);
    if (exitReasons.length > 0) setFinalExitReasonId(exitReasons[0].id);
    setFinalSettlementDrawerOpen(true);
    setFinalSimResult(null);
  };

  const handleSimulateFinalSettlement = async () => {
    if (!finalEmpId || !finalExitReasonId) {
      setFeedback({ type: "error", message: "Seleccione empleado y motivo de retiro." });
      return;
    }
    setActionLoading(true);
    try {
      const sim = await payrollBenefitsApi.simulateFinalSettlement({
        employeeId: finalEmpId,
        retirementDate: finalRetirementDate,
        exitReasonId: finalExitReasonId,
        includePendingPayroll,
        applyIndemnification,
        otherEarningsAmount: Number(finalOtherEarnings) || 0,
        otherEarningsConcept: finalOtherEarningsConcept,
        otherDeductionsAmount: Number(finalOtherDeductions) || 0,
        otherDeductionsConcept: finalOtherDeductionsConcept,
        blockForRehireBdn,
      });
      setFinalSimResult(sim);
      setFeedback({ type: "info", message: "Simulación de liquidación total calculada con éxito." });
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "Error al simular liquidación definitiva." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveFinalSettlement = async (approveImmediate: boolean) => {
    if (!finalEmpId || !finalExitReasonId) return;
    setActionLoading(true);
    try {
      const created = await payrollBenefitsApi.createFinalSettlement({
        employeeId: finalEmpId,
        retirementDate: finalRetirementDate,
        exitReasonId: finalExitReasonId,
        includePendingPayroll,
        applyIndemnification,
        otherEarningsAmount: Number(finalOtherEarnings) || 0,
        otherEarningsConcept: finalOtherEarningsConcept,
        otherDeductionsAmount: Number(finalOtherDeductions) || 0,
        otherDeductionsConcept: finalOtherDeductionsConcept,
        blockForRehireBdn,
        notes: `Liquidación definitiva emitida el ${new Date().toLocaleDateString("es-CO")}`,
      });

      if (approveImmediate) {
        await payrollBenefitsApi.approveFinalSettlement(created.id);
        setFeedback({
          type: "success",
          message: "Liquidación definitiva aprobada, empleado inactivado, puestos cerrados y préstamos saldados.",
        });
      } else {
        setFeedback({ type: "success", message: "Liquidación definitiva guardada en borrador." });
      }

      setFinalSettlementDrawerOpen(false);
      const settlements = await payrollBenefitsApi.listFinalContractSettlements();
      setFinalSettlements(settlements);
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "Error al guardar liquidación definitiva." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadFinalPdf = async (id: string) => {
    try {
      const blob = await payrollBenefitsApi.downloadFinalSettlementPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acta-liquidacion-paz-y-salvo-${id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setFeedback({ type: "error", message: `Error al descargar acta PDF: ${e.message}` });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#F8FAFC", minHeight: "100vh" }}>
      {/* Breadcrumb Header */}
      <Breadcrumbs sx={{ mb: 1, fontSize: "0.85rem" }}>
        <Link underline="hover" color="inherit" href="/finance">
          Dirección Financiera
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          Prestaciones Sociales y Liquidación Total
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
            Consola de Prestaciones Sociales y Liquidación Definitiva
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B" }}>
            Libro de vacaciones legal con calendario inteligente, prima semestral proyectada, cesantías/intereses 12% y acta de paz y salvo.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshOutlined />}
          onClick={loadAllData}
          sx={{ borderColor: "#CBD5E1", color: "#334155", "&:hover": { bgcolor: "#F1F5F9" } }}
        >
          Actualizar Consola
        </Button>
      </Box>

      {/* Global Alerts */}
      {feedback && (
        <Alert severity={feedback.type} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}

      {/* 4 Executive KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "none" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#EFF6FF", color: "#2563EB" }}>
                <BeachAccessOutlined fontSize="small" />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                Vacaciones Pendientes (≥15d)
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", fontFamily: "JetBrains Mono, monospace" }}>
              {kpis?.employeesWithOver15VacationDays ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              De {kpis?.totalActiveEmployees ?? 0} empleados activos
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "none" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#F5F3FF", color: "#7C3AED" }}>
                <TrendingUpOutlined fontSize="small" />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                Prima Semestral Lote
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#7C3AED", fontFamily: "JetBrains Mono, monospace" }}>
              ${kpis?.latestPrimaBatch?.totalBenefitAmount ? kpis.latestPrimaBatch.totalBenefitAmount.toLocaleString("es-CO") : "0"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              {kpis?.latestPrimaBatch?.label || "Sin lote calculado"}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "none" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#ECFDF5", color: "#059669" }}>
                <SavingsOutlined fontSize="small" />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                Cesantías / Intereses (12%)
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#059669", fontFamily: "JetBrains Mono, monospace" }}>
              ${kpis?.latestSeveranceBatch?.totalBenefitAmount ? kpis.latestSeveranceBatch.totalBenefitAmount.toLocaleString("es-CO") : "0"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Int: ${kpis?.latestSeveranceBatch?.totalInterestAmount ? kpis.latestSeveranceBatch.totalInterestAmount.toLocaleString("es-CO") : "0"}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "none" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: "#FFF1F2", color: "#E11D48" }}>
                <WorkOffOutlined fontSize="small" />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                Retiros y Liquidaciones
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#E11D48", fontFamily: "JetBrains Mono, monospace" }}>
              {kpis?.finalSettlementsCountThisYear ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Paz y salvos emitidos este año
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs Container */}
      <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "none" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            borderBottom: "1px solid #E2E8F0",
            px: 2,
            pt: 1,
            "& .MuiTab-root": { fontWeight: 700, fontSize: "0.875rem", textTransform: "none", minHeight: 48 },
            "& .Mui-selected": { color: "#7C3AED" },
            "& .MuiTabs-indicator": { bgcolor: "#7C3AED", height: 3 },
          }}
        >
          <Tab icon={<BeachAccessOutlined />} iconPosition="start" label="1. Vacaciones y Libro de Saldos" />
          <Tab icon={<TrendingUpOutlined />} iconPosition="start" label="2. Prima de Servicios Semestral" />
          <Tab icon={<SavingsOutlined />} iconPosition="start" label="3. Cesantías e Intereses (12%)" />
          <Tab icon={<WorkOffOutlined />} iconPosition="start" label="4. Liquidación Definitiva de Contrato (Paz y Salvo)" />
        </Tabs>

        {/* ========================================================================= */}
        {/* TAB 0: VACACIONES Y LIBRO DE SALDOS */}
        {/* ========================================================================= */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
                Libro de Saldos de Vacaciones (Causación Legal de 15 Días Hábiles por Año)
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="Buscar por cédula o nombre..."
                  value={vacationSearch}
                  onChange={(e) => setVacationSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" sx={{ color: "#94A3B8" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 280 }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddOutlined />}
                  onClick={() => handleOpenVacationDrawer()}
                  sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
                >
                  Liquidar Vacaciones
                </Button>
              </Box>
            </Box>

            {/* Vacation Book Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>EMPLEADO / DOCUMENTO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>DEPENDENCIA / PUESTO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>FECHA INGRESO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">DÍAS SERVIDOS</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">CAUSADOS</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">DISFRUTADOS</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">PENDIENTES</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">ESTADO ALERTA</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">ACCIONES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vacationBook
                    .filter(
                      (b) =>
                        b.fullName.toLowerCase().includes(vacationSearch.toLowerCase()) ||
                        b.document.includes(vacationSearch),
                    )
                    .map((row) => (
                      <TableRow key={row.employeeId} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                            {row.fullName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748B", fontFamily: "JetBrains Mono, monospace" }}>
                            CC {row.document}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.dependencyName}</TableCell>
                        <TableCell sx={{ fontFamily: "JetBrains Mono, monospace" }}>{row.hireDate}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {row.totalServiceDays}d
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {row.totalAccruedBusinessDays}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {row.totalEnjoyedBusinessDays}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                          {row.pendingBusinessDays}
                        </TableCell>
                        <TableCell align="center">
                          {row.alertLevel === "ALERT_HIGH" && (
                            <Chip size="small" label="≥ 30 Días" color="error" sx={{ fontWeight: 700 }} />
                          )}
                          {row.alertLevel === "ALERT_MED" && (
                            <Chip size="small" label="≥ 15 Días" color="warning" sx={{ fontWeight: 700 }} />
                          )}
                          {row.alertLevel === "NORMAL" && (
                            <Chip size="small" label="Al Día" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenVacationDrawer(row.employeeId)}
                            sx={{ textTransform: "none", borderColor: "#7C3AED", color: "#7C3AED" }}
                          >
                            Liquidar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  {vacationBook.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3, color: "#64748B" }}>
                        No se encontraron registros en el Libro de Vacaciones.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Vacation History Table */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
              Historial de Vacaciones Otorgadas y Compensadas
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>EMPLEADO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>MODALIDAD</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>RANGO DISFRUTE [SALIDA - FIN]</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>REGRESO AL PUESTO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">DÍAS HÁBILES</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">CALENDARIO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">NETO PAGADO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">ESTADO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">COMPROBANTE</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vacationHistory.map((v) => (
                    <TableRow key={v.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {v.employee ? `${v.employee.firstName} ${v.employee.lastName}` : "Empleado"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          CC {v.employee?.document || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={v.vacationType === "ENJOYED_IN_TIME" ? "Tiempo (Sinc 3-en-1)" : "Compensada en Dinero"}
                          color={v.vacationType === "ENJOYED_IN_TIME" ? "primary" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {v.enjoymentStartDate.split("T")[0]} al {v.enjoymentEndDate.split("T")[0]}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#7C3AED" }}>
                        {v.returnDate.split("T")[0]}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {v.businessDays}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {v.calendarDaysPaid}d
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                        ${Number(v.netPayAmount).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={v.status}
                          color={v.status === "APPROVED" ? "success" : "default"}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleDownloadVacationPdf(v.id)}>
                          <PictureAsPdfOutlined fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {vacationHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3, color: "#64748B" }}>
                        No hay liquidaciones de vacaciones registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: PRIMA DE SERVICIOS SEMESTRAL */}
        {/* ========================================================================= */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {/* Parameters Bar */}
            <Card sx={{ p: 2, mb: 3, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", boxShadow: "none" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Semestre"
                    value={selectedPrimaSemester}
                    onChange={(e: any) => setSelectedPrimaSemester(e.target.value)}
                  >
                    <MenuItem value="PRIMA_FIRST_SEMESTER">1er Semestre (Ene - Jun)</MenuItem>
                    <MenuItem value="PRIMA_SECOND_SEMESTER">2do Semestre (Jul - Dic)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Año Fiscal"
                    value={selectedPrimaYear}
                    onChange={(e) => setSelectedPrimaYear(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="Fecha de Corte (Acumulados)"
                    value={primaCutoffDate}
                    onChange={(e) => setPrimaCutoffDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="Fecha Cierre Proyectada"
                    value={primaProjectionDate}
                    onChange={(e) => setPrimaProjectionDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3} sx={{ display: "flex", gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CalculateOutlined />}
                    onClick={handleCalculatePrimaBatch}
                    disabled={actionLoading}
                    sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
                  >
                    {actionLoading ? "Calculando..." : "Calcular Prima"}
                  </Button>
                </Grid>
              </Grid>
            </Card>

            {/* Active Batch Summary & Action Toolbar */}
            {activePrimaBatch ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      {activePrimaBatch.label}
                    </Typography>
                    <Typography
                      component="div"
                      variant="body2"
                      sx={{ color: "#64748B", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.5 }}
                    >
                      <span>
                        Periodo: {activePrimaBatch.periodStartDate.split("T")[0]} al {activePrimaBatch.projectionEndDate.split("T")[0]} | Total Empleados: {activePrimaBatch.totalEmployees} | Estado:
                      </span>
                      <Chip size="small" label={activePrimaBatch.status} color={activePrimaBatch.status === "APPROVED" ? "success" : "default"} />
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<SendOutlined />}
                      onClick={() => handleOpenInjectDrawer(activePrimaBatch)}
                    >
                      Inyectar en Nómina
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleOutline />}
                      onClick={() => handleApproveBatch(activePrimaBatch.id, true)}
                      disabled={activePrimaBatch.status === "APPROVED" || actionLoading}
                    >
                      Aprobar Lote
                    </Button>
                  </Box>
                </Box>

                {/* Batch Items Table */}
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>EMPLEADO</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">DÍAS TRABAJADOS</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">SUELDO BÁSICO</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">PROMEDIO VARIABLE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">AUX. TRANSPORTE</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">BASE CÁLCULO</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">VALOR PRIMA</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">BANCO / ACH</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">ACCIONES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(activePrimaBatch.items || []).map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : "Empleado"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              CC {item.employee?.document || ""}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                            {item.netDaysWorked}d
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                            ${Number(item.basicSalaryMonthly).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                            ${Number(item.averageVariableEarnings).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                            ${Number(item.transportAllowanceBase).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                            ${Number(item.totalComputationBase).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#7C3AED" }}>
                            ${Number(item.approvedBenefitAmount).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="center">
                            {item.hasBankWarning ? (
                              <Tooltip title="Sin cuenta bancaria registrada para dispersión ACH">
                                <WarningAmberOutlined color="warning" fontSize="small" />
                              </Tooltip>
                            ) : (
                              <Tooltip title={`${item.bankAccountType} Nro ${item.bankAccountNumber}`}>
                                <CheckCircleOutline color="success" fontSize="small" />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenEditItem(item)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Alert severity="info">
                Seleccione los parámetros de corte y haga clic en <strong>Calcular Prima</strong> para liquidar el semestre.
              </Alert>
            )}
          </Box>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CESANTÍAS E INTERESES (12%) */}
        {/* ========================================================================= */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            {/* Parameters Bar */}
            <Card sx={{ p: 2, mb: 3, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", boxShadow: "none" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Año Fiscal"
                    value={selectedSeveranceYear}
                    onChange={(e) => setSelectedSeveranceYear(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="Fecha de Corte"
                    value={severanceCutoffDate}
                    onChange={(e) => setSeveranceCutoffDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="Fecha Cierre Proyectada"
                    value={severanceProjectionDate}
                    onChange={(e) => setSeveranceProjectionDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SavingsOutlined />}
                    onClick={handleCalculateSeveranceBatch}
                    disabled={actionLoading}
                    sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" }, fontWeight: 700 }}
                  >
                    {actionLoading ? "Calculando..." : "Calcular Cesantías e Int."}
                  </Button>
                </Grid>
              </Grid>
            </Card>

            {/* Active Severance Batch */}
            {activeSeveranceBatch ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      {activeSeveranceBatch.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748B" }}>
                      Total Cesantías: ${Number(activeSeveranceBatch.totalBenefitAmount).toLocaleString("es-CO")} | Total Intereses (12%): $
                      {Number(activeSeveranceBatch.totalInterestAmount).toLocaleString("es-CO")}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<SendOutlined />}
                      onClick={() => handleOpenInjectDrawer(activeSeveranceBatch)}
                    >
                      Inyectar Intereses 12% en Nómina Enero
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleOutline />}
                      onClick={() => handleApproveBatch(activeSeveranceBatch.id, false)}
                      disabled={activeSeveranceBatch.status === "APPROVED" || actionLoading}
                    >
                      Aprobar Lote
                    </Button>
                  </Box>
                </Box>

                {/* Funds Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {(activeSeveranceBatch.fundsSummary || []).map((fund, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                      <Card sx={{ p: 2, border: "1px solid #E2E8F0", boxShadow: "none" }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                          {fund.entityName}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#059669", fontFamily: "JetBrains Mono, monospace" }}>
                          ${fund.totalAmount.toLocaleString("es-CO")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          {fund.count} empleados afiliados
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Detailed Table */}
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>EMPLEADO</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>FONDO DE CESANTÍAS</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">DÍAS AÑO</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">BASE CÁLCULO</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">VALOR CESANTÍAS</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">INTERESES (12%)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">ACCIONES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(activeSeveranceBatch.items || []).map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : "Empleado"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748B" }}>
                              CC {item.employee?.document || ""}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={item.cesantiasEntity?.name || "SIN FONDO"} variant="outlined" />
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                            {item.netDaysWorked}d
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                            ${Number(item.totalComputationBase).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#059669" }}>
                            ${Number(item.approvedBenefitAmount).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#7C3AED" }}>
                            ${Number(item.approvedInterestAmount).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenEditItem(item)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Alert severity="info">
                Haga clic en <strong>Calcular Cesantías e Int.</strong> para proyectar el consolidado anual por fondos.
              </Alert>
            )}
          </Box>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LIQUIDACIÓN DEFINITIVA DE CONTRATO (PAZ Y SALVO) */}
        {/* ========================================================================= */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
                  Liquidación Total de Contrato de Trabajo (Art. 64, 65, 186-249 CST)
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  Cálculo de tiempos en base 360, prestaciones proporcionales, indemnización legal, cruce de cartera y emisión de acta oficial de paz y salvo.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={handleOpenFinalSettlementDrawer}
                sx={{ bgcolor: "#E11D48", "&:hover": { bgcolor: "#BE123C" }, fontWeight: 700 }}
              >
                + Nueva Liquidación Definitiva
              </Button>
            </Box>

            {/* Settlements Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>TRABAJADOR</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>MOTIVO DE RETIRO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>VIGENCIA [INGRESO - RETIRO]</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">DÍAS BASE 360</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">CESANTÍAS / INT.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">PRIMA</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">VACACIONES</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">INDEMNIZACIÓN</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">NETO LIQUIDADO</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">ACTA PAZ Y SALVO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finalSettlements.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {s.employee ? `${s.employee.firstName} ${s.employee.lastName}` : "Empleado"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          CC {s.employee?.document || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{s.exitReason?.name || "Retiro"}</Typography>
                        <Chip
                          size="small"
                          label={s.exitReason?.isJustCause ? "Con Justa Causa" : "Sin Justa Causa"}
                          color={s.exitReason?.isJustCause ? "default" : "error"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {s.hireDate.split("T")[0]} al {s.retirementDate.split("T")[0]}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {s.netServiceDaysTotal}d
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        ${(Number(s.cesantiasAmount) + Number(s.interestsCesantiasAmount)).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        ${Number(s.primaAmount).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        ${Number(s.vacationAmount).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace" }}>
                        ${Number(s.indemnificationAmount).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 800, color: "#E11D48" }}>
                        ${Number(s.netPayAmount).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleDownloadFinalPdf(s.id)}>
                          <PictureAsPdfOutlined fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {finalSettlements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 3, color: "#64748B" }}>
                        No hay liquidaciones definitivas de contrato registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* RESPONSIVE FORM DRAWER: LIQUIDACIÓN DE VACACIONES */}
      {/* ========================================================================= */}
      <ResponsiveFormDrawer
        open={vacationDrawerOpen}
        onClose={() => setVacationDrawerOpen(false)}
        title="Otorgamiento y Liquidación de Vacaciones"
        subtitle="Cálculo inteligente de días hábiles, fechas de retorno y sincronización 3-en-1"
        actions={
          <>
            <Button variant="outlined" color="inherit" onClick={() => setVacationDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button variant="outlined" onClick={handleSimulateVacation} disabled={actionLoading}>
              Simular Fechas y Bases
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
              onClick={() => handleSaveVacation(true)}
              disabled={actionLoading}
            >
              Aprobar y Sincronizar en Turnos
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Empleado"
            value={selectedVacationEmp}
            onChange={(e) => setSelectedVacationEmp(e.target.value)}
          >
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} (CC {emp.document})
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Modalidad de Vacaciones"
                value={vacationType}
                onChange={(e: any) => setVacationType(e.target.value)}
              >
                <MenuItem value="ENJOYED_IN_TIME">Disfrutadas en Tiempo (Sincroniza Turnos)</MenuItem>
                <MenuItem value="COMPENSATED_IN_CASH">Compensadas en Dinero (Art. 189 CST)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Días Hábiles Solicitados"
                value={businessDays}
                onChange={(e) => setBusinessDays(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                size="small"
                label="Fecha de Salida"
                value={enjoymentStartDate}
                onChange={(e) => setEnjoymentStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Descuento Préstamos ($)"
                value={loansToDeduct}
                onChange={(e) => setLoansToDeduct(Number(e.target.value))}
              />
            </Grid>
          </Grid>

          {/* Simulation Results Card */}
          {vacationSimResult && (
            <Card sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #7C3AED", borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#7C3AED", mb: 1 }}>
                Resultado del Cálculo y Calendario de Vacaciones
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Fin de Disfrute:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{vacationSimResult.enjoymentEndDate}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Fecha Regreso al Puesto:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#7C3AED" }}>
                    {vacationSimResult.returnDate}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Días Calendario Pagados:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{vacationSimResult.calendarDaysPaid} días</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Base Vacaciones:</Typography>
                  <Typography variant="body2">${vacationSimResult.totalVacationBase.toLocaleString("es-CO")}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Deducción Salud + Pensión:</Typography>
                  <Typography variant="body2" sx={{ color: "#E11D48" }}>
                    -${(vacationSimResult.healthDeductionAmount + vacationSimResult.pensionDeductionAmount).toLocaleString("es-CO")}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Neto a Pagar:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#059669" }}>
                    ${vacationSimResult.netPayAmount.toLocaleString("es-CO")}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          )}
        </Box>
      </ResponsiveFormDrawer>

      {/* ========================================================================= */}
      {/* RESPONSIVE FORM DRAWER: AJUSTAR ÍTEM DE PRESTACIÓN */}
      {/* ========================================================================= */}
      <ResponsiveFormDrawer
        open={adjustItemDrawerOpen}
        onClose={() => setAdjustItemDrawerOpen(false)}
        title="Ajuste Manual de Prestación"
        subtitle={`Empleado: ${editingBenefitItem?.employee?.firstName || ""} ${editingBenefitItem?.employee?.lastName || ""}`}
        actions={
          <>
            <Button variant="outlined" color="inherit" onClick={() => setAdjustItemDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
              onClick={handleSaveItemAdjustment}
              disabled={actionLoading}
            >
              Guardar Ajuste
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            type="number"
            size="small"
            label="Valor Aprobado de Prestación ($)"
            value={adjustedBenefitAmount}
            onChange={(e) => setAdjustedBenefitAmount(Number(e.target.value))}
          />
          <TextField
            fullWidth
            type="number"
            size="small"
            label="Valor Intereses sobre Cesantías ($)"
            value={adjustedInterestAmount}
            onChange={(e) => setAdjustedInterestAmount(Number(e.target.value))}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Motivo del Ajuste Manual"
            value={adjustedNotes}
            onChange={(e) => setAdjustedNotes(e.target.value)}
          />
        </Box>
      </ResponsiveFormDrawer>

      {/* ========================================================================= */}
      {/* RESPONSIVE FORM DRAWER: INYECTAR A NÓMINA */}
      {/* ========================================================================= */}
      <ResponsiveFormDrawer
        open={injectDrawerOpen}
        onClose={() => setInjectDrawerOpen(false)}
        title="Inyectar Prestaciones como Novedad en Nómina Abierta"
        subtitle={`Lote: ${injectingBatch?.label || ""}`}
        actions={
          <>
            <Button variant="outlined" color="inherit" onClick={() => setInjectDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
              onClick={handleExecuteInjection}
              disabled={actionLoading || !targetPeriodId}
            >
              Inyectar Novedades
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Alert severity="info">
            Esta acción registrará los valores aprobados del lote como novedades pagables directamente en el periodo de nómina abierto seleccionado.
          </Alert>

          <TextField
            select
            fullWidth
            size="small"
            label="Periodo de Nómina Abierto Destino"
            value={targetPeriodId}
            onChange={(e) => setTargetPeriodId(e.target.value)}
          >
            {periods
              .filter((p) => p.status === "OPEN")
              .map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.label} ({p.startDate.split("T")[0]} al {p.endDate.split("T")[0]})
                </MenuItem>
              ))}
          </TextField>
        </Box>
      </ResponsiveFormDrawer>

      {/* ========================================================================= */}
      {/* RESPONSIVE FORM DRAWER: LIQUIDACIÓN DEFINITIVA DE CONTRATO */}
      {/* ========================================================================= */}
      <ResponsiveFormDrawer
        open={finalSettlementDrawerOpen}
        onClose={() => setFinalSettlementDrawerOpen(false)}
        title="Liquidación Definitiva de Contrato y Paz y Salvo"
        subtitle="Art. 64 CST, cruce de cartera y cálculo proporcional de prestaciones sociales"
        actions={
          <>
            <Button variant="outlined" color="inherit" onClick={() => setFinalSettlementDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button variant="outlined" onClick={handleSimulateFinalSettlement} disabled={actionLoading}>
              Simular Liquidación
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#E11D48", "&:hover": { bgcolor: "#BE123C" }, fontWeight: 700 }}
              onClick={() => handleSaveFinalSettlement(true)}
              disabled={actionLoading}
            >
              Aprobar y Cerrar Contrato
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Trabajador a Retirar"
            value={finalEmpId}
            onChange={(e) => setFinalEmpId(e.target.value)}
          >
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} (CC {emp.document})
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Motivo de Retiro"
                value={finalExitReasonId}
                onChange={(e) => setFinalExitReasonId(e.target.value)}
              >
                {exitReasons.map((ex) => (
                  <MenuItem key={ex.id} value={ex.id}>
                    {ex.code} - {ex.name} {ex.isJustCause ? "(Justa Causa)" : "(Sin Justa Causa)"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                size="small"
                label="Fecha Efectiva de Retiro"
                value={finalRetirementDate}
                onChange={(e) => setFinalRetirementDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Toggles */}
          <Box sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
            <FormControlLabel
              control={<Switch checked={includePendingPayroll} onChange={(e) => setIncludePendingPayroll(e.target.checked)} />}
              label="Incluir salario y días pendientes del mes de retiro"
            />
            <FormControlLabel
              control={<Switch checked={applyIndemnification} onChange={(e) => setApplyIndemnification(e.target.checked)} />}
              label="Aplicar indemnización por despido Art. 64 CST"
            />
            <FormControlLabel
              control={<Switch checked={blockForRehireBdn} onChange={(e) => setBlockForRehireBdn(e.target.checked)} color="error" />}
              label="Bloquear para recontratación en Base de Datos Negativa (B.D.N)"
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Otros Devengos ($)"
                value={finalOtherEarnings}
                onChange={(e) => setFinalOtherEarnings(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Concepto Otros Devengos"
                value={finalOtherEarningsConcept}
                onChange={(e) => setFinalOtherEarningsConcept(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Otras Deducciones ($)"
                value={finalOtherDeductions}
                onChange={(e) => setFinalOtherDeductions(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Concepto Otras Deducciones"
                value={finalOtherDeductionsConcept}
                onChange={(e) => setFinalOtherDeductionsConcept(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Simulation Preview */}
          {finalSimResult && (
            <Card sx={{ p: 2, bgcolor: "#FFF1F2", border: "1px solid #E11D48", borderRadius: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#E11D48", mb: 1 }}>
                Liquidación Definitiva Calculada
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Días Netos Servicio:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{finalSimResult.netServiceDaysTotal} días</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Cesantías + Intereses:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    ${(finalSimResult.cesantiasAmount + finalSimResult.interestsCesantiasAmount).toLocaleString("es-CO")}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Prima Proporcional:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>${finalSimResult.primaAmount.toLocaleString("es-CO")}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Vacaciones en Dinero:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>${finalSimResult.vacationAmount.toLocaleString("es-CO")}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Indemnización Art. 64:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#E11D48" }}>
                    ${finalSimResult.indemnificationAmount.toLocaleString("es-CO")}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>Cruce Préstamos:</Typography>
                  <Typography variant="body2" sx={{ color: "#E11D48" }}>
                    -${finalSimResult.loansDeductedAmount.toLocaleString("es-CO")}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      VALOR NETO A LIQUIDAR:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#E11D48", fontFamily: "JetBrains Mono, monospace" }}>
                      ${finalSimResult.netPayAmount.toLocaleString("es-CO")} COP
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          )}
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}

