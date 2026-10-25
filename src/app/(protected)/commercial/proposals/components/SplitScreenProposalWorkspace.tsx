"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Card,
  CircularProgress,
  Drawer,
  AppBar,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  PictureAsPdf,
  SaveOutlined,
  FormatPaint,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp,
  WarningAmber,
  Block,
  Calculate,
  CheckCircle,
} from "@mui/icons-material";
import TipTapRichEditor from "./TipTapRichEditor";
import ChameleonPdfPreview from "./ChameleonPdfPreview";
import ClientAutocomplete, { ClientOption } from "@/components/common/ClientAutocomplete";
import {
  DocumentHeaderLayout,
  TenantDocumentSkin,
  AuthorizedSigner,
  DocumentTextSnippet,
  DocumentEngineApi,
  CommercialSettingsApi,
  CommercialSector,
  WeaponModality,
  ShiftScheduleType,
} from "@/lib/api/commercial-settings";
import {
  commercialProposalsApi,
  PnlHealthStatus,
  PnlSimulationResult,
  ProposalServiceItemPayload,
  ProposalValueAddedItemPayload,
  BenefitPeriodicity,
} from "@/lib/api/commercial-proposals";
import { useNotification } from "@/providers/NotificationProvider";

interface SplitScreenProposalWorkspaceProps {
  open: boolean;
  onClose: () => void;
  initialProposal?: any;
}

interface LocalServicePosition {
  id: string;
  positionTitle: string;
  quantity: number;
  scheduleType: ShiftScheduleType;
  weaponModality: WeaponModality;
  tariffCategory: CommercialSector;
  unitMonthlyBilledPrice: number;
  unitMonthlyRealCost: number;
}

interface LocalValueAddedItem {
  id: string;
  itemName: string;
  quantity: number;
  periodicity: BenefitPeriodicity;
  itemInternalCost: number;
  notes?: string;
}

const SHIFT_OPTIONS = [
  { value: ShiftScheduleType.SCHEDULE_2X2X2, label: "Turno 2x2x2 (24 Horas Rotativo)" },
  { value: ShiftScheduleType.SCHEDULE_3X3X2, label: "Turno 3x3x2 (24 Horas Relevos)" },
  { value: ShiftScheduleType.SCHEDULE_4X4X2, label: "Turno 4x4x2 (24 Horas Extendido)" },
  { value: ShiftScheduleType.SCHEDULE_5X1, label: "Turno 5x1 (12 Horas Lunes-Viernes)" },
  { value: ShiftScheduleType.SCHEDULE_5X2, label: "Turno 5x2 (12 Horas Hábil)" },
  { value: ShiftScheduleType.SCHEDULE_6X1, label: "Turno 6x1 (12 Horas Diurno/Nocturno)" },
  { value: ShiftScheduleType.SCHEDULE_6X2, label: "Turno 6x2 (12 Horas Especial)" },
  { value: ShiftScheduleType.SCHEDULE_7X1, label: "Turno 7x1 (Refuerzo Dominical)" },
  { value: ShiftScheduleType.SPECIAL_CUSTOM, label: "Turno Especial / A la Medida" },
];

const MODALITY_OPTIONS = [
  { value: WeaponModality.LETHAL_WEAPON, label: "Arma de Fuego Letal" },
  { value: WeaponModality.NO_WEAPON, label: "Sin Arma (Desarmado)" },
  { value: WeaponModality.NON_LETHAL_WEAPON, label: "Arma No Letal / Traumática" },
  { value: WeaponModality.CANINE_SUPPORT, label: "Manejador con Guía Canino" },
];

const SECTOR_OPTIONS = [
  { value: CommercialSector.RESIDENTIAL_STRATA_4_6, label: "Residencial Estratos 4, 5 y 6" },
  { value: CommercialSector.RESIDENTIAL_STRATA_1_3, label: "Residencial Estratos 1, 2 y 3 (Tarifa Plana)" },
  { value: CommercialSector.COMMERCIAL_PUBLIC, label: "Comercial, Industrial y Oficial" },
];

