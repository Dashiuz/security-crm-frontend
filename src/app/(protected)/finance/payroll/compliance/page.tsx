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
  Switch,
  FormControlLabel,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  FactCheckOutlined,
  SearchOutlined,
  RefreshOutlined,
  CloudDownloadOutlined,
  UploadFileOutlined,
  SendOutlined,
  CheckCircleOutline,
  ErrorOutline,
  WarningAmberOutlined,
  ReceiptLongOutlined,
  AccountBalanceOutlined,
  PictureAsPdfOutlined,
  VerifiedUserOutlined,
  TableChartOutlined,
  ContentCopyOutlined,
  VisibilityOutlined,
  EditNoteOutlined,
  AssessmentOutlined,
  PaymentsOutlined,
  ShieldOutlined,
  CheckCircleRounded,
  CancelRounded,
  SyncOutlined,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { noxiaPalette } from "@/theme/noxiaTheme";
import {
  PayrollApi,
  PayrollPeriod,
  PayrollSettings,
  DianProviderMode,
  DianEnvironmentType,
  AccountingExportFormat,
  ElectronicPayrollStatus,
  ElectronicDocumentType,
  PilaBatchStatus,
} from "@/lib/api/payroll";
import {
  payrollComplianceApi,
  ComplianceDashboardKpis,
  PilaBatch,
  PilaRecordLine,
  ElectronicBatch,
  ElectronicDocument,
  AccountingBatch,
  AccountingLine,
  TaxCertificate220,
  AnnualAccumulatedMatrix,
} from "@/lib/api/payroll-compliance";

const PILA_OPERATORS = [
  { value: "SOI", label: "SOI (Servicio de Operación de Información)" },
  { value: "MiPlanilla", label: "MiPlanilla (Compensar)" },
  { value: "AportesEnLinea", label: "Aportes en Línea" },
  { value: "Simple", label: "Simple (Pagos GDE)" },
  { value: "ASOPAGOS", label: "ASOPAGOS" },
  { value: "Fedecajas", label: "Fedecajas" },
  { value: "Comfenalco", label: "Comfenalco" },
];

