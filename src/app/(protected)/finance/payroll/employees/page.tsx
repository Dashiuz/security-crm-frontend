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
  InputAdornment,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  BadgeOutlined,
  SearchOutlined,
  CloudDownloadOutlined,
  VerifiedUserOutlined,
  WarningAmberOutlined,
  AssignmentOutlined,
  PeopleAltOutlined,
  DeleteOutline,
  AddOutlined,
  HistoryEduOutlined,
  SchoolOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  OpenInNewOutlined,
  AccountBalanceOutlined,
  SecurityOutlined,
  ReceiptLongOutlined,
  TrendingUpOutlined,
  PictureAsPdfOutlined,
} from "@mui/icons-material";
import {
  PayrollEmployeesApi,
  PayrollEmployeeListItem,
  PayrollKpisResponse,
  EmployeeDossierResponse,
  EmploymentContractType,
  EmployeeSalaryMode,
  BankAccountType,
  MilitaryCardClass,
  MaritalStatus,
  EducationLevel,
  HousingType,
  FamilyRelationship,
  HiringRequirementStatus,
} from "@/lib/api/payroll-employees";
import {
  PayrollApi,
  PayrollBranch,
  PayrollDependency,
  PayrollEntity,
  PayrollBank,
  PayrollExitReason,
  PayrollSvspLevel,
  PayrollSecurityAcademy,
  ArlRiskClass,
} from "@/lib/api/payroll";
import { payrollBenefitsApi } from "@/lib/api/payroll-benefits";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { noxiaPalette } from "@/theme/noxiaTheme";

