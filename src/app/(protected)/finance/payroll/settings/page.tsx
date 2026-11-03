"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  MenuItem,
  Tooltip,
  Switch,
  FormControlLabel,
  Card,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import {
  TuneOutlined,
  GavelOutlined,
  ReceiptLongOutlined,
  AccessTimeOutlined,
  CategoryOutlined,
  CalendarMonthOutlined,
  SaveOutlined,
  AddOutlined,
  ElectricBoltOutlined,
  CheckCircleRounded,
  RemoveCircleOutlineRounded,
  ExpandMore as ExpandMoreIcon,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  PayrollApi,
  PayrollSettings,
  PayrollConcept,
  PayrollShiftModality,
  PayrollHoliday,
  PayrollEntity,
  PayrollBank,
  PayrollExitReason,
  PayrollSvspLevel,
  PayrollPaymentFrequency,
  PayrollAdvanceMode,
  PayrollConceptNature,
  PayrollProportionality,
  ShiftModalityClass,
  DianProviderMode,
  DianEnvironmentType,
  AccountingExportFormat,
} from "@/lib/api/payroll";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { noxiaPalette } from "@/theme/noxiaTheme";

const TAB_CONFIG = [
  { label: "Parámetros Legales y Políticas", icon: <GavelOutlined fontSize="small" /> },
  { label: "Conceptos y Matriz de Bases", icon: <ReceiptLongOutlined fontSize="small" /> },
  { label: "Modalidades de Turno (100%)", icon: <AccessTimeOutlined fontSize="small" /> },
  { label: "Catálogos Maestros Pronos", icon: <CategoryOutlined fontSize="small" /> },
  { label: "Calendario Festivos Emiliani", icon: <CalendarMonthOutlined fontSize="small" /> },
];

