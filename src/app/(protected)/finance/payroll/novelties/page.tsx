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
} from "@mui/material";
import {
  AddOutlined,
  SearchOutlined,
  RefreshOutlined,
  MonetizationOnOutlined,
  LocalHospitalOutlined,
  AccountBalanceWalletOutlined,
  AssignmentOutlined,
  EditOutlined,
  DeleteOutline,
  PlayArrowOutlined,
  PauseOutlined,
  PostAddOutlined,
  CalculateOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import {
  payrollNoveltiesApi,
  LeaveAndAbsenceType,
  EpsClaimStatus,
  PayrollLoanStatus,
  PermanentConceptScope,
  NoveltyPeriodicityRule,
  NoveltyOriginType,
  PayrollLeaveAndAbsence,
  PayrollLoan,
  PayrollPermanentConcept,
  PayrollPeriodNovelty,
  NoveltiesKpis,
  IncapacityPreviewResult,
} from "@/lib/api/payroll-novelties";
import { PayrollApi, PayrollConcept, PayrollDependency, PayrollPeriod } from "@/lib/api/payroll";
import { PayrollEmployeesApi, PayrollEmployeeListItem } from "@/lib/api/payroll-employees";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { noxiaPalette } from "@/theme/noxiaTheme";

export default function PayrollNoveltiesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Common Catalogs
  const [employees, setEmployees] = useState<PayrollEmployeeListItem[]>([]);
  const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
  const [dependencies, setDependencies] = useState<PayrollDependency[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [cie10List, setCie10List] = useState<Array<{ id: string; code: string; name: string }>>([]);

  // Data states
  const [kpis, setKpis] = useState<NoveltiesKpis | null>(null);
  const [leaves, setLeaves] = useState<PayrollLeaveAndAbsence[]>([]);
  const [loans, setLoans] = useState<PayrollLoan[]>([]);
  const [permanentConcepts, setPermanentConcepts] = useState<PayrollPermanentConcept[]>([]);
  const [periodNovelties, setPeriodNovelties] = useState<PayrollPeriodNovelty[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [leaveFilterType, setLeaveFilterType] = useState<string>("ALL");
  const [claimFilterStatus, setClaimFilterStatus] = useState<string>("ALL");

  // Drawers
  const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false);
  const [claimDrawerOpen, setClaimDrawerOpen] = useState(false);
  const [loanDrawerOpen, setLoanDrawerOpen] = useState(false);
  const [installmentDrawerOpen, setInstallmentDrawerOpen] = useState(false);
  const [permDrawerOpen, setPermDrawerOpen] = useState(false);
  const [noveltyDrawerOpen, setNoveltyDrawerOpen] = useState(false);

  // Forms states
  const [leaveForm, setLeaveForm] = useState<{
    employeeId: string;
    leaveType: LeaveAndAbsenceType;
    conceptId?: string;
    startDate: string;
    endDate: string;
    cie10Id?: string;
    isExtension: boolean;
    accumulatedPriorDays: number;
    certificateNumber: string;
    notes: string;
  }>({
    employeeId: "",
    leaveType: LeaveAndAbsenceType.SICK_LEAVE_EG,
    conceptId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    cie10Id: "",
    isExtension: false,
    accumulatedPriorDays: 0,
    certificateNumber: "",
    notes: "",
  });

  const [previewResult, setPreviewResult] = useState<IncapacityPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [selectedLeaveForClaim, setSelectedLeaveForClaim] = useState<PayrollLeaveAndAbsence | null>(null);
  const [claimForm, setClaimForm] = useState<{
    claimStatus: EpsClaimStatus;
    certificateNumber: string;
    filingDate: string;
    paymentDate: string;
    reimbursedAmount: number;
    rejectionReason: string;
  }>({
    claimStatus: EpsClaimStatus.PENDING_FILING,
    certificateNumber: "",
    filingDate: "",
    paymentDate: "",
    reimbursedAmount: 0,
    rejectionReason: "",
  });

  const [loanForm, setLoanForm] = useState<{
    employeeId: string;
    conceptId: string;
    loanNumber: string;
    principalAmount: number;
    totalInstallments: number;
    installmentAmount: number;
    periodicity: NoveltyPeriodicityRule;
    firstDeductionDate: string;
    notes: string;
  }>({
    employeeId: "",
    conceptId: "",
    loanNumber: "",
    principalAmount: 1000000,
    totalInstallments: 10,
    installmentAmount: 100000,
    periodicity: NoveltyPeriodicityRule.ALL_PERIODS,
    firstDeductionDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [selectedLoanForInstallment, setSelectedLoanForInstallment] = useState<PayrollLoan | null>(null);
  const [installmentForm, setInstallmentForm] = useState<{
    amount: number;
    notes: string;
  }>({
    amount: 0,
    notes: "",
  });

  const [permForm, setPermForm] = useState<{
    scope: PermanentConceptScope;
    employeeId: string;
    dependencyId: string;
    conceptId: string;
    amount: number;
    isProportionalToDays: boolean;
    applicationRule: NoveltyPeriodicityRule;
    validFrom: string;
    validUntil: string;
    notes: string;
  }>({
    scope: PermanentConceptScope.BY_EMPLOYEE,
    employeeId: "",
    dependencyId: "",
    conceptId: "",
    amount: 150000,
    isProportionalToDays: true,
    applicationRule: NoveltyPeriodicityRule.ALL_PERIODS,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
    notes: "",
  });

  const [noveltyForm, setNoveltyForm] = useState<{
    periodId: string;
    employeeId: string;
    dependencyId: string;
    conceptId: string;
    noveltyDate: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    notes: string;
  }>({
    periodId: "",
    employeeId: "",
    dependencyId: "",
    conceptId: "",
    noveltyDate: new Date().toISOString().split("T")[0],
    quantity: 1,
    unitValue: 0,
    totalValue: 0,
    notes: "",
  });

  // Load Initial Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [
        kpisData,
        leavesData,
        loansData,
        permData,
        noveltiesData,
        empData,
        conceptsData,
        depsData,
        periodsData,
        cieData,
      ] = await Promise.all([
        payrollNoveltiesApi.getKpis(),
        payrollNoveltiesApi.listLeaves(),
        payrollNoveltiesApi.listLoans(),
        payrollNoveltiesApi.listPermanentConcepts(),
        payrollNoveltiesApi.listPeriodNovelties(),
        PayrollEmployeesApi.findEmployees(),
        PayrollApi.listConcepts({ isActive: true }),
        PayrollApi.listDependencies({ isActive: true }),
        PayrollApi.listPeriods(),
        payrollNoveltiesApi.listCie10(),
      ]);

      setKpis(kpisData);
      setLeaves(leavesData || []);
      setLoans(loansData || []);
      setPermanentConcepts(permData || []);
      setPeriodNovelties(noveltiesData || []);
      setEmployees(empData || []);
      setConcepts(conceptsData || []);
      setDependencies(depsData || []);
      setPeriods(periodsData || []);
      setCie10List(cieData || []);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al cargar novedades de nómina." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live calculation for preview
  useEffect(() => {
    if (leaveDrawerOpen && leaveForm.startDate && leaveForm.endDate) {
      const runPreview = async () => {
        try {
          setPreviewLoading(true);
          const result = await payrollNoveltiesApi.previewLeave({
            leaveType: leaveForm.leaveType,
            startDate: leaveForm.startDate,
            endDate: leaveForm.endDate,
            employeeId: leaveForm.employeeId || undefined,
            isExtension: leaveForm.isExtension,
            accumulatedPriorDays: leaveForm.accumulatedPriorDays,
          });
          setPreviewResult(result);
        } catch {
          setPreviewResult(null);
        } finally {
          setPreviewLoading(false);
        }
      };
      runPreview();
    }
  }, [
    leaveDrawerOpen,
    leaveForm.leaveType,
    leaveForm.startDate,
    leaveForm.endDate,
    leaveForm.employeeId,
    leaveForm.isExtension,
    leaveForm.accumulatedPriorDays,
  ]);

  // Handle Save Leave
  const handleSaveLeave = async () => {
    if (!leaveForm.employeeId) {
      setFeedback({ type: "error", message: "Selecciona el empleado para registrar la incapacidad." });
      return;
    }
    try {
      setSaving(true);
      await payrollNoveltiesApi.createLeave({
        employeeId: leaveForm.employeeId,
        leaveType: leaveForm.leaveType,
        conceptId: leaveForm.conceptId || undefined,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        cie10Id: leaveForm.cie10Id || undefined,
        isExtension: leaveForm.isExtension,
        accumulatedPriorDays: Number(leaveForm.accumulatedPriorDays) || 0,
        certificateNumber: leaveForm.certificateNumber || undefined,
        notes: leaveForm.notes || undefined,
      });
      setFeedback({ type: "success", message: "Novedad de tiempo registrada e integrada a la malla de turnos." });
      setLeaveDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al registrar incapacidad." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Claim
  const handleSaveClaim = async () => {
    if (!selectedLeaveForClaim) return;
    try {
      setSaving(true);
      await payrollNoveltiesApi.updateClaimStatus(selectedLeaveForClaim.id, {
        claimStatus: claimForm.claimStatus,
        certificateNumber: claimForm.certificateNumber || undefined,
        filingDate: claimForm.filingDate || undefined,
        paymentDate: claimForm.paymentDate || undefined,
        reimbursedAmount: Number(claimForm.reimbursedAmount) || 0,
        rejectionReason: claimForm.rejectionReason || undefined,
      });
      setFeedback({ type: "success", message: "Estado de radicación y cobro EPS/ARL actualizado." });
      setClaimDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al actualizar estado de recobro." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Loan
  const handleSaveLoan = async () => {
    if (!loanForm.employeeId || !loanForm.conceptId) {
      setFeedback({ type: "error", message: "Selecciona el empleado y el concepto de préstamo/libranza." });
      return;
    }
    try {
      setSaving(true);
      await payrollNoveltiesApi.createLoan({
        employeeId: loanForm.employeeId,
        conceptId: loanForm.conceptId,
        loanNumber: loanForm.loanNumber || undefined,
        principalAmount: Number(loanForm.principalAmount),
        totalInstallments: Number(loanForm.totalInstallments),
        installmentAmount: Number(loanForm.installmentAmount),
        periodicity: loanForm.periodicity,
        firstDeductionDate: loanForm.firstDeductionDate || undefined,
        notes: loanForm.notes || undefined,
      });
      setFeedback({ type: "success", message: "Préstamo o libranza registrado exitosamente." });
      setLoanDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al registrar préstamo." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Record Installment
  const handleRecordInstallment = async () => {
    if (!selectedLoanForInstallment || installmentForm.amount <= 0) return;
    try {
      setSaving(true);
      await payrollNoveltiesApi.recordLoanInstallment(selectedLoanForInstallment.id, {
        amount: Number(installmentForm.amount),
        notes: installmentForm.notes || undefined,
      });
      setFeedback({ type: "success", message: "Abono / cuota registrada y saldo recalculado." });
      setInstallmentDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al registrar cuota." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Permanent Concept
  const handleSavePerm = async () => {
    if (permForm.scope === PermanentConceptScope.BY_EMPLOYEE && !permForm.employeeId) {
      setFeedback({ type: "error", message: "Selecciona el empleado destinatario." });
      return;
    }
    if (permForm.scope === PermanentConceptScope.BY_DEPENDENCY && !permForm.dependencyId) {
      setFeedback({ type: "error", message: "Selecciona el puesto o dependencia." });
      return;
    }
    if (!permForm.conceptId) {
      setFeedback({ type: "error", message: "Selecciona el concepto contable." });
      return;
    }
    try {
      setSaving(true);
      await payrollNoveltiesApi.createPermanentConcept({
        scope: permForm.scope,
        employeeId: permForm.employeeId || undefined,
        dependencyId: permForm.dependencyId || undefined,
        conceptId: permForm.conceptId,
        amount: Number(permForm.amount),
        isProportionalToDays: permForm.isProportionalToDays,
        applicationRule: permForm.applicationRule,
        validFrom: permForm.validFrom || undefined,
        validUntil: permForm.validUntil || undefined,
        notes: permForm.notes || undefined,
      });
      setFeedback({ type: "success", message: "Concepto fijo parametrizado correctamente." });
      setPermDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al crear concepto fijo." });
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Variable Novelty
  const handleSaveNovelty = async () => {
    if (!noveltyForm.periodId || !noveltyForm.employeeId || !noveltyForm.conceptId) {
      setFeedback({ type: "error", message: "Completa el periodo, empleado y concepto de la novedad." });
      return;
    }
    try {
      setSaving(true);
      await payrollNoveltiesApi.createPeriodNovelty({
        periodId: noveltyForm.periodId,
        employeeId: noveltyForm.employeeId,
        dependencyId: noveltyForm.dependencyId || undefined,
        conceptId: noveltyForm.conceptId,
        noveltyDate: noveltyForm.noveltyDate,
        quantity: Number(noveltyForm.quantity) || 1,
        unitValue: Number(noveltyForm.unitValue) || 0,
        totalValue: Number(noveltyForm.totalValue) || 0,
        origin: NoveltyOriginType.MANUAL,
        notes: noveltyForm.notes || undefined,
      });
      setFeedback({ type: "success", message: "Novedad variable del periodo guardada." });
      setNoveltyDrawerOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error al crear novedad variable." });
    } finally {
      setSaving(false);
    }
  };

  const getClaimStatusChip = (status: EpsClaimStatus) => {
    switch (status) {
      case EpsClaimStatus.PENDING_FILING:
        return <Chip label="Por Radicar" size="small" sx={{ bgcolor: "#FFFBEB", color: "#D97706", fontWeight: 700 }} />;
      case EpsClaimStatus.FILED_IN_AUDIT:
        return <Chip label="Radicado / Auditoría" size="small" sx={{ bgcolor: "#EEF2FF", color: "#4F46E5", fontWeight: 700 }} />;
      case EpsClaimStatus.APPROVED_PENDING_PAYMENT:
        return <Chip label="Aprobado EPS" size="small" sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 700 }} />;
      case EpsClaimStatus.PAID_RECOVERED:
        return <Chip label="Recobrado / Pagado" size="small" sx={{ bgcolor: "#ECFDF5", color: "#059669", fontWeight: 700 }} />;
      case EpsClaimStatus.REJECTED:
        return <Chip label="Objetado / Rechazado" size="small" sx={{ bgcolor: "#FFF1F2", color: "#E11D48", fontWeight: 700 }} />;
      default:
        return <Chip label="No Aplica" size="small" sx={{ bgcolor: "#F1F5F9", color: "#64748B" }} />;
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    const matchEmp =
      !searchTerm ||
      `${l.employee?.firstName} ${l.employee?.lastName} ${l.employee?.document}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      l.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = leaveFilterType === "ALL" || l.leaveType === leaveFilterType;
    const matchStatus = claimFilterStatus === "ALL" || l.claimStatus === claimFilterStatus;
    return matchEmp && matchType && matchStatus;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: noxiaPalette.background.default, minHeight: "100vh" }}>
      {/* Breadcrumb Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link href="/finance/payroll/settings" color="inherit" underline="hover">
            Dirección Financiera
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            Novedades e Incapacidades
          </Typography>
        </Breadcrumbs>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, letterSpacing: "-0.5px" }}>
              Consola de Novedades, Incapacidades y Libranzas
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Gestión CIE-10 con liquidación automática (Días 1-2 empresa vs EPS/ARL), cartera de recobro y préstamos.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              onClick={loadData}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Actualizar
            </Button>
            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={() => setLeaveDrawerOpen(true)}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: noxiaPalette.primary.main }}
              >
                Nueva Incapacidad / Licencia
              </Button>
            )}
            {activeTab === 1 && (
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={() => setLoanDrawerOpen(true)}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: noxiaPalette.primary.main }}
              >
                Nuevo Préstamo / Libranza
              </Button>
            )}
            {activeTab === 2 && (
              <Button
                variant="contained"
                startIcon={<AddOutlined />}
                onClick={() => setPermDrawerOpen(true)}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: noxiaPalette.primary.main }}
              >
                Nuevo Concepto Fijo
              </Button>
            )}
            {activeTab === 3 && (
              <Button
                variant="contained"
                startIcon={<PostAddOutlined />}
                onClick={() => setNoveltyDrawerOpen(true)}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, bgcolor: noxiaPalette.primary.main }}
              >
                Registrar Novedad Variable
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

      {/* Metric Cards Banner */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#FEF3C7", color: "#D97706" }}>
              <LocalHospitalOutlined fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                Incapacidades Activas
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
                {kpis?.activeLeavesCount || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#F5F3FF", color: noxiaPalette.primary.main }}>
              <AccountBalanceWalletOutlined fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                Cartera EPS/ARL por Cobrar
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.primary.main }}>
                ${(kpis?.totalPendingClaimAmount || 0).toLocaleString("es-CO")}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#ECFDF5", color: "#059669" }}>
              <MonetizationOnOutlined fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                Saldo Préstamos Activos
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#059669" }}>
                ${(kpis?.totalLoansOutstandingBalance || 0).toLocaleString("es-CO")}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#EEF2FF", color: "#4F46E5" }}>
              <AssignmentOutlined fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                Novedades del Periodo
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#4F46E5" }}>
                ${(kpis?.totalPeriodNoveltiesAmount || 0).toLocaleString("es-CO")}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Menu */}
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
          <Tab icon={<LocalHospitalOutlined />} iconPosition="start" label="1. Incapacidades CIE-10 y Recobro EPS" />
          <Tab icon={<MonetizationOnOutlined />} iconPosition="start" label="2. Préstamos y Libranzas" />
          <Tab icon={<AssignmentOutlined />} iconPosition="start" label="3. Conceptos Fijos por Puesto/Guarda" />
          <Tab icon={<PostAddOutlined />} iconPosition="start" label="4. Novedades Variables e Importador" />
        </Tabs>

        {/* TAB 0: INCAPACIDADES CIE-10 & RECOBRO */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Filters */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
              <TextField
                size="small"
                placeholder="Buscar por empleado, documento o certificado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 260 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                label="Tipo de Novedad"
                value={leaveFilterType}
                onChange={(e) => setLeaveFilterType(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="ALL">Todos los Tipos</MenuItem>
                <MenuItem value={LeaveAndAbsenceType.SICK_LEAVE_EG}>Enfermedad General (EG)</MenuItem>
                <MenuItem value={LeaveAndAbsenceType.WORK_ACCIDENT_AT}>Accidente de Trabajo (AT)</MenuItem>
                <MenuItem value={LeaveAndAbsenceType.MATERNITY_PATERNITY_LMA}>Licencia Maternidad (LMA)</MenuItem>
                <MenuItem value={LeaveAndAbsenceType.PAID_LEAVE_LR}>Licencia Remunerada (LR)</MenuItem>
                <MenuItem value={LeaveAndAbsenceType.UNPAID_LEAVE_LNR}>Licencia No Remunerada (LNR)</MenuItem>
                <MenuItem value={LeaveAndAbsenceType.DISCIPLINARY_SUSPENSION_SAN}>Sanción Disciplinaria (SAN)</MenuItem>
                <MenuItem value={LeaveAndAbsenceType.UNJUSTIFIED_ABSENCE_AUS}>Ausencia Injustificada (AUS 504)</MenuItem>
                <MenuItem value={LeaveAndAbsenceType.VACATION_TIME_VAC}>Vacaciones (VAC)</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Estado Recobro EPS"
                value={claimFilterStatus}
                onChange={(e) => setClaimFilterStatus(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="ALL">Todos los Estados</MenuItem>
                <MenuItem value={EpsClaimStatus.PENDING_FILING}>Por Radicar</MenuItem>
                <MenuItem value={EpsClaimStatus.FILED_IN_AUDIT}>Radicado en Auditoría</MenuItem>
                <MenuItem value={EpsClaimStatus.APPROVED_PENDING_PAYMENT}>Aprobado por EPS</MenuItem>
                <MenuItem value={EpsClaimStatus.PAID_RECOVERED}>Recobrado / Pagado</MenuItem>
                <MenuItem value={EpsClaimStatus.REJECTED}>Rechazado</MenuItem>
              </TextField>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>EMPLEADO</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>TIPO NOVEDAD</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>DIAGNÓSTICO CIE-10</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>VIGENCIA (FECHAS)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>DÍAS (EMP / EPS)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>VALOR TOTAL</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ESTADO RECOBRO</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ACCIONES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : filteredLeaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No se encontraron registros de novedades de tiempo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaves.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: noxiaPalette.secondary.main }}>
                            {row.employee?.firstName} {row.employee?.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                            CC {row.employee?.document}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.leaveType.replace(/_/g, " ")}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "#F5F3FF", color: noxiaPalette.primary.main }}
                          />
                          {row.certificateNumber && (
                            <Typography variant="caption" display="block" sx={{ color: "text.secondary" }}>
                              Cert: {row.certificateNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.cie10 ? (
                            <Tooltip title={row.cie10.name}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                <span style={{ fontFamily: "monospace", color: "#7C3AED" }}>[{row.cie10.code}]</span> {row.cie10.name.substring(0, 30)}...
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" sx={{ color: "text.disabled" }}>N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            {new Date(row.startDate).toISOString().split("T")[0]} al {new Date(row.endDate).toISOString().split("T")[0]}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {row.totalDays} {row.totalDays === 1 ? "día" : "días"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${row.employerDays}d emp / ${row.entityDays}d eps`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                            ${Number(row.totalLiquidatedAmount).toLocaleString("es-CO")}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            IBC: ${Number(row.ibcDailyValue).toLocaleString("es-CO")}/d
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {getClaimStatusChip(row.claimStatus)}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                            {row.entityDays > 0 && (
                              <Tooltip title="Gestionar recobro ante EPS / ARL">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedLeaveForClaim(row);
                                    setClaimForm({
                                      claimStatus: row.claimStatus,
                                      certificateNumber: row.certificateNumber || "",
                                      filingDate: row.filingDate ? row.filingDate.split("T")[0] : "",
                                      paymentDate: row.paymentDate ? row.paymentDate.split("T")[0] : "",
                                      reimbursedAmount: Number(row.reimbursedAmount) || 0,
                                      rejectionReason: "",
                                    });
                                    setClaimDrawerOpen(true);
                                  }}
                                  sx={{ color: noxiaPalette.primary.main }}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Eliminar novedad y liberar malla">
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  if (confirm("¿Estás seguro de eliminar esta incapacidad? Se liberarán los días en la malla.")) {
                                    await payrollNoveltiesApi.deleteLeave(row.id);
                                    loadData();
                                  }
                                }}
                                sx={{ color: "#EF4444" }}
                              >
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 1: PRÉSTAMOS Y LIBRANZAS */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>EMPLEADO</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>CONCEPTO / CÓDIGO</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>MONTO PRESTADO</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>VALOR CUOTA</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>PROGRESO CUOTAS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>SALDO PENDIENTE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ESTADO</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ACCIONES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : loans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No hay préstamos o libranzas activos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    loans.map((loan) => (
                      <TableRow key={loan.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {loan.employee?.firstName} {loan.employee?.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                            CC {loan.employee?.document}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {loan.concept?.name || "Préstamo"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                            {loan.loanCode}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            ${Number(loan.principalAmount).toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#D97706" }}>
                            ${Number(loan.installmentAmount).toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${loan.paidInstallments} / ${loan.totalInstallments} cuotas`}
                            size="small"
                            sx={{ fontWeight: 600, bgcolor: "#EEF2FF", color: "#4F46E5" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: Number(loan.remainingBalance) > 0 ? "#E11D48" : "#059669" }}>
                            ${Number(loan.remainingBalance).toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={loan.status}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor:
                                loan.status === PayrollLoanStatus.ACTIVE
                                  ? "#ECFDF5"
                                  : loan.status === PayrollLoanStatus.PAID_OFF
                                  ? "#F1F5F9"
                                  : "#FFFBEB",
                              color:
                                loan.status === PayrollLoanStatus.ACTIVE
                                  ? "#059669"
                                  : loan.status === PayrollLoanStatus.PAID_OFF
                                  ? "#64748B"
                                  : "#D97706",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                            {loan.status === PayrollLoanStatus.ACTIVE && (
                              <>
                                <Tooltip title="Abonar cuota manualmente">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedLoanForInstallment(loan);
                                      setInstallmentForm({
                                        amount: Number(loan.installmentAmount),
                                        notes: "Abono directo de cuota",
                                      });
                                      setInstallmentDrawerOpen(true);
                                    }}
                                    sx={{ color: "#059669" }}
                                  >
                                    <MonetizationOnOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Pausar descuento">
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      await payrollNoveltiesApi.updateLoanStatus(loan.id, {
                                        status: PayrollLoanStatus.PAUSED,
                                      });
                                      loadData();
                                    }}
                                    sx={{ color: "#D97706" }}
                                  >
                                    <PauseOutlined fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {loan.status === PayrollLoanStatus.PAUSED && (
                              <Tooltip title="Reanudar descuento">
                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    await payrollNoveltiesApi.updateLoanStatus(loan.id, {
                                      status: PayrollLoanStatus.ACTIVE,
                                    });
                                    loadData();
                                  }}
                                  sx={{ color: "#059669" }}
                                >
                                  <PlayArrowOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 2: CONCEPTOS FIJOS / PERMANENTES */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>ALCANCE</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>DESTINATARIO (EMPLEADO / PUESTO)</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>CONCEPTO CONTABLE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>VALOR MENSUAL</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>PROPORCIONAL DÍAS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>REGLA PERIODICIDAD</TableCell>
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
                  ) : permanentConcepts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No hay conceptos fijos o permanentes configurados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    permanentConcepts.map((perm) => (
                      <TableRow key={perm.id} hover>
                        <TableCell>
                          <Chip
                            label={perm.scope === PermanentConceptScope.BY_EMPLOYEE ? "Por Empleado" : "Por Dependencia"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: perm.scope === PermanentConceptScope.BY_EMPLOYEE ? "#F5F3FF" : "#ECFDF5",
                              color: perm.scope === PermanentConceptScope.BY_EMPLOYEE ? "#7C3AED" : "#059669",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {perm.scope === PermanentConceptScope.BY_EMPLOYEE ? (
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {perm.employee?.firstName} {perm.employee?.lastName} (CC {perm.employee?.document})
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {perm.dependency?.name} [Cód. {perm.dependency?.code}]
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {perm.concept?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {perm.concept?.nature}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                            ${Number(perm.amount).toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {perm.isProportionalToDays ? (
                            <Chip label="Sí (Días / 30)" size="small" sx={{ bgcolor: "#ECFDF5", color: "#059669" }} />
                          ) : (
                            <Chip label="Fijo Íntegro" size="small" sx={{ bgcolor: "#F1F5F9", color: "#64748B" }} />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {perm.applicationRule}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Inactivar concepto permanente">
                            <IconButton
                              size="small"
                              onClick={async () => {
                                if (confirm("¿Inactivar este concepto permanente?")) {
                                  await payrollNoveltiesApi.deletePermanentConcept(perm.id);
                                  loadData();
                                }
                              }}
                              sx={{ color: "#EF4444" }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
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

        {/* TAB 3: NOVEDADES VARIABLES */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>EMPLEADO</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>CONCEPTO</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>FECHA NOVEDAD</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>CANTIDAD</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>VALOR UNITARIO</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>TOTAL LIQUIDADO</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ORIGEN</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: "#475569" }}>ACCIONES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : periodNovelties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No hay novedades variables registradas en este periodo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    periodNovelties.map((nov) => (
                      <TableRow key={nov.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {nov.employee?.firstName} {nov.employee?.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                            CC {nov.employee?.document}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {nov.concept?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {nov.dependency?.name || "Sin puesto específico"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            {new Date(nov.noveltyDate).toISOString().split("T")[0]}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${nov.quantity} h/d`} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${Number(nov.unitValue).toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: noxiaPalette.primary.main }}>
                            ${Number(nov.totalValue).toLocaleString("es-CO")}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={nov.origin}
                            size="small"
                            sx={{
                              bgcolor: nov.origin === NoveltyOriginType.MANUAL ? "#EEF2FF" : "#ECFDF5",
                              color: nov.origin === NoveltyOriginType.MANUAL ? "#4F46E5" : "#059669",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Eliminar novedad variable">
                            <IconButton
                              size="small"
                              onClick={async () => {
                                if (confirm("¿Eliminar esta novedad del periodo?")) {
                                  await payrollNoveltiesApi.deletePeriodNovelty(nov.id);
                                  loadData();
                                }
                              }}
                              sx={{ color: "#EF4444" }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
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
      </Card>

      {/* DRAWER: NUEVA INCAPACIDAD / LICENCIA */}
      <ResponsiveFormDrawer
        open={leaveDrawerOpen}
        onClose={() => setLeaveDrawerOpen(false)}
        title="Registrar Incapacidad o Novedad de Tiempo"
        subtitle="Cálculo matemático en tiempo real con desglose Ley colombiana (Días 1-2 empresa vs EPS/ARL)"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setLeaveDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveLeave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Guardando..." : "Guardar Incapacidad"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Empleado *"
              value={leaveForm.employeeId}
              onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
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
              select
              fullWidth
              label="Tipo de Novedad *"
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveAndAbsenceType })}
            >
              <MenuItem value={LeaveAndAbsenceType.SICK_LEAVE_EG}>Enfermedad General (EG)</MenuItem>
              <MenuItem value={LeaveAndAbsenceType.WORK_ACCIDENT_AT}>Accidente de Trabajo (AT)</MenuItem>
              <MenuItem value={LeaveAndAbsenceType.MATERNITY_PATERNITY_LMA}>Licencia Maternidad / Paternidad (LMA)</MenuItem>
              <MenuItem value={LeaveAndAbsenceType.PAID_LEAVE_LR}>Licencia Remunerada (LR)</MenuItem>
              <MenuItem value={LeaveAndAbsenceType.UNPAID_LEAVE_LNR}>Licencia No Remunerada (LNR)</MenuItem>
              <MenuItem value={LeaveAndAbsenceType.DISCIPLINARY_SUSPENSION_SAN}>Sanción Disciplinaria (SAN)</MenuItem>
              <MenuItem value={LeaveAndAbsenceType.UNJUSTIFIED_ABSENCE_AUS}>Ausencia Injustificada (AUS 504)</MenuItem>
              <MenuItem value={LeaveAndAbsenceType.VACATION_TIME_VAC}>Vacaciones (VAC)</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Diagnóstico Médico CIE-10"
              value={leaveForm.cie10Id}
              onChange={(e) => setLeaveForm({ ...leaveForm, cie10Id: e.target.value })}
              helperText="Requerido para EG, AT y LMA"
            >
              <MenuItem value="">-- Ninguno / No Aplica --</MenuItem>
              {cie10List.map((cie) => (
                <MenuItem key={cie.id} value={cie.id}>
                  [{cie.code}] {cie.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha Inicio *"
              type="date"
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha Fin *"
              type="date"
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nro. Certificado / Radicado Médico"
              value={leaveForm.certificateNumber}
              onChange={(e) => setLeaveForm({ ...leaveForm, certificateNumber: e.target.value })}
              placeholder="Ej: INC-98234-EPS"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={leaveForm.isExtension}
                  onChange={(e) => setLeaveForm({ ...leaveForm, isExtension: e.target.checked })}
                  color="primary"
                />
              }
              label="¿Es Prórroga de Incapacidad?"
            />
          </Grid>

          {leaveForm.isExtension && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Días Acumulados Previos"
                type="number"
                value={leaveForm.accumulatedPriorDays}
                onChange={(e) => setLeaveForm({ ...leaveForm, accumulatedPriorDays: Number(e.target.value) })}
                helperText="Si suma más de 2 días, la empresa no paga días 1-2"
              />
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Observaciones"
              value={leaveForm.notes}
              onChange={(e) => setLeaveForm({ ...leaveForm, notes: e.target.value })}
            />
          </Grid>

          {/* SIMULATION PREVIEW BOX */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 2, bgcolor: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <CalculateOutlined sx={{ color: noxiaPalette.primary.main }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: noxiaPalette.primary.main }}>
                  Pre-liquidación Automática
                </Typography>
                {previewLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Box>

              {previewResult ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Días Totales</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800 }}>{previewResult.totalDays} días</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>A Cargo Empresa</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                      {previewResult.employerDays}d (${previewResult.employerRecognizedAmount.toLocaleString("es-CO")})
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>A Cargo EPS / ARL</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: "#059669" }}>
                      {previewResult.entityDays}d (${previewResult.entityRecognizedAmount.toLocaleString("es-CO")})
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>Total Liquidado</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: noxiaPalette.primary.main }}>
                      ${previewResult.totalLiquidatedAmount.toLocaleString("es-CO")}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Selecciona fechas válidas para ver el desglose en tiempo real.
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>

      {/* DRAWER: GESTIONAR RECOBRO EPS / ARL */}
      <ResponsiveFormDrawer
        open={claimDrawerOpen}
        onClose={() => setClaimDrawerOpen(false)}
        title="Gestión de Cartera y Recobro EPS / ARL"
        subtitle="Radicación de certificado y seguimiento al desembolso de la entidad"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setClaimDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveClaim}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Guardando..." : "Actualizar Recobro"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Estado del Recobro *"
              value={claimForm.claimStatus}
              onChange={(e) => setClaimForm({ ...claimForm, claimStatus: e.target.value as EpsClaimStatus })}
            >
              <MenuItem value={EpsClaimStatus.PENDING_FILING}>Pendiente por Radicar</MenuItem>
              <MenuItem value={EpsClaimStatus.FILED_IN_AUDIT}>Radicado en Auditoría Médica EPS</MenuItem>
              <MenuItem value={EpsClaimStatus.APPROVED_PENDING_PAYMENT}>Aprobado por EPS (Pendiente Giro)</MenuItem>
              <MenuItem value={EpsClaimStatus.PAID_RECOVERED}>Pagado / Recobrado Exitosamente</MenuItem>
              <MenuItem value={EpsClaimStatus.REJECTED}>Objetado / Rechazado</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nro. Radicado EPS"
              value={claimForm.certificateNumber}
              onChange={(e) => setClaimForm({ ...claimForm, certificateNumber: e.target.value })}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de Radicación"
              type="date"
              value={claimForm.filingDate}
              onChange={(e) => setClaimForm({ ...claimForm, filingDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de Pago / Giro"
              type="date"
              value={claimForm.paymentDate}
              onChange={(e) => setClaimForm({ ...claimForm, paymentDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Valor Efectivamente Recobrado ($)"
              type="number"
              value={claimForm.reimbursedAmount}
              onChange={(e) => setClaimForm({ ...claimForm, reimbursedAmount: Number(e.target.value) })}
            />
          </Grid>

          {claimForm.claimStatus === EpsClaimStatus.REJECTED && (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Motivo de Objeción / Rechazo"
                value={claimForm.rejectionReason}
                onChange={(e) => setClaimForm({ ...claimForm, rejectionReason: e.target.value })}
              />
            </Grid>
          )}
        </Grid>
      </ResponsiveFormDrawer>

      {/* DRAWER: NUEVO PRÉSTAMO / LIBRANZA */}
      <ResponsiveFormDrawer
        open={loanDrawerOpen}
        onClose={() => setLoanDrawerOpen(false)}
        title="Crear Préstamo o Libranza de Nómina"
        subtitle="Registro de obligaciones con descuento quincenal o mensual programado"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setLoanDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveLoan}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Guardando..." : "Crear Préstamo"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Empleado *"
              value={loanForm.employeeId}
              onChange={(e) => setLoanForm({ ...loanForm, employeeId: e.target.value })}
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
              label="Concepto de Nómina (Deducción) *"
              value={loanForm.conceptId}
              onChange={(e) => setLoanForm({ ...loanForm, conceptId: e.target.value })}
            >
              {concepts
                .filter((c) => c.nature === "DEDUCCION")
                .map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    [{c.code}] {c.name}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Monto Prestado ($) *"
              type="number"
              value={loanForm.principalAmount}
              onChange={(e) => {
                const principal = Number(e.target.value);
                const cuotas = loanForm.totalInstallments || 1;
                setLoanForm({
                  ...loanForm,
                  principalAmount: principal,
                  installmentAmount: Math.round(principal / cuotas),
                });
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Número Total de Cuotas *"
              type="number"
              value={loanForm.totalInstallments}
              onChange={(e) => {
                const cuotas = Number(e.target.value) || 1;
                setLoanForm({
                  ...loanForm,
                  totalInstallments: cuotas,
                  installmentAmount: Math.round(loanForm.principalAmount / cuotas),
                });
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Valor Cuota Fija ($) *"
              type="number"
              value={loanForm.installmentAmount}
              onChange={(e) => setLoanForm({ ...loanForm, installmentAmount: Number(e.target.value) })}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Regla de Descuento"
              value={loanForm.periodicity}
              onChange={(e) => setLoanForm({ ...loanForm, periodicity: e.target.value as NoveltyPeriodicityRule })}
            >
              <MenuItem value={NoveltyPeriodicityRule.ALL_PERIODS}>En Todos los Periodos (Quincenal / Mensual)</MenuItem>
              <MenuItem value={NoveltyPeriodicityRule.FIRST_FORTNIGHT_ONLY}>Sólo 1ra Quincena (Día 15)</MenuItem>
              <MenuItem value={NoveltyPeriodicityRule.SECOND_FORTNIGHT_ONLY}>Sólo 2da Quincena (Día 30)</MenuItem>
              <MenuItem value={NoveltyPeriodicityRule.END_OF_MONTH_ONLY}>Sólo Fin de Mes</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha Primer Descuento"
              type="date"
              value={loanForm.firstDeductionDate}
              onChange={(e) => setLoanForm({ ...loanForm, firstDeductionDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Observaciones / Entidad Acreedora"
              value={loanForm.notes}
              onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>

      {/* DRAWER: ABONAR CUOTA DE PRÉSTAMO */}
      <ResponsiveFormDrawer
        open={installmentDrawerOpen}
        onClose={() => setInstallmentDrawerOpen(false)}
        title="Registrar Abono a Préstamo"
        subtitle={`Empleado: ${selectedLoanForInstallment?.employee?.firstName} ${selectedLoanForInstallment?.employee?.lastName}`}
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setInstallmentDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleRecordInstallment}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Guardando..." : "Registrar Abono"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              Saldo actual: <strong>${Number(selectedLoanForInstallment?.remainingBalance || 0).toLocaleString("es-CO")}</strong>
            </Typography>
            <TextField
              fullWidth
              label="Valor del Abono ($) *"
              type="number"
              value={installmentForm.amount}
              onChange={(e) => setInstallmentForm({ ...installmentForm, amount: Number(e.target.value) })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notas del Abono"
              value={installmentForm.notes}
              onChange={(e) => setInstallmentForm({ ...installmentForm, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>

      {/* DRAWER: CONCEPTO FIJO / PERMANENTE */}
      <ResponsiveFormDrawer
        open={permDrawerOpen}
        onClose={() => setPermDrawerOpen(false)}
        title="Parametrizar Concepto Fijo"
        subtitle="Valores permanentes recurrentes aplicados automáticamente a cada nómina"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setPermDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSavePerm}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Guardando..." : "Guardar Concepto"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Alcance del Concepto *"
              value={permForm.scope}
              onChange={(e) => setPermForm({ ...permForm, scope: e.target.value as PermanentConceptScope })}
            >
              <MenuItem value={PermanentConceptScope.BY_EMPLOYEE}>Por Empleado (Individual)</MenuItem>
              <MenuItem value={PermanentConceptScope.BY_DEPENDENCY}>Por Dependencia / Puesto (Universal a quien lo cubra)</MenuItem>
            </TextField>
          </Grid>

          {permForm.scope === PermanentConceptScope.BY_EMPLOYEE ? (
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Empleado Destinatario *"
                value={permForm.employeeId}
                onChange={(e) => setPermForm({ ...permForm, employeeId: e.target.value })}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} — CC {emp.document}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ) : (
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Puesto o Dependencia *"
                value={permForm.dependencyId}
                onChange={(e) => setPermForm({ ...permForm, dependencyId: e.target.value })}
              >
                {dependencies.map((dep) => (
                  <MenuItem key={dep.id} value={dep.id}>
                    [{dep.code}] {dep.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Concepto Contable *"
              value={permForm.conceptId}
              onChange={(e) => setPermForm({ ...permForm, conceptId: e.target.value })}
            >
              {concepts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  [{c.code}] {c.name} ({c.nature})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Valor Fijo Mensual ($) *"
              type="number"
              value={permForm.amount}
              onChange={(e) => setPermForm({ ...permForm, amount: Number(e.target.value) })}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Regla de Periodicidad"
              value={permForm.applicationRule}
              onChange={(e) => setPermForm({ ...permForm, applicationRule: e.target.value as NoveltyPeriodicityRule })}
            >
              <MenuItem value={NoveltyPeriodicityRule.ALL_PERIODS}>En Todos los Periodos</MenuItem>
              <MenuItem value={NoveltyPeriodicityRule.FIRST_FORTNIGHT_ONLY}>Sólo 1ra Quincena</MenuItem>
              <MenuItem value={NoveltyPeriodicityRule.SECOND_FORTNIGHT_ONLY}>Sólo 2da Quincena</MenuItem>
              <MenuItem value={NoveltyPeriodicityRule.END_OF_MONTH_ONLY}>Fin de Mes</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={permForm.isProportionalToDays}
                  onChange={(e) => setPermForm({ ...permForm, isProportionalToDays: e.target.checked })}
                  color="primary"
                />
              }
              label="Calcular proporcional a los días laborados (Valor / 30 * Días)"
            />
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>

      {/* DRAWER: NOVEDAD VARIABLE DEL PERIODO */}
      <ResponsiveFormDrawer
        open={noveltyDrawerOpen}
        onClose={() => setNoveltyDrawerOpen(false)}
        title="Registrar Novedad Variable"
        subtitle="Horas extras manuales, bonificaciones, descuentos o ajustes por periodo"
        actions={
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="outlined" color="inherit" onClick={() => setNoveltyDrawerOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveNovelty}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: noxiaPalette.primary.main }}
            >
              {saving ? "Guardando..." : "Registrar Novedad"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Periodo de Nómina *"
              value={noveltyForm.periodId}
              onChange={(e) => setNoveltyForm({ ...noveltyForm, periodId: e.target.value })}
            >
              {periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  [{p.code}] {p.label} ({p.startDate.split("T")[0]} al {p.endDate.split("T")[0]})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Empleado *"
              value={noveltyForm.employeeId}
              onChange={(e) => setNoveltyForm({ ...noveltyForm, employeeId: e.target.value })}
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
              label="Concepto *"
              value={noveltyForm.conceptId}
              onChange={(e) => setNoveltyForm({ ...noveltyForm, conceptId: e.target.value })}
            >
              {concepts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  [{c.code}] {c.name} ({c.nature})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de la Novedad *"
              type="date"
              value={noveltyForm.noveltyDate}
              onChange={(e) => setNoveltyForm({ ...noveltyForm, noveltyDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Cantidad (Horas o Días) *"
              type="number"
              value={noveltyForm.quantity}
              onChange={(e) => {
                const qty = Number(e.target.value);
                setNoveltyForm({
                  ...noveltyForm,
                  quantity: qty,
                  totalValue: qty * (noveltyForm.unitValue || 0),
                });
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Valor Unitario ($)"
              type="number"
              value={noveltyForm.unitValue}
              onChange={(e) => {
                const unit = Number(e.target.value);
                setNoveltyForm({
                  ...noveltyForm,
                  unitValue: unit,
                  totalValue: (noveltyForm.quantity || 1) * unit,
                });
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Valor Total a Liquidar ($) *"
              type="number"
              value={noveltyForm.totalValue}
              onChange={(e) => setNoveltyForm({ ...noveltyForm, totalValue: Number(e.target.value) })}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Observaciones"
              value={noveltyForm.notes}
              onChange={(e) => setNoveltyForm({ ...noveltyForm, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </ResponsiveFormDrawer>
    </Box>
  );
}