export default function PayrollEmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // List & KPI States
  const [employees, setEmployees] = useState<PayrollEmployeeListItem[]>([]);
  const [kpis, setKpis] = useState<PayrollKpisResponse | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDependency, setSelectedDependency] = useState("");
  const [selectedSvspStatus, setSelectedSvspStatus] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ACTIVE" | "RETIRED" | "ALL">("ACTIVE");

  // Catalogs for Dropdowns
  const [branches, setBranches] = useState<PayrollBranch[]>([]);
  const [dependencies, setDependencies] = useState<PayrollDependency[]>([]);
  const [entities, setEntities] = useState<PayrollEntity[]>([]);
  const [banks, setBanks] = useState<PayrollBank[]>([]);
  const [exitReasons, setExitReasons] = useState<PayrollExitReason[]>([]);
  const [svspLevels, setSvspLevels] = useState<PayrollSvspLevel[]>([]);
  const [academies, setAcademies] = useState<PayrollSecurityAcademy[]>([]);

  // Drawer & Dossier States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossier, setDossier] = useState<EmployeeDossierResponse | null>(null);
  const [drawerTab, setDrawerTab] = useState(0);

  // Editable Profile Form inside Drawer
  const [profileForm, setProfileForm] = useState<any>({});

  // Sub-forms inside Drawer
  const [newFamilyMember, setNewFamilyMember] = useState({
    fullName: "",
    relationship: FamilyRelationship.CHILD,
    documentType: "TI",
    document: "",
    birthdate: "",
    isDependentForSubsidy: true,
    isScholar: false,
  });

  const [newSvspCourse, setNewSvspCourse] = useState({
    svspLevelId: "",
    academyId: "",
    nroCode: "",
    certificateNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });

  const [newTraining, setNewTraining] = useState({
    title: "",
    topic: "Atención al Usuario y Control de Accesos",
    instructorName: "",
    trainingDate: new Date().toISOString().split("T")[0],
    durationHours: 2,
    score: 5.0,
    approved: true,
  });

  // Salary Adjustment Dialog State
  const [salaryAdjOpen, setSalaryAdjOpen] = useState(false);
  const [salaryAdjForm, setSalaryAdjForm] = useState({
    salaryMode: EmployeeSalaryMode.CUSTOM_FIXED,
    newSalary: 1750905,
    effectiveDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const handleApplySalaryAdjustment = async () => {
    if (!selectedEmployeeId) return;
    try {
      setDossierLoading(true);
      await PayrollEmployeesApi.applySalaryAdjustment(selectedEmployeeId, {
        salaryMode: salaryAdjForm.salaryMode,
        newSalary: Number(salaryAdjForm.newSalary),
        effectiveDate: salaryAdjForm.effectiveDate,
        reason: salaryAdjForm.reason || "Ajuste o aumento salarial individual",
      });
      setFeedback({ type: "success", message: "Ajuste salarial aplicado y registrado en el historial." });
      setSalaryAdjOpen(false);
      await handleOpenDossier(selectedEmployeeId);
      await loadMainData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al aplicar ajuste salarial" });
    } finally {
      setDossierLoading(false);
    }
  };

  const handleDownloadVacationSlip = async (vacationId: string) => {
    try {
      const blob = await payrollBenefitsApi.downloadVacationSlipPdf(vacationId);
      if (blob instanceof Blob && typeof window !== "undefined") {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `comprobante-vacaciones-${vacationId.substring(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
      setFeedback({ type: "success", message: "Desprendible de vacaciones descargado con éxito." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al descargar desprendible de vacaciones." });
    }
  };

  const handleDownloadFinalSettlementPdf = async (settlementId: string) => {
    try {
      const blob = await payrollBenefitsApi.downloadFinalSettlementPdf(settlementId);
      if (blob instanceof Blob && typeof window !== "undefined") {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `acta-liquidacion-definitiva-${settlementId.substring(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
      setFeedback({ type: "success", message: "Acta de liquidación definitiva y paz y salvo descargada con éxito." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al descargar acta de liquidación definitiva." });
    }
  };

  const handleDownloadPayslip = async (settlementId: string) => {
    if (!selectedEmployeeId) return;
    try {
      await PayrollEmployeesApi.downloadPayslipPdf(selectedEmployeeId, settlementId, false);
      setFeedback({ type: "success", message: "Desprendible de nómina descargado con éxito." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al descargar desprendible de nómina" });
    }
  };

  useEffect(() => {
    loadMainData();
    loadCatalogs();
  }, []);

  const loadMainData = async () => {
    try {
      setLoading(true);
      const isActiveParam = activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE";
      const [empRes, kpiRes] = await Promise.all([
        PayrollEmployeesApi.findEmployees({
          search: searchTerm,
          dependencyId: selectedDependency,
          svspStatus: selectedSvspStatus,
          isActive: isActiveParam,
        }),
        PayrollEmployeesApi.getKpis(),
      ]);

      if (empRes) setEmployees(empRes);
      if (kpiRes) setKpis(kpiRes);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al cargar nómina de empleados" });
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      const [brRes, depRes, entRes, bnkRes, exitRes, lvlRes, acadRes] = await Promise.all([
        PayrollApi.listBranches(),
        PayrollApi.listDependencies(),
        PayrollApi.listEntities(),
        PayrollApi.listBanks(),
        PayrollApi.listExitReasons(),
        PayrollApi.listSvspLevels(),
        PayrollApi.listAcademies(),
      ]);
      if (brRes) setBranches(brRes);
      if (depRes) setDependencies(depRes);
      if (entRes) setEntities(entRes);
      if (bnkRes) setBanks(bnkRes);
      if (exitRes) setExitReasons(exitRes);
      if (lvlRes) setSvspLevels(lvlRes);
      if (acadRes) setAcademies(acadRes);
    } catch (err: any) {
      console.error("Error loading catalogs:", err);
    }
  };

  const handleOpenDossier = async (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setDrawerOpen(true);
    setDrawerTab(0);
    setDossierLoading(true);

    try {
      const data = await PayrollEmployeesApi.getEmployeeDossier(employeeId);
      setDossier(data);
      const prof = data.payrollProfile || {};
      setProfileForm({
        branchId: prof.branchId || "",
        primaryDependencyId: prof.primaryDependencyId || "",
        contractType: prof.contractType || EmploymentContractType.FIXED_TERM,
        contractNumber: prof.contractNumber || "",
        contractEndDate: prof.contractEndDate ? prof.contractEndDate.split("T")[0] : "",
        salaryMode: prof.salaryMode || EmployeeSalaryMode.BY_DEPENDENCY,
        customBaseSalary: prof.customBaseSalary ? Number(prof.customBaseSalary) : 1750905,
        hasTransportAllowance: prof.hasTransportAllowance ?? true,
        customAdvanceValue: prof.customAdvanceValue ? Number(prof.customAdvanceValue) : 0,
        isIntegralSalary: prof.isIntegralSalary ?? false,
        pilaContributorType: prof.pilaContributorType || "01",
        pilaContributorSubtype: prof.pilaContributorSubtype || "00",
        isPensioner: prof.isPensioner ?? false,
        arlRiskClass: prof.arlRiskClass || ArlRiskClass.RISK_IV,
        epsEntityId: prof.epsEntityId || "",
        afpEntityId: prof.afpEntityId || "",
        cesantiasEntityId: prof.cesantiasEntityId || "",
        ccfEntityId: prof.ccfEntityId || "",
        bankId: prof.bankId || "",
        bankAccountType: prof.bankAccountType || BankAccountType.SAVINGS,
        bankAccountNumber: prof.bankAccountNumber || "",
        daneCityCode: prof.daneCityCode || "11001",
        daneCityName: prof.daneCityName || "BOGOTÁ D.C.",
        neighborhood: prof.neighborhood || "",
        stratum: prof.stratum || 2,
        maritalStatus: prof.maritalStatus || MaritalStatus.SINGLE,
        bloodType: prof.bloodType || "O+",
        educationLevel: prof.educationLevel || EducationLevel.HIGH_SCHOOL,
        housingType: prof.housingType || HousingType.RENTED,
        transportMeans: prof.transportMeans || "Transporte Público",
        militaryCardNumber: prof.militaryCardNumber || "",
        militaryCardClass: prof.militaryCardClass || MilitaryCardClass.NOT_APPLICABLE,
        militaryDistrict: prof.militaryDistrict || "",
        shirtSize: prof.shirtSize || "M",
        pantsSize: prof.pantsSize || "32",
        footwearSize: prof.footwearSize || "40",
        exitReasonId: prof.exitReasonId || "",
        exitNotes: prof.exitNotes || "",
        isBlockedForRehire: prof.isBlockedForRehire ?? false,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: "Error al cargar expediente 360°" });
    } finally {
      setDossierLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedEmployeeId) return;
    try {
      setSaving(true);
      await PayrollEmployeesApi.upsertPayrollProfile(selectedEmployeeId, profileForm);
      setFeedback({ type: "success", message: "Expediente de nómina actualizado correctamente" });
      loadMainData();
      handleOpenDossier(selectedEmployeeId);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al guardar perfil de nómina" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFamilyMember = async () => {
    if (!selectedEmployeeId || !newFamilyMember.fullName) return;
    try {
      setSaving(true);
      await PayrollEmployeesApi.addFamilyMember(selectedEmployeeId, newFamilyMember);
      setNewFamilyMember({
        fullName: "",
        relationship: FamilyRelationship.CHILD,
        documentType: "TI",
        document: "",
        birthdate: "",
        isDependentForSubsidy: true,
        isScholar: false,
      });
      handleOpenDossier(selectedEmployeeId);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al agregar beneficiario" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFamilyMember = async (id: string) => {
    try {
      setSaving(true);
      await PayrollEmployeesApi.deleteFamilyMember(id);
      if (selectedEmployeeId) handleOpenDossier(selectedEmployeeId);
    } catch (err: any) {
      setFeedback({ type: "error", message: "Error al eliminar beneficiario" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRequirement = async (requirementId: string, status: HiringRequirementStatus, expiryDate?: string) => {
    if (!selectedEmployeeId) return;
    try {
      await PayrollEmployeesApi.updateRequirementCheck(selectedEmployeeId, requirementId, {
        status,
        expiryDate: expiryDate || undefined,
      });
      handleOpenDossier(selectedEmployeeId);
      loadMainData();
    } catch (err: any) {
      setFeedback({ type: "error", message: "Error al actualizar requisito de contratación" });
    }
  };

  const handleAddSvspCourse = async () => {
    if (!selectedEmployeeId || !newSvspCourse.svspLevelId || !newSvspCourse.academyId || !newSvspCourse.nroCode) {
      setFeedback({ type: "error", message: "Complete nivel, academia, NRO y fecha de grado" });
      return;
    }
    try {
      setSaving(true);
      await PayrollEmployeesApi.addSvspCourse(selectedEmployeeId, newSvspCourse);
      setNewSvspCourse({
        svspLevelId: "",
        academyId: "",
        nroCode: "",
        certificateNumber: "",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
      });
      handleOpenDossier(selectedEmployeeId);
      loadMainData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al registrar curso SVSP" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSvspCourse = async (id: string) => {
    try {
      setSaving(true);
      await PayrollEmployeesApi.deleteSvspCourse(id);
      if (selectedEmployeeId) {
        handleOpenDossier(selectedEmployeeId);
        loadMainData();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Error al eliminar curso SVSP" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTraining = async () => {
    if (!selectedEmployeeId || !newTraining.title || !newTraining.instructorName) {
      setFeedback({ type: "error", message: "Complete título e instructor de la capacitación" });
      return;
    }
    try {
      setSaving(true);
      await PayrollEmployeesApi.addInternalTraining(selectedEmployeeId, newTraining);
      setNewTraining({
        title: "",
        topic: "Atención al Usuario y Control de Accesos",
        instructorName: "",
        trainingDate: new Date().toISOString().split("T")[0],
        durationHours: 2,
        score: 5.0,
        approved: true,
      });
      handleOpenDossier(selectedEmployeeId);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al registrar capacitación" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTraining = async (id: string) => {
    try {
      setSaving(true);
      await PayrollEmployeesApi.deleteInternalTraining(id);
      if (selectedEmployeeId) handleOpenDossier(selectedEmployeeId);
    } catch (err: any) {
      setFeedback({ type: "error", message: "Error al eliminar capacitación" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadRenova = async () => {
    try {
      setExporting(true);
      await PayrollEmployeesApi.downloadRenovaExcel();
      setFeedback({ type: "success", message: "Informe oficial RENOVA descargado con éxito" });
    } catch (err: any) {
      setFeedback({ type: "error", message: "Error al descargar informe RENOVA" });
    } finally {
      setExporting(false);
    }
  };

  const renderSvspStatusBadge = (status: string, days: number | null) => {
    if (status === "VALID") {
      return (
        <Chip
          label={`VIGENTE (${days}d)`}
          size="small"
          sx={{
            bgcolor: "#DCFCE7",
            color: "#166534",
            fontWeight: 700,
            fontSize: "0.68rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      );
    }
    if (status === "EXPIRING_SOON") {
      return (
        <Chip
          label={`POR VENCER (${days}d)`}
          size="small"
          sx={{
            bgcolor: "#FEF3C7",
            color: "#B45309",
            fontWeight: 700,
            fontSize: "0.68rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      );
    }
    if (status === "EXPIRED") {
      return (
        <Chip
          label={`VENCIDO (${Math.abs(days || 0)}d)`}
          size="small"
          sx={{
            bgcolor: "#FEE2E2",
            color: "#991B1B",
            fontWeight: 700,
            fontSize: "0.68rem",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      );
    }
    return (
      <Chip
        label="SIN CURSO"
        size="small"
        sx={{
          bgcolor: "#F1F5F9",
          color: "#475569",
          fontWeight: 700,
          fontSize: "0.68rem",
        }}
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#F8FAFC", minHeight: "100vh" }}>
      {/* 1. Breadcrumb & Executive Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ fontSize: "0.8rem", mb: 1, color: "#64748B" }}>
          <Link underline="hover" color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link underline="hover" color="inherit" href="/finance">
            Dirección Financiera
          </Link>
          <Typography color="text.primary" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
            Expediente Laboral y SVSP
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "10px",
                bgcolor: "#EDE9FE",
                color: noxiaPalette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BadgeOutlined fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                Expediente Laboral 360° y Cumplimiento SVSP
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B" }}>
                Hojas de vida de nómina, control documental de contratación, acreditaciones SuperVigilancia (RENOVA) y capacitaciones Cap/SOMA
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={16} /> : <CloudDownloadOutlined />}
              onClick={handleDownloadRenova}
              disabled={exporting}
              sx={{
                textTransform: "none",
                borderColor: "#CBD5E1",
                color: "#0F172A",
                fontWeight: 600,
                bgcolor: "#FFFFFF",
                "&:hover": { bgcolor: "#F1F5F9", borderColor: "#94A3B8" },
              }}
            >
              Exportar Informe RENOVA (.xlsx)
            </Button>
            <Button
              variant="contained"
              href="/administrative/employees"
              startIcon={<PeopleAltOutlined />}
              sx={{
                textTransform: "none",
                bgcolor: noxiaPalette.primary.main,
                color: "#FFFFFF",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { bgcolor: "#6D28D9", boxShadow: "none" },
              }}
            >
              Padrón General RR.HH.
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Feedback banner */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{ mb: 3, borderRadius: "8px", border: "1px solid", borderColor: feedback.type === "success" ? "#BBF7D0" : "#FECACA" }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* 2. KPIs Band */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "8px",
                bgcolor: "#EDE9FE",
                color: noxiaPalette.primary.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PeopleAltOutlined />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                Activos en Nómina
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", fontFamily: "'JetBrains Mono', monospace" }}>
                {kpis ? kpis.totalActiveEmployees : 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "8px",
                bgcolor: "#DCFCE7",
                color: "#166534",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <VerifiedUserOutlined />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                SVSP Vigentes (RENOVA)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#166534", fontFamily: "'JetBrains Mono', monospace" }}>
                {kpis ? kpis.svspValidCount : 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "8px",
                bgcolor: "#FEF3C7",
                color: "#B45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WarningAmberOutlined />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                Alertas Cursos SVSP
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#B45309", fontFamily: "'JetBrains Mono', monospace" }}>
                {kpis ? kpis.svspAlertCount : 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "8px",
                bgcolor: "#E0F2FE",
                color: "#0369A1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HistoryEduOutlined />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                Preavisos CST (&le; 35d)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0369A1", fontFamily: "'JetBrains Mono', monospace" }}>
                {kpis ? kpis.contractsExpiringSoonCount : 0}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Filter Bar */}
      <Card elevation={0} sx={{ p: 2, mb: 3, borderRadius: "10px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por nombre, cédula o código NRO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadMainData()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" sx={{ color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              size="small"
              fullWidth
              label="Puesto / Dependencia"
              value={selectedDependency}
              onChange={(e) => {
                setSelectedDependency(e.target.value);
              }}
            >
              <MenuItem value="">Todos los Puestos</MenuItem>
              {dependencies.map((dep) => (
                <MenuItem key={dep.id} value={dep.id}>
                  {dep.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              size="small"
              fullWidth
              label="Acreditación SVSP"
              value={selectedSvspStatus}
              onChange={(e) => {
                setSelectedSvspStatus(e.target.value);
              }}
            >
              <MenuItem value="">Todos los Estados</MenuItem>
              <MenuItem value="VALID">Vigente (&gt; 30 días)</MenuItem>
              <MenuItem value="EXPIRING_SOON">Por Vencer (&le; 30 días)</MenuItem>
              <MenuItem value="EXPIRED">Vencido</MenuItem>
              <MenuItem value="MISSING">Sin Curso</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 2 }} sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={loadMainData}
              sx={{
                bgcolor: "#0F172A",
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { bgcolor: "#1E293B", boxShadow: "none" },
              }}
            >
              Filtrar
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* 4. Main Employees Table */}
      <Card elevation={0} sx={{ borderRadius: "10px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF", overflow: "hidden" }}>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>EMPLEADO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>PUESTO / DEPENDENCIA</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>CONTRATO &amp; VENCIMIENTO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>SEGURIDAD SOCIAL (PILA)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>ACREDITACIÓN SVSP (RENOVA)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>CARPETA (%)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: noxiaPalette.primary.main }} />
                    <Typography variant="body2" sx={{ mt: 1.5, color: "#64748B" }}>
                      Consultando padrón laboral de nómina...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: "#64748B" }}>
                      No se encontraron empleados registrados con los criterios seleccionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const prof = emp.payrollProfile;
                  const course = emp.currentSvspCourse;

                  return (
                    <TableRow key={emp.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      {/* Empleado */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              bgcolor: "#EDE9FE",
                              color: noxiaPalette.primary.main,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                            }}
                          >
                            {emp.firstName.charAt(0)}
                            {emp.lastName.charAt(0)}
                          </Box>
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                                {emp.fullName}
                              </Typography>
                              {emp.isBlockedForRehire && (
                                <Tooltip title="Bloqueado para recontratación por falta grave (Base de Datos Negativa)">
                                  <Chip label="B.D.N" size="small" color="error" sx={{ height: 18, fontSize: "0.62rem", fontWeight: 800 }} />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#64748B",
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {emp.documentType} {emp.document}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Dependencia / Puesto */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B" }}>
                          {prof?.primaryDependency?.name || "Sin Puesto Asignado"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          Sucursal: {prof?.branch?.name || "Bogotá D.C."}
                        </Typography>
                      </TableCell>

                      {/* Contrato & Vencimiento */}
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#0F172A" }}>
                          {prof?.contractType === EmploymentContractType.INDEFINITE ? "Indefinido" : "Término Fijo"}
                        </Typography>
                        {prof?.contractEndDate ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748B" }}>
                              Vence: {prof.contractEndDate.split("T")[0]}
                            </Typography>
                            {emp.contractAlertStatus === "PREAVISO_REQUIRED" && (
                              <Tooltip title="Contrato próximo a vencer (requiere preaviso 30 días)">
                                <Chip label="PREAVISO" size="small" sx={{ height: 16, fontSize: "0.6rem", bgcolor: "#FEF3C7", color: "#B45309", fontWeight: 700 }} />
                              </Tooltip>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                            Sin fecha fin
                          </Typography>
                        )}
                      </TableCell>

                      {/* Seguridad Social PILA */}
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          <Chip label={`EPS: ${prof?.epsEntity?.code || "Pendiente"}`} size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: "#F1F5F9" }} />
                          <Chip label={`AFP: ${prof?.afpEntity?.code || "Pendiente"}`} size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: "#F1F5F9" }} />
                          <Chip label={`ARL: ${prof?.arlRiskClass ? prof.arlRiskClass.replace("RISK_", "") : "IV"}`} size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: "#EDE9FE", color: noxiaPalette.primary.main, fontWeight: 700 }} />
                        </Box>
                      </TableCell>

                      {/* Acreditación SVSP */}
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                          {renderSvspStatusBadge(emp.svspStatus, emp.svspDaysRemaining)}
                          {course && (
                            <Typography variant="caption" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "#64748B", fontSize: "0.68rem" }}>
                              {course.svspLevel?.name || "Curso"} &bull; {course.nroCode}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Carpeta Requisitos */}
                      <TableCell sx={{ minWidth: 110 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={emp.folderCompletionPct}
                            sx={{
                              flexGrow: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "#F1F5F9",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: emp.folderCompletionPct === 100 ? "#059669" : emp.folderCompletionPct >= 50 ? "#D97706" : "#DC2626",
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#0F172A" }}>
                            {emp.folderCompletionPct}%
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDossier(emp.id)}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: noxiaPalette.primary.main,
                            borderColor: "#DDD6FE",
                            "&:hover": { bgcolor: "#EDE9FE", borderColor: noxiaPalette.primary.main },
                          }}
                        >
                          Expediente 360°
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* 5. Responsive Form Drawer: Expediente 360° */}
      <ResponsiveFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={dossier ? `Expediente 360° — ${dossier.employee.fullName}` : "Expediente de Personal"}
        subtitle="Ficha laboral, contractual, bancaria, requisitos documentales, cursos SVSP y capacitaciones"
        width={{ xs: "100%", md: 860, lg: 960 }}
        actions={
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, width: "100%" }}>
            <Button variant="outlined" onClick={() => setDrawerOpen(false)} sx={{ textTransform: "none", color: "#64748B", borderColor: "#CBD5E1" }}>
              Cerrar
            </Button>
            {drawerTab === 0 && (
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} sx={{ color: "#FFF" }} /> : <SaveOutlined />}
                onClick={handleSaveProfile}
                disabled={saving}
                sx={{
                  bgcolor: noxiaPalette.primary.main,
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#6D28D9" },
                }}
              >
                Guardar Ficha Laboral
              </Button>
            )}
          </Box>
        }
      >
        {dossierLoading || !dossier ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={32} sx={{ color: noxiaPalette.primary.main }} />
          </Box>
        ) : (
          <Box>
            {/* Header del Expediente */}
            <Card elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: "8px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                    {dossier.employee.fullName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748B", fontFamily: "'JetBrains Mono', monospace" }}>
                    {dossier.employee.documentType} {dossier.employee.document} &bull; Cargo: {dossier.employee.positionName || "Guarda"} &bull; Ingreso: {dossier.employee.entryDate || "N/A"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  {renderSvspStatusBadge(dossier.svspStatus, dossier.svspDaysRemaining)}
                  <Chip label={`Carpeta: ${dossier.folderCompletionPct}%`} size="small" sx={{ bgcolor: "#EDE9FE", color: noxiaPalette.primary.main, fontWeight: 700 }} />
                </Grid>
              </Grid>
            </Card>

            {/* Pestañas del Expediente 360° */}
            <Tabs
              value={drawerTab}
              onChange={(_, val) => setDrawerTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 2.5,
                borderBottom: "1px solid #E2E8F0",
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.82rem" },
                "& .Mui-selected": { color: noxiaPalette.primary.main },
                "& .MuiTabs-indicator": { bgcolor: noxiaPalette.primary.main },
              }}
            >
              <Tab label="1. Contrato, Puesto y Salario" icon={<HistoryEduOutlined />} iconPosition="start" />
              <Tab label="2. DANE, Libreta y Familia" icon={<PeopleAltOutlined />} iconPosition="start" />
              <Tab label="3. Requisitos de Ingreso (1..10)" icon={<AssignmentOutlined />} iconPosition="start" />
              <Tab label="4. Cursos SVSP y RENOVA" icon={<SecurityOutlined />} iconPosition="start" />
              <Tab label="5. Capacitaciones Cap/SOMA" icon={<SchoolOutlined />} iconPosition="start" />
              <Tab label="6. Desprendibles e Historial Salarial" icon={<ReceiptLongOutlined />} iconPosition="start" />
            </Tabs>

            {/* TAB 0: Contrato, Puesto, Salario, ACH y PILA */}
            {drawerTab === 0 && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Asignación Operativa y Contractual
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Sucursal de Nómina"
                      value={profileForm.branchId || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, branchId: e.target.value })}
                    >
                      <MenuItem value="">Seleccione Sucursal</MenuItem>
                      {branches.map((b) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Puesto / Dependencia Principal"
                      value={profileForm.primaryDependencyId || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, primaryDependencyId: e.target.value })}
                    >
                      <MenuItem value="">Seleccione Dependencia</MenuItem>
                      {dependencies.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Tipo de Contrato"
                      value={profileForm.contractType || EmploymentContractType.FIXED_TERM}
                      onChange={(e) => setProfileForm({ ...profileForm, contractType: e.target.value })}
                    >
                      <MenuItem value={EmploymentContractType.FIXED_TERM}>Término Fijo</MenuItem>
                      <MenuItem value={EmploymentContractType.INDEFINITE}>Término Indefinido</MenuItem>
                      <MenuItem value={EmploymentContractType.WORK_OR_LABOR}>Obra o Labor</MenuItem>
                      <MenuItem value={EmploymentContractType.APPRENTICE_LECTIVE}>Aprendiz Lectiva</MenuItem>
                      <MenuItem value={EmploymentContractType.APPRENTICE_PRODUCTIVE}>Aprendiz Productiva</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Número de Contrato"
                      value={profileForm.contractNumber || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, contractNumber: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      label="Vencimiento Contrato (Preaviso)"
                      value={profileForm.contractEndDate || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, contractEndDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Esquema Salarial y Modo de Liquidación
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Modo Salarial"
                      value={profileForm.salaryMode || EmployeeSalaryMode.BY_DEPENDENCY}
                      onChange={(e) => setProfileForm({ ...profileForm, salaryMode: e.target.value })}
                    >
                      <MenuItem value={EmployeeSalaryMode.BY_DEPENDENCY}>Heredar del Puesto (Sueldo Garantizado / Modalidad)</MenuItem>
                      <MenuItem value={EmployeeSalaryMode.MINIMUM_WAGE}>Salario Mínimo Legal Vigente (SMMLV Automático)</MenuItem>
                      <MenuItem value={EmployeeSalaryMode.CUSTOM_FIXED}>Sueldo Fijo Contractual Personalizado</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        label="Sueldo Básico ($ COP)"
                        value={profileForm.customBaseSalary ?? 1750905}
                        disabled={profileForm.salaryMode === EmployeeSalaryMode.MINIMUM_WAGE}
                        onChange={(e) => setProfileForm({ ...profileForm, customBaseSalary: Number(e.target.value) })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                      <Tooltip title="Registrar aumento salarial con trazabilidad e historial">
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ textTransform: "none", minWidth: 140, fontWeight: 700, borderColor: "#7C3AED", color: "#7C3AED" }}
                          startIcon={<TrendingUpOutlined />}
                          onClick={() => {
                            setSalaryAdjForm({
                              salaryMode: profileForm.salaryMode || EmployeeSalaryMode.CUSTOM_FIXED,
                              newSalary: profileForm.customBaseSalary || 1750905,
                              effectiveDate: new Date().toISOString().split("T")[0],
                              reason: "Aumento por desempeño / nivelación",
                            });
                            setSalaryAdjOpen(true);
                          }}
                        >
                          Ajustar Salario
                        </Button>
                      </Tooltip>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={profileForm.hasTransportAllowance ?? true}
                          onChange={(e) => setProfileForm({ ...profileForm, hasTransportAllowance: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Tiene derecho a Auxilio de Transporte de Ley"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      size="small"
                      fullWidth
                      type="number"
                      label="Anticipo Quincenal Fijo Opcional ($ COP)"
                      value={profileForm.customAdvanceValue ?? 0}
                      onChange={(e) => setProfileForm({ ...profileForm, customAdvanceValue: Number(e.target.value) })}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Afiliaciones a Seguridad Social PILA
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Entidad Promotora de Salud (EPS)"
                      value={profileForm.epsEntityId || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, epsEntityId: e.target.value })}
                    >
                      <MenuItem value="">Seleccione EPS</MenuItem>
                      {entities.filter((e) => e.entityType === "EPS").map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                          {e.name} ({e.nit})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Fondo de Pensión (AFP)"
                      value={profileForm.afpEntityId || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, afpEntityId: e.target.value })}
                    >
                      <MenuItem value="">Seleccione AFP</MenuItem>
                      {entities.filter((e) => e.entityType === "AFP").map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                          {e.name} ({e.nit})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Fondo de Cesantías"
                      value={profileForm.cesantiasEntityId || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, cesantiasEntityId: e.target.value })}
                    >
                      <MenuItem value="">Mismo de Pensión</MenuItem>
                      {entities.filter((e) => e.entityType === "AFP").map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                          {e.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Caja de Compensación (CCF)"
                      value={profileForm.ccfEntityId || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, ccfEntityId: e.target.value })}
                    >
                      <MenuItem value="">Seleccione CCF</MenuItem>
                      {entities.filter((e) => e.entityType === "CCF").map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                          {e.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Nivel Riesgo ARL"
                      value={profileForm.arlRiskClass || ArlRiskClass.RISK_IV}
                      onChange={(e) => setProfileForm({ ...profileForm, arlRiskClass: e.target.value })}
                    >
                      <MenuItem value={ArlRiskClass.RISK_I}>Clase I - 0.522% (Administrativo)</MenuItem>
                      <MenuItem value={ArlRiskClass.RISK_IV}>Clase IV - 4.350% (Vigilancia sin arma)</MenuItem>
                      <MenuItem value={ArlRiskClass.RISK_V}>Clase V - 6.960% (Vigilancia armada / Escoltas)</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Dispersión Bancaria ACH
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Banco de Dispersión"
                      value={profileForm.bankId || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, bankId: e.target.value })}
                    >
                      <MenuItem value="">Seleccione Banco</MenuItem>
                      {banks.map((b) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Tipo de Cuenta"
                      value={profileForm.bankAccountType || BankAccountType.SAVINGS}
                      onChange={(e) => setProfileForm({ ...profileForm, bankAccountType: e.target.value })}
                    >
                      <MenuItem value={BankAccountType.SAVINGS}>Ahorros</MenuItem>
                      <MenuItem value={BankAccountType.CHECKING}>Corriente</MenuItem>
                      <MenuItem value={BankAccountType.ELECTRONIC_DEPOSIT}>Depósito Electrónico (Nequi / Daviplata)</MenuItem>
                      <MenuItem value={BankAccountType.CASH_OR_CHECK}>Efectivo / Ventanilla</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Número de Cuenta"
                      value={profileForm.bankAccountNumber || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, bankAccountNumber: e.target.value })}
                      inputProps={{ style: { fontFamily: "'JetBrains Mono', monospace" } }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 700, color: "#DC2626", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Retiro y Base de Datos Negativa (B.D.N)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Causal de Retiro (Pronos B.D.N)"
                      value={profileForm.exitReasonId || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, exitReasonId: e.target.value })}
                    >
                      <MenuItem value="">Sin Causal (Personal Activo)</MenuItem>
                      {exitReasons.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={profileForm.isBlockedForRehire ?? false}
                          onChange={(e) => setProfileForm({ ...profileForm, isBlockedForRehire: e.target.checked })}
                          color="error"
                        />
                      }
                      label="Bloquear en B.D.N para Recontratación (Falta Grave)"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      label="Observaciones del Retiro"
                      value={profileForm.exitNotes || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, exitNotes: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* TAB 1: DANE, Libreta Militar, Dotación y Grupo Familiar */}
            {drawerTab === 1 && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Ubicación Geográfica DANE y Datos Demográficos
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Código DANE Ciudad"
                      value={profileForm.daneCityCode || "11001"}
                      onChange={(e) => setProfileForm({ ...profileForm, daneCityCode: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Ciudad de Residencia"
                      value={profileForm.daneCityName || "BOGOTÁ D.C."}
                      onChange={(e) => setProfileForm({ ...profileForm, daneCityName: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Barrio"
                      value={profileForm.neighborhood || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, neighborhood: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Estado Civil"
                      value={profileForm.maritalStatus || MaritalStatus.SINGLE}
                      onChange={(e) => setProfileForm({ ...profileForm, maritalStatus: e.target.value })}
                    >
                      <MenuItem value={MaritalStatus.SINGLE}>Soltero(a)</MenuItem>
                      <MenuItem value={MaritalStatus.MARRIED}>Casado(a)</MenuItem>
                      <MenuItem value={MaritalStatus.FREE_UNION}>Unión Libre</MenuItem>
                      <MenuItem value={MaritalStatus.DIVORCED}>Separado(a)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Grupo Sanguíneo RH"
                      value={profileForm.bloodType || "O+"}
                      onChange={(e) => setProfileForm({ ...profileForm, bloodType: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Nivel Educativo"
                      value={profileForm.educationLevel || EducationLevel.HIGH_SCHOOL}
                      onChange={(e) => setProfileForm({ ...profileForm, educationLevel: e.target.value })}
                    >
                      <MenuItem value={EducationLevel.PRIMARY}>Primaria</MenuItem>
                      <MenuItem value={EducationLevel.HIGH_SCHOOL}>Bachiller</MenuItem>
                      <MenuItem value={EducationLevel.TECHNICAL}>Técnico</MenuItem>
                      <MenuItem value={EducationLevel.TECHNOLOGIST}>Tecnólogo</MenuItem>
                      <MenuItem value={EducationLevel.PROFESSIONAL}>Profesional</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Tipo de Vivienda"
                      value={profileForm.housingType || HousingType.RENTED}
                      onChange={(e) => setProfileForm({ ...profileForm, housingType: e.target.value })}
                    >
                      <MenuItem value={HousingType.OWN}>Propia</MenuItem>
                      <MenuItem value={HousingType.RENTED}>Arrendada</MenuItem>
                      <MenuItem value={HousingType.FAMILY}>Familiar</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Libreta Militar y Tallas de Dotación
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Nro. Libreta Militar"
                      value={profileForm.militaryCardNumber || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, militaryCardNumber: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Clase Libreta Militar"
                      value={profileForm.militaryCardClass || MilitaryCardClass.NOT_APPLICABLE}
                      onChange={(e) => setProfileForm({ ...profileForm, militaryCardClass: e.target.value })}
                    >
                      <MenuItem value={MilitaryCardClass.FIRST_CLASS}>Primera Clase</MenuItem>
                      <MenuItem value={MilitaryCardClass.SECOND_CLASS}>Segunda Clase</MenuItem>
                      <MenuItem value={MilitaryCardClass.PROVISIONAL}>Provisional</MenuItem>
                      <MenuItem value={MilitaryCardClass.NOT_APPLICABLE}>No Aplica / Exento</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Distrito Militar"
                      value={profileForm.militaryDistrict || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, militaryDistrict: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Talla Camisa (ej. M, L)"
                      value={profileForm.shirtSize || "M"}
                      onChange={(e) => setProfileForm({ ...profileForm, shirtSize: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Talla Pantalón (ej. 32, 34)"
                      value={profileForm.pantsSize || "32"}
                      onChange={(e) => setProfileForm({ ...profileForm, pantsSize: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Calzado (ej. 40, 41)"
                      value={profileForm.footwearSize || "40"}
                      onChange={(e) => setProfileForm({ ...profileForm, footwearSize: e.target.value })}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Grupo Familiar y Beneficiarios (Caja de Compensación)
                </Typography>

                {/* Formulario nuevo beneficiario */}
                <Card elevation={0} sx={{ p: 2, mb: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "#0F172A", display: "block", mb: 1 }}>
                    Agregar Beneficiario
                  </Typography>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Nombre Completo"
                        value={newFamilyMember.fullName}
                        onChange={(e) => setNewFamilyMember({ ...newFamilyMember, fullName: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={newFamilyMember.relationship}
                        onChange={(e) => setNewFamilyMember({ ...newFamilyMember, relationship: e.target.value as any })}
                      >
                        <MenuItem value={FamilyRelationship.SPOUSE}>Cónyuge</MenuItem>
                        <MenuItem value={FamilyRelationship.CHILD}>Hijo(a)</MenuItem>
                        <MenuItem value={FamilyRelationship.PARENT}>Padre / Madre</MenuItem>
                        <MenuItem value={FamilyRelationship.OTHER}>Otro</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        size="small"
                        type="date"
                        fullWidth
                        label="Fecha Nacimiento"
                        value={newFamilyMember.birthdate}
                        onChange={(e) => setNewFamilyMember({ ...newFamilyMember, birthdate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        onClick={handleAddFamilyMember}
                        startIcon={<AddOutlined />}
                        sx={{ bgcolor: noxiaPalette.primary.main, textTransform: "none", fontWeight: 600 }}
                      >
                        Agregar
                      </Button>
                    </Grid>
                  </Grid>
                </Card>

                {/* Tabla de familiares */}
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>NOMBRE</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>PARENTESCO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>NACIMIENTO</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>SUBSIDIO CCF</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>ACCIONES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dossier.familyMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#64748B", fontSize: "0.8rem" }}>
                            No hay beneficiarios registrados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dossier.familyMembers.map((fam) => (
                          <TableRow key={fam.id} hover>
                            <TableCell sx={{ fontWeight: 600, color: "#0F172A" }}>{fam.fullName}</TableCell>
                            <TableCell>{fam.relationship}</TableCell>
                            <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace" }}>{fam.birthdate ? fam.birthdate.split("T")[0] : "N/A"}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={fam.isDependentForSubsidy ? "Aplica" : "No"}
                                size="small"
                                sx={{ height: 20, bgcolor: fam.isDependentForSubsidy ? "#DCFCE7" : "#F1F5F9", color: fam.isDependentForSubsidy ? "#166534" : "#64748B" }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleDeleteFamilyMember(fam.id)}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 2: Checklist de Contratación 1..10 */}
            {drawerTab === 2 && (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#64748B" }}>
                    Verificación documental obligatoria para vinculación y apertura de carpeta laboral
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: noxiaPalette.primary.main }}>
                    Cumplimiento Total: {dossier.folderCompletionPct}%
                  </Typography>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>CÓD</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>REQUISITO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>TIPO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>ESTADO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>VENCIMIENTO</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>ACCIÓN</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dossier.requirementMatrix.map((req) => (
                        <TableRow key={req.requirementId} hover>
                          <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{req.code}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#0F172A" }}>{req.name}</TableCell>
                          <TableCell>
                            {req.isMandatory ? (
                              <Chip label="Obligatorio" size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: "#EDE9FE", color: noxiaPalette.primary.main, fontWeight: 700 }} />
                            ) : (
                              <Chip label="Opcional" size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: "#F1F5F9" }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              value={req.status}
                              onChange={(e) => handleUpdateRequirement(req.requirementId, e.target.value as any, req.expiryDate)}
                              sx={{ minWidth: 120, "& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 } }}
                            >
                              <MenuItem value={HiringRequirementStatus.PENDING}>Pendiente</MenuItem>
                              <MenuItem value={HiringRequirementStatus.VERIFIED}>Verificado</MenuItem>
                              <MenuItem value={HiringRequirementStatus.EXPIRED}>Vencido</MenuItem>
                              <MenuItem value={HiringRequirementStatus.WAIVED}>No Aplica</MenuItem>
                            </TextField>
                          </TableCell>
                          <TableCell>
                            {req.hasExpiry ? (
                              <TextField
                                type="date"
                                size="small"
                                value={req.expiryDate || ""}
                                onChange={(e) => handleUpdateRequirement(req.requirementId, req.status, e.target.value)}
                                sx={{ width: 140, "& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 } }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Subir o consultar soporte digital en S3">
                              <IconButton size="small" sx={{ color: noxiaPalette.primary.main }}>
                                <FolderOpenOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 3: Cursos SVSP y RENOVA */}
            {drawerTab === 3 && (
              <Box>
                {/* Formulario nuevo curso */}
                <Card elevation={0} sx={{ p: 2, mb: 3, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A", display: "block", mb: 1.5, textTransform: "uppercase" }}>
                    Registrar Acreditación / Curso SuperVigilancia (RENOVA)
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="Nivel / Especialidad SVSP"
                        value={newSvspCourse.svspLevelId}
                        onChange={(e) => setNewSvspCourse({ ...newSvspCourse, svspLevelId: e.target.value })}
                      >
                        <MenuItem value="">Seleccione Nivel</MenuItem>
                        {svspLevels.map((lvl) => (
                          <MenuItem key={lvl.id} value={lvl.id}>
                            {lvl.code} - {lvl.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label="Academia de Seguridad"
                        value={newSvspCourse.academyId}
                        onChange={(e) => setNewSvspCourse({ ...newSvspCourse, academyId: e.target.value })}
                      >
                        <MenuItem value="">Seleccione Academia</MenuItem>
                        {academies.map((acad) => (
                          <MenuItem key={acad.id} value={acad.id}>
                            {acad.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Código NRO SuperVigilancia"
                        value={newSvspCourse.nroCode}
                        onChange={(e) => setNewSvspCourse({ ...newSvspCourse, nroCode: e.target.value })}
                        inputProps={{ style: { fontFamily: "'JetBrains Mono', monospace" } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Nro. Acta / Certificado"
                        value={newSvspCourse.certificateNumber}
                        onChange={(e) => setNewSvspCourse({ ...newSvspCourse, certificateNumber: e.target.value })}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        size="small"
                        type="date"
                        fullWidth
                        label="Fecha de Grado"
                        value={newSvspCourse.issueDate}
                        onChange={(e) => setNewSvspCourse({ ...newSvspCourse, issueDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "flex-end" }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleAddSvspCourse}
                        startIcon={<AddOutlined />}
                        sx={{ bgcolor: noxiaPalette.primary.main, textTransform: "none", fontWeight: 600, height: 40 }}
                      >
                        Registrar Curso
                      </Button>
                    </Grid>
                  </Grid>
                </Card>

                {/* Historial de Cursos */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569", textTransform: "uppercase", display: "block", mb: 1 }}>
                  Historial de Cursos Registrados
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>NIVEL SVSP</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>ACADEMIA</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>CÓDIGO NRO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>GRADO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>VENCIMIENTO</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>ACCIONES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dossier.svspCourses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3, color: "#64748B", fontSize: "0.8rem" }}>
                            No hay cursos SVSP registrados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dossier.svspCourses.map((c) => (
                          <TableRow key={c.id} hover>
                            <TableCell sx={{ fontWeight: 600, color: "#0F172A" }}>
                              {c.svspLevel?.name}
                              {c.isCurrent && (
                                <Chip label="ACTUAL" size="small" sx={{ ml: 1, height: 16, fontSize: "0.6rem", bgcolor: "#DCFCE7", color: "#166534", fontWeight: 700 }} />
                              )}
                            </TableCell>
                            <TableCell>{c.academy?.name}</TableCell>
                            <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.nroCode}</TableCell>
                            <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.issueDate ? c.issueDate.split("T")[0] : "N/A"}</TableCell>
                            <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.expiryDate ? c.expiryDate.split("T")[0] : "N/A"}</TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleDeleteSvspCourse(c.id)}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 4: Capacitaciones Cap/SOMA */}
            {drawerTab === 4 && (
              <Box>
                {/* Formulario nueva capacitación */}
                <Card elevation={0} sx={{ p: 2, mb: 3, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A", display: "block", mb: 1.5, textTransform: "uppercase" }}>
                    Registrar Capacitación Interna (Cap/SOMA)
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Título / Tema"
                        value={newTraining.title}
                        onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Instructor / Facilitador"
                        value={newTraining.instructorName}
                        onChange={(e) => setNewTraining({ ...newTraining, instructorName: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <TextField
                        size="small"
                        type="date"
                        fullWidth
                        label="Fecha"
                        value={newTraining.trainingDate}
                        onChange={(e) => setNewTraining({ ...newTraining, trainingDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 1.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        label="Nota (1-5)"
                        value={newTraining.score}
                        onChange={(e) => setNewTraining({ ...newTraining, score: Number(e.target.value) })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 1.5 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleAddTraining}
                        sx={{ bgcolor: noxiaPalette.primary.main, textTransform: "none", fontWeight: 600, height: 40 }}
                      >
                        Registrar
                      </Button>
                    </Grid>
                  </Grid>
                </Card>

                {/* Historial de Capacitaciones */}
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>TÍTULO / TEMA</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>INSTRUCTOR</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>FECHA</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>HORAS</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>CALIFICACIÓN</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.72rem" }}>ACCIONES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dossier.internalTrainings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3, color: "#64748B", fontSize: "0.8rem" }}>
                            No hay capacitaciones internas registradas.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dossier.internalTrainings.map((t) => (
                          <TableRow key={t.id} hover>
                            <TableCell sx={{ fontWeight: 600, color: "#0F172A" }}>{t.title}</TableCell>
                            <TableCell>{t.instructorName}</TableCell>
                            <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.trainingDate ? t.trainingDate.split("T")[0] : "N/A"}</TableCell>
                            <TableCell align="center" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.durationHours}h</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={Number(t.score).toFixed(1)}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontWeight: 700,
                                  fontFamily: "'JetBrains Mono', monospace",
                                  bgcolor: Number(t.score) >= 4.0 ? "#DCFCE7" : "#FEF3C7",
                                  color: Number(t.score) >= 4.0 ? "#166534" : "#B45309",
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleDeleteTraining(t.id)}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 5: Desprendibles e Historial Salarial */}
            {drawerTab === 5 && (
              <Box>
                {/* 1. Historial de Aumentos y Nivelaciones */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A", textTransform: "uppercase" }}>
                    Historial de Aumentos y Ajustes Salariales
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TrendingUpOutlined />}
                    onClick={() => {
                      setSalaryAdjForm({
                        salaryMode: dossier.payrollProfile?.salaryMode || EmployeeSalaryMode.CUSTOM_FIXED,
                        newSalary: dossier.payrollProfile?.customBaseSalary ? Number(dossier.payrollProfile.customBaseSalary) : 1750905,
                        effectiveDate: new Date().toISOString().split("T")[0],
                        reason: "Ajuste / Aumento salarial individual",
                      });
                      setSalaryAdjOpen(true);
                    }}
                    sx={{ textTransform: "none", fontWeight: 700, borderColor: "#7C3AED", color: "#7C3AED" }}
                  >
                    Registrar Aumento Salarial
                  </Button>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", mb: 4 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>FECHA EFECTIVA</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>ORIGEN DEL AJUSTE</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">SALARIO ANTERIOR</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">SALARIO NUEVO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">INCREMENTO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>MOTIVO / JUSTIFICACIÓN</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!dossier.salaryHistories || dossier.salaryHistories.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3, color: "#64748B", fontSize: "0.8rem" }}>
                            No hay registros históricos de variación salarial para este empleado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dossier.salaryHistories.map((h: any) => (
                          <TableRow key={h.id} hover>
                            <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                              {h.effectiveDate ? h.effectiveDate.split("T")[0] : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  h.origin === "SMMLV_GLOBAL_UPDATE"
                                    ? "Nivelación SMMLV"
                                    : h.origin === "INDIVIDUAL_INCREASE"
                                    ? "Aumento Individual"
                                    : "Contrato Inicial"
                                }
                                size="small"
                                sx={{
                                  height: 20,
                                  fontWeight: 700,
                                  bgcolor: h.origin === "SMMLV_GLOBAL_UPDATE" ? "#EDE9FE" : "#DCFCE7",
                                  color: h.origin === "SMMLV_GLOBAL_UPDATE" ? "#6D28D9" : "#166534",
                                }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              ${Number(h.previousSalary).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669" }}>
                              ${Number(h.newSalary).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`+${Number(h.variationPct).toFixed(2)}%`}
                                size="small"
                                color="success"
                                sx={{ height: 20, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: "#334155" }}>{h.reason}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* 2. Desprendibles de Pago Emitidos */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Desprendibles de Pago Emitidos Oficialmente
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>PERIODO DE NÓMINA</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">DÍAS LIQ.</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">TOTAL DEVENGADO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">TOTAL DEDUCIDO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">NETO PAGADO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">ESTADO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">DESPRENDIBLE PDF</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!dossier.periodSettlements || dossier.periodSettlements.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3, color: "#64748B", fontSize: "0.8rem" }}>
                            No hay liquidaciones de nómina históricas generadas para este empleado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dossier.periodSettlements.map((ps: any) => (
                          <TableRow key={ps.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                              {ps.periodLabel || "Periodo de Nómina"}
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={`${ps.workedDays} d`} size="small" sx={{ height: 20, fontWeight: 700 }} />
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "#059669" }}>
                              ${Number(ps.totalEarnings).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "#DC2626" }}>
                              ${Number(ps.totalDeductions).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#7C3AED" }}>
                              ${Number(ps.netPayAmount).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={ps.status === "PAID" ? "PAGADO" : ps.status === "APPROVED" ? "APROBADO" : "BORRADOR"}
                                size="small"
                                color={ps.status === "PAID" ? "success" : "default"}
                                sx={{ height: 20, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<PictureAsPdfOutlined />}
                                onClick={() => handleDownloadPayslip(ps.id)}
                                sx={{ textTransform: "none", borderColor: "#DC2626", color: "#DC2626", fontWeight: 700, py: 0.2 }}
                              >
                                Descargar PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* 3. Desprendibles de Vacaciones (Fase 5) */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A", textTransform: "uppercase", display: "block", mt: 3, mb: 1.5 }}>
                  Desprendibles de Vacaciones Oficiales (Disfrute y Compensación)
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>TIPO / MODALIDAD</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">PERIODO DISFRUTE</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">DÍAS HÁBILES / DINERO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">BASE SALARIAL</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">NETO A PAGAR</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">ESTADO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">DESPRENDIBLE PDF</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!dossier.vacationSettlements || dossier.vacationSettlements.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3, color: "#64748B", fontSize: "0.8rem" }}>
                            No hay liquidaciones de vacaciones registradas para este empleado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dossier.vacationSettlements.map((vac: any) => (
                          <TableRow key={vac.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                              {vac.settlementType === "TIME_OFF" ? "Disfrute en Tiempo" : vac.settlementType === "MONEY_COMPENSATION" ? "Compensación Dinero" : "Mixto"}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: "0.8rem" }}>
                              {vac.startDate ? `${vac.startDate} al ${vac.endDate}` : "N/A (Compensadas)"}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${vac.businessDaysTaken || 0}d hábiles / ${vac.moneyDaysPaid || 0}d dinero`}
                                size="small"
                                sx={{ height: 20, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              $${Number(vac.baseSalary).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#7C3AED" }}>
                              $${Number(vac.netPay).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={vac.status === "PAID" ? "PAGADO" : vac.status === "APPROVED" ? "APROBADO" : "BORRADOR"}
                                size="small"
                                color={vac.status === "PAID" ? "success" : "default"}
                                sx={{ height: 20, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<PictureAsPdfOutlined />}
                                onClick={() => handleDownloadVacationSlip(vac.id)}
                                sx={{ textTransform: "none", borderColor: "#7C3AED", color: "#7C3AED", fontWeight: 700, py: 0.2 }}
                              >
                                Desprendible PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* 4. Actas de Liquidación Definitiva y Paz y Salvo (Fase 5) */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A", textTransform: "uppercase", display: "block", mb: 1.5 }}>
                  Actas de Liquidación Definitiva de Contrato y Paz y Salvo Oficial
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>FECHA DE RETIRO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>MOTIVO / CAUSA</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">JUSTA CAUSA</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">TOTAL LIQUIDACIÓN</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="right">NETO DEFINITIVO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">ESTADO</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }} align="center">ACTA OFICIAL PDF</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!dossier.finalSettlements || dossier.finalSettlements.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3, color: "#64748B", fontSize: "0.8rem" }}>
                            El empleado no presenta liquidaciones de retiro o contrato finalizado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dossier.finalSettlements.map((finalS: any) => (
                          <TableRow key={finalS.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                              {finalS.terminationDate || "N/A"}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8rem" }}>
                              {finalS.terminationReason || "Terminación de Contrato"}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={finalS.isJustCause ? "CON JUSTA CAUSA" : "SIN JUSTA CAUSA"}
                                size="small"
                                color={finalS.isJustCause ? "default" : "warning"}
                                sx={{ height: 20, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              $${Number(finalS.totalSettlement).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#059669" }}>
                              $${Number(finalS.netLiquidation).toLocaleString("es-CO")}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={finalS.status === "PAID" ? "PAGADO" : finalS.status === "APPROVED" ? "APROBADO" : "BORRADOR"}
                                size="small"
                                color={finalS.status === "PAID" ? "success" : "default"}
                                sx={{ height: 20, fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<PictureAsPdfOutlined />}
                                onClick={() => handleDownloadFinalSettlementPdf(finalS.id)}
                                sx={{ textTransform: "none", bgcolor: "#1E1B4B", "&:hover": { bgcolor: "#0F172A" }, fontWeight: 700, py: 0.2 }}
                              >
                                Descargar Paz y Salvo
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </ResponsiveFormDrawer>

      {/* DRAWER: REGISTRAR AUMENTO / AJUSTE SALARIAL */}
      <ResponsiveFormDrawer
        open={salaryAdjOpen}
        onClose={() => setSalaryAdjOpen(false)}
        title="Registrar Aumento / Ajuste Salarial"
        subtitle={`Empleado: ${dossier?.employee?.fullName || ""}`}
        actions={
          <>
            <Button variant="outlined" color="inherit" onClick={() => setSalaryAdjOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
              onClick={handleApplySalaryAdjustment}
              disabled={dossierLoading}
            >
              Aplicar Aumento
            </Button>
          </>
        }
      >
        <Box sx={{ p: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Modo Salarial"
            value={salaryAdjForm.salaryMode}
            onChange={(e) => setSalaryAdjForm({ ...salaryAdjForm, salaryMode: e.target.value as any })}
            sx={{ mb: 2 }}
          >
            <MenuItem value={EmployeeSalaryMode.CUSTOM_FIXED}>Sueldo Fijo Contractual Personalizado</MenuItem>
            <MenuItem value={EmployeeSalaryMode.MINIMUM_WAGE}>Salario Mínimo Legal Vigente (SMMLV Automático)</MenuItem>
            <MenuItem value={EmployeeSalaryMode.BY_DEPENDENCY}>Heredar del Puesto (Sueldo Garantizado / Modalidad)</MenuItem>
          </TextField>

          <TextField
            fullWidth
            type="number"
            size="small"
            label="Nuevo Salario Básico Mensual ($ COP)"
            value={salaryAdjForm.newSalary}
            onChange={(e) => setSalaryAdjForm({ ...salaryAdjForm, newSalary: Number(e.target.value) })}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="date"
            size="small"
            label="Fecha Efectiva del Aumento"
            value={salaryAdjForm.effectiveDate}
            onChange={(e) => setSalaryAdjForm({ ...salaryAdjForm, effectiveDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Motivo o Justificación del Aumento"
            placeholder="Ej: Ascenso a Supervisor, Nivelación IPC 2026, Desempeño Destacado..."
            value={salaryAdjForm.reason}
            onChange={(e) => setSalaryAdjForm({ ...salaryAdjForm, reason: e.target.value })}
          />
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