export default function PayrollSettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Data states
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [concepts, setConcepts] = useState<PayrollConcept[]>([]);
  const [modalities, setModalities] = useState<PayrollShiftModality[]>([]);
  const [holidays, setHolidays] = useState<PayrollHoliday[]>([]);
  const [entities, setEntities] = useState<PayrollEntity[]>([]);
  const [banks, setBanks] = useState<PayrollBank[]>([]);
  const [exitReasons, setExitReasons] = useState<PayrollExitReason[]>([]);
  const [svspLevels, setSvspLevels] = useState<PayrollSvspLevel[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Matrix edit buffer (conceptId -> { flag: boolean })
  const [matrixEdits, setMatrixEdits] = useState<Record<string, Partial<PayrollConcept>>>({});

  // Drawer states
  const [conceptDrawerOpen, setConceptDrawerOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Partial<PayrollConcept> | null>(null);

  const [modalityDrawerOpen, setModalityDrawerOpen] = useState(false);
  const [editingModality, setEditingModality] = useState<Partial<PayrollShiftModality> | null>(null);

  useEffect(() => {
    loadAllData();
  }, [selectedYear]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes, mRes, hRes, eRes, bRes, rRes, svRes] = await Promise.all([
        PayrollApi.getSettings(),
        PayrollApi.listConcepts(),
        PayrollApi.listModalities(),
        PayrollApi.getHolidays(selectedYear),
        PayrollApi.listEntities(),
        PayrollApi.listBanks(),
        PayrollApi.listExitReasons(),
        PayrollApi.listSvspLevels(),
      ]);

      if (sRes) setSettings(sRes);
      if (cRes) setConcepts(cRes);
      if (mRes) setModalities(mRes);
      if (hRes) setHolidays(hRes);
      if (eRes) setEntities(eRes);
      if (bRes) setBanks(bRes);
      if (rRes) setExitReasons(rRes);
      if (svRes) setSvspLevels(svRes);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al cargar configuración de nómina" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await PayrollApi.updateSettings(settings);
      if (res) setSettings(res);
      setFeedback({ type: "success", message: "Parámetros legales y políticas de nómina guardados exitosamente." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al guardar parámetros" });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateHolidays = async () => {
    try {
      setSaving(true);
      const res = await PayrollApi.generateHolidays(selectedYear);
      if (res) setHolidays(res);
      setFeedback({ type: "success", message: `Los 18 festivos de ${selectedYear} fueron calculados y guardados según Ley Emiliani.` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al calcular festivos" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMatrixFlag = (conceptId: string, flag: keyof PayrollConcept) => {
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return;

    const currentVal = matrixEdits[conceptId]?.[flag] !== undefined ? matrixEdits[conceptId][flag] : concept[flag];
    const newVal = !currentVal;

    setMatrixEdits((prev) => ({
      ...prev,
      [conceptId]: {
        ...(prev[conceptId] || {}),
        [flag]: newVal,
      },
    }));

    setConcepts((prev) =>
      prev.map((c) => (c.id === conceptId ? ({ ...c, [flag]: newVal } as PayrollConcept) : c)),
    );
  };

  const handleSaveMatrixChanges = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(matrixEdits).map(([id, flags]) =>
        PayrollApi.updateConcept(id, flags),
      );
      await Promise.all(updates);
      setMatrixEdits({});
      setFeedback({ type: "success", message: "Matriz de bases de liquidación guardada exitosamente." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al guardar matriz" });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <Box sx={{ p: 6, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: noxiaPalette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Breadcrumbs y Encabezado */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, fontSize: "0.85rem" }}>
            <Link underline="hover" color="inherit" href="/dashboard">
              Inicio
            </Link>
            <Typography color="inherit">Dirección Financiera</Typography>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>
              Configuración y Catálogos
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: `${noxiaPalette.primary.main}15`,
                color: noxiaPalette.primary.main,
                display: "flex",
              }}
            >
              <TuneOutlined />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, letterSpacing: -0.5 }}>
                Configuración y Catálogos de Nómina
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Parámetros legales vigentes, conceptos contables PUC, matriz de bases Pronos y modalidades de turno
              </Typography>
            </Box>
          </Box>
        </Box>

        <Tooltip title="Actualizar catálogos">
          <IconButton
            onClick={loadAllData}
            disabled={loading}
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            <RefreshOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alerta de Feedback */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{ borderRadius: 2 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Disposición Desktop (Master-Detail con Tabs Verticales) o Mobile (Acordeones) */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {TAB_CONFIG.map((t, idx) => (
            <Accordion
              key={idx}
              expanded={activeTab === idx}
              onChange={() => setActiveTab(activeTab === idx ? -1 : idx)}
              slotProps={{ transition: { unmountOnExit: true } }}
              sx={{
                border: "1px solid #E2E8F0",
                borderRadius: "12px !important",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography component="div" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, fontSize: "0.9rem" }}>
                  <Box component="span" sx={{ color: noxiaPalette.primary.main, display: "flex" }}>
                    {t.icon}
                  </Box>
                  {t.label}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2 }}>
                {renderTabContent(idx)}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* Columna Izquierda: Tabs Verticales */}
          <Paper
            elevation={0}
            sx={{
              width: 280,
              minWidth: 280,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              overflow: "hidden",
              position: "sticky",
              top: 80,
            }}
          >
            <Tabs
              orientation="vertical"
              value={activeTab >= 0 && activeTab < TAB_CONFIG.length ? activeTab : 0}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                borderRight: 1,
                borderColor: "divider",
                "& .MuiTab-root": {
                  alignItems: "center",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  py: 1.8,
                  px: 2,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textTransform: "none",
                  gap: 1.5,
                  borderRight: "3px solid transparent",
                  transition: "all 0.15s ease",
                  "&.Mui-selected": {
                    color: noxiaPalette.primary.main,
                    bgcolor: `${noxiaPalette.primary.main}0D`,
                    borderRight: `3px solid ${noxiaPalette.primary.main}`,
                  },
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.02)",
                  },
                },
              }}
            >
              {TAB_CONFIG.map((t, idx) => (
                <Tab
                  key={idx}
                  icon={t.icon}
                  iconPosition="start"
                  label={t.label}
                />
              ))}
            </Tabs>
          </Paper>

          {/* Columna Derecha: Contenido de la Pestaña Activa */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {renderTabContent(activeTab)}
          </Box>
        </Box>
      )}

      {/* Drawer: Crear/Editar Concepto */}
      <ResponsiveFormDrawer
        open={conceptDrawerOpen}
        onClose={() => setConceptDrawerOpen(false)}
        title={editingConcept?.id ? "Editar Concepto de Nómina" : "Nuevo Concepto de Nómina"}
        subtitle="Configuración contable PUC, homologación DIAN NIE y banderas de liquidación"
        headerIcon={<ReceiptLongOutlined sx={{ color: noxiaPalette.primary.main }} />}
        submitButtonText="Guardar Concepto"
        isSubmitting={saving}
        width={{ xs: "100%", md: 540 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <TextField
            label="Código de Concepto (Pronos)"
            type="number"
            value={editingConcept?.code || ""}
            onChange={(e) => setEditingConcept({ ...editingConcept, code: Number(e.target.value) })}
            fullWidth
            helperText="1..99 Devengos, 100..110 Licencias, 500..599 Deducciones"
          />
          <TextField
            label="Nombre del Concepto"
            value={editingConcept?.name || ""}
            onChange={(e) => setEditingConcept({ ...editingConcept, name: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Naturaleza Contable"
            value={editingConcept?.nature || PayrollConceptNature.DEVENGO}
            onChange={(e) => setEditingConcept({ ...editingConcept, nature: e.target.value as PayrollConceptNature })}
            fullWidth
          >
            <MenuItem value={PayrollConceptNature.DEVENGO}>Devengo (Pago Salarial o No Salarial)</MenuItem>
            <MenuItem value={PayrollConceptNature.DEDUCCION}>Deducción / Descuento</MenuItem>
            <MenuItem value={PayrollConceptNature.LICENCIA}>Licencia Remunerada</MenuItem>
            <MenuItem value={PayrollConceptNature.INCAPACIDAD}>Incapacidad Médica</MenuItem>
            <MenuItem value={PayrollConceptNature.SEG_SOCIAL}>Seguridad Social Empleado</MenuItem>
          </TextField>

          <TextField
            label="Cuenta PUC Administrativa (5105xx)"
            value={editingConcept?.adminPucAccount || ""}
            onChange={(e) => setEditingConcept({ ...editingConcept, adminPucAccount: e.target.value })}
            fullWidth
            placeholder="Ej. 510506"
          />
          <TextField
            label="Cuenta PUC Operativa (7205xx)"
            value={editingConcept?.operativePucAccount || ""}
            onChange={(e) => setEditingConcept({ ...editingConcept, operativePucAccount: e.target.value })}
            fullWidth
            placeholder="Ej. 720506"
          />
          <TextField
            label="Código DIAN Nómina Electrónica (NIE)"
            value={editingConcept?.dianNieCode || ""}
            onChange={(e) => setEditingConcept({ ...editingConcept, dianNieCode: e.target.value })}
            fullWidth
            helperText="Ejemplo: NIE070, NIE078, NIE085"
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={async () => {
              if (!editingConcept?.code || !editingConcept?.name) return;
              try {
                setSaving(true);
                await PayrollApi.createConcept(editingConcept);
                setConceptDrawerOpen(false);
                const res = await PayrollApi.listConcepts();
                if (res) setConcepts(res);
                setFeedback({ type: "success", message: "Concepto de nómina registrado exitosamente." });
              } catch (err: any) {
                setFeedback({ type: "error", message: err?.message || "Error al crear concepto" });
              } finally {
                setSaving(false);
              }
            }}
            sx={{ textTransform: "none", fontWeight: 700, mt: 2 }}
          >
            Guardar Concepto
          </Button>
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );

  function renderTabContent(tabIndex: number) {
    switch (tabIndex) {
      case 0:
        return renderTabLegalParameters();
      case 1:
        return renderTabConceptsAndMatrix();
      case 2:
        return renderTabShiftModalities();
      case 3:
        return renderTabOfficialCatalogs();
      case 4:
        return renderTabEmilianiHolidays();
      default:
        return null;
    }
  }

  // --- TAB 1: PARÁMETROS LEGALES Y POLÍTICAS ---
  function renderTabLegalParameters() {
    if (!settings) return null;
    return (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main }}>
              Vigencia Legal y Parámetros Laborales ({settings.activeYear})
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Bases estatutarias colombianas, horas semanales Ley 2101, auxilio de transporte y periodicidad
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveOutlined />}
            onClick={handleSaveSettings}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 700, px: 3, borderRadius: 2 }}
          >
            {saving ? "Guardando..." : "Guardar Parámetros"}
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Salario Mínimo Legal (SMMLV)"
              type="number"
              value={settings.smmlv}
              onChange={(e) => setSettings({ ...settings, smmlv: Number(e.target.value) })}
              helperText="Base nacional 2026"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Auxilio de Transporte Legal"
              type="number"
              value={settings.transportAllowance}
              onChange={(e) => setSettings({ ...settings, transportAllowance: Number(e.target.value) })}
              helperText="Para salarios ≤ 2 SMMLV"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Valor UVT Vigente (COP)"
              type="number"
              value={settings.uvtValue}
              onChange={(e) => setSettings({ ...settings, uvtValue: Number(e.target.value) })}
              helperText="Unidad de Valor Tributario DIAN"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Jornada Máxima Semanal (Horas)"
              type="number"
              value={settings.weeklyWorkingHours}
              onChange={(e) => setSettings({ ...settings, weeklyWorkingHours: Number(e.target.value) })}
              helperText="Ley 2101 (44h o 42h)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              label="Periodicidad de Pago Principal"
              value={settings.paymentFrequency}
              onChange={(e) => setSettings({ ...settings, paymentFrequency: e.target.value as PayrollPaymentFrequency })}
            >
              <MenuItem value={PayrollPaymentFrequency.MONTHLY_WITH_ADVANCE}>
                Mensual (Día 30) con Anticipo (Día 15) [Estándar]
              </MenuItem>
              <MenuItem value={PayrollPaymentFrequency.BIWEEKLY_PURE}>
                Quincenal Pura (Cortes día 15 y día 30)
              </MenuItem>
              <MenuItem value={PayrollPaymentFrequency.MONTHLY_PURE}>
                Mensual Única (Sin anticipo)
              </MenuItem>
              <MenuItem value={PayrollPaymentFrequency.WEEKLY}>Semanal</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              label="Modo de Cálculo de Anticipo"
              value={settings.advanceMode}
              onChange={(e) => setSettings({ ...settings, advanceMode: e.target.value as PayrollAdvanceMode })}
            >
              <MenuItem value={PayrollAdvanceMode.PERCENTAGE_OF_BASE}>
                Porcentaje del Sueldo Básico/Garantizado
              </MenuItem>
              <MenuItem value={PayrollAdvanceMode.FIXED_AMOUNT}>
                Valor Fijo Parametrizado
              </MenuItem>
              <MenuItem value={PayrollAdvanceMode.PROPORTIONAL_DAYS}>
                Proporcional a Días Laborados
              </MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="% Anticipo Quincenal por Defecto"
              type="number"
              value={Math.round(settings.defaultAdvancePct * 100)}
              onChange={(e) => setSettings({ ...settings, defaultAdvancePct: Number(e.target.value) / 100 })}
              helperText="Ejemplo: 40% o 50%"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="% Reconocimiento Empresa Incapacidad EG (Días 1-2)"
              type="number"
              value={settings.employerSickLeaveRatePct ?? 66.67}
              onChange={(e) => setSettings({ ...settings, employerSickLeaveRatePct: Number(e.target.value) })}
              helperText="66.67% (Ley Colombia) o 100% (Beneficio empresa)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="% EPS Incapacidad EG (Días 3 al 90)"
              type="number"
              value={settings.epsSickLeaveRateDays3To90Pct ?? 66.67}
              onChange={(e) => setSettings({ ...settings, epsSickLeaveRateDays3To90Pct: Number(e.target.value) })}
              helperText="66.67% (Art. 227 C.S.T.)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="% EPS Incapacidad EG (Días 91 al 180)"
              type="number"
              value={settings.epsSickLeaveRateDays91To180Pct ?? 50.0}
              onChange={(e) => setSettings({ ...settings, epsSickLeaveRateDays91To180Pct: Number(e.target.value) })}
              helperText="50.00% (Art. 227 C.S.T.)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.saturdayIsWorkingDay}
                  onChange={(e) => setSettings({ ...settings, saturdayIsWorkingDay: e.target.checked })}
                  color="primary"
                />
              }
              label="Sábado es día hábil para vacaciones"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.applyExonerationLaw1607}
                  onChange={(e) => setSettings({ ...settings, applyExonerationLaw1607: e.target.checked })}
                  color="primary"
                />
              }
              label="Exoneración Salud/SENA/ICBF (Art. 114-1 E.T.)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enforceUgpp40PctRule}
                  onChange={(e) => setSettings({ ...settings, enforceUgpp40PctRule: e.target.checked })}
                  color="primary"
                />
              }
              label="Control Tope 40% No Salarial UGPP (Ley 1393)"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main }}>
            Cumplimiento Externo, DIAN e Interfaz Contable (Fase 6)
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Proveedor predeterminado de Nómina Electrónica, ambiente DIAN y plantilla oficial de exportación contable
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Proveedor Predeterminado Nómina Electrónica"
              value={settings.defaultDianProviderMode || DianProviderMode.INTERNAL_DIAN_STANDARD}
              onChange={(e) => setSettings({ ...settings, defaultDianProviderMode: e.target.value as DianProviderMode })}
              helperText="Puede cambiarse dinámicamente en el módulo de transmisión"
            >
              <MenuItem value={DianProviderMode.INTERNAL_DIAN_STANDARD}>
                Emisión Directa XML UBL 2.1 con CUNE SHA-384 (Estándar DIAN - $0 Costo)
              </MenuItem>
              <MenuItem value={DianProviderMode.DATAICO}>
                Dataico (Proveedor Tecnológico Autorizado API REST)
              </MenuItem>
              <MenuItem value={DianProviderMode.THE_FACTORY_HKA}>
                The Factory HKA (Proveedor Tecnológico Autorizado API REST)
              </MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Plantilla Contable Oficial Predeterminada"
              value={settings.defaultAccountingFormat || AccountingExportFormat.WORLD_OFFICE}
              onChange={(e) => setSettings({ ...settings, defaultAccountingFormat: e.target.value as AccountingExportFormat })}
              helperText="Estructura oficial para importación masiva de comprobantes"
            >
              <MenuItem value={AccountingExportFormat.WORLD_OFFICE}>
                Plantilla Oficial WORLD OFFICE (.CSV - Partida Doble)
              </MenuItem>
              <MenuItem value={AccountingExportFormat.HELISA}>
                Plantilla Oficial HELISA GW / NIIF (.CSV - Partida Doble)
              </MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              label="Ambiente DIAN"
              value={settings.dianEnvironment || DianEnvironmentType.HABILITACION_2}
              onChange={(e) => setSettings({ ...settings, dianEnvironment: e.target.value as DianEnvironmentType })}
            >
              <MenuItem value={DianEnvironmentType.HABILITACION_2}>
                Ambiente de Habilitación / Pruebas (Set de Pruebas DIAN)
              </MenuItem>
              <MenuItem value={DianEnvironmentType.PRODUCCION_1}>
                Ambiente de Producción Oficial DIAN
              </MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Prefijo Nómina Individual"
              value={settings.dianPrefix ?? "NE"}
              onChange={(e) => setSettings({ ...settings, dianPrefix: e.target.value })}
              helperText="Ejemplo: NE, NOM"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Prefijo Nota de Ajuste"
              value={settings.dianAdjustmentPrefix ?? "NA"}
              onChange={(e) => setSettings({ ...settings, dianAdjustmentPrefix: e.target.value })}
              helperText="Ejemplo: NA, NAJ"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="ID de Software DIAN / PT"
              value={settings.dianSoftwareId ?? ""}
              onChange={(e) => setSettings({ ...settings, dianSoftwareId: e.target.value })}
              placeholder="UUID o ID asignado"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="PIN de Software DIAN / PT"
              value={settings.dianSoftwarePin ?? ""}
              onChange={(e) => setSettings({ ...settings, dianSoftwarePin: e.target.value })}
              placeholder="PIN de 5 dígitos"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Token API / Clave Secreta Proveedor"
              type="password"
              value={settings.dianApiToken ?? ""}
              onChange={(e) => setSettings({ ...settings, dianApiToken: e.target.value })}
              placeholder="Bearer Token Dataico o The Factory HKA"
            />
          </Grid>
        </Grid>
      </Paper>
    );
  }

  // --- TAB 2: CONCEPTOS Y MATRIZ DE BASES ---
  function renderTabConceptsAndMatrix() {
    return (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main }}>
              Catálogo de Conceptos Contables y Banderas de Base (Pronos)
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Cuentas PUC 5105/7205, códigos DIAN NIE y 10 banderas de inclusión en bases de cálculo
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {Object.keys(matrixEdits).length > 0 && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<SaveOutlined />}
                onClick={handleSaveMatrixChanges}
                disabled={saving}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                Guardar Cambios ({Object.keys(matrixEdits).length})
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddOutlined />}
              onClick={() => {
                setEditingConcept({
                  nature: PayrollConceptNature.DEVENGO,
                  proportionality: PayrollProportionality.DAYS,
                  inLiq: true,
                });
                setConceptDrawerOpen(true);
              }}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Nuevo Concepto
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 2, maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>CÓD.</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>NOMBRE CONCEPTO</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>NATURALEZA</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>PUC ADMIN</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>PUC OPER</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>DIAN NIE</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>LIQ</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>PRI</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>TIS</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>VAC</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>CES</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>IBC</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>ARL</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>CCF</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>LHEX</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.72rem" }}>LNR</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {concepts.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "rgba(124, 58, 237, 0.035)" },
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: noxiaPalette.primary.main }}>
                    {String(c.code).padStart(3, "0")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>
                    {c.name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.nature}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        height: 22,
                        bgcolor:
                          c.nature === PayrollConceptNature.DEVENGO
                            ? "#ECFDF5"
                            : c.nature === PayrollConceptNature.DEDUCCION
                              ? "#FFF1F2"
                              : "#EEF2FF",
                        color:
                          c.nature === PayrollConceptNature.DEVENGO
                            ? "#059669"
                            : c.nature === PayrollConceptNature.DEDUCCION
                              ? "#E11D48"
                              : "#4F46E5",
                        border: `1px solid ${c.nature === PayrollConceptNature.DEVENGO
                            ? "#A7F3D0"
                            : c.nature === PayrollConceptNature.DEDUCCION
                              ? "#FECDD3"
                              : "#C7D2FE"
                          }`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem" }}>
                    {c.adminPucAccount || "-"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.8rem" }}>
                    {c.operativePucAccount || "-"}
                  </TableCell>
                  <TableCell>
                    {c.dianNieCode ? (
                      <Chip
                        label={c.dianNieCode}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          height: 20,
                          bgcolor: "#FFFBEB",
                          color: "#D97706",
                          border: "1px solid #FDE68A",
                        }}
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  {/* 10 Checkboxes de Banderas de Base */}
                  {(
                    [
                      "inLiq",
                      "inPri",
                      "inTis",
                      "inVac",
                      "inCes",
                      "inIbcEpsAfp",
                      "inIbcArl",
                      "inIbcCcf",
                      "inLhex",
                      "inLnr",
                    ] as (keyof PayrollConcept)[]
                  ).map((flag) => {
                    const val = c[flag] as boolean;
                    return (
                      <TableCell
                        key={flag}
                        align="center"
                        sx={{ cursor: "pointer", px: 0.5 }}
                        onClick={() => handleToggleMatrixFlag(c.id, flag)}
                      >
                        <Tooltip title={`Alternar bandera ${flag}`}>
                          <span>
                            {val ? (
                              <CheckCircleRounded sx={{ color: "#059669", fontSize: 18 }} />
                            ) : (
                              <RemoveCircleOutlineRounded sx={{ color: "#CBD5E1", fontSize: 18 }} />
                            )}
                          </span>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  // --- TAB 3: MODALIDADES DE TURNO ---
  function renderTabShiftModalities() {
    return (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main }}>
              Modalidades de Turno y Desglose de Sueldo Garantizado
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Distribución porcentual del excedente sobre el SMMLV entre conceptos suplementarios (suma = 100.00%)
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddOutlined />}
            onClick={() => {
              setEditingModality({
                code: (modalities.length || 0) + 1,
                shiftClass: ShiftModalityClass.ROTATING,
                items: [],
              });
              setModalityDrawerOpen(true);
            }}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Nueva Modalidad
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          {modalities.map((mod) => (
            <Grid size={{ xs: 12, md: 6 }} key={mod.id}>
              <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2.5, p: 2.5, bgcolor: "#FAFAFA" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
                      Cód. {mod.code} - {mod.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Clase: {mod.shiftClass} • {mod.hoursPerShift} Horas/Turno
                    </Typography>
                  </Box>
                  <Chip
                    label="100.00%"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: "#ECFDF5",
                      color: "#059669",
                      border: "1px solid #A7F3D0",
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontSize: "0.85rem" }}>
                  {mod.description || "Distribución garantizada según tabla operativa"}
                </Typography>

                <Typography variant="caption" sx={{ color: noxiaPalette.primary.main, fontWeight: 700, textTransform: "uppercase", display: "block", mb: 1 }}>
                  Distribución Porcentual del Excedente:
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {mod.items.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1.2,
                        bgcolor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                        Cód. {item.concept.code} - {item.concept.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: noxiaPalette.primary.main }}>
                        {Number(item.percentage).toFixed(2)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  // --- TAB 4: CATÁLOGOS OFICIALES PRONOS ---
  function renderTabOfficialCatalogs() {
    return (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, mb: 1 }}>
          Catálogos Maestros de Seguridad Privada
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Entidades de seguridad social PILA, bancos para dispersión ACH, causales de retiro y niveles SVSP
        </Typography>

        <Grid container spacing={3}>
          {/* Entidades EPS/AFP/ARL/CCF */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ color: noxiaPalette.primary.main, fontWeight: 700, mb: 1.5, textTransform: "uppercase" }}>
              Entidades de Seguridad Social ({entities.length})
            </Typography>
            <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 2, maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>TIPO</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>ENTIDAD</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>NIT</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>PILA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entities.slice(0, 15).map((ent) => (
                    <TableRow key={ent.id} hover sx={{ borderBottom: "1px solid #E2E8F0" }}>
                      <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>{ent.entityType}</TableCell>
                      <TableCell sx={{ color: "text.primary" }}>{ent.name}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", color: "text.secondary" }}>{ent.nit}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 600, color: noxiaPalette.primary.main }}>
                        {ent.pluCode}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Bancos ACH */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ color: noxiaPalette.primary.main, fontWeight: 700, mb: 1.5, textTransform: "uppercase" }}>
              Bancos Dispersión ACH ({banks.length})
            </Typography>
            <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 2, maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>CÓD. ACH</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>ENTIDAD BANCARIA</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>FORMATO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {banks.map((bk) => (
                    <TableRow key={bk.id} hover sx={{ borderBottom: "1px solid #E2E8F0" }}>
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: noxiaPalette.primary.main }}>
                        {bk.code}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>{bk.name}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", color: "text.secondary" }}>{bk.exportFormat}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Causales de Retiro */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ color: noxiaPalette.primary.main, fontWeight: 700, mb: 1.5, textTransform: "uppercase" }}>
              Causales de Retiro B.D.N Pronos ({exitReasons.length})
            </Typography>
            <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 2, maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>CÓD.</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>MOTIVO DE RETIRO</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>INDEMNIZACIÓN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exitReasons.map((ex) => (
                    <TableRow key={ex.id} hover sx={{ borderBottom: "1px solid #E2E8F0" }}>
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: noxiaPalette.primary.main }}>
                        {ex.code}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>{ex.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={ex.isJustCause ? "Sin Indemnización" : "Con Indemnización"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 20,
                            bgcolor: ex.isJustCause ? "#F1F5F9" : "#FFF1F2",
                            color: ex.isJustCause ? "#475569" : "#E11D48",
                            border: `1px solid ${ex.isJustCause ? "#CBD5E1" : "#FECDD3"}`,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Cursos SVSP */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ color: noxiaPalette.primary.main, fontWeight: 700, mb: 1.5, textTransform: "uppercase" }}>
              Cursos Reglamentarios SuperVigilancia ({svspLevels.length})
            </Typography>
            <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 2, maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>CÓD.</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>CURSO / CAPACITACIÓN</TableCell>
                    <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>VIGENCIA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {svspLevels.map((sv) => (
                    <TableRow key={sv.id} hover sx={{ borderBottom: "1px solid #E2E8F0" }}>
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: noxiaPalette.primary.main }}>
                        {sv.code}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>{sv.name}</TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                        {sv.validityDays} días (1 año)
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Paper>
    );
  }

  // --- TAB 5: CALENDARIO DE FESTIVOS EMILIANI ---
  function renderTabEmilianiHolidays() {
    return (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main }}>
              Calendario Legal de Días Festivos (Ley 51 de 1983 - Ley Emiliani)
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Cálculo de Pascua (algoritmo Computus Gregoriano) y traslados a lunes para liquidación de recargos
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              select
              size="small"
              label="Año de Vigencia"
              value={selectedYear}
              onChange={async (e) => {
                const y = Number(e.target.value);
                setSelectedYear(y);
                const res = await PayrollApi.getHolidays(y);
                if (res) setHolidays(res);
              }}
              sx={{ width: 140 }}
            >
              <MenuItem value={2025}>2025</MenuItem>
              <MenuItem value={2026}>2026</MenuItem>
              <MenuItem value={2027}>2027</MenuItem>
            </TextField>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ElectricBoltOutlined />}
              onClick={handleGenerateHolidays}
              disabled={saving}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              Calcular 18 Festivos {selectedYear}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {holidays.map((h) => {
            const dateObj = new Date(h.date);
            const dayName = dateObj.toLocaleDateString("es-CO", { weekday: "long", timeZone: "UTC" });
            const fullDate = dateObj.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={h.id}>
                <Card elevation={0} sx={{ border: "1px solid #E2E8F0", p: 2, borderRadius: 2, bgcolor: "#FAFAFA" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: noxiaPalette.primary.main, fontWeight: 700, textTransform: "capitalize" }}>
                      {dayName}
                    </Typography>
                    <Chip
                      label={h.isNational ? "Ley 51/1983" : "Regional"}
                      size="small"
                      sx={{ fontSize: "0.7rem", height: 20, bgcolor: "#F1F5F9", color: "#475569" }}
                    />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mt: 0.5 }}>
                    {h.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontFamily: "monospace", fontSize: "0.85rem" }}>
                    {fullDate}
                  </Typography>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  }
}