export default function PayrollCompliancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Catálogos globales
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [kpis, setKpis] = useState<ComplianceDashboardKpis | null>(null);

  // Tab 1: PILA
  const [selectedOperator, setSelectedOperator] = useState<string>("SOI");
  const [pilaBatch, setPilaBatch] = useState<PilaBatch | null>(null);
  const [pilaSearch, setPilaSearch] = useState<string>("");
  const [pilaNoveltyFilter, setPilaNoveltyFilter] = useState<string>("ALL");
  const [selectedPilaLine, setSelectedPilaLine] = useState<PilaRecordLine | null>(null);
  const [pilaLineDrawerOpen, setPilaLineDrawerOpen] = useState<boolean>(false);

  // Tab 2: DIAN Nómina Electrónica
  const [selectedDianProvider, setSelectedDianProvider] = useState<DianProviderMode>(
    DianProviderMode.INTERNAL_DIAN_STANDARD,
  );
  const [electronicBatch, setElectronicBatch] = useState<ElectronicBatch | null>(null);
  const [electronicSearch, setElectronicSearch] = useState<string>("");
  const [electronicStatusFilter, setElectronicStatusFilter] = useState<string>("ALL");
  const [selectedElectronicDoc, setSelectedElectronicDoc] = useState<ElectronicDocument | null>(null);
  const [rejectionDrawerOpen, setRejectionDrawerOpen] = useState<boolean>(false);
  const [adjustmentDrawerOpen, setAdjustmentDrawerOpen] = useState<boolean>(false);
  const [adjustmentForm, setAdjustmentForm] = useState<{
    documentType: ElectronicDocumentType;
    reason: string;
  }>({
    documentType: ElectronicDocumentType.ADJUSTMENT_NOTE_REPLACE,
    reason: "",
  });

  // Tab 3: Interfaz Contable
  const [selectedAccountingFormat, setSelectedAccountingFormat] = useState<AccountingExportFormat>(
    AccountingExportFormat.WORLD_OFFICE,
  );
  const [accountingBatchNumber, setAccountingBatchNumber] = useState<string>("001");
  const [accountingDate, setAccountingDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [accountingBatch, setAccountingBatch] = useState<AccountingBatch | null>(null);

  // Tab 4: Certificados y Constancias
  const [certTab, setCertTab] = useState<number>(0);
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());
  const [certificates220, setCertificates220] = useState<TaxCertificate220[]>([]);
  const [certSearch, setCertSearch] = useState<string>("");
  // Constancia Laboral
  const [laborEmployeeId, setLaborEmployeeId] = useState<string>("");
  const [laborAddressedTo, setLaborAddressedTo] = useState<string>("A QUIEN PUEDA INTERESAR");
  const [laborIncludeAverage, setLaborIncludeAverage] = useState<boolean>(false);
  const [laborNotes, setLaborNotes] = useState<string>("");

  // Tab 5: Matriz BI de Acumulados
  const [matrixYear, setMatrixYear] = useState<number>(new Date().getFullYear());
  const [accumulatedMatrix, setAccumulatedMatrix] = useState<AnnualAccumulatedMatrix | null>(null);
  const [matrixMetric, setMatrixMetric] = useState<"netPay" | "totalEarnings" | "basicSalary" | "overtime">("netPay");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadPeriodData();
    }
  }, [selectedPeriodId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [periodsRes, settingsRes, kpisRes] = await Promise.all([
        PayrollApi.listPeriods(),
        PayrollApi.getSettings(),
        payrollComplianceApi.getKpis().catch(() => null),
      ]);

      if (periodsRes && periodsRes.length > 0) {
        setPeriods(periodsRes);
        setSelectedPeriodId(periodsRes[0].id);
      }
      if (settingsRes) {
        setSettings(settingsRes);
        if (settingsRes.defaultDianProviderMode) {
          setSelectedDianProvider(settingsRes.defaultDianProviderMode);
        }
        if (settingsRes.defaultAccountingFormat) {
          setSelectedAccountingFormat(settingsRes.defaultAccountingFormat);
        }
      }
      if (kpisRes) {
        setKpis(kpisRes);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al cargar datos maestros de cumplimiento." });
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodData = async () => {
    if (!selectedPeriodId) return;
    try {
      const kpisRes = await payrollComplianceApi.getKpis().catch(() => null);
      if (kpisRes) {
        setKpis(kpisRes);
        if (kpisRes.pila?.lastBatch) {
          setPilaBatch(kpisRes.pila.lastBatch);
        }
        if (kpisRes.electronicPayroll?.lastBatch) {
          setElectronicBatch(kpisRes.electronicPayroll.lastBatch);
        }
        if (kpisRes.accounting?.lastBatch) {
          setAccountingBatch(kpisRes.accounting.lastBatch);
        }
      }
    } catch {
      // silencioso al refrescar periodo
    }
  };

  // --- ACCIONES TAB 1: PILA ---
  const handleGeneratePila = async () => {
    if (!selectedPeriodId) {
      setFeedback({ type: "error", message: "Seleccione un periodo de nómina para generar PILA." });
      return;
    }
    try {
      setActionLoading(true);
      const batch = await payrollComplianceApi.generatePilaBatch({
        periodId: selectedPeriodId,
        operatorName: selectedOperator,
      });
      setPilaBatch(batch);
      setFeedback({
        type: "success",
        message: `Planilla PILA (Res. 2388) generada exitosamente. Total aportes: $${(batch.grandTotalAmount || 0).toLocaleString("es-CO")}.`,
      });
      loadInitialData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al generar Planilla PILA." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPilaTxt = async () => {
    if (!pilaBatch) return;
    try {
      await payrollComplianceApi.exportPilaFlatFile(pilaBatch.id, pilaBatch.fileNameTxt || "PILA_RES2388.txt");
      setFeedback({ type: "success", message: "Archivo plano PILA (.TXT) descargado para carga en operador." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al descargar plano PILA." });
    }
  };

  const handleDownloadPilaCsv = async () => {
    if (!pilaBatch) return;
    try {
      await payrollComplianceApi.exportPilaAuditCsv(pilaBatch.id, pilaBatch.fileNameCsv || "PILA_AUDITORIA.csv");
      setFeedback({ type: "success", message: "Matriz de auditoría PILA (.CSV) descargada." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al descargar CSV de auditoría PILA." });
    }
  };

  // --- ACCIONES TAB 2: DIAN NÓMINA ELECTRÓNICA ---
  const handleGenerateElectronicBatch = async () => {
    if (!selectedPeriodId) {
      setFeedback({ type: "error", message: "Seleccione un periodo de nómina para emitir Nómina Electrónica." });
      return;
    }
    try {
      setActionLoading(true);
      const batch = await payrollComplianceApi.generateElectronicBatch({
        periodId: selectedPeriodId,
        providerMode: selectedDianProvider,
      });
      setElectronicBatch(batch);
      setFeedback({
        type: "success",
        message: `Lote de Nómina Electrónica generado con ${batch.totalDocuments} documentos validados en modo ${selectedDianProvider}.`,
      });
      loadInitialData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al generar lote electrónico DIAN." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransmitAllElectronic = async () => {
    if (!electronicBatch) return;
    try {
      setActionLoading(true);
      const res = await payrollComplianceApi.transmitAllElectronicBatch(electronicBatch.id);
      setElectronicBatch(res);
      setFeedback({
        type: "success",
        message: `Transmisión completada: ${res.acceptedDocuments} aceptados por DIAN/PT, ${res.rejectedDocuments} con inconsistencias.`,
      });
      loadInitialData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al transmitir lote a la DIAN." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransmitSingleDoc = async (docId: string) => {
    try {
      setActionLoading(true);
      const doc = await payrollComplianceApi.transmitElectronicDocument(docId);
      if (electronicBatch && electronicBatch.documents) {
        setElectronicBatch({
          ...electronicBatch,
          documents: electronicBatch.documents.map((d) => (d.id === docId ? doc : d)),
        });
      }
      setFeedback({
        type: doc.status === ElectronicPayrollStatus.TRANSMITTED_ACCEPTED ? "success" : "error",
        message:
          doc.status === ElectronicPayrollStatus.TRANSMITTED_ACCEPTED
            ? `Documento ${doc.documentNumber} transmitido y ACEPTADO por la DIAN (CUNE generado).`
            : `Documento ${doc.documentNumber} RECHAZADO por la DIAN. Revise las inconsistencias.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al transmitir documento." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAdjustmentNote = async () => {
    if (!selectedElectronicDoc) return;
    try {
      setActionLoading(true);
      const note = await payrollComplianceApi.createAdjustmentNote(selectedElectronicDoc.id, adjustmentForm);
      setAdjustmentDrawerOpen(false);
      setFeedback({
        type: "success",
        message: `Nota de Ajuste ${note.documentNumber} (${note.documentType}) creada exitosamente. Lista para transmitir.`,
      });
      if (electronicBatch) {
        const refreshed = await payrollComplianceApi.getElectronicBatch(electronicBatch.id);
        setElectronicBatch(refreshed);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al crear Nota de Ajuste." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadDocXml = (doc: ElectronicDocument) => {
    if (!doc.xmlContent) {
      setFeedback({ type: "error", message: "El documento aún no cuenta con XML UBL 2.1 generado." });
      return;
    }
    const blob = new Blob([doc.xmlContent], { type: "application/xml;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.documentNumber || "documento_dian"}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- ACCIONES TAB 3: INTERFAZ CONTABLE ---
  const handleGenerateAccounting = async () => {
    if (!selectedPeriodId) {
      setFeedback({ type: "error", message: "Seleccione un periodo de nómina para generar el comprobante contable." });
      return;
    }
    try {
      setActionLoading(true);
      const batch = await payrollComplianceApi.generateAccountingBatch({
        periodId: selectedPeriodId,
        exportFormat: selectedAccountingFormat,
        batchNumber: accountingBatchNumber,
        accountingDate,
      });
      setAccountingBatch(batch);
      setFeedback({
        type: batch.isBalanced ? "success" : "error",
        message: batch.isBalanced
          ? `Comprobante contable (${selectedAccountingFormat}) generado exitosamente con PARTIDA DOBLE EXACTA ($${(batch.totalDebit || 0).toLocaleString("es-CO")}).`
          : `Alerta: Comprobante generado con descuadre contable (Débito: $${batch.totalDebit} vs Crédito: $${batch.totalCredit}).`,
      });
      loadInitialData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al generar comprobante contable." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadAccountingCsv = async () => {
    if (!accountingBatch) return;
    try {
      await payrollComplianceApi.exportAccountingCsv(
        accountingBatch.id,
        accountingBatch.fileName || `COMPROBANTE_${selectedAccountingFormat}.csv`,
      );
      setFeedback({
        type: "success",
        message: `Archivo CSV oficial (${selectedAccountingFormat}) descargado, listo para importar.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al exportar CSV contable." });
    }
  };

  // --- ACCIONES TAB 4: CERTIFICADOS & CONSTANCIAS ---
  const handleGenerateAll220 = async () => {
    try {
      setActionLoading(true);
      const certs = await payrollComplianceApi.generateForm220Certificates({ year: taxYear });
      setCertificates220(certs);
      setFeedback({
        type: "success",
        message: `Consolidación DIAN completada: ${certs.length} Certificados Formulario 220 generados para el año gravable ${taxYear}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al generar Certificados 220 DIAN." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadExisting220 = async () => {
    try {
      setActionLoading(true);
      const certs = await payrollComplianceApi.getForm220Certificates(taxYear);
      setCertificates220(certs);
      setFeedback({ type: "info", message: `${certs.length} certificados encontrados para el año ${taxYear}.` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al consultar certificados." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadLaborPdf = async () => {
    if (!laborEmployeeId) {
      setFeedback({ type: "error", message: "Seleccione un empleado para emitir la constancia laboral." });
      return;
    }
    try {
      setActionLoading(true);
      await payrollComplianceApi.downloadLaborCertificatePdf({
        employeeId: laborEmployeeId,
        addressedTo: laborAddressedTo || "A QUIEN PUEDA INTERESAR",
        includeAverageSalary: laborIncludeAverage,
        notes: laborNotes || undefined,
      });
      setFeedback({ type: "success", message: "Constancia laboral oficial con verificación QR descargada." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al emitir constancia laboral." });
    } finally {
      setActionLoading(false);
    }
  };

  // --- ACCIONES TAB 5: MATRIZ BI DE ACUMULADOS ---
  const handleLoadBiMatrix = async () => {
    try {
      setActionLoading(true);
      const data = await payrollComplianceApi.getAnnualAccumulatedReport({ year: matrixYear });
      setAccumulatedMatrix(data);
      setFeedback({
        type: "success",
        message: `Matriz BI de Acumulados cargada con éxito para ${data.totalEmployees} colaboradores en el año ${matrixYear}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al cargar matriz BI." });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtros en Tablas
  const filteredPilaLines = (pilaBatch?.lines || []).filter((line) => {
    const fullName = `${line.firstName} ${line.firstLastName} ${line.secondLastName || ""}`.toLowerCase();
    const doc = line.documentNumber.toLowerCase();
    const matchesSearch = !pilaSearch || fullName.includes(pilaSearch.toLowerCase()) || doc.includes(pilaSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (pilaNoveltyFilter === "ALL") return true;
    if (pilaNoveltyFilter === "ING") return line.isIng;
    if (pilaNoveltyFilter === "RET") return line.isRet;
    if (pilaNoveltyFilter === "IGE") return line.isIge;
    if (pilaNoveltyFilter === "IRL") return line.isIrl;
    if (pilaNoveltyFilter === "VAC") return line.isVacLr;
    if (pilaNoveltyFilter === "SLN") return line.isSln;
    if (pilaNoveltyFilter === "VST") return line.isVst;
    return true;
  });

  const filteredElectronicDocs = (electronicBatch?.documents || []).filter((doc) => {
    const emp = doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName} ${doc.employee.document}`.toLowerCase() : "";
    const matchesSearch = !electronicSearch || emp.includes(electronicSearch.toLowerCase()) || doc.documentNumber.toLowerCase().includes(electronicSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (electronicStatusFilter === "ALL") return true;
    return doc.status === electronicStatusFilter;
  });

  const filteredCerts = certificates220.filter((c) => {
    const term = certSearch.toLowerCase();
    return !certSearch || c.employeeFullName.toLowerCase().includes(term) || c.employeeDocument.toLowerCase().includes(term);
  });

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* 1. Header & Breadcrumbs */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, fontSize: "0.85rem" }}>
            <Link underline="hover" color="inherit" href="/dashboard">
              Inicio
            </Link>
            <Typography color="inherit">Dirección Financiera</Typography>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>
              Cumplimiento y DIAN
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                bgcolor: `${noxiaPalette.primary.main}15`,
                color: noxiaPalette.primary.main,
                display: "flex",
              }}
            >
              <FactCheckOutlined fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, letterSpacing: -0.5 }}>
                Cumplimiento Externo, DIAN e Interfaz Contable
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Planilla PILA Res. 2388, Nómina Electrónica UBL 2.1, Interfaz Contable, Certificados 220 y Matriz BI
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Selector de Periodo Global */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            select
            size="small"
            label="Periodo de Nómina Activo"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            sx={{ minWidth: 260 }}
          >
            {periods.length === 0 ? (
              <MenuItem value="" disabled>
                Sin periodos configurados
              </MenuItem>
            ) : (
              periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.label} (Cód: {p.code})
                </MenuItem>
              ))
            )}
          </TextField>

          <Tooltip title="Actualizar datos">
            <IconButton
              onClick={loadInitialData}
              disabled={loading || actionLoading}
              sx={{ border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}
            >
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 2. Banner de Feedback */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{ borderRadius: 2 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* 3. Navegación de Pestañas Principales */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#FFFFFF", borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
              py: 2,
              minHeight: 48,
              gap: 1,
            },
          }}
        >
          <Tab icon={<AssessmentOutlined fontSize="small" />} iconPosition="start" label="0. Resumen & KPIs" />
          <Tab icon={<PaymentsOutlined fontSize="small" />} iconPosition="start" label="1. Planilla PILA (Res. 2388)" />
          <Tab icon={<ReceiptLongOutlined fontSize="small" />} iconPosition="start" label="2. Nómina Electrónica DIAN" />
          <Tab icon={<AccountBalanceOutlined fontSize="small" />} iconPosition="start" label="3. Interfaz Contable" />
          <Tab icon={<VerifiedUserOutlined fontSize="small" />} iconPosition="start" label="4. Certificados & Constancias" />
          <Tab icon={<TableChartOutlined fontSize="small" />} iconPosition="start" label="5. Matriz BI de Acumulados" />
        </Tabs>
      </Paper>

      {/* 4. CONTENIDO DE CADA PESTAÑA */}
      {loading ? (
        <Box sx={{ p: 6, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress sx={{ color: noxiaPalette.primary.main }} />
        </Box>
      ) : (
        <>
          {/* TAB 0: RESUMEN Y KPIS */}
          {activeTab === 0 && renderTab0Kpis()}

          {/* TAB 1: PILA RESOLUCIÓN 2388 */}
          {activeTab === 1 && renderTab1Pila()}

          {/* TAB 2: NÓMINA ELECTRÓNICA DIAN */}
          {activeTab === 2 && renderTab2ElectronicPayroll()}

          {/* TAB 3: INTERFAZ CONTABLE (WORLD OFFICE / HELISA) */}
          {activeTab === 3 && renderTab3AccountingInterface()}

          {/* TAB 4: CERTIFICADOS 220 Y CONSTANCIAS LABORALES */}
          {activeTab === 4 && renderTab4Certificates()}

          {/* TAB 5: MATRIZ BI DE ACUMULADOS ANUALES */}
          {activeTab === 5 && renderTab5BiMatrix()}
        </>
      )}

      {/* 5. DRAWERS ZERO-DIALOG POLICY */}

      {/* Drawer: Detalle de Renglón PILA */}
      <ResponsiveFormDrawer
        open={pilaLineDrawerOpen}
        onClose={() => setPilaLineDrawerOpen(false)}
        title="Detalle de Cotizante PILA (Res. 2388)"
        subtitle={`${selectedPilaLine?.firstName} ${selectedPilaLine?.firstLastName} — CC ${selectedPilaLine?.documentNumber}`}
        headerIcon={<PaymentsOutlined sx={{ color: noxiaPalette.primary.main }} />}
        width={{ xs: "100%", md: 540 }}
      >
        {selectedPilaLine && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block" }}>
                REGISTRO PLANO OFICIAL (TIPO 2 - 219 POSICIONES)
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem",
                  wordBreak: "break-all",
                  mt: 0.5,
                  bgcolor: "#0F172A",
                  color: "#38BDF8",
                  p: 1.5,
                  borderRadius: 1,
                }}
              >
                {selectedPilaLine.rawPositionalRecord || "Registro no disponible"}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Salario Básico:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(selectedPilaLine.baseSalary || 0).toLocaleString("es-CO")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Total Aporte Renglón:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: "#059669", fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(selectedPilaLine.totalLineAmount || 0).toLocaleString("es-CO")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">IBC Salud:</Typography>
                <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(selectedPilaLine.ibcHealth || 0).toLocaleString("es-CO")} ({selectedPilaLine.workedDaysHealth}d)
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">IBC Pensión:</Typography>
                <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(selectedPilaLine.ibcPension || 0).toLocaleString("es-CO")} ({selectedPilaLine.workedDaysPension}d)
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">EPS (PLU):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedPilaLine.epsCodePlu || "N/A"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">AFP (PLU):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedPilaLine.afpCodePlu || "N/A"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">CCF (PLU):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedPilaLine.ccfCodePlu || "N/A"}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">ARL Tarifa:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedPilaLine.arlRatePct}%</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Banderas de Novedades del Mes:</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip label="ING (Ingreso)" size="small" color={selectedPilaLine.isIng ? "success" : "default"} variant={selectedPilaLine.isIng ? "filled" : "outlined"} />
              <Chip label="RET (Retiro)" size="small" color={selectedPilaLine.isRet ? "error" : "default"} variant={selectedPilaLine.isRet ? "filled" : "outlined"} />
              <Chip label="IGE (Incapacidad EG)" size="small" color={selectedPilaLine.isIge ? "warning" : "default"} variant={selectedPilaLine.isIge ? "filled" : "outlined"} />
              <Chip label="IRL (Accidente AT)" size="small" color={selectedPilaLine.isIrl ? "warning" : "default"} variant={selectedPilaLine.isIrl ? "filled" : "outlined"} />
              <Chip label="VAC (Vacaciones)" size="small" color={selectedPilaLine.isVacLr ? "info" : "default"} variant={selectedPilaLine.isVacLr ? "filled" : "outlined"} />
              <Chip label="SLN (Suspensión)" size="small" color={selectedPilaLine.isSln ? "secondary" : "default"} variant={selectedPilaLine.isSln ? "filled" : "outlined"} />
              <Chip label="VST (Variación Salario)" size="small" color={selectedPilaLine.isVst ? "primary" : "default"} variant={selectedPilaLine.isVst ? "filled" : "outlined"} />
            </Box>
          </Box>
        )}
      </ResponsiveFormDrawer>

      {/* Drawer: Inconsistencias / Rechazo DIAN */}
      <ResponsiveFormDrawer
        open={rejectionDrawerOpen}
        onClose={() => setRejectionDrawerOpen(false)}
        title="Inconsistencias DIAN / Mensajes de Rechazo"
        subtitle={`Doc: ${selectedElectronicDoc?.documentNumber || ""} — ${selectedElectronicDoc?.employee?.firstName || ""} ${selectedElectronicDoc?.employee?.lastName || ""}`}
        headerIcon={<ErrorOutline sx={{ color: "#DC2626" }} />}
        width={{ xs: "100%", md: 540 }}
      >
        {selectedElectronicDoc && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              El documento fue rechazado durante la validación del Anexo Técnico v1.0 o por el Proveedor Tecnológico.
            </Alert>

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Reglas de Validación Incumplidas:
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {(selectedElectronicDoc.rejectionErrorsJson && selectedElectronicDoc.rejectionErrorsJson.length > 0) ? (
                selectedElectronicDoc.rejectionErrorsJson.map((err, idx) => (
                  <Paper key={idx} elevation={0} sx={{ p: 1.5, bgcolor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: "#991B1B", fontWeight: 600 }}>
                      • {err}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  No se registraron códigos específicos de rechazo.
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography variant="caption" color="text.secondary">
              CUNE SHA-384 Calculado:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", wordBreak: "break-all", bgcolor: "#F1F5F9", p: 1, borderRadius: 1 }}>
              {selectedElectronicDoc.cune || "No emitido"}
            </Typography>
          </Box>
        )}
      </ResponsiveFormDrawer>

      {/* Drawer: Crear Nota de Ajuste DIAN (Tipo 103) */}
      <ResponsiveFormDrawer
        open={adjustmentDrawerOpen}
        onClose={() => setAdjustmentDrawerOpen(false)}
        title="Crear Nota de Ajuste DIAN (Tipo 103)"
        subtitle={`Sobre Documento Predecesor: ${selectedElectronicDoc?.documentNumber || ""}`}
        headerIcon={<EditNoteOutlined sx={{ color: noxiaPalette.primary.main }} />}
        submitButtonText="Generar Nota de Ajuste"
        isSubmitting={actionLoading}
        width={{ xs: "100%", md: 540 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <TextField
            select
            fullWidth
            label="Tipo de Nota de Ajuste"
            value={adjustmentForm.documentType}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, documentType: e.target.value as ElectronicDocumentType })}
          >
            <MenuItem value={ElectronicDocumentType.ADJUSTMENT_NOTE_REPLACE}>
              Reemplazar Documento Predecesor (Tipo 1 - Corrección de valores/devengos)
            </MenuItem>
            <MenuItem value={ElectronicDocumentType.ADJUSTMENT_NOTE_DELETE}>
              Eliminar Documento Predecesor (Tipo 2 - Anulación total de la emisión)
            </MenuItem>
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Motivo / Causa de la Corrección"
            value={adjustmentForm.reason}
            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
            placeholder="Describa el motivo del ajuste exigido por la DIAN..."
            helperText="Este motivo será incluido en el XML UBL 2.1 bajo el elemento de notas de ajuste"
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCreateAdjustmentNote}
            disabled={actionLoading || !adjustmentForm.reason.trim()}
            sx={{ fontWeight: 700, py: 1.2, textTransform: "none", mt: 1 }}
          >
            {actionLoading ? "Generando..." : "Confirmar y Generar Nota de Ajuste"}
          </Button>
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );

  // ==========================================================================
  // RENDER PESTAÑA 0: RESUMEN Y KPIS
  // ==========================================================================
  function renderTab0Kpis() {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Tarjetas de Indicadores */}
        <Grid container spacing={2.5}>
          {/* Tarjeta PILA */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", height: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  Planilla PILA (Res. 2388)
                </Typography>
                <PaymentsOutlined sx={{ color: "#059669" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
                {kpis?.pila?.totalBatches || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                Lotes generados históricamente
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "#059669", fontWeight: 700 }}>
                Último: {kpis?.pila?.lastBatch?.status || "Sin Lote"}
              </Typography>
            </Card>
          </Grid>

          {/* Tarjeta DIAN Nómina Electrónica */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", height: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  Aceptados DIAN / PT
                </Typography>
                <CheckCircleRounded sx={{ color: "#2563EB" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#2563EB" }}>
                {kpis?.electronicPayroll?.documentCounts?.TRANSMITTED_ACCEPTED || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                Documentos con CUNE válido
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" sx={{ fontSize: "0.8rem", color: (kpis?.electronicPayroll?.documentCounts?.REJECTED || 0) > 0 ? "#DC2626" : "text.secondary", fontWeight: 600 }}>
                Rechazados: {kpis?.electronicPayroll?.documentCounts?.REJECTED || 0}
              </Typography>
            </Card>
          </Grid>

          {/* Tarjeta Interfaz Contable */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", height: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  Interfaz Contable
                </Typography>
                <AccountBalanceOutlined sx={{ color: "#7C3AED" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
                {kpis?.accounting?.totalBatches || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                Asientos generados (WO / Helisa)
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" sx={{ fontSize: "0.8rem", color: kpis?.accounting?.lastBatch?.isBalanced ? "#059669" : "#DC2626", fontWeight: 700 }}>
                {kpis?.accounting?.lastBatch ? (kpis.accounting.lastBatch.isBalanced ? "✓ Partida Doble OK" : "⚠ Descuadre") : "Sin Comprobante"}
              </Typography>
            </Card>
          </Grid>

          {/* Tarjeta Certificados 220 */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", height: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  Certificados 220 DIAN
                </Typography>
                <VerifiedUserOutlined sx={{ color: "#D97706" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#D97706" }}>
                {kpis?.taxCertificates?.total220Issued || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                Certificados con código QR
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary", fontWeight: 600 }}>
                Año Gravable Activo: {settings?.activeYear || new Date().getFullYear()}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Acceso Rápido y Guía Operativa */}
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, mb: 1 }}>
            Flujo de Cumplimiento Mensual (PRONOS NOXIA)
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Ejecute en orden los pasos para dar cierre legal, fiscal y contable al periodo liquidado:
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#059669", mb: 1 }}>
                  1. Liquidar Planilla PILA (Res. 2388)
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 2 }}>
                  Genera el archivo plano (.TXT de 219 posiciones) aplicando exoneración de aportes Ley 1607 y novedades de ausentismo.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveTab(1)}
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#059669", color: "#059669" }}
                >
                  Ir a Planilla PILA
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#2563EB", mb: 1 }}>
                  2. Emitir Nómina Electrónica DIAN
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 2 }}>
                  Genera los documentos individuales XML UBL 2.1 con CUNE SHA-384 vía Emisión Directa, Dataico o The Factory HKA.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveTab(2)}
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#2563EB", color: "#2563EB" }}
                >
                  Ir a Nómina Electrónica
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0", height: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#7C3AED", mb: 1 }}>
                  3. Exportar Interfaz Contable
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 2 }}>
                  Valida la Partida Doble exacta y genera el archivo CSV homologado para importar en World Office o Helisa sin tocar celdas.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveTab(3)}
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#7C3AED", color: "#7C3AED" }}
                >
                  Ir a Interfaz Contable
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }

  // ==========================================================================
  // RENDER PESTAÑA 1: PLANILLA PILA (RESOLUCIÓN 2388)
  // ==========================================================================
  function renderTab1Pila() {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Controles de Generación y Operador */}
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <TextField
                select
                size="small"
                label="Operador de Información PILA"
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                sx={{ minWidth: 280 }}
              >
                {PILA_OPERATORS.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SyncOutlined />}
                onClick={handleGeneratePila}
                disabled={actionLoading || !selectedPeriodId}
                sx={{ textTransform: "none", fontWeight: 700, px: 2.5 }}
              >
                {actionLoading ? "Generando PILA..." : "Liquidar Planilla PILA"}
              </Button>
            </Box>

            {pilaBatch && (
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownloadOutlined />}
                  onClick={handleDownloadPilaTxt}
                  sx={{ textTransform: "none", fontWeight: 700, color: "#1E1B4B", borderColor: "#CBD5E1" }}
                >
                  Descargar Plano (.TXT)
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TableChartOutlined />}
                  onClick={handleDownloadPilaCsv}
                  sx={{ textTransform: "none", fontWeight: 700, color: "#059669", borderColor: "#059669" }}
                >
                  Auditoría (.CSV)
                </Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Resumen de Valores de la Planilla */}
        {pilaBatch && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={0} sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Total Cotizantes:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
                  {pilaBatch.totalEmployees}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{pilaBatch.totalLines} líneas tipo 2</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={0} sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Total IBC Salud:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(pilaBatch.totalIbcHealth || 0).toLocaleString("es-CO")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Base estatutaria</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={0} sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Ahorro Exoneración Ley 1607:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#2563EB", fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(pilaBatch.totalExoneratedLaw1607 || 0).toLocaleString("es-CO")}
                </Typography>
                <Typography variant="caption" sx={{ color: "#2563EB" }}>Art. 114-1 E.T. (Salud/SENA/ICBF)</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={0} sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Aportes Empleados:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#DC2626", fontFamily: "'JetBrains Mono', monospace" }}>
                  ${((pilaBatch.totalHealthEmployee || 0) + (pilaBatch.totalPensionEmployee || 0) + (pilaBatch.totalFsp || 0)).toLocaleString("es-CO")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Salud + Pensión + FSP</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Card elevation={0} sx={{ p: 2, border: "2px solid #059669", borderRadius: 2, bgcolor: "#F0FDF4" }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#065F46" }}>GRAN TOTAL A PAGAR:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "#059669", fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(pilaBatch.grandTotalAmount || 0).toLocaleString("es-CO")}
                </Typography>
                <Typography variant="caption" sx={{ color: "#065F46", fontWeight: 600 }}>Operador {pilaBatch.operatorName}</Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabla de Renglones Tipo 2 */}
        <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", overflow: "hidden" }}>
          {/* Barra de Filtros */}
          <Box sx={{ p: 2, borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flex: 1, minWidth: 280 }}>
              <TextField
                size="small"
                placeholder="Buscar por cédula o nombre de empleado..."
                value={pilaSearch}
                onChange={(e) => setPilaSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 360, width: "100%" }}
              />

              <TextField
                select
                size="small"
                label="Filtrar por Novedad"
                value={pilaNoveltyFilter}
                onChange={(e) => setPilaNoveltyFilter(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="ALL">Todas las líneas</MenuItem>
                <MenuItem value="ING">ING (Ingreso)</MenuItem>
                <MenuItem value="RET">RET (Retiro)</MenuItem>
                <MenuItem value="IGE">IGE (Incapacidad EG)</MenuItem>
                <MenuItem value="IRL">IRL (Accidente AT)</MenuItem>
                <MenuItem value="VAC">VAC (Vacaciones)</MenuItem>
                <MenuItem value="SLN">SLN (Suspensión)</MenuItem>
                <MenuItem value="VST">VST (Variación Salario)</MenuItem>
              </TextField>
            </Box>

            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Mostrando {filteredPilaLines.length} de {pilaBatch?.lines?.length || 0} renglones
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>SEC.</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>EMPLEADO / DOCUMENTO</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>EPS / AFP / CCF</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="center">DÍAS (PEN/SAL)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">IBC SALUD</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="center">NOVEDADES</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">TOTAL APORTE</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="center">ACCIÓN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPilaLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No hay registros PILA generados para este periodo o no coinciden con los filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPilaLines.map((line) => (
                    <TableRow key={line.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.8rem" }}>
                        {line.sequenceNumber}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                          {line.firstName} {line.firstLastName} {line.secondLastName || ""}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {line.documentType} {line.documentNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: "block" }}>
                          EPS: <strong>{line.epsCodePlu}</strong> | AFP: <strong>{line.afpCodePlu}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                          CCF: {line.ccfCodePlu} | ARL: {line.arlRatePct}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${line.workedDaysPension}d / ${line.workedDaysHealth}d`} size="small" sx={{ height: 22, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                        ${(line.ibcHealth || 0).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
                          {line.isIng && <Chip label="ING" size="small" color="success" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />}
                          {line.isRet && <Chip label="RET" size="small" color="error" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />}
                          {line.isIge && <Chip label="IGE" size="small" color="warning" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />}
                          {line.isIrl && <Chip label="IRL" size="small" color="warning" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />}
                          {line.isVacLr && <Chip label="VAC" size="small" color="info" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />}
                          {line.isSln && <Chip label="SLN" size="small" color="secondary" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />}
                          {line.isVst && <Chip label="VST" size="small" color="primary" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />}
                          {!line.isIng && !line.isRet && !line.isIge && !line.isIrl && !line.isVacLr && !line.isSln && !line.isVst && (
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>—</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#059669" }}>
                        ${(line.totalLineAmount || 0).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalle del renglón y cadena posicional">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedPilaLine(line);
                              setPilaLineDrawerOpen(true);
                            }}
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  }

  // ==========================================================================
  // RENDER PESTAÑA 2: NÓMINA ELECTRÓNICA DIAN (UBL 2.1)
  // ==========================================================================
  function renderTab2ElectronicPayroll() {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Controles de Generación y Selector Explícito de Proveedor */}
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", flex: 1 }}>
              {/* SELECTOR EXPLÍCITO DE PROVEEDOR DIAN (Requisito de Usuario) */}
              <TextField
                select
                size="small"
                label="Canal / Proveedor de Emisión DIAN"
                value={selectedDianProvider}
                onChange={(e) => setSelectedDianProvider(e.target.value as DianProviderMode)}
                sx={{ minWidth: 320 }}
              >
                <MenuItem value={DianProviderMode.INTERNAL_DIAN_STANDARD}>
                  Emisión Directa XML UBL 2.1 con CUNE SHA-384 ($0 Costo)
                </MenuItem>
                <MenuItem value={DianProviderMode.DATAICO}>
                  Dataico (Proveedor Tecnológico Autorizado API REST)
                </MenuItem>
                <MenuItem value={DianProviderMode.THE_FACTORY_HKA}>
                  The Factory HKA (Proveedor Tecnológico Autorizado API REST)
                </MenuItem>
              </TextField>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SyncOutlined />}
                onClick={handleGenerateElectronicBatch}
                disabled={actionLoading || !selectedPeriodId}
                sx={{ textTransform: "none", fontWeight: 700, px: 2.5 }}
              >
                {actionLoading ? "Generando Lote..." : "Generar Lote Electrónico"}
              </Button>

              {electronicBatch && (
                <Button
                  variant="contained"
                  startIcon={<SendOutlined />}
                  onClick={handleTransmitAllElectronic}
                  disabled={actionLoading}
                  sx={{
                    bgcolor: "#1E1B4B",
                    "&:hover": { bgcolor: "#0F172A" },
                    textTransform: "none",
                    fontWeight: 700,
                    px: 2.5,
                  }}
                >
                  Transmitir Todos a DIAN / PT
                </Button>
              )}
            </Box>

            {electronicBatch && (
              <Chip
                label={`Ambiente: ${electronicBatch.environment || "HABILITACION_2"}`}
                color={electronicBatch.environment === DianEnvironmentType.PRODUCCION_1 ? "success" : "default"}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
        </Paper>

        {/* Resumen del Lote Electrónico */}
        {electronicBatch && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={0} sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Total Documentos:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
                  {electronicBatch.totalDocuments}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Prefijo {electronicBatch.prefix}</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={0} sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Aceptados DIAN:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#059669" }}>
                  {electronicBatch.acceptedDocuments}
                </Typography>
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600 }}>CUNE SHA-384 asignado</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={0} sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Rechazados / Inconsistentes:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: (electronicBatch.rejectedDocuments || 0) > 0 ? "#DC2626" : "text.secondary" }}>
                  {electronicBatch.rejectedDocuments}
                </Typography>
                <Typography variant="caption" sx={{ color: (electronicBatch.rejectedDocuments || 0) > 0 ? "#DC2626" : "text.secondary" }}>Requieren corrección</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={0} sx={{ p: 2, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Neto Total Transmitido:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#2563EB", fontFamily: "'JetBrains Mono', monospace" }}>
                  ${(electronicBatch.netAmount || 0).toLocaleString("es-CO")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Base 30 días</Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabla de Documentos de Nómina Electrónica */}
        <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", overflow: "hidden" }}>
          {/* Filtros */}
          <Box sx={{ p: 2, borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flex: 1, minWidth: 280 }}>
              <TextField
                size="small"
                placeholder="Buscar por cédula, nombre o número de documento..."
                value={electronicSearch}
                onChange={(e) => setElectronicSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 360, width: "100%" }}
              />

              <TextField
                select
                size="small"
                label="Estado DIAN"
                value={electronicStatusFilter}
                onChange={(e) => setElectronicStatusFilter(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="ALL">Todos los estados</MenuItem>
                <MenuItem value={ElectronicPayrollStatus.VALIDATED}>Validado (Listo)</MenuItem>
                <MenuItem value={ElectronicPayrollStatus.TRANSMITTED_ACCEPTED}>Aceptado DIAN</MenuItem>
                <MenuItem value={ElectronicPayrollStatus.REJECTED}>Rechazado</MenuItem>
                <MenuItem value={ElectronicPayrollStatus.REPLACED_BY_NOTE}>Reemplazado por Nota</MenuItem>
              </TextField>
            </Box>

            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Mostrando {filteredElectronicDocs.length} de {electronicBatch?.documents?.length || 0} documentos
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>DOCUMENTO</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>TIPO</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>EMPLEADO / NIT</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>CUNE SHA-384</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">DEVENGOS</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">DEDUCCIONES</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">NETO A PAGAR</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="center">ESTADO DIAN</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="center">ACCIONES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredElectronicDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No hay documentos de nómina electrónica generados para este periodo o filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredElectronicDocs.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: "#1E1B4B", fontFamily: "'JetBrains Mono', monospace" }}>
                        {doc.documentNumber}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            doc.documentType === ElectronicDocumentType.INDIVIDUAL_PAYROLL
                              ? "NIE"
                              : doc.documentType === ElectronicDocumentType.ADJUSTMENT_NOTE_REPLACE
                              ? "NA-REEMP"
                              : "NA-ELIM"
                          }
                          size="small"
                          color={doc.documentType === ElectronicDocumentType.INDIVIDUAL_PAYROLL ? "default" : "secondary"}
                          sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                          {doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : "Empleado"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {doc.employee?.documentType} {doc.employee?.document}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={doc.cune ? `Copiar CUNE: ${doc.cune}` : "CUNE no generado aún"}>
                          <Chip
                            label={doc.cune ? `${doc.cune.substring(0, 14)}...` : "Pendiente"}
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              if (doc.cune) {
                                navigator.clipboard.writeText(doc.cune);
                                setFeedback({ type: "success", message: "CUNE copiado al portapapeles." });
                              }
                            }}
                            icon={<ContentCopyOutlined sx={{ fontSize: "14px !important" }} />}
                            sx={{ height: 22, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem" }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "#059669" }}>
                        ${(doc.totalAccrued || 0).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", color: "#DC2626" }}>
                        ${(doc.totalDeductions || 0).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#2563EB" }}>
                        ${(doc.netAmount || 0).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            doc.status === ElectronicPayrollStatus.TRANSMITTED_ACCEPTED
                              ? "ACEPTADO"
                              : doc.status === ElectronicPayrollStatus.REJECTED
                              ? "RECHAZADO"
                              : doc.status === ElectronicPayrollStatus.VALIDATED
                              ? "VALIDADO"
                              : "BORRADOR"
                          }
                          size="small"
                          color={
                            doc.status === ElectronicPayrollStatus.TRANSMITTED_ACCEPTED
                              ? "success"
                              : doc.status === ElectronicPayrollStatus.REJECTED
                              ? "error"
                              : "default"
                          }
                          sx={{ height: 20, fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                          {doc.status !== ElectronicPayrollStatus.TRANSMITTED_ACCEPTED && (
                            <Tooltip title="Transmitir documento a la DIAN">
                              <IconButton
                                size="small"
                                onClick={() => handleTransmitSingleDoc(doc.id)}
                                disabled={actionLoading}
                                sx={{ color: "#2563EB" }}
                              >
                                <SendOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {doc.xmlContent && (
                            <Tooltip title="Descargar XML UBL 2.1 Oficial">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadDocXml(doc)}
                                sx={{ color: "#059669" }}
                              >
                                <CloudDownloadOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {doc.status === ElectronicPayrollStatus.REJECTED && (
                            <Tooltip title="Ver inconsistencias y motivos de rechazo">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedElectronicDoc(doc);
                                  setRejectionDrawerOpen(true);
                                }}
                                sx={{ color: "#DC2626" }}
                              >
                                <ErrorOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {doc.status === ElectronicPayrollStatus.TRANSMITTED_ACCEPTED && (
                            <Tooltip title="Crear Nota de Ajuste (Tipo 103)">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedElectronicDoc(doc);
                                  setAdjustmentDrawerOpen(true);
                                }}
                                sx={{ color: "#7C3AED" }}
                              >
                                <EditNoteOutlined fontSize="small" />
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
        </Paper>
      </Box>
    );
  }

  // ==========================================================================
  // RENDER PESTAÑA 3: INTERFAZ CONTABLE (WORLD OFFICE / HELISA)
  // ==========================================================================
  function renderTab3AccountingInterface() {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Controles de Generación y Selector Explícito de Formato Contable */}
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", flex: 1 }}>
              {/* SELECTOR EXPLÍCITO DE FORMATO CONTABLE (Requisito de Usuario: Exclusivamente World Office o Helisa) */}
              <TextField
                select
                size="small"
                label="Software Contable Destino"
                value={selectedAccountingFormat}
                onChange={(e) => setSelectedAccountingFormat(e.target.value as AccountingExportFormat)}
                sx={{ minWidth: 260 }}
              >
                <MenuItem value={AccountingExportFormat.WORLD_OFFICE}>
                  Plantilla Oficial WORLD OFFICE (.CSV)
                </MenuItem>
                <MenuItem value={AccountingExportFormat.HELISA}>
                  Plantilla Oficial HELISA GW / NIIF (.CSV)
                </MenuItem>
              </TextField>

              <TextField
                size="small"
                label="Número de Comprobante"
                value={accountingBatchNumber}
                onChange={(e) => setAccountingBatchNumber(e.target.value)}
                sx={{ maxWidth: 160 }}
              />

              <TextField
                type="date"
                size="small"
                label="Fecha Contable"
                value={accountingDate}
                onChange={(e) => setAccountingDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: 180 }}
              />

              <Button
                variant="contained"
                color="primary"
                startIcon={<SyncOutlined />}
                onClick={handleGenerateAccounting}
                disabled={actionLoading || !selectedPeriodId}
                sx={{ textTransform: "none", fontWeight: 700, px: 2.5 }}
              >
                {actionLoading ? "Generando Asiento..." : "Generar Comprobante Contable"}
              </Button>
            </Box>

            {accountingBatch && (
              <Button
                variant="outlined"
                startIcon={<CloudDownloadOutlined />}
                onClick={handleDownloadAccountingCsv}
                sx={{ textTransform: "none", fontWeight: 700, color: "#059669", borderColor: "#059669" }}
              >
                Descargar CSV Oficial ({selectedAccountingFormat})
              </Button>
            )}
          </Box>
        </Paper>

        {/* Semáforo de Partida Doble y Totales */}
        {accountingBatch && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  p: 2.5,
                  border: accountingBatch.isBalanced ? "2px solid #059669" : "2px solid #DC2626",
                  borderRadius: 2,
                  bgcolor: accountingBatch.isBalanced ? "#F0FDF4" : "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {accountingBatch.isBalanced ? (
                  <CheckCircleRounded sx={{ color: "#059669", fontSize: 40 }} />
                ) : (
                  <CancelRounded sx={{ color: "#DC2626", fontSize: 40 }} />
                )}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: accountingBatch.isBalanced ? "#065F46" : "#991B1B" }}>
                    {accountingBatch.isBalanced ? "PARTIDA DOBLE EXACTA" : "DESCUADRE CONTABLE"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    {accountingBatch.isBalanced
                      ? "La sumatoria de Débitos y Créditos coincide al centavo (∑Débitos = ∑Créditos)."
                      : `Diferencia de cuadre: $${Math.abs((accountingBatch.totalDebit || 0) - (accountingBatch.totalCredit || 0)).toFixed(2)}.`}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Total Débitos (Causación Gastos/Costos):</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E1B4B", fontFamily: "'JetBrains Mono', monospace", mt: 0.5 }}>
                  ${(accountingBatch.totalDebit || 0).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{accountingBatch.totalLines} líneas contables</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 2, bgcolor: "#FFFFFF" }}>
                <Typography variant="caption" color="text.secondary">Total Créditos (Pasivos y Bancos):</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E1B4B", fontFamily: "'JetBrains Mono', monospace", mt: 0.5 }}>
                  ${(accountingBatch.totalCredit || 0).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Estructura oficial {accountingBatch.exportFormat}</Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabla de Renglones del Asiento Contable */}
        <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", overflow: "hidden" }}>
          <Box sx={{ p: 2, borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1E1B4B" }}>
              Asiento Contable Detallado por PUC, Tercero y Centro de Costo
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {accountingBatch?.lines?.length || 0} registros
            </Typography>
          </Box>

          <TableContainer sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>SEC.</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>CUENTA PUC</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>NOMBRE CUENTA</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>TERCERO / NIT</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>CENTRO DE COSTO</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>CONCEPTO / DESCRIPCIÓN</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">DÉBITO</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">CRÉDITO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!accountingBatch?.lines || accountingBatch.lines.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No se ha generado el comprobante contable para este periodo. Haga clic en &quot;Generar Comprobante Contable&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  accountingBatch.lines.map((line) => (
                    <TableRow key={line.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.75rem" }}>
                        {line.sequence}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#1E1B4B" }}>
                        {line.pucAccount}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                        {line.accountName}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>
                        <strong>{line.thirdPartyNit}</strong> — {line.thirdPartyName}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", color: "#7C3AED", fontWeight: 600 }}>
                        {line.costCenterCode || "ADMIN"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>
                        {line.description}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: line.debitAmount > 0 ? "#059669" : "text.secondary" }}>
                        ${line.debitAmount > 0 ? line.debitAmount.toLocaleString("es-CO", { minimumFractionDigits: 2 }) : "0.00"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: line.creditAmount > 0 ? "#2563EB" : "text.secondary" }}>
                        ${line.creditAmount > 0 ? line.creditAmount.toLocaleString("es-CO", { minimumFractionDigits: 2 }) : "0.00"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  }

  // ==========================================================================
  // RENDER PESTAÑA 4: CERTIFICADOS Y CONSTANCIAS LABORALES
  // ==========================================================================
  function renderTab4Certificates() {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Selector de Sub-Pestaña: Formulario 220 vs Constancia Laboral */}
        <Paper elevation={0} sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#FFFFFF", borderRadius: 2 }}>
          <Tabs
            value={certTab}
            onChange={(_, val) => setCertTab(val)}
            sx={{
              px: 2,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 48 },
            }}
          >
            <Tab icon={<VerifiedUserOutlined fontSize="small" />} iconPosition="start" label="Certificados Formulario 220 DIAN (Ingresos y Retenciones)" />
            <Tab icon={<PictureAsPdfOutlined fontSize="small" />} iconPosition="start" label="Constancias Laborales Oficiales con Verificación QR" />
          </Tabs>
        </Paper>

        {certTab === 0 ? (
          /* Sub-Pestaña 1: Formulario 220 DIAN */
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <TextField
                    type="number"
                    size="small"
                    label="Año Gravable"
                    value={taxYear}
                    onChange={(e) => setTaxYear(Number(e.target.value))}
                    sx={{ maxWidth: 140 }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SyncOutlined />}
                    onClick={handleGenerateAll220}
                    disabled={actionLoading}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    {actionLoading ? "Consolidando..." : "Generar Certificados 220 (Todos)"}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<SearchOutlined />}
                    onClick={handleLoadExisting220}
                    disabled={actionLoading}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    Consultar Año
                  </Button>
                </Box>

                <TextField
                  size="small"
                  placeholder="Buscar por cédula o nombre..."
                  value={certSearch}
                  onChange={(e) => setCertSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 260 }}
                />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", overflow: "hidden" }}>
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table size="small" stickyHeader>
                  <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>AÑO</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>EMPLEADO / NIT</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">R49: INGRESOS BRUTOS</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">R50: SALUD</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">R51: PENSIÓN/FSP</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">R55: RETEFUENTE</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="center">DESCARGA PDF QR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No hay certificados 220 generados para el año gravable {taxYear}. Haga clic en &quot;Generar Certificados 220&quot;.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCerts.map((cert) => (
                        <TableRow key={cert.id} hover>
                          <TableCell sx={{ fontWeight: 700, color: "#1E1B4B" }}>{cert.year}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                              {cert.employeeFullName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              CC {cert.employeeDocument}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#059669" }}>
                            ${(cert.row49TotalGrossIncome || 0).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            ${(cert.row50HealthDeduction || 0).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            ${(cert.row51PensionAndFspDeduction || 0).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#DC2626" }}>
                            ${(cert.row55WithholdingTax || 0).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<PictureAsPdfOutlined />}
                              onClick={() => payrollComplianceApi.downloadForm220Pdf(cert.id, cert.employeeDocument)}
                              sx={{
                                textTransform: "none",
                                bgcolor: "#DC2626",
                                "&:hover": { bgcolor: "#B91C1C" },
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                py: 0.3,
                              }}
                            >
                              Descargar PDF QR
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        ) : (
          /* Sub-Pestaña 2: Constancia Laboral Oficial */
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", maxWidth: 640, mx: "auto" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, mb: 1 }}>
              Emisión de Constancia Laboral con QR
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Genera una certificación oficial membretada con cargo, puesto de seguridad asignado, tipo de contrato y código QR que valida su veracidad ante bancos y terceros.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="ID o Cédula del Colaborador"
                value={laborEmployeeId}
                onChange={(e) => setLaborEmployeeId(e.target.value)}
                placeholder="Ingrese UUID o Cédula del empleado"
                fullWidth
                helperText="También puede descargarse directamente desde la Hoja de Vida 360°"
              />

              <TextField
                label="Destinatario"
                value={laborAddressedTo}
                onChange={(e) => setLaborAddressedTo(e.target.value)}
                placeholder="A QUIEN PUEDA INTERESAR, Banco Agrario, etc."
                fullWidth
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={laborIncludeAverage}
                    onChange={(e) => setLaborIncludeAverage(e.target.checked)}
                    color="primary"
                  />
                }
                label="Incluir promedio salarial de los últimos 12 meses (recargos y horas extras)"
              />

              <TextField
                label="Notas Adicionales (Opcional)"
                multiline
                rows={2}
                value={laborNotes}
                onChange={(e) => setLaborNotes(e.target.value)}
                placeholder="Anotaciones requeridas por la entidad solicitante..."
                fullWidth
              />

              <Button
                variant="contained"
                color="primary"
                startIcon={<PictureAsPdfOutlined />}
                onClick={handleDownloadLaborPdf}
                disabled={actionLoading || !laborEmployeeId}
                sx={{ textTransform: "none", fontWeight: 700, py: 1.2, mt: 1 }}
              >
                {actionLoading ? "Generando..." : "Descargar Constancia Laboral PDF"}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    );
  }

  // ==========================================================================
  // RENDER PESTAÑA 5: MATRIZ BI DE ACUMULADOS ANUALES
  // ==========================================================================
  function renderTab5BiMatrix() {
    const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* Controles de Consulta y Métrica */}
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <TextField
                type="number"
                size="small"
                label="Año de Consulta"
                value={matrixYear}
                onChange={(e) => setMatrixYear(Number(e.target.value))}
                sx={{ maxWidth: 140 }}
              />

              <TextField
                select
                size="small"
                label="Métrica Visualizada"
                value={matrixMetric}
                onChange={(e) => setMatrixMetric(e.target.value as any)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="netPay">Neto Pagado</MenuItem>
                <MenuItem value="totalEarnings">Total Devengado</MenuItem>
                <MenuItem value="basicSalary">Sueldo Básico</MenuItem>
                <MenuItem value="overtime">Horas Extras y Recargos</MenuItem>
              </TextField>

              <Button
                variant="contained"
                color="primary"
                startIcon={<SyncOutlined />}
                onClick={handleLoadBiMatrix}
                disabled={actionLoading}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {actionLoading ? "Cargando BI..." : "Cargar Matriz BI"}
              </Button>
            </Box>

            {accumulatedMatrix && (
              <Chip
                label={`${accumulatedMatrix.totalEmployees} colaboradores acumulados en ${matrixYear}`}
                color="primary"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
        </Paper>

        {/* Tabla Pivote de 12 Meses */}
        <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", minWidth: 200 }}>
                    COLABORADOR
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", minWidth: 120 }}>
                    CENTRO DE COSTO
                  </TableCell>
                  {MONTH_NAMES.map((m, idx) => (
                    <TableCell key={idx} align="right" sx={{ fontWeight: 800, fontSize: "0.72rem", minWidth: 95 }}>
                      {m.toUpperCase()}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 900, fontSize: "0.75rem", bgcolor: "#F1F5F9", minWidth: 120 }}>
                    TOTAL AÑO
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!accumulatedMatrix?.employees || accumulatedMatrix.employees.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={15} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No se ha consultado la Matriz BI de Acumulados para el año {matrixYear}. Haga clic en &quot;Cargar Matriz BI&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {accumulatedMatrix.employees.map((row) => (
                      <TableRow key={row.employeeId} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#1E1B4B" }}>
                          {row.employeeFullName}
                          <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                            CC {row.employeeDocument}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", color: "#7C3AED", fontWeight: 600 }}>
                          {row.costCenterCode || "ADMIN"}
                        </TableCell>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                          const mData = row.months[m];
                          const val = mData ? (mData as any)[matrixMetric] || 0 : 0;
                          return (
                            <TableCell key={m} align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem" }}>
                              {val > 0 ? `$${Math.round(val).toLocaleString("es-CO")}` : "—"}
                            </TableCell>
                          );
                        })}
                        <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#059669", bgcolor: "#F8FAFC" }}>
                          ${Math.round((row.yearTotals as any)[matrixMetric] || 0).toLocaleString("es-CO")}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Fila de Totales Generales */}
                    <TableRow sx={{ bgcolor: "#F1F5F9", borderTop: "2px solid #CBD5E1" }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 900, fontSize: "0.82rem", color: "#1E1B4B" }}>
                        TOTALES GENERALES ({accumulatedMatrix.totalEmployees} EMPLEADOS):
                      </TableCell>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const mTotal = accumulatedMatrix.grandTotalsByMonth[m];
                        const totalVal = mTotal ? (mTotal as any)[matrixMetric] || 0 : 0;
                        return (
                          <TableCell key={m} align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: "0.8rem", color: "#1E1B4B" }}>
                            ${Math.round(totalVal).toLocaleString("es-CO")}
                          </TableCell>
                        );
                      })}
                      <TableCell align="right" sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: "0.85rem", color: "#059669", bgcolor: "#E2E8F0" }}>
                        ${Math.round((accumulatedMatrix.grandTotalYear as any)[matrixMetric] || 0).toLocaleString("es-CO")}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  }
}