const PERIODICITY_OPTIONS = [
  { value: "SINGLE_ONE_TIME", label: "Única Vez (Instalación)" },
  { value: "MONTHLY_RECURRING", label: "Mensual Recurrente" },
  { value: "ANNUAL_RENEWAL", label: "Anual (Renovación)" },
];

export default function SplitScreenProposalWorkspace({
  open,
  onClose,
  initialProposal,
}: SplitScreenProposalWorkspaceProps) {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Configuration from backend
  const [tariffPeriodId, setTariffPeriodId] = useState<string>("");
  const [skin, setSkin] = useState<Partial<TenantDocumentSkin> | null>(null);
  const [signers, setSigners] = useState<AuthorizedSigner[]>([]);
  const [snippets, setSnippets] = useState<DocumentTextSnippet[]>([]);

  // Selected Client
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [clientCity, setClientCity] = useState("Bogotá D.C.");
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(12);
  const [promptPaymentDiscount, setPromptPaymentDiscount] = useState<number>(0);
  const [proposalNumber, setProposalNumber] = useState(
    `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [headerLayout, setHeaderLayout] = useState<DocumentHeaderLayout>(
    DocumentHeaderLayout.MODERN_MINIMALIST
  );

  // Proposal Document Body (TipTap Editor)
  const [bodyHtml, setBodyHtml] = useState(
    "<p>Estimados señores del Consejo de Administración y Gerencia,</p><p>De acuerdo con su atenta solicitud, nos complace presentar nuestra propuesta formal técnico-económica para el suministro de vigilancia y seguridad privada integral, cumpliendo rigurosamente con los decretos tarifarios vigentes emitidos por la Superintendencia de Vigilancia y Seguridad Privada.</p><p>Nuestro personal cuenta con formación certificada en control de accesos, manejo de sistemas electrónicos, primeros auxilios y protocolo de atención al usuario.</p>"
  );

  // Positions (Estructura Económica)
  const [servicePositions, setServicePositions] = useState<LocalServicePosition[]>([
    {
      id: "pos-1",
      positionTitle: "Guarda de Seguridad 24 Horas",
      quantity: 1,
      scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
      weaponModality: WeaponModality.LETHAL_WEAPON,
      tariffCategory: CommercialSector.RESIDENTIAL_STRATA_4_6,
      unitMonthlyBilledPrice: 17270787,
      unitMonthlyRealCost: 11400000,
    },
  ]);

  // Values Added (VAG)
  const [valueAddedItems, setValueAddedItems] = useState<LocalValueAddedItem[]>([]);

  // Selected Signers
  const [selectedSignerIds, setSelectedSignerIds] = useState<string[]>([]);

  // Live P&L Simulation Result
  const [pnlResult, setPnlResult] = useState<PnlSimulationResult | null>(null);
  const [simulatingPnl, setSimulatingPnl] = useState(false);

  // Load backend configuration
  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [settingsRes, previewRes, snippetsRes, signersRes] = await Promise.all([
        CommercialSettingsApi.getSettings().catch(() => null),
        DocumentEngineApi.getPreviewConfig().catch(() => null),
        CommercialSettingsApi.getTextSnippets().catch(() => []),
        DocumentEngineApi.getSigners().catch(() => []),
      ]);

      const activeTariff = settingsRes?.tariffPeriods?.find((t) => t.isActive) || settingsRes?.tariffPeriods?.[0];
      if (activeTariff?.id) {
        setTariffPeriodId(activeTariff.id);
      }
      if (previewRes?.skin) {
        setSkin(previewRes.skin);
        if (previewRes.skin.headerLayout) {
          setHeaderLayout(previewRes.skin.headerLayout as DocumentHeaderLayout);
        }
      }
      setSnippets(snippetsRes || []);
      const typedSigners: AuthorizedSigner[] = (signersRes as AuthorizedSigner[]) || [];
      setSigners(typedSigners);

      const defaultSigners = typedSigners
        .filter((s: AuthorizedSigner) => s.includeInCommercialProposal)
        .map((s: AuthorizedSigner) => s.id);
      setSelectedSignerIds(defaultSigners);
    } catch (err: any) {
      showError("Error al cargar la configuración comercial y tarifaria.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger P&L Simulation whenever positions, VAGs or discounts change
  const triggerPnlSimulation = useCallback(async () => {
    if (servicePositions.length === 0) {
      setPnlResult(null);
      return;
    }
    setSimulatingPnl(true);
    try {
      const res = await commercialProposalsApi.simulatePnl({
        contractDurationMonths,
        promptPaymentDiscPercent: promptPaymentDiscount,
        items: servicePositions.map((pos) => ({
          positionTitle: pos.positionTitle,
          quantity: Number(pos.quantity) || 1,
          unitMonthlyBilledPrice: Number(pos.unitMonthlyBilledPrice) || 0,
          unitMonthlyRealCost: Number(pos.unitMonthlyRealCost) || 0,
        })),
        valueAddedItems: valueAddedItems.map((vag) => ({
          itemName: vag.itemName,
          quantity: Number(vag.quantity) || 1,
          periodicity: vag.periodicity,
          itemInternalCost: Number(vag.itemInternalCost) || 0,
        })),
      });
      setPnlResult(res);
    } catch (err) {
      // Fallback local calculation if backend simulation fails
      const subtotal = servicePositions.reduce(
        (acc, p) => acc + (Number(p.unitMonthlyBilledPrice) || 0) * (Number(p.quantity) || 1),
        0
      );
      const totalLabor = servicePositions.reduce(
        (acc, p) => acc + (Number(p.unitMonthlyRealCost) || 0) * (Number(p.quantity) || 1),
        0
      );
      const totalVagCost = valueAddedItems.reduce((acc, v) => {
        const cost = (Number(v.itemInternalCost) || 0) * (Number(v.quantity) || 1);
        if (v.periodicity === "MONTHLY_RECURRING") return acc + cost;
        if (v.periodicity === "ANNUAL_RENEWAL") return acc + cost / 12;
        return acc + cost / (contractDurationMonths || 12);
      }, 0);

      const marginAmount = subtotal - totalLabor - totalVagCost;
      const marginPct = subtotal > 0 ? (marginAmount / subtotal) * 100 : 0;
      let pnlStatus: PnlHealthStatus = "PROFITABLE";
      if (marginPct < 8) pnlStatus = "DEFICIT_BLOCKED";
      else if (marginPct < 15) pnlStatus = "WARNING_LOW_MARGIN";

      setPnlResult({
        subtotalMonthlyPreDisc: subtotal,
        promptPaymentDiscPercent: promptPaymentDiscount,
        promptPaymentDiscAmount: (subtotal * promptPaymentDiscount) / 100,
        subtotalMonthlyAfterDisc: subtotal - (subtotal * promptPaymentDiscount) / 100,
        aiuBaseAmount: subtotal * 0.1,
        ivaAmount: subtotal * 0.1 * 0.19,
        totalMonthlyWithTax: subtotal + subtotal * 0.1 * 0.19,
        totalAnnualContractValue: (subtotal + subtotal * 0.1 * 0.19) * contractDurationMonths,
        estimatedMonthlyRealCost: totalLabor,
        monthlyVagAmortization: totalVagCost,
        totalMonthlyOperatingCost: totalLabor + totalVagCost,
        netMonthlyMarginAmount: marginAmount,
        netMarginPercentage: marginPct,
        pnlStatus,
      });
    } finally {
      setSimulatingPnl(false);
    }
  }, [servicePositions, valueAddedItems, contractDurationMonths, promptPaymentDiscount]);

  useEffect(() => {
    triggerPnlSimulation();
  }, [triggerPnlSimulation]);

  // Position Handlers
  const handleAddPosition = () => {
    const newPos: LocalServicePosition = {
      id: `pos-${Date.now()}`,
      positionTitle: "Guarda de Seguridad 24 Horas",
      quantity: 1,
      scheduleType: ShiftScheduleType.SCHEDULE_2X2X2,
      weaponModality: WeaponModality.LETHAL_WEAPON,
      tariffCategory: CommercialSector.RESIDENTIAL_STRATA_4_6,
      unitMonthlyBilledPrice: 17270787,
      unitMonthlyRealCost: 11400000,
    };
    setServicePositions((prev) => [...prev, newPos]);
  };

  const handleUpdatePosition = (id: string, field: keyof LocalServicePosition, value: any) => {
    setServicePositions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemovePosition = (id: string) => {
    if (servicePositions.length === 1) {
      showError("Debe mantener al menos una posición en la propuesta.");
      return;
    }
    setServicePositions((prev) => prev.filter((p) => p.id !== id));
  };

  // VAG Handlers
  const handleAddVag = () => {
    const newVag: LocalValueAddedItem = {
      id: `vag-${Date.now()}`,
      itemName: "Estudio de Seguridad y Matriz de Riesgos",
      quantity: 1,
      periodicity: "SINGLE_ONE_TIME",
      itemInternalCost: 1500000,
      notes: "Sin costo adicional para el cliente",
    };
    setValueAddedItems((prev) => [...prev, newVag]);
  };

  const handleUpdateVag = (id: string, field: keyof LocalValueAddedItem, value: any) => {
    setValueAddedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveVag = (id: string) => {
    setValueAddedItems((prev) => prev.filter((v) => v.id !== id));
  };

  // Snippets Handler
  const handleApplySnippet = (snippet: DocumentTextSnippet) => {
    let content = snippet.bodyTemplate;
    content = content.replace(/{{client_name}}/g, selectedClient?.name || "CONJUNTO RESIDENCIAL");
    content = content.replace(/{{current_year}}/g, new Date().getFullYear().toString());
    content = content.replace(/{{monthly_rate}}/g, `$ ${(pnlResult?.totalMonthlyWithTax || 0).toLocaleString("es-CO")} COP`);
    content = content.replace(/{{company_legal_name}}/g, skin?.companyLegalName || "NOXIA SEGURIDAD S.A.S.");
    content = content.replace(/{{company_nit}}/g, skin?.companyNit || "900.000.000-1");

    setBodyHtml(`<p>${content.replace(/\n/g, "</p><p>")}</p>`);
    showSuccess(`Plantilla "${snippet.title}" insertada en el editor.`);
  };

  // Signers
  const activeSigners = useMemo(
    () => signers.filter((s) => selectedSignerIds.includes(s.id)),
    [signers, selectedSignerIds]
  );

  // Save Proposal to Real Backend API
  const handleSaveProposal = async () => {
    if (!selectedClient?.id) {
      showError("Por favor seleccione un cliente o prospecto destinatario.");
      return;
    }
    if (servicePositions.length === 0) {
      showError("La propuesta debe contener al menos un puesto de seguridad.");
      return;
    }

    setSaving(true);
    try {
      const payloadItems: ProposalServiceItemPayload[] = servicePositions.map((pos, idx) => ({
        positionTitle: pos.positionTitle,
        quantity: Number(pos.quantity) || 1,
        scheduleType: pos.scheduleType,
        weaponModality: pos.weaponModality,
        tariffCategory: pos.tariffCategory,
        unitMonthlyBilledPrice: Number(pos.unitMonthlyBilledPrice) || 0,
        unitMonthlyRealCost: Number(pos.unitMonthlyRealCost) || 0,
        sortOrder: idx + 1,
      }));

      const payloadVags: ProposalValueAddedItemPayload[] = valueAddedItems.map((vag) => ({
        itemName: vag.itemName,
        quantity: Number(vag.quantity) || 1,
        periodicity: vag.periodicity,
        itemInternalCost: Number(vag.itemInternalCost) || 0,
        notes: vag.notes,
      }));

      await commercialProposalsApi.createProposal({
        clientId: selectedClient.id,
        tariffPeriodId: tariffPeriodId || "tariff-default",
        contractType: "NEW_CONTRACT",
        contractDurationMonths: Number(contractDurationMonths) || 12,
        promptPaymentDiscPercent: Number(promptPaymentDiscount) || 0,
        items: payloadItems,
        valueAddedItems: payloadVags,
        draftSnapshotJson: {
          bodyHtml,
          selectedSignerIds,
          headerLayout,
          clientCity,
        },
      });

      showSuccess(`¡Propuesta comercial emitida exitosamente con folio correlativo!`);
      onClose();
    } catch (err: any) {
      showError(err.message || "Error al emitir y persistir la propuesta comercial.");
    } finally {
      setSaving(false);
    }
  };

  const previewServiceItems = useMemo(
    () =>
      servicePositions.map((p) => ({
        name: p.positionTitle,
        modality: MODALITY_OPTIONS.find((m) => m.value === p.weaponModality)?.label || p.weaponModality,
        hours: SHIFT_OPTIONS.find((s) => s.value === p.scheduleType)?.label || p.scheduleType,
        postsCount: p.quantity,
        monthlyTotal: (Number(p.unitMonthlyBilledPrice) || 0) * (Number(p.quantity) || 1),
      })),
    [servicePositions]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "100vw",
          height: "100vh",
          bgcolor: "neutral.50",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Top Tactical App Bar */}
      <AppBar sx={{ position: "relative", bgcolor: "secondary.main", color: "#ffffff", boxShadow: 2 }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "0.02em" }}>
                Emisión de Propuesta y Cotización Técnico-Económica
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                {proposalNumber} • Motor Tarifario y Simulación P&L en Tiempo Real
              </Typography>
            </Box>
          </Stack>

          {/* Right Action Bar */}
          <Stack direction="row" spacing={2} alignItems="center">
            {pnlResult && (
              <Chip
                icon={
                  pnlResult.pnlStatus === "PROFITABLE" ? (
                    <TrendingUp fontSize="small" sx={{ color: "#ffffff !important" }} />
                  ) : pnlResult.pnlStatus === "WARNING_LOW_MARGIN" ? (
                    <WarningAmber fontSize="small" sx={{ color: "#ffffff !important" }} />
                  ) : (
                    <Block fontSize="small" sx={{ color: "#ffffff !important" }} />
                  )
                }
                label={`Margen P&L: ${pnlResult.netMarginPercentage.toFixed(1)}% (${
                  pnlResult.pnlStatus === "PROFITABLE"
                    ? "Saludable"
                    : pnlResult.pnlStatus === "WARNING_LOW_MARGIN"
                    ? "Ajustado"
                    : "Riesgo Crítico"
                })`}
                color={
                  pnlResult.pnlStatus === "PROFITABLE"
                    ? "success"
                    : pnlResult.pnlStatus === "WARNING_LOW_MARGIN"
                    ? "warning"
                    : "error"
                }
                sx={{ fontWeight: 800, fontSize: "0.8rem", px: 1 }}
              />
            )}

            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
              onClick={handleSaveProposal}
              disabled={saving}
              sx={{ fontWeight: 700, px: 2.5, borderRadius: 2 }}
            >
              {saving ? "Emitiendo..." : "Guardar y Emitir Cotización"}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main Split-Screen Layout */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* PANEL IZQUIERDO: Configurador Económico y Editor (50% en Desktop) */}
          <Box
            sx={{
              width: { xs: "100%", md: "52%" },
              height: "100%",
              overflowY: "auto",
              p: 3,
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Stack spacing={3.5}>
              {/* Sección 1: Cliente / Prospecto Destinatario */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1.5, textTransform: "uppercase" }}>
                  1. Cliente / Prospecto Destinatario
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <ClientAutocomplete
                      value={selectedClient}
                      onChange={(client) => {
                        setSelectedClient(client);
                      }}
                      label="Seleccionar Cliente o Prospecto *"
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Ciudad / Ubicación de la Sede"
                      fullWidth
                      size="small"
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Duración (Meses)"
                      type="number"
                      fullWidth
                      size="small"
                      value={contractDurationMonths}
                      onChange={(e) => setContractDurationMonths(Number(e.target.value) || 12)}
                    />
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Desc. Pronto Pago (%)"
                      type="number"
                      fullWidth
                      size="small"
                      value={promptPaymentDiscount}
                      onChange={(e) => setPromptPaymentDiscount(Number(e.target.value) || 0)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Sección 2: Estructura Económica y Puestos de Vigilancia */}
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", textTransform: "uppercase" }}>
                      2. Estructura Económica y Puestos de Vigilancia
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Defina los puestos, esquemas de turno, modalidad y precios de venta según la SVSP
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddPosition}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                  >
                    Agregar Puesto
                  </Button>
                </Box>

                <Stack spacing={2}>
                  {servicePositions.map((pos, idx) => (
                    <Paper
                      key={pos.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2, bgcolor: "neutral.50" }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Puesto #{idx + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemovePosition(pos.id)}
                          disabled={servicePositions.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <TextField
                            label="Título del Puesto / Cargo *"
                            fullWidth
                            size="small"
                            value={pos.positionTitle}
                            onChange={(e) => handleUpdatePosition(pos.id, "positionTitle", e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Cantidad de Puestos *"
                            type="number"
                            fullWidth
                            size="small"
                            value={pos.quantity}
                            onChange={(e) => handleUpdatePosition(pos.id, "quantity", Number(e.target.value))}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            select
                            label="Esquema de Turno *"
                            fullWidth
                            size="small"
                            value={pos.scheduleType}
                            onChange={(e) => handleUpdatePosition(pos.id, "scheduleType", e.target.value)}
                          >
                            {SHIFT_OPTIONS.map((sh) => (
                              <MenuItem key={sh.value} value={sh.value}>
                                {sh.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            select
                            label="Modalidad de Arma *"
                            fullWidth
                            size="small"
                            value={pos.weaponModality}
                            onChange={(e) => handleUpdatePosition(pos.id, "weaponModality", e.target.value)}
                          >
                            {MODALITY_OPTIONS.map((m) => (
                              <MenuItem key={m.value} value={m.value}>
                                {m.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <TextField
                            select
                            label="Sector Tarifario SVSP *"
                            fullWidth
                            size="small"
                            value={pos.tariffCategory}
                            onChange={(e) => handleUpdatePosition(pos.id, "tariffCategory", e.target.value)}
                          >
                            {SECTOR_OPTIONS.map((sec) => (
                              <MenuItem key={sec.value} value={sec.value}>
                                {sec.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Precio Venta Mensual (COP) *"
                            type="number"
                            fullWidth
                            size="small"
                            value={pos.unitMonthlyBilledPrice}
                            onChange={(e) =>
                              handleUpdatePosition(pos.id, "unitMonthlyBilledPrice", Number(e.target.value))
                            }
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Costo Laboral Mensual Estimado (COP) *"
                            type="number"
                            fullWidth
                            size="small"
                            value={pos.unitMonthlyRealCost}
                            onChange={(e) =>
                              handleUpdatePosition(pos.id, "unitMonthlyRealCost", Number(e.target.value))
                            }
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Sección 3: Valores Agregados Gratuitos (VAG) */}
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", textTransform: "uppercase" }}>
                      3. Valores Agregados Gratuitos (VAG)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Equipamiento o servicios de cortesía que amortizan directamente contra el P&L
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddVag}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                  >
                    Agregar VAG
                  </Button>
                </Box>

                {valueAddedItems.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      No hay valores agregados configurados en esta propuesta.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.5}>
                    {valueAddedItems.map((vag) => (
                      <Paper key={vag.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Grid container spacing={1.5} alignItems="center">
                          <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                              label="Nombre del Beneficio / VAG *"
                              fullWidth
                              size="small"
                              value={vag.itemName}
                              onChange={(e) => handleUpdateVag(vag.id, "itemName", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 4, sm: 2 }}>
                            <TextField
                              label="Cantidad"
                              type="number"
                              fullWidth
                              size="small"
                              value={vag.quantity}
                              onChange={(e) => handleUpdateVag(vag.id, "quantity", Number(e.target.value))}
                            />
                          </Grid>
                          <Grid size={{ xs: 8, sm: 2.5 }}>
                            <TextField
                              label="Costo Interno (COP)"
                              type="number"
                              fullWidth
                              size="small"
                              value={vag.itemInternalCost}
                              onChange={(e) =>
                                handleUpdateVag(vag.id, "itemInternalCost", Number(e.target.value))
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 10, sm: 2 }}>
                            <TextField
                              select
                              label="Periodicidad"
                              fullWidth
                              size="small"
                              value={vag.periodicity}
                              onChange={(e) => handleUpdateVag(vag.id, "periodicity", e.target.value)}
                            >
                              {PERIODICITY_OPTIONS.map((p) => (
                                <MenuItem key={p.value} value={p.value}>
                                  {p.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 2, sm: 0.5 }} sx={{ textAlign: "right" }}>
                            <IconButton size="small" color="error" onClick={() => handleRemoveVag(vag.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider />

              {/* Sección 4: Semáforo P&L en Vivo */}
              {pnlResult && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: (theme) =>
                      pnlResult.pnlStatus === "PROFITABLE"
                        ? "rgba(5, 150, 105, 0.04)"
                        : pnlResult.pnlStatus === "WARNING_LOW_MARGIN"
                        ? "rgba(217, 119, 6, 0.04)"
                        : "rgba(225, 29, 72, 0.04)",
                    borderColor: (theme) =>
                      pnlResult.pnlStatus === "PROFITABLE"
                        ? "success.light"
                        : pnlResult.pnlStatus === "WARNING_LOW_MARGIN"
                        ? "warning.light"
                        : "error.light",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Calculate color="primary" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase" }}>
                        4. Análisis Financiero P&L y Semáforo en Vivo
                      </Typography>
                    </Stack>
                    <Chip
                      label={`Margen: ${pnlResult.netMarginPercentage.toFixed(1)}%`}
                      color={
                        pnlResult.pnlStatus === "PROFITABLE"
                          ? "success"
                          : pnlResult.pnlStatus === "WARNING_LOW_MARGIN"
                          ? "warning"
                          : "error"
                      }
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Subtotal Mensual
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        $ {pnlResult.subtotalMonthlyPreDisc.toLocaleString("es-CO")}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Costo Nómina Directa
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="text.secondary">
                        $ {pnlResult.estimatedMonthlyRealCost.toLocaleString("es-CO")}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Amortización VAG Mensual
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="text.secondary">
                        $ {pnlResult.monthlyVagAmortization.toLocaleString("es-CO")}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        Margen Bruto Mensual
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                        color={pnlResult.pnlStatus === "PROFITABLE" ? "success.main" : "error.main"}
                      >
                        $ {pnlResult.netMonthlyMarginAmount.toLocaleString("es-CO")}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              <Divider />

              {/* Sección 5: Membrete Camaleón */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1, textTransform: "uppercase" }}>
                  5. Diseño de Membrete Institucional
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { id: DocumentHeaderLayout.MODERN_MINIMALIST, label: "Minimalista Moderno", desc: "Barra lateral acento y datos limpios" },
                    { id: DocumentHeaderLayout.CLASSIC_CORPORATE, label: "Clásico Corporativo", desc: "Banda superior sólida a color" },
                    { id: DocumentHeaderLayout.EDITORIAL_CENTERED, label: "Editorial Centrado", desc: "Tipografía sobria y logo superior" },
                    { id: DocumentHeaderLayout.FRAME_ACCREDITED, label: "Marco Acreditado", desc: "Sellos ISO, BASC y PONAL" },
                  ].map((l) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={l.id}>
                      <Card
                        onClick={() => setHeaderLayout(l.id)}
                        sx={{
                          p: 1.5,
                          cursor: "pointer",
                          borderRadius: 2,
                          textAlign: "center",
                          border: "2px solid",
                          borderColor: headerLayout === l.id ? "primary.main" : "divider",
                          bgcolor: headerLayout === l.id ? "primary.soft" : "background.paper",
                          transition: "all 0.18s ease-in-out",
                          "&:hover": { borderColor: "primary.main" },
                        }}
                      >
                        <FormatPaint
                          sx={{
                            fontSize: 20,
                            color: headerLayout === l.id ? "primary.main" : "text.secondary",
                            mb: 0.5,
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>
                          {l.label}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider />

              {/* Sección 6: Redacción de Minuta / TipTap */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", textTransform: "uppercase" }}>
                    6. Redacción de Minuta / Cláusula de Presentación
                  </Typography>
                  {snippets.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Seleccione una plantilla para autocompletar variables
                    </Typography>
                  )}
                </Stack>

                {snippets.length > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                    {snippets.map((snip) => (
                      <Chip
                        key={snip.id}
                        label={snip.title}
                        size="small"
                        onClick={() => handleApplySnippet(snip)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: "0.74rem",
                          "&:hover": { bgcolor: "primary.soft" },
                        }}
                      />
                    ))}
                  </Stack>
                )}

                <TipTapRichEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  placeholder="Redacte la propuesta comercial o inserte cláusulas del catálogo..."
                />
              </Box>

              <Divider />

              {/* Sección 7: Firmantes Autorizados */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", mb: 1, textTransform: "uppercase" }}>
                  7. Firmantes Autorizados en el Documento
                </Typography>
                <Grid container spacing={1.5}>
                  {signers.map((s) => {
                    const isSelected = selectedSignerIds.includes(s.id);
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={s.id}>
                        <Card
                          onClick={() => {
                            setSelectedSignerIds((prev) =>
                              isSelected ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                            );
                          }}
                          sx={{
                            p: 1.5,
                            cursor: "pointer",
                            borderRadius: 2,
                            border: "1.5px solid",
                            borderColor: isSelected ? "primary.main" : "divider",
                            bgcolor: isSelected ? "primary.soft" : "background.paper",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
                              {s.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {s.jobTitle}
                            </Typography>
                          </Box>
                          <Chip
                            label={isSelected ? "Incluido" : "Omitir"}
                            size="small"
                            color={isSelected ? "primary" : "default"}
                            sx={{ fontSize: "0.65rem", height: 20, fontWeight: 700 }}
                          />
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Stack>
          </Box>

          {/* PANEL DERECHO: Previsualización en Vivo PDF Camaleón (48% en Desktop) */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: "48%",
              height: "100%",
              overflowY: "auto",
              p: 3,
              bgcolor: "#334155",
            }}
          >
            <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ffffff" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Previsualización Dinámica Reactiva (A4 Oficial)
              </Typography>
              <Chip
                label="Actualizado en Tiempo Real"
                size="small"
                sx={{ bgcolor: "success.main", color: "#ffffff", height: 18, fontSize: "0.6rem", fontWeight: 700 }}
              />
            </Box>

            <ChameleonPdfPreview
              skin={skin}
              layout={headerLayout}
              clientName={selectedClient?.name || "CONJUNTO RESIDENCIAL"}
              clientNit={selectedClient?.nit || "NIT: 900.000.000-1"}
              clientCity={clientCity}
              proposalNumber={proposalNumber}
              bodyHtml={bodyHtml}
              serviceItems={previewServiceItems}
              signers={activeSigners}
            />
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
