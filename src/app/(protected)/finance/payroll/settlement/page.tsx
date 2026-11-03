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
  Checkbox,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  SearchOutlined,
  RefreshOutlined,
  AccountBalanceWalletOutlined,
  CalculateOutlined,
  LockOutlined,
  LockOpenOutlined,
  FileDownloadOutlined,
  PictureAsPdfOutlined,
  EmailOutlined,
  SendOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  ErrorOutline,
  EditOutlined,
  AddOutlined,
  DeleteOutline,
  AccountBalanceOutlined,
  AttachMoneyOutlined,
  GroupOutlined,
  ShieldOutlined,
  CalendarMonthOutlined,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import {
  PayrollSettlementApi,
  SettlementKpis,
  PayrollSettlementStatus,
  PayrollDisbursementType,
  PayslipDeliveryStatus,
} from "@/lib/api/payroll-settlement";
import { PayrollApi } from "@/lib/api/payroll";

export default function PayrollSettlementPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Filtros de Periodo
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<any | null>(null);

  // Anticipos Año / Mes
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [advanceYear, setAdvanceYear] = useState<number>(currentYear);
  const [advanceMonth, setAdvanceMonth] = useState<number>(currentMonth);
  const [advanceSettlement, setAdvanceSettlement] = useState<any | null>(null);

  // Catálogos auxiliares
  const [banks, setBanks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<any[]>([]);

  // Estados de Datos
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [kpis, setKpis] = useState<SettlementKpis | null>(null);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Feedback Alerts
  const [alertInfo, setAlertInfo] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Drawer Edición Manual de Pre-Nómina
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<any | null>(null);
  const [editingLines, setEditingLines] = useState<any[]>([]);
  const [editNotes, setEditNotes] = useState("");

  // Drawer Edición de Monto en Anticipo
  const [advanceDrawerOpen, setAdvanceDrawerOpen] = useState(false);
  const [editingAdvanceItem, setEditingAdvanceItem] = useState<any | null>(null);
  const [editingAdvanceAmount, setEditingAdvanceAmount] = useState<number>(0);
  const [editingAdvanceNotes, setEditingAdvanceNotes] = useState("");

  // Estado ACH
  const [achDisbursementType, setAchDisbursementType] = useState<PayrollDisbursementType>(
    PayrollDisbursementType.PAYROLL_PERIOD,
  );
  const [achExportFormat, setAchExportFormat] = useState("PAB_BANCOLOMBIA");
  const [achBankId, setAchBankId] = useState("");
  const [achResult, setAchResult] = useState<any | null>(null);

  // Desprendibles
  const [groupOvertime, setGroupOvertime] = useState(false);

  // Drawer Periodos (Fase 5)
  const [periodDrawerOpen, setPeriodDrawerOpen] = useState(false);
  const [periodDrawerMode, setPeriodDrawerMode] = useState<"INDIVIDUAL" | "YEAR_GENERATE">("INDIVIDUAL");
  const [periodForm, setPeriodForm] = useState({
    code: new Date().getFullYear() * 100 + (new Date().getMonth() + 1),
    label: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    periodNumber: 1,
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
    paymentDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
    notes: "",
  });
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genBaseCode, setGenBaseCode] = useState(new Date().getFullYear() * 100 + 1);

  const handleCreatePeriod = async () => {
    try {
      setActionLoading(true);
      const created = await PayrollApi.createPeriod({
        code: Number(periodForm.code),
        label: periodForm.label || `Periodo ${periodForm.month}/${periodForm.year}`,
        year: Number(periodForm.year),
        month: Number(periodForm.month),
        periodNumber: Number(periodForm.periodNumber) || 1,
        startDate: periodForm.startDate,
        endDate: periodForm.endDate,
        paymentDate: periodForm.paymentDate || undefined,
        notes: periodForm.notes || undefined,
      });
      setAlertInfo({ type: "success", msg: `Periodo "${created.label}" creado exitosamente.` });
      setPeriodDrawerOpen(false);
      await loadCatalogs();
      setSelectedPeriodId(created.id);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al crear periodo de nómina" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateYearPeriods = async () => {
    try {
      setActionLoading(true);
      const generated = await PayrollApi.generateYearPeriods({
        year: Number(genYear),
        baseCode: Number(genBaseCode) || undefined,
      });
      setAlertInfo({ type: "success", msg: `Se generaron exitosamente ${generated.length} periodos para el año ${genYear}.` });
      setPeriodDrawerOpen(false);
      await loadCatalogs();
      if (generated.length > 0) {
        setSelectedPeriodId(generated[0].id);
      }
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al generar periodos anuales" });
    } finally {
      setActionLoading(false);
    }
  };

  // Cargar Catálogos Iniciales
  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      const [periodsRes, banksRes, branchesRes, conceptsRes] = await Promise.all([
        PayrollApi.listPeriods(),
        PayrollApi.listBanks(),
        PayrollApi.listBranches(),
        PayrollApi.listConcepts(),
      ]);

      setPeriods(periodsRes);
      setBanks(banksRes);
      setBranches(branchesRes);
      setConcepts(conceptsRes);

      if (periodsRes.length > 0) {
        setSelectedPeriodId(periodsRes[0].id);
        setSelectedPeriod(periodsRes[0]);
      }
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error cargando catálogos iniciales" });
    } finally {
      setLoading(false);
    }
  };

  // Cargar Liquidaciones y KPIs al cambiar periodo
  useEffect(() => {
    if (selectedPeriodId) {
      const found = periods.find((p) => p.id === selectedPeriodId);
      setSelectedPeriod(found || null);
      loadSettlementsData(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  // Cargar Anticipos al cambiar año o mes
  useEffect(() => {
    if (activeTab === 1) {
      loadAdvanceData(advanceYear, advanceMonth);
    }
  }, [activeTab, advanceYear, advanceMonth]);

  const loadSettlementsData = async (periodId: string) => {
    try {
      setLoading(true);
      const [kpiRes, setRes] = await Promise.all([
        PayrollSettlementApi.getKpis(periodId),
        PayrollSettlementApi.findSettlements(periodId, {
          search: searchTerm || undefined,
          branchId: branchFilter || undefined,
          status: statusFilter || undefined,
        }),
      ]);
      setKpis(kpiRes);
      setSettlements(setRes);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al cargar nómina del periodo" });
    } finally {
      setLoading(false);
    }
  };

  const loadAdvanceData = async (year: number, month: number) => {
    try {
      setLoading(true);
      const res = await PayrollSettlementApi.findAdvances(year, month);
      setAdvanceSettlement(res);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al cargar anticipos" });
    } finally {
      setLoading(false);
    }
  };

  // Acciones Pre-Nómina
  const handleLiquidatePeriod = async (preserveManual = true) => {
    if (!selectedPeriodId) return;
    try {
      setActionLoading(true);
      setAlertInfo(null);
      const res = await PayrollSettlementApi.liquidatePeriod(selectedPeriodId, {
        preserveManualEdits: preserveManual,
      });
      setAlertInfo({
        type: "success",
        msg: `Pre-nómina calculada con éxito: ${res.settledEmployeesCount} empleados liquidados. Neto total: $${res.totalNetPay.toLocaleString("es-CO")} COP`,
      });
      await loadSettlementsData(selectedPeriodId);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al liquidar nómina" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriodId) return;
    if (!window.confirm("¿Está seguro de cerrar definitivamente este periodo? Se amortizarán las cuotas de préstamos y se congelarán los turnos.")) {
      return;
    }
    try {
      setActionLoading(true);
      setAlertInfo(null);
      await PayrollSettlementApi.closePeriod(selectedPeriodId);
      setAlertInfo({ type: "success", msg: "Periodo cerrado exitosamente. Préstamos y anticipos amortizados." });
      await loadCatalogs();
      await loadSettlementsData(selectedPeriodId);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al cerrar periodo" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenPeriod = async () => {
    if (!selectedPeriodId) return;
    if (!window.confirm("¿Desea reabrir este periodo? Se revertirán las cuotas de préstamos amortizadas y quedará en estado borrador.")) {
      return;
    }
    try {
      setActionLoading(true);
      setAlertInfo(null);
      await PayrollSettlementApi.reopenPeriod(selectedPeriodId);
      setAlertInfo({ type: "success", msg: "Periodo reabierto en modo borrador." });
      await loadCatalogs();
      await loadSettlementsData(selectedPeriodId);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al reabrir periodo" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedPeriodId) return;
    try {
      setActionLoading(true);
      await PayrollSettlementApi.downloadExcelAudit(selectedPeriodId);
      setAlertInfo({ type: "success", msg: "Libro de auditoría de nómina (.xlsx) descargado exitosamente." });
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al descargar Excel" });
    } finally {
      setActionLoading(false);
    }
  };

  // Edición Manual de Pre-Nómina
  const handleOpenEditDrawer = async (settlementId: string) => {
    try {
      setActionLoading(true);
      const s = await PayrollSettlementApi.getSettlementById(settlementId);
      setEditingSettlement(s);
      setEditingLines(
        s.lines.map((l: any) => ({
          id: l.id,
          conceptId: l.conceptId,
          conceptName: l.concept?.name,
          nature: l.nature,
          quantity: Number(l.quantity),
          unitValue: Number(l.unitValue),
          totalValue: Number(l.totalValue),
          isConstitutiveOfSalary: l.isConstitutiveOfSalary,
          isDeletable: l.isDeletable,
          notes: l.notes || "",
        })),
      );
      setEditNotes(s.notes || "");
      setEditDrawerOpen(true);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al cargar detalle de liquidación" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveManualEdit = async () => {
    if (!editingSettlement) return;
    try {
      setActionLoading(true);
      await PayrollSettlementApi.manualEditSettlement(editingSettlement.id, {
        notes: editNotes,
        lines: editingLines.map((l) => ({
          id: l.id,
          conceptId: l.conceptId,
          nature: l.nature,
          quantity: l.quantity,
          unitValue: l.unitValue,
          totalValue: l.totalValue,
          isConstitutiveOfSalary: l.isConstitutiveOfSalary,
          isDeletable: l.isDeletable,
          notes: l.notes,
        })),
      });
      setAlertInfo({ type: "success", msg: "Liquidación actualizada y recalculada manualmente." });
      setEditDrawerOpen(false);
      await loadSettlementsData(selectedPeriodId);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al guardar edición manual" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddManualLine = () => {
    const defaultConcept = concepts[0];
    if (!defaultConcept) return;
    setEditingLines([
      ...editingLines,
      {
        conceptId: defaultConcept.id,
        conceptName: defaultConcept.name,
        nature: defaultConcept.nature,
        quantity: 1,
        unitValue: 0,
        totalValue: 0,
        isConstitutiveOfSalary: true,
        isDeletable: true,
        notes: "Ajuste manual",
      },
    ]);
  };

  const handleDeleteLine = (index: number) => {
    setEditingLines(editingLines.filter((_, idx) => idx !== index));
  };

  // Anticipos Día 15
  const handleGenerateAdvances = async () => {
    try {
      setActionLoading(true);
      setAlertInfo(null);
      await PayrollSettlementApi.generateAdvances({
        year: advanceYear,
        month: advanceMonth,
        defaultAdvancePct: 0.4,
        deductAbsences: true,
      });
      setAlertInfo({ type: "success", msg: `Lote de anticipos generado para ${advanceYear}-${advanceMonth}.` });
      await loadAdvanceData(advanceYear, advanceMonth);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al generar anticipos" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAdvances = async () => {
    if (!advanceSettlement?.id) return;
    try {
      setActionLoading(true);
      await PayrollSettlementApi.approveAdvances(advanceSettlement.id);
      setAlertInfo({ type: "success", msg: "Lote de anticipos aprobado para dispersión bancaria." });
      await loadAdvanceData(advanceYear, advanceMonth);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al aprobar anticipos" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAdvanceItem = async () => {
    if (!editingAdvanceItem) return;
    try {
      setActionLoading(true);
      await PayrollSettlementApi.updateAdvanceItem(editingAdvanceItem.id, {
        approvedAmount: editingAdvanceAmount,
        notes: editingAdvanceNotes,
      });
      setAlertInfo({ type: "success", msg: "Monto de anticipo actualizado con éxito." });
      setAdvanceDrawerOpen(false);
      await loadAdvanceData(advanceYear, advanceMonth);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al actualizar anticipo" });
    } finally {
      setActionLoading(false);
    }
  };

  // Dispersión ACH
  const handleGenerateAch = async () => {
    try {
      setActionLoading(true);
      setAlertInfo(null);
      setAchResult(null);

      const res = await PayrollSettlementApi.generateAch({
        disbursementType: achDisbursementType,
        periodId: achDisbursementType === PayrollDisbursementType.PAYROLL_PERIOD ? selectedPeriodId : undefined,
        advanceSettlementId: achDisbursementType === PayrollDisbursementType.FORTNIGHT_ADVANCE ? advanceSettlement?.id : undefined,
        bankId: achBankId || undefined,
        exportFormat: achExportFormat,
      });

      setAchResult(res);

      // Descargar archivo automáticamente en el navegador
      const blob = new Blob([res.fileContent], { type: res.mimeType || "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setAlertInfo({
        type: "success",
        msg: `Archivo ${res.fileName} generado exitosamente con ${res.totalRecords} registros por $${res.totalAmount.toLocaleString("es-CO")} COP.`,
      });
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al generar archivo plano ACH" });
    } finally {
      setActionLoading(false);
    }
  };

  // Desprendibles PDF y Correo
  const handleDownloadAllPayslips = async () => {
    if (!selectedPeriodId) return;
    try {
      setActionLoading(true);
      await PayrollSettlementApi.downloadPayslipsPdf(selectedPeriodId, undefined, groupOvertime);
      setAlertInfo({ type: "success", msg: "Desprendibles consolidados descargados exitosamente." });
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al descargar desprendibles PDF" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadSinglePayslip = async (employeeId: string) => {
    if (!selectedPeriodId) return;
    try {
      setActionLoading(true);
      await PayrollSettlementApi.downloadPayslipsPdf(selectedPeriodId, employeeId, groupOvertime);
      setAlertInfo({ type: "success", msg: "Desprendible PDF individual descargado con éxito." });
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al descargar desprendible" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (!selectedPeriodId) return;
    if (!window.confirm("¿Desea enviar los desprendibles oficiales con PDF adjunto por correo a los empleados con email registrado?")) {
      return;
    }
    try {
      setActionLoading(true);
      setAlertInfo(null);
      const res = await PayrollSettlementApi.sendPayslipsEmail(selectedPeriodId, {
        groupOvertime,
      });
      setAlertInfo({
        type: "success",
        msg: `Despacho finalizado: ${res.sentCount} correos enviados exitosamente, ${res.failedCount} fallidos o sin correo configurado.`,
      });
      await loadSettlementsData(selectedPeriodId);
    } catch (err: any) {
      setAlertInfo({ type: "error", msg: err?.message || "Error al despachar correos" });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCOP = (val: number | string) => {
    return "$" + Number(val || 0).toLocaleString("es-CO");
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#F8FAFC", minHeight: "100vh" }}>
      {/* Encabezado y Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, fontSize: "0.85rem" }}>
          <Link underline="hover" color="inherit" href="/finance">
            Dirección Financiera
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            Liquidación de Nómina y Bancos
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E1B4B", display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalanceWalletOutlined sx={{ color: "#7C3AED", fontSize: "2rem" }} />
              Liquidación de Nómina y Dispersión Bancaria
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Motor determinístico base 30 días comerciales, anticipos día 15, archivos ACH bancarios y desprendibles con QR
            </Typography>
          </Box>

          {/* Selector Global de Periodo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#FFFFFF", p: 1, borderRadius: 2, border: "1px solid #E2E8F0" }}>
            <CalendarMonthOutlined sx={{ color: "#7C3AED" }} />
            <TextField
              select
              size="small"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              sx={{ minWidth: 260 }}
              label="Periodo de Nómina"
            >
              {periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.label} ({p.status === "CLOSED" ? "CERRADO" : "ABIERTO"})
                </MenuItem>
              ))}
            </TextField>

            {selectedPeriod && (
              <Chip
                label={selectedPeriod.status === "CLOSED" ? "CERRADO" : "ABIERTO"}
                color={selectedPeriod.status === "CLOSED" ? "default" : "success"}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}

            <IconButton onClick={() => selectedPeriodId && loadSettlementsData(selectedPeriodId)} size="small" disabled={loading}>
              <RefreshOutlined fontSize="small" />
            </IconButton>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddOutlined />}
              onClick={() => setPeriodDrawerOpen(true)}
              sx={{
                bgcolor: "#7C3AED",
                "&:hover": { bgcolor: "#6D28D9" },
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                whiteSpace: "nowrap",
                ml: 1,
              }}
            >
              + Abrir Periodo
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Alertas */}
      {alertInfo && (
        <Alert severity={alertInfo.type} sx={{ mb: 3 }} onClose={() => setAlertInfo(null)}>
          {alertInfo.msg}
        </Alert>
      )}

      {/* Pestañas Principales */}
      <Paper sx={{ mb: 3, borderRadius: 2, border: "1px solid #E2E8F0" }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            px: 2,
            "& .MuiTab-root": { fontWeight: 700, textTransform: "none", py: 1.5 },
          }}
        >
          <Tab icon={<CalculateOutlined fontSize="small" />} iconPosition="start" label="1. Pre-Nómina y Liquidación" />
          <Tab icon={<AttachMoneyOutlined fontSize="small" />} iconPosition="start" label="2. Anticipos Quincenales (Día 15)" />
          <Tab icon={<AccountBalanceOutlined fontSize="small" />} iconPosition="start" label="3. Dispersión Bancaria ACH" />
          <Tab icon={<PictureAsPdfOutlined fontSize="small" />} iconPosition="start" label="4. Desprendibles PDF y Correo" />
        </Tabs>
      </Paper>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: PRE-NÓMINA Y LIQUIDACIÓN                                       */}
      {/* ========================================================================= */}
      {activeTab === 0 && (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                    TOTAL EMPLEADOS
                  </Typography>
                  <GroupOutlined sx={{ color: "#7C3AED", fontSize: "1.3rem" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E1B4B", mt: 0.5 }}>
                  {kpis?.totalEmployees || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Liquidados en periodo
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                    TOTAL DEVENGADO
                  </Typography>
                  <AttachMoneyOutlined sx={{ color: "#059669", fontSize: "1.3rem" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#059669", mt: 0.5 }}>
                  {formatCOP(kpis?.totalEarnings || 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Sueldos + recargos + aux
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                    TOTAL DEDUCIDO
                  </Typography>
                  <AttachMoneyOutlined sx={{ color: "#DC2626", fontSize: "1.3rem" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#DC2626", mt: 0.5 }}>
                  {formatCOP(kpis?.totalDeductions || 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Salud, pensión, anticipos
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0", bgcolor: "#FAF5FF" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "#7C3AED", fontWeight: 700 }}>
                    NETO A DISPERSAR
                  </Typography>
                  <AccountBalanceWalletOutlined sx={{ color: "#7C3AED", fontSize: "1.3rem" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#7C3AED", mt: 0.5 }}>
                  {formatCOP(kpis?.totalNetPay || 0)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#7C3AED" }}>
                  Monto final bancario
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card sx={{ p: 2, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                    ALERTAS BANCARIAS
                  </Typography>
                  <WarningAmberOutlined sx={{ color: "#F59E0B", fontSize: "1.3rem" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: kpis?.bankWarningsCount ? "#D97706" : "#1E1B4B", mt: 0.5 }}>
                  {kpis?.bankWarningsCount || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Sin cuenta o incompleta
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Barra de Acciones y Filtros */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid #E2E8F0" }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="Buscar por cédula o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && selectedPeriodId && loadSettlementsData(selectedPeriodId)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 260 }}
                />

                <TextField
                  select
                  size="small"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  sx={{ width: 180 }}
                  label="Sucursal"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => selectedPeriodId && loadSettlementsData(selectedPeriodId)}
                  startIcon={<SearchOutlined />}
                  sx={{ textTransform: "none", borderColor: "#CBD5E1", color: "#334155" }}
                >
                  Filtrar
                </Button>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, textTransform: "none", fontWeight: 700 }}
                  startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CalculateOutlined />}
                  onClick={() => handleLiquidatePeriod(true)}
                  disabled={actionLoading || selectedPeriod?.status === "CLOSED"}
                >
                  Liquidar / Reliquidar Nómina
                </Button>

                {selectedPeriod?.status === "OPEN" ? (
                  <Button
                    variant="outlined"
                    color="warning"
                    sx={{ textTransform: "none", fontWeight: 700 }}
                    startIcon={<LockOutlined />}
                    onClick={handleClosePeriod}
                    disabled={actionLoading}
                  >
                    Cerrar Periodo
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="info"
                    sx={{ textTransform: "none", fontWeight: 700 }}
                    startIcon={<LockOpenOutlined />}
                    onClick={handleReopenPeriod}
                    disabled={actionLoading}
                  >
                    Reabrir Periodo
                  </Button>
                )}

                <Button
                  variant="outlined"
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#CBD5E1", color: "#1E1B4B" }}
                  startIcon={<FileDownloadOutlined />}
                  onClick={handleExportExcel}
                  disabled={actionLoading}
                >
                  Auditoría Excel
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Tabla de Pre-Nómina */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#1E1B4B" }}>
                <TableRow>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Documento</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Empleado</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Puesto / Dependencia</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="center">Días</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Básico</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Aux. Transp.</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Extras/Recargos</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Total Devengado</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Salud 4%</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Pensión 4%</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Anticipo</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Total Deducido</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Neto a Pagar</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Banco / Cuenta</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={15} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} sx={{ color: "#7C3AED" }} />
                      <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                        Calculando y cargando renglones de pre-nómina...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" sx={{ color: "#64748b", fontWeight: 600 }}>
                        No hay liquidaciones registradas para este periodo.
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        Haga clic en &quot;Liquidar / Reliquidar Nómina&quot; para ejecutar el motor de cálculo base 30 días.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((s) => (
                    <TableRow key={s.id} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#F8FAFC" } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{s.employee?.document}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1E1B4B" }}>{s.employee?.fullName}</TableCell>
                      <TableCell>{s.primaryDependency?.name || "CENTRAL"}</TableCell>
                      <TableCell align="center">
                        <Chip label={`${s.workedDays} d`} size="small" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right">{formatCOP(s.basicSalaryEarned)}</TableCell>
                      <TableCell align="right">{formatCOP(s.transportAllowanceAmount)}</TableCell>
                      <TableCell align="right">{formatCOP(s.overtimeAndSurchargesAmount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#059669" }}>
                        {formatCOP(s.totalEarnings)}
                      </TableCell>
                      <TableCell align="right">{formatCOP(s.healthEmployeeAmount)}</TableCell>
                      <TableCell align="right">{formatCOP(s.pensionEmployeeAmount)}</TableCell>
                      <TableCell align="right">{formatCOP(s.advanceDeductionAmount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#DC2626" }}>
                        {formatCOP(s.totalDeductions)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#7C3AED", bgcolor: "#FAF5FF" }}>
                        {formatCOP(s.netPayAmount)}
                      </TableCell>
                      <TableCell>
                        {s.hasBankWarning || !s.bankAccountNumber ? (
                          <Chip
                            icon={<WarningAmberOutlined />}
                            label="Sin Cuenta"
                            color="warning"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                              {s.bank?.name || "BANCO"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b" }}>
                              {s.bankAccountNumber}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver y Editar Renglones Manualmente">
                          <IconButton size="small" onClick={() => handleOpenEditDrawer(s.id)} sx={{ color: "#7C3AED" }}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Descargar Desprendible PDF">
                          <IconButton size="small" onClick={() => handleDownloadSinglePayslip(s.employeeId)} sx={{ color: "#DC2626" }}>
                            <PictureAsPdfOutlined fontSize="small" />
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

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ANTICIPOS QUINCENALES (DÍA 15)                                  */}
      {/* ========================================================================= */}
      {activeTab === 1 && (
        <Box>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid #E2E8F0" }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TextField
                  type="number"
                  label="Año"
                  size="small"
                  value={advanceYear}
                  onChange={(e) => setAdvanceYear(parseInt(e.target.value, 10))}
                  sx={{ width: 120 }}
                />
                <TextField
                  select
                  label="Mes"
                  size="small"
                  value={advanceMonth}
                  onChange={(e) => setAdvanceMonth(parseInt(e.target.value, 10))}
                  sx={{ width: 160 }}
                >
                  {[
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                  ].map((m, idx) => (
                    <MenuItem key={idx + 1} value={idx + 1}>
                      {m}
                    </MenuItem>
                  ))}
                </TextField>

                {advanceSettlement && (
                  <Chip
                    label={advanceSettlement.status === "APPROVED" ? "LOTE APROBADO" : "BORRADOR"}
                    color={advanceSettlement.status === "APPROVED" ? "success" : "default"}
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, textTransform: "none", fontWeight: 700 }}
                  startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CalculateOutlined />}
                  onClick={handleGenerateAdvances}
                  disabled={actionLoading || advanceSettlement?.status === "APPROVED"}
                >
                  Generar Anticipos Quincenales
                </Button>

                {advanceSettlement && advanceSettlement.status !== "APPROVED" && (
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ textTransform: "none", fontWeight: 700 }}
                    startIcon={<CheckCircleOutline />}
                    onClick={handleApproveAdvances}
                    disabled={actionLoading}
                  >
                    Aprobar Lote para Dispersión
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          {advanceSettlement && (
            <Card sx={{ p: 2, mb: 3, borderRadius: 2, border: "1px solid #E2E8F0", bgcolor: "#FAF5FF" }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: "#7C3AED", fontWeight: 700 }}>
                    TOTAL TRABAJADORES CON ANTICIPO
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
                    {advanceSettlement.totalEmployees}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: "#7C3AED", fontWeight: 700 }}>
                    MONTO TOTAL A DISPERSAR (DÍA 15)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#7C3AED" }}>
                    {formatCOP(advanceSettlement.totalAmount)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: "#7C3AED", fontWeight: 700 }}>
                    FECHA DE CORTE Y PAGO
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "#1E1B4B" }}>
                    Día 15 del Mes — Cruza en Concepto 509 a fin de mes
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          )}

          <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#1E1B4B" }}>
                <TableRow>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Documento</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Empleado</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Puesto</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Sueldo Básico</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="center">% Aplicado</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="center">Días 1ra Quincena</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Monto Calculado</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Monto Aprobado</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Banco / Cuenta</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="center">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!advanceSettlement || advanceSettlement.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" sx={{ color: "#64748b", fontWeight: 600 }}>
                        No se han generado anticipos para este mes.
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        Haga clic en &quot;Generar Anticipos Quincenales&quot; para liquidar el 40% ordinario sobre el salario básico.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  advanceSettlement.items.map((it: any) => (
                    <TableRow key={it.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{it.employee?.document}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1E1B4B" }}>{it.employee?.fullName}</TableCell>
                      <TableCell>{it.dependency?.name || "CENTRAL"}</TableCell>
                      <TableCell align="right">{formatCOP(it.baseSalary)}</TableCell>
                      <TableCell align="center">
                        <Chip label={`${Number(it.advancePctApplied) * 100}%`} size="small" />
                      </TableCell>
                      <TableCell align="center">{it.workedDaysFirstFortnight} d</TableCell>
                      <TableCell align="right">{formatCOP(it.calculatedAmount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#7C3AED" }}>
                        {formatCOP(it.approvedAmount)}
                      </TableCell>
                      <TableCell>
                        {it.hasBankWarning ? (
                          <Chip label="Sin Banco" size="small" color="warning" />
                        ) : (
                          <Typography variant="caption">{it.bankAccountNumber}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingAdvanceItem(it);
                            setEditingAdvanceAmount(Number(it.approvedAmount));
                            setEditingAdvanceNotes(it.notes || "");
                            setAdvanceDrawerOpen(true);
                          }}
                          disabled={advanceSettlement.status === "APPROVED"}
                        >
                          <EditOutlined fontSize="small" />
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

      {/* ========================================================================= */}
      {/* PESTAÑA 3: DISPERSIÓN BANCARIA ACH                                        */}
      {/* ========================================================================= */}
      {activeTab === 2 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: "1px solid #E2E8F0" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E1B4B", mb: 2 }}>
              Generador de Archivos Planos para Bancos (ACH / PAB)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Tipo de Pago a Dispersar"
                  value={achDisbursementType}
                  onChange={(e) => setAchDisbursementType(e.target.value as any)}
                >
                  <MenuItem value={PayrollDisbursementType.PAYROLL_PERIOD}>Nómina Mensual (Periodo Fin de Mes)</MenuItem>
                  <MenuItem value={PayrollDisbursementType.FORTNIGHT_ADVANCE}>Anticipo Quincenal (Día 15)</MenuItem>
                  <MenuItem value={PayrollDisbursementType.SOCIAL_BENEFITS}>Prestaciones Sociales (Prima / Cesantías)</MenuItem>
                  <MenuItem value={PayrollDisbursementType.VACATION_SETTLEMENT}>Compensación de Vacaciones en Dinero</MenuItem>
                  <MenuItem value={PayrollDisbursementType.FINAL_LIQUIDATION}>Liquidación Definitiva de Contratos</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Estructura / Formato Bancario"
                  value={achExportFormat}
                  onChange={(e) => setAchExportFormat(e.target.value)}
                >
                  <MenuItem value="PAB_BANCOLOMBIA">Bancolombia PAB (Pagos a Proveedores y Nómina)</MenuItem>
                  <MenuItem value="BOGOTA">Banco de Bogotá</MenuItem>
                  <MenuItem value="DAVIVIENDA">Davivienda</MenuItem>
                  <MenuItem value="BCSC">Banco Caja Social (BCSC)</MenuItem>
                  <MenuItem value="STANDARD_ACH">ACH Colombia Estándar (Interbancario)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Filtrar Banco Específico (Opcional)"
                  value={achBankId}
                  onChange={(e) => setAchBankId(e.target.value)}
                >
                  <MenuItem value="">Todos los Bancos</MenuItem>
                  {banks.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name} ({b.achCode})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, py: 1, fontWeight: 700 }}
                  startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlined />}
                  onClick={handleGenerateAch}
                  disabled={actionLoading}
                >
                  Generar y Descargar Plano
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {achResult && (
            <Card sx={{ p: 3, mb: 3, borderRadius: 2, border: "1px solid #7C3AED", bgcolor: "#FAF5FF" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#7C3AED", mb: 1 }}>
                Archivo Generado: {achResult.fileName}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>TOTAL REGISTROS</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{achResult.totalRecords} beneficiarios</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>MONTO TOTAL DISPERSADO</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#059669" }}>
                    {formatCOP(achResult.totalAmount)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>OMITIDOS POR CUENTA FALTANTE</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: achResult.skippedMissingAccountCount > 0 ? "#DC2626" : "#64748b" }}>
                    {achResult.skippedMissingAccountCount}
                  </Typography>
                </Grid>
              </Grid>

              {achResult.warnings && achResult.warnings.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#D97706" }}>
                    Advertencias de Cuentas:
                  </Typography>
                  {achResult.warnings.map((w: any, idx: number) => (
                    <Typography key={idx} variant="caption" sx={{ display: "block", color: "#92400E" }}>
                      • {w.fullName}: {w.reason}
                    </Typography>
                  ))}
                </Box>
              )}
            </Card>
          )}
        </Box>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: DESPRENDIBLES PDF Y CORREO                                      */}
      {/* ========================================================================= */}
      {activeTab === 3 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: "1px solid #E2E8F0" }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
                  Despacho de Desprendibles con Firma y Código QR
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Genera archivos PDF vectoriales con QR embebido para auditoría y despacho masivo por correo electrónico
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={groupOvertime}
                      onChange={(e) => setGroupOvertime(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Agrupar horas extras y recargos en una sola fila (Formato Sintético)"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                <Button
                  variant="outlined"
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#DC2626", color: "#DC2626" }}
                  startIcon={<PictureAsPdfOutlined />}
                  onClick={handleDownloadAllPayslips}
                  disabled={actionLoading || settlements.length === 0}
                >
                  Descargar PDF Consolidado ({settlements.length})
                </Button>

                <Button
                  variant="contained"
                  sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, textTransform: "none", fontWeight: 700 }}
                  startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <SendOutlined />}
                  onClick={handleSendEmails}
                  disabled={actionLoading || settlements.length === 0}
                >
                  Despachar por Correo Electrónico
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Tabla de Estados de Envío */}
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#1E1B4B" }}>
                <TableRow>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Documento</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Empleado</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Correo Electrónico</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="right">Neto Pagado</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="center">Estado Envío</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="center">Fecha Envío</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }} align="center">Descargar PDF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlements.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.employee?.document}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#1E1B4B" }}>{s.employee?.fullName}</TableCell>
                    <TableCell>{s.employee?.email || <Typography variant="caption" sx={{ color: "#DC2626" }}>SIN CORREO</Typography>}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#7C3AED" }}>
                      {formatCOP(s.netPayAmount)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          s.payslipEmailStatus === PayslipDeliveryStatus.SENT
                            ? "ENVIADO"
                            : s.payslipEmailStatus === PayslipDeliveryStatus.FAILED
                            ? "FALLIDO"
                            : "NO ENVIADO"
                        }
                        color={
                          s.payslipEmailStatus === PayslipDeliveryStatus.SENT
                            ? "success"
                            : s.payslipEmailStatus === PayslipDeliveryStatus.FAILED
                            ? "error"
                            : "default"
                        }
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption">
                        {s.payslipSentAt ? new Date(s.payslipSentAt).toLocaleString("es-CO") : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleDownloadSinglePayslip(s.employeeId)} sx={{ color: "#DC2626" }}>
                        <PictureAsPdfOutlined fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: DETALLE Y EDICIÓN MANUAL DE PRE-NÓMINA (Ajuste por Analista)       */}
      {/* ========================================================================= */}
      <ResponsiveFormDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        title={`Liquidación de ${editingSettlement?.employee?.fullName || "Empleado"}`}
        subtitle={`Cédula: ${editingSettlement?.employee?.document || ""} | Puesto: ${editingSettlement?.primaryDependency?.name || "CENTRAL"}`}
        actions={
          <>
            <Button variant="outlined" color="inherit" onClick={() => setEditDrawerOpen(false)}>
              Cerrar
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
              onClick={handleSaveManualEdit}
              disabled={actionLoading || selectedPeriod?.status === "CLOSED"}
            >
              Guardar Ajustes
            </Button>
          </>
        }
      >
        <Box sx={{ p: 2 }}>
          {/* Resumen Superior */}
          <Card sx={{ p: 2, mb: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>DÍAS TRABAJADOS</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{editingSettlement?.workedDays} días</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>SALARIO MENSUAL</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatCOP(editingSettlement?.baseSalaryMonthly)}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>TOTAL DEVENGOS</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "#059669" }}>
                  {formatCOP(editingSettlement?.totalEarnings)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>TOTAL DEDUCCIONES</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "#DC2626" }}>
                  {formatCOP(editingSettlement?.totalDeductions)}
                </Typography>
              </Grid>
            </Grid>
          </Card>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
              Renglones de Liquidación por Concepto
            </Typography>
            <Button
              size="small"
              startIcon={<AddOutlined />}
              onClick={handleAddManualLine}
              sx={{ textTransform: "none", color: "#7C3AED", fontWeight: 700 }}
              disabled={selectedPeriod?.status === "CLOSED"}
            >
              Agregar Concepto Manual
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ mb: 2, border: "1px solid #E2E8F0" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#F1F5F9" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Concepto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Valor Unit.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Valor Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Eliminar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editingLines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ width: "35%" }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={line.conceptId}
                        onChange={(e) => {
                          const c = concepts.find((cp) => cp.id === e.target.value);
                          const updated = [...editingLines];
                          updated[idx].conceptId = e.target.value;
                          if (c) {
                            updated[idx].conceptName = c.name;
                            updated[idx].nature = c.nature;
                          }
                          setEditingLines(updated);
                        }}
                      >
                        {concepts.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={line.nature}
                        size="small"
                        color={line.nature === "DEVENGO" ? "success" : "error"}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: "15%" }}>
                      <TextField
                        type="number"
                        size="small"
                        value={line.quantity}
                        onChange={(e) => {
                          const qty = parseFloat(e.target.value) || 0;
                          const updated = [...editingLines];
                          updated[idx].quantity = qty;
                          updated[idx].totalValue = Math.round(qty * updated[idx].unitValue);
                          setEditingLines(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ width: "20%" }}>
                      <TextField
                        type="number"
                        size="small"
                        value={line.unitValue}
                        onChange={(e) => {
                          const uVal = parseFloat(e.target.value) || 0;
                          const updated = [...editingLines];
                          updated[idx].unitValue = uVal;
                          updated[idx].totalValue = Math.round(updated[idx].quantity * uVal);
                          setEditingLines(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCOP(line.totalValue)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteLine(idx)}
                        disabled={!line.isDeletable}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notas / Justificación de la Modificación"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />
        </Box>
      </ResponsiveFormDrawer>

      {/* ========================================================================= */}
      {/* DRAWER: EDICIÓN DE MONTO DE ANTICIPO (Día 15)                             */}
      {/* ========================================================================= */}
      <ResponsiveFormDrawer
        open={advanceDrawerOpen}
        onClose={() => setAdvanceDrawerOpen(false)}
        title="Ajustar Monto Aprobado de Anticipo"
        subtitle={`Empleado: ${editingAdvanceItem?.employee?.fullName || ""}`}
        actions={
          <>
            <Button variant="outlined" color="inherit" onClick={() => setAdvanceDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
              onClick={handleSaveAdvanceItem}
              disabled={actionLoading}
            >
              Guardar Monto
            </Button>
          </>
        }
      >
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="Monto Aprobado Definitivo (COP)"
            value={editingAdvanceAmount}
            onChange={(e) => setEditingAdvanceAmount(parseFloat(e.target.value) || 0)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones del Ajuste"
            value={editingAdvanceNotes}
            onChange={(e) => setEditingAdvanceNotes(e.target.value)}
          />
        </Box>
      </ResponsiveFormDrawer>

      {/* ========================================================================= */}
      {/* DRAWER: ABRIR / GENERAR PERIODOS DE NÓMINA (Fase 5)                      */}
      {/* ========================================================================= */}
      <ResponsiveFormDrawer
        open={periodDrawerOpen}
        onClose={() => setPeriodDrawerOpen(false)}
        title={periodDrawerMode === "INDIVIDUAL" ? "Abrir Periodo de Nómina" : "Generación Anual de Periodos"}
        subtitle="Configuración y apertura de ciclos quincenales o mensuales de liquidación"
        actions={
          <>
            <Button variant="outlined" color="inherit" onClick={() => setPeriodDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" }, fontWeight: 700 }}
              onClick={periodDrawerMode === "INDIVIDUAL" ? handleCreatePeriod : handleGenerateYearPeriods}
              disabled={actionLoading}
            >
              {periodDrawerMode === "INDIVIDUAL" ? "Crear Periodo" : "Generar 12 Periodos"}
            </Button>
          </>
        }
      >
        <Box sx={{ p: 2 }}>
          <Tabs
            value={periodDrawerMode === "INDIVIDUAL" ? 0 : 1}
            onChange={(_, val) => setPeriodDrawerMode(val === 0 ? "INDIVIDUAL" : "YEAR_GENERATE")}
            sx={{ mb: 3, borderBottom: "1px solid #E2E8F0" }}
          >
            <Tab label="Periodo Individual" sx={{ textTransform: "none", fontWeight: 700 }} />
            <Tab label="Generador Anual (12 Meses)" sx={{ textTransform: "none", fontWeight: 700 }} />
          </Tabs>

          {periodDrawerMode === "INDIVIDUAL" ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Código Numérico (Ej: 202611)"
                  value={periodForm.code}
                  onChange={(e) => setPeriodForm({ ...periodForm, code: parseInt(e.target.value) || 0 })}
                  helperText="Formato sugerido: YYYYMM"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Etiqueta / Nombre Descriptivo"
                  value={periodForm.label}
                  onChange={(e) => setPeriodForm({ ...periodForm, label: e.target.value })}
                  placeholder="Ej: Noviembre 2026"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Año"
                  value={periodForm.year}
                  onChange={(e) => setPeriodForm({ ...periodForm, year: parseInt(e.target.value) || 2026 })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Mes (1..12)"
                  value={periodForm.month}
                  onChange={(e) => setPeriodForm({ ...periodForm, month: parseInt(e.target.value) || 1 })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="N° Sub-periodo"
                  value={periodForm.periodNumber}
                  onChange={(e) => setPeriodForm({ ...periodForm, periodNumber: parseInt(e.target.value) || 1 })}
                  helperText="1 para mensual, 1 ó 2 para quincenal"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Inicio"
                  value={periodForm.startDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Corte / Fin"
                  value={periodForm.endDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Límite de Pago"
                  value={periodForm.paymentDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, paymentDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notas u Observaciones del Periodo"
                  value={periodForm.notes}
                  onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Este generador creará automáticamente los 12 periodos mensuales estándar (enero a diciembre) para el año especificado, con corte comercial al último día de cada mes.
              </Alert>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Año a Generar"
                    value={genYear}
                    onChange={(e) => {
                      const yr = parseInt(e.target.value) || 2026;
                      setGenYear(yr);
                      setGenBaseCode(yr * 100 + 1);
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Código Base Inicial (Enero)"
                    value={genBaseCode}
                    onChange={(e) => setGenBaseCode(parseInt(e.target.value) || 202601)}
                    helperText="Ej: 202601 generará 202601 .. 202612"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
