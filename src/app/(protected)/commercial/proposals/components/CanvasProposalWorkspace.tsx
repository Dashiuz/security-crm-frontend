"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Paper,
  Tooltip,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  ButtonGroup,
} from "@mui/material";
import {
  Close as CloseIcon,
  PictureAsPdf,
  SaveOutlined,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp,
  WarningAmber,
  Block,
  Calculate,
  PersonAdd,
  ListAlt,
  Search as SearchIcon,
  LibraryBooks,
  CardGiftcard,
  Security,
  EditOutlined,
  Visibility,
  VisibilityOff,
  AlternateEmail,
  TextFields,
  PostAdd,
  Print,
  Lock,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Draw,
  ContentCopy,
  AddCircleOutline,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import NotionProposalBlock from "./NotionProposalBlock";
import FormatSelectionModal from "@/components/format-engine/drawers/FormatSelectionModal";
import {
  FormatCategory,
  FormatEngineApi,
  FormatVariable,
  SystemFieldCategory,
  VariableSourceType,
  FormatVisibilityScope,
} from "@/lib/api/format-engine";
import ChameleonPdfPreview from "./ChameleonPdfPreview";
import ClientAutocomplete, { ClientOption } from "@/components/common/ClientAutocomplete";
import {
  DocumentHeaderLayout,
  TenantDocumentSkin,
  AuthorizedSigner,
  SystemUserSigner,
  ValueAddedCatalogItem,
  DocumentTextSnippet,
  DocumentEngineApi,
  CommercialSettingsApi,
  CommercialSector,
  WeaponModality,
  ShiftScheduleType,
  SecurityServiceCatalogItem,
  PositionSalaryMatrixItem,
  TariffPeriodConfig,
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

export interface CanvasProposalWorkspaceProps {
  initialProposal?: any;
  proposalId?: string;
}

export interface LocalServicePosition {
  id: string;
  positionTitle: string;
  quantity: number;
  scheduleType: ShiftScheduleType;
  weaponModality: WeaponModality;
  tariffCategory: CommercialSector;
  unitMonthlyBilledPrice: number;
  unitMonthlyRealCost: number;
}

export interface LocalValueAddedItem {
  id: string;
  itemName: string;
  quantity: number;
  periodicity: BenefitPeriodicity;
  itemInternalCost: number;
  notes?: string;
}

export interface ProposalContentBlock {
  id: string;
  type: "paragraph" | "clause";
  title?: string;
  content: string;
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

const SYSTEM_VARIABLES = [
  { token: "cliente_nombre", label: "Nombre / Razón Social", category: "Cliente" },
  { token: "cliente_nit", label: "NIT Cliente", category: "Cliente" },
  { token: "cliente_ciudad", label: "Ciudad Sede", category: "Cliente" },
  { token: "propuesta_consecutivo", label: "Número Folio Propuesta", category: "Propuesta" },
  { token: "propuesta_total_mensual", label: "Total Mensual COP", category: "Propuesta" },
  { token: "monto_en_letras", label: "Total Mensual en Letras", category: "Propuesta" },
  { token: "propuesta_meses", label: "Duración en Meses", category: "Propuesta" },
  { token: "empresa_nombre", label: "Razón Social Empresa", category: "Empresa" },
  { token: "empresa_nit", label: "NIT Empresa", category: "Empresa" },
  { token: "empresa_licencia_svsp", label: "Resolución SVSP", category: "Empresa" },
  { token: "empresa_logo", label: "Logo Empresa (S3)", category: "Imágenes S3" },
  { token: "usuario_firma", label: "Firma Digitalizada (S3)", category: "Imágenes S3" },
  { token: "estudio_plano_cad", label: "Plano CAD / Anexo (S3)", category: "Imágenes S3" },
];

export default function CanvasProposalWorkspace({
  initialProposal,
  proposalId,
}: CanvasProposalWorkspaceProps) {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Zoom / Scale State (Default 1.0 = 100%)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Configuration from backend
  const [tariffPeriodId, setTariffPeriodId] = useState<string>("");
  const [activeTariffPeriod, setActiveTariffPeriod] = useState<TariffPeriodConfig | null>(null);
  const [skin, setSkin] = useState<Partial<TenantDocumentSkin> | null>(null);
  const [signers, setSigners] = useState<AuthorizedSigner[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUserSigner[]>([]);
  const [selectedSystemUserIds, setSelectedSystemUserIds] = useState<string[]>([]);
  const [snippets, setSnippets] = useState<DocumentTextSnippet[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<SecurityServiceCatalogItem[]>([]);
  const [salaryMatrix, setSalaryMatrix] = useState<PositionSalaryMatrixItem[]>([]);
  const [vagCatalog, setVagCatalog] = useState<ValueAddedCatalogItem[]>([]);

  // Selected Client & Commercial Parameters
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [clientCity, setClientCity] = useState("Bogotá D.C.");
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(12);
  const [promptPaymentDiscount, setPromptPaymentDiscount] = useState<number>(0);
  const [proposalNumber, setProposalNumber] = useState(
    `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Notion-like Document Blocks (Lienzo en Blanco)
  const [blocks, setBlocks] = useState<ProposalContentBlock[]>([
    {
      id: "block-intro",
      type: "paragraph",
      content:
        "<p>Respetados señores, nos complace presentar a su consideración nuestra propuesta técnico-económica para la prestación integral de los servicios especializados de seguridad y vigilancia privada, dando estricto cumplimiento a la normatividad legal vigente y las directrices tarifarias de la Superintendencia de Vigilancia y Seguridad Privada.</p>",
    },
    {
      id: "block-cl1",
      type: "clause",
      title: "CLÁUSULA PRIMERA: Objeto y Alcance Operativo",
      content:
        "<p>La empresa suministrará al cliente el personal operativo debidamente calificado, carnetizado y uniformado, respaldado por una estricta supervisión móvil y enlace permanente a nuestra central de operaciones 24/7.</p>",
    },
  ]);
  const [activeBlockId, setActiveBlockId] = useState<string>("block-intro");
  const editorRefs = useRef<Record<string, any>>({});

  // Drag and Drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Document History Stack (Ctrl+Z / Ctrl+Y) Ref-backed para múltiples deshacer/rehacer continuos
  const historyStackRef = useRef<ProposalContentBlock[][]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Positions
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
  const [showVags, setShowVags] = useState(true);

  // Signers & Signatures conmutable
  const [selectedSignerIds, setSelectedSignerIds] = useState<string[]>([]);
  const [adHocSigners, setAdHocSigners] = useState<
    Array<{ id: string; fullName: string; jobTitle: string; documentNumber?: string }>
  >([]);
  const [showSignatures, setShowSignatures] = useState<boolean>(false);
  const [signerDrawerTab, setSignerDrawerTab] = useState<"institutional" | "system_users" | "adhoc">("institutional");

  // Live P&L Simulation Result
  const [pnlResult, setPnlResult] = useState<PnlSimulationResult | null>(null);

  // Side Drawer (Destinatario, Puestos, VAGs, Firmantes, P&L, Variables)
  const [drawerTab, setDrawerTab] = useState<
    "client" | "positions" | "vags" | "signers" | "pnl" | "variables" | null
  >(null);

  // Sub-tabs para los Drawers de Catálogo Integrado (sin modales externos)
  const [positionDrawerSubTab, setPositionDrawerSubTab] = useState<"positions" | "catalog">("positions");
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [vagDrawerSubTab, setVagDrawerSubTab] = useState<"vags" | "catalog">("vags");
  const [vagSearchQuery, setVagSearchQuery] = useState("");

  // Variables Dinámicas en el Drawer
  const [systemCategories, setSystemCategories] = useState<SystemFieldCategory[]>([]);
  const [customVariables, setCustomVariables] = useState<FormatVariable[]>([]);
  const [variableCategoryFilter, setVariableCategoryFilter] = useState<string>("all");
  const [variableSearchQuery, setVariableSearchQuery] = useState("");
  const [showNewVarForm, setShowNewVarForm] = useState(false);
  const [newVarToken, setNewVarToken] = useState("");
  const [newVarLabel, setNewVarLabel] = useState("");
  const [newVarCategory, setNewVarCategory] = useState("Comercial");
  const [newVarValue, setNewVarValue] = useState("");
  const [creatingVar, setCreatingVar] = useState(false);

  // Ribbon Menu Anchors
  const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(null);
  const [destMenuAnchor, setDestMenuAnchor] = useState<null | HTMLElement>(null);
  const [posMenuAnchor, setPosMenuAnchor] = useState<null | HTMLElement>(null);
  const [vagMenuAnchor, setVagMenuAnchor] = useState<null | HTMLElement>(null);
  const [signerMenuAnchor, setSignerMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);

  // Modales
  const [formatModalOpen, setFormatModalOpen] = useState(false);
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);

  // Ad-hoc Signer Dialog
  const [adHocDialogOpen, setAdHocDialogOpen] = useState(false);
  const [newAdHocSigner, setNewAdHocSigner] = useState({ fullName: "", jobTitle: "", documentNumber: "" });

  // Inicialización del historial con el estado inicial de bloques
  useEffect(() => {
    if (blocks.length > 0 && historyStackRef.current.length === 0) {
      historyStackRef.current = [JSON.parse(JSON.stringify(blocks))];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [blocks]);

  // Push to history helper
  const pushToHistory = useCallback((newBlocks: ProposalContentBlock[]) => {
    const snapshot = JSON.parse(JSON.stringify(newBlocks));
    const currentStack = historyStackRef.current.slice(0, historyIndexRef.current + 1);

    if (currentStack.length > 0) {
      const last = JSON.stringify(currentStack[currentStack.length - 1]);
      if (last === JSON.stringify(snapshot)) return;
    }

    const nextStack = [...currentStack, snapshot];
    if (nextStack.length > 60) nextStack.shift();

    historyStackRef.current = nextStack;
    historyIndexRef.current = nextStack.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Undo Handler (Sin toasts intrusivos)
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const targetIndex = historyIndexRef.current - 1;
      historyIndexRef.current = targetIndex;
      const targetState = JSON.parse(JSON.stringify(historyStackRef.current[targetIndex]));
      setBlocks(targetState);
      setCanUndo(targetIndex > 0);
      setCanRedo(true);
    }
  }, []);

  // Redo Handler (Sin toasts intrusivos)
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      const targetIndex = historyIndexRef.current + 1;
      historyIndexRef.current = targetIndex;
      const targetState = JSON.parse(JSON.stringify(historyStackRef.current[targetIndex]));
      setBlocks(targetState);
      setCanUndo(true);
      setCanRedo(targetIndex < historyStackRef.current.length - 1);
    }
  }, []);

  // Ref para handleSaveProposal accesible en listener global sin ciclos
  const handleSaveProposalRef = useRef<() => void>(() => {});

  // Global Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isStandardInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (!isStandardInput) {
          e.preventDefault();
          handleUndo();
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        if (!isStandardInput) {
          e.preventDefault();
          handleRedo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveProposalRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // LocalStorage Autosave Backup
  useEffect(() => {
    const backupKey = `noxia_proposal_draft_${proposalId || "new"}`;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          backupKey,
          JSON.stringify({
            blocks,
            selectedClient,
            clientCity,
            servicePositions,
            valueAddedItems,
            contractDurationMonths,
            promptPaymentDiscount,
            timestamp: Date.now(),
          })
        );
      } catch {
        // Ignore quota limits
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [blocks, selectedClient, clientCity, servicePositions, valueAddedItems, contractDurationMonths, promptPaymentDiscount, proposalId]);

  // Load initial backend configuration
  useEffect(() => {
    loadInitialData();
  }, [proposalId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [settingsRes, previewRes, snippetsRes, signersRes, catalogRes, matrixRes, vagRes, sysUsersRes, sysCatRes, varsRes] =
        await Promise.all([
          CommercialSettingsApi.getSettings().catch(() => null),
          DocumentEngineApi.getPreviewConfig().catch(() => null),
          CommercialSettingsApi.getTextSnippets().catch(() => []),
          DocumentEngineApi.getSigners().catch(() => []),
          CommercialSettingsApi.getServiceCatalog().catch(() => []),
          CommercialSettingsApi.getSalaryMatrix().catch(() => []),
          CommercialSettingsApi.getValueAddedCatalog().catch(() => []),
          DocumentEngineApi.getSystemUsersAsSigners().catch(() => []),
          FormatEngineApi.getSystemCatalog().catch(() => []),
          FormatEngineApi.getVariables().catch(() => []),
        ]);

      const activeTariff = settingsRes?.tariffPeriods?.find((t) => t.isActive) || settingsRes?.tariffPeriods?.[0];
      if (activeTariff?.id) {
        setTariffPeriodId(activeTariff.id);
        setActiveTariffPeriod(activeTariff);
      }
      setServiceCatalog(catalogRes || []);
      setSalaryMatrix(matrixRes || []);
      setVagCatalog(vagRes || []);
      setSystemUsers(sysUsersRes || []);
      setSystemCategories(sysCatRes || []);
      setCustomVariables(varsRes || []);

      if (previewRes?.skin) {
        setSkin(previewRes.skin);
      }
      setSnippets(snippetsRes || []);
      const typedSigners: AuthorizedSigner[] = (signersRes as AuthorizedSigner[]) || [];
      setSigners(typedSigners);

      const defaultSigners = typedSigners
        .filter((s: AuthorizedSigner) => s.includeInCommercialProposal)
        .map((s: AuthorizedSigner) => s.id);
      setSelectedSignerIds(defaultSigners);

      // Hydrate if editing an existing proposal
      if (proposalId) {
        try {
          const loaded = await commercialProposalsApi.getProposalById(proposalId);
          if (loaded) {
            setProposalNumber(loaded.proposalFolioCode);
            if (loaded.client) {
              setSelectedClient({
                id: loaded.client.id,
                name: loaded.client.name,
                nit: loaded.client.nit,
                isProspect: loaded.client.clientStatus === "PROSPECT",
              });
            }
            if (loaded.contractDurationMonths) setContractDurationMonths(loaded.contractDurationMonths);
            if (loaded.promptPaymentDiscPercent) setPromptPaymentDiscount(loaded.promptPaymentDiscPercent);
            if (loaded.draftSnapshotJson?.clauseBlocks?.length) {
              setBlocks(loaded.draftSnapshotJson.clauseBlocks);
              historyStackRef.current = [JSON.parse(JSON.stringify(loaded.draftSnapshotJson.clauseBlocks))];
              historyIndexRef.current = 0;
              setCanUndo(false);
              setCanRedo(false);
            }
            if (loaded.draftSnapshotJson?.clientCity) setClientCity(loaded.draftSnapshotJson.clientCity);
            if (loaded.draftSnapshotJson?.showSignatures !== undefined) setShowSignatures(loaded.draftSnapshotJson.showSignatures);
            if (loaded.items?.length) {
              setServicePositions(
                loaded.items.map((it: any, i: number) => ({
                  id: it.id || `pos-${i}`,
                  positionTitle: it.positionTitle,
                  quantity: it.quantity,
                  scheduleType: it.scheduleType,
                  weaponModality: it.weaponModality,
                  tariffCategory: it.tariffCategory,
                  unitMonthlyBilledPrice: Number(it.unitMonthlyBilledPrice) || 0,
                  unitMonthlyRealCost: Number(it.unitMonthlyRealCost) || 0,
                }))
              );
            }
            if (loaded.valueAddedItems?.length) {
              setValueAddedItems(
                loaded.valueAddedItems.map((v: any, i: number) => ({
                  id: v.id || `vag-${i}`,
                  itemName: v.itemName,
                  quantity: v.quantity,
                  periodicity: v.periodicity,
                  itemInternalCost: Number(v.itemInternalCost) || 0,
                  notes: v.notes,
                }))
              );
            }
          }
        } catch {
          showError("Error al cargar los datos de la propuesta existente.");
        }
      } else if (initialProposal) {
        if (initialProposal.draftSnapshotJson?.clauseBlocks?.length) {
          setBlocks(initialProposal.draftSnapshotJson.clauseBlocks);
          historyStackRef.current = [JSON.parse(JSON.stringify(initialProposal.draftSnapshotJson.clauseBlocks))];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
        }
      } else {
        // Initial snapshot for undo stack
        historyStackRef.current = [JSON.parse(JSON.stringify(blocks))];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      }
    } catch {
      showError("Error al cargar la configuración comercial y tarifaria.");
    } finally {
      setLoading(false);
    }
  };

  // Salary Matrix & SVSP Tariff Calculation Helpers
  const findLaborCostFromSalaryMatrix = useCallback(
    (title: string, schedule: ShiftScheduleType): number => {
      if (!salaryMatrix || salaryMatrix.length === 0) {
        return schedule === ShiftScheduleType.SCHEDULE_5X2 ? 4000000 : 11400000;
      }
      const exact = salaryMatrix.find(
        (m) =>
          m.scheduleType === schedule &&
          m.positionTitle.trim().toLowerCase() === title.trim().toLowerCase()
      );
      if (exact) return Number(exact.grossSalary) || 11400000;

      const bySchedule = salaryMatrix.find((m) => m.scheduleType === schedule);
      if (bySchedule) return Number(bySchedule.grossSalary) || 11400000;

      return 11400000;
    },
    [salaryMatrix]
  );

  const calculateBilledPriceForService = useCallback(
    (service: SecurityServiceCatalogItem): number => {
      if (!activeTariffPeriod) return 17270787;
      const smmlv = Number(activeTariffPeriod.smmlv) || 1423500;
      const baseCost = smmlv * 8.8;
      let multiplier = 1.0;
      if (service.weaponModality === WeaponModality.LETHAL_WEAPON) multiplier += 0.1;
      else if (service.weaponModality === WeaponModality.CANINE_SUPPORT) multiplier += 0.15;
      const adminSupervision = 1 + (Number(service.adminSupervisionPct) || 0.1);
      return Math.round(baseCost * multiplier * adminSupervision);
    },
    [activeTariffPeriod]
  );

  // Trigger P&L Simulation
  const triggerPnlSimulation = useCallback(async () => {
    if (servicePositions.length === 0) {
      setPnlResult(null);
      return;
    }
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
    } catch {
      // Local fallback calculation
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
    }
  }, [servicePositions, valueAddedItems, contractDurationMonths, promptPaymentDiscount]);

  useEffect(() => {
    triggerPnlSimulation();
  }, [triggerPnlSimulation]);

  // Total Financial Summaries
  const financialSummary = useMemo(() => {
    const subtotal = servicePositions.reduce(
      (acc, p) => acc + (Number(p.unitMonthlyBilledPrice) || 0) * (Number(p.quantity) || 1),
      0
    );
    const aiu = subtotal * 0.1;
    const iva = aiu * 0.19;
    const total = subtotal + iva;
    return { subtotal, aiu, iva, total };
  }, [servicePositions]);

  // Combined Active Signers
  const allActiveSigners = useMemo(() => {
    const institutional = signers
      .filter((s) => selectedSignerIds.includes(s.id))
      .map((s) => ({
        id: s.id,
        fullName: s.fullName,
        jobTitle: s.jobTitle,
        documentNumber: s.documentNumber,
        signatureUrl: s.signatureUrl,
      }));

    const systemUserSigners = systemUsers
      .filter((u) => selectedSystemUserIds.includes(u.id))
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        jobTitle: u.position || "Funcionario Autorizado",
        documentNumber: u.document,
        signatureUrl: u.signatureUrl,
      }));

    const adHocFormatted = adHocSigners.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      jobTitle: a.jobTitle,
      documentNumber: a.documentNumber,
      signatureUrl: undefined,
    }));

    return [...institutional, ...systemUserSigners, ...adHocFormatted];
  }, [signers, selectedSignerIds, systemUsers, selectedSystemUserIds, adHocSigners]);

  // Dynamic Document Items & A4 Multi-Page Pagination Engine
  const docItems = useMemo(() => {
    const items: Array<{
      id: string;
      kind: "block" | "economic_tariffs" | "values_added" | "signatures";
      block?: ProposalContentBlock;
      blockIndex?: number;
      height: number;
    }> = blocks.map((b, idx) => {
      const plainText = (b.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const lines = Math.max(1, Math.ceil(plainText.length / 75));
      const height = b.type === "clause" ? 65 + lines * 24 + 25 : Math.max(50, lines * 24 + 25);
      return {
        id: b.id,
        kind: "block",
        block: b,
        blockIndex: idx,
        height,
      };
    });

    items.push({
      id: "section_tariffs",
      kind: "economic_tariffs",
      height: 180 + servicePositions.length * 45,
    });

    if (showVags) {
      items.push({
        id: "section_vags",
        kind: "values_added",
        height: valueAddedItems.length > 0 ? 100 + valueAddedItems.length * 40 : 65,
      });
    }

    if (showSignatures && allActiveSigners.length > 0) {
      items.push({
        id: "section_signatures",
        kind: "signatures",
        height: 220,
      });
    }

    return items;
  }, [blocks, servicePositions, showVags, valueAddedItems, showSignatures, allActiveSigners]);

  // Paginated Pages Memo: Pack sequentially into discrete physical A4 sheets
  const paginatedPages = useMemo(() => {
    const pages: Array<typeof docItems> = [];
    let currentPage: typeof docItems = [];
    let currentHeight = 0;
    // Page 1 has Executive Header + Recipient (~190px), leaving ~710px capacity
    const page1Capacity = 710;
    // Continuation pages have Compact Header (~45px), leaving ~850px capacity
    const continuationCapacity = 850;

    for (const item of docItems) {
      const capacity = pages.length === 0 ? page1Capacity : continuationCapacity;
      if (currentPage.length > 0 && currentHeight + item.height > capacity) {
        pages.push(currentPage);
        currentPage = [item];
        currentHeight = item.height;
      } else {
        currentPage.push(item);
        currentHeight += item.height;
      }
    }

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [[]];
  }, [docItems]);

  // Block Handlers (Notion-like)
  const handleAddParagraph = () => {
    const newBlock: ProposalContentBlock = {
      id: `block-${Date.now()}`,
      type: "paragraph",
      content: "<p></p>",
    };
    const next = [...blocks, newBlock];
    setBlocks(next);
    pushToHistory(next);
    setActiveBlockId(newBlock.id);
  };

  const handleAddClause = () => {
    const clauseCount = blocks.filter((b) => b.type === "clause").length + 1;
    const newBlock: ProposalContentBlock = {
      id: `block-${Date.now()}`,
      type: "clause",
      title: `CLÁUSULA ${clauseCount}: Disposiciones Específicas`,
      content: "<p>Describa aquí las condiciones y términos aplicables...</p>",
    };
    const next = [...blocks, newBlock];
    setBlocks(next);
    pushToHistory(next);
    setActiveBlockId(newBlock.id);
  };

  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleUpdateBlock = (id: string, updates: { title?: string; content?: string }) => {
    setBlocks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
      updateTimerRef.current = setTimeout(() => {
        pushToHistory(next);
      }, 700);
      return next;
    });
  };

  const handleRemoveBlock = (id: string) => {
    if (blocks.length <= 1) {
      showError("La cotización debe contener al menos un bloque de texto.");
      return;
    }
    const next = blocks.filter((b) => b.id !== id);
    setBlocks(next);
    pushToHistory(next);
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setBlocks(copy);
    pushToHistory(copy);
  };

  // Drag and Drop Event Handlers
  const handleDragStartBlock = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverBlock = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDropBlock = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const copy = [...blocks];
    const [removed] = copy.splice(draggedIndex, 1);
    copy.splice(targetIndex, 0, removed);
    setBlocks(copy);
    pushToHistory(copy);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Variable Insertion & Creation Handlers (via Drawer, sin toasts intrusivos)
  const handleInsertVariable = (token: string) => {
    const activeEditor = editorRefs.current[activeBlockId];
    if (activeEditor) {
      activeEditor.chain().focus().insertContent(`{{${token}}}`).run();
    } else {
      setBlocks((prev) => {
        const next = prev.map((b, idx) =>
          idx === 0 || b.id === activeBlockId ? { ...b, content: `${b.content} {{${token}}} ` } : b
        );
        pushToHistory(next);
        return next;
      });
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(`{{${token}}}`);
  };

  const handleCreateCustomVariable = async () => {
    if (!newVarToken.trim() || !newVarLabel.trim()) {
      showError("Por favor indique la clave (token) y la etiqueta de la variable.");
      return;
    }
    const cleanKey = newVarToken.trim().toLowerCase().replace(/[{}]/g, "").replace(/\s+/g, "_");
    try {
      setCreatingVar(true);
      const created = await FormatEngineApi.createVariable({
        key: cleanKey,
        label: newVarLabel.trim(),
        category: newVarCategory.trim() || "Mis Variables",
        sourceType: VariableSourceType.STATIC_TEXT,
        staticValue: newVarValue.trim() || "",
        scope: FormatVisibilityScope.GLOBAL,
      });
      setCustomVariables((prev) => [created, ...prev]);
      setNewVarToken("");
      setNewVarLabel("");
      setNewVarValue("");
      setShowNewVarForm(false);
    } catch {
      // Fallback local variable if offline or network error
      const localFallbackVar: any = {
        id: `custom-${Date.now()}`,
        key: cleanKey,
        label: newVarLabel.trim(),
        category: newVarCategory.trim() || "Mis Variables",
        sourceType: VariableSourceType.STATIC_TEXT,
        staticValue: newVarValue.trim() || "",
        scope: FormatVisibilityScope.PERSONAL,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCustomVariables((prev) => [localFallbackVar, ...prev]);
      setNewVarToken("");
      setNewVarLabel("");
      setNewVarValue("");
      setShowNewVarForm(false);
    } finally {
      setCreatingVar(false);
    }
  };

  // Positions Handlers
  const handleAddPosition = () => {
    const defaultSchedule = ShiftScheduleType.SCHEDULE_2X2X2;
    const defaultTitle = "Guarda de Seguridad 24 Horas";
    const defaultLaborCost = findLaborCostFromSalaryMatrix(defaultTitle, defaultSchedule);

    const newPos: LocalServicePosition = {
      id: `pos-${Date.now()}`,
      positionTitle: defaultTitle,
      quantity: 1,
      scheduleType: defaultSchedule,
      weaponModality: WeaponModality.LETHAL_WEAPON,
      tariffCategory: CommercialSector.RESIDENTIAL_STRATA_4_6,
      unitMonthlyBilledPrice: 17270787,
      unitMonthlyRealCost: defaultLaborCost,
    };
    setServicePositions((prev) => [...prev, newPos]);
    setDrawerTab("positions");
  };

  const handleSelectFromCatalog = (service: SecurityServiceCatalogItem) => {
    const billedPrice = calculateBilledPriceForService(service);
    const laborCost = findLaborCostFromSalaryMatrix(service.name, service.scheduleType);

    const newPos: LocalServicePosition = {
      id: `pos-${Date.now()}`,
      positionTitle: service.name,
      quantity: 1,
      scheduleType: service.scheduleType,
      weaponModality: service.weaponModality,
      tariffCategory: service.sector,
      unitMonthlyBilledPrice: billedPrice,
      unitMonthlyRealCost: laborCost,
    };

    setServicePositions((prev) => [...prev, newPos]);
  };

  const handleUpdatePosition = (id: string, field: keyof LocalServicePosition, value: any) => {
    setServicePositions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "scheduleType") {
          const matchedCost = findLaborCostFromSalaryMatrix(updated.positionTitle, value as ShiftScheduleType);
          updated.unitMonthlyRealCost = matchedCost;
        }
        return updated;
      })
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
  const handleAddManualVag = () => {
    const newVag: LocalValueAddedItem = {
      id: `vag-${Date.now()}`,
      itemName: "Estudio de Seguridad y Matriz de Riesgos",
      quantity: 1,
      periodicity: "SINGLE_ONE_TIME",
      itemInternalCost: 1500000,
      notes: "Sin costo adicional para el cliente (100% Bonificado)",
    };
    setValueAddedItems((prev) => [...prev, newVag]);
    setShowVags(true);
    setDrawerTab("vags");
  };

  const handleSelectFromVagCatalog = (vag: ValueAddedCatalogItem) => {
    const newVag: LocalValueAddedItem = {
      id: `vag-${Date.now()}`,
      itemName: vag.name,
      quantity: vag.defaultQuantity || 1,
      periodicity: "MONTHLY_RECURRING",
      itemInternalCost: Number(vag.internalReferenceCost) || 0,
      notes: vag.description || "Beneficio del catálogo institucional",
    };
    setValueAddedItems((prev) => [...prev, newVag]);
    setShowVags(true);
  };

  const handleUpdateVag = (id: string, field: keyof LocalValueAddedItem, value: any) => {
    setValueAddedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveVag = (id: string) => {
    setValueAddedItems((prev) => prev.filter((v) => v.id !== id));
  };

  // Save / Emit Proposal
  const handleSaveProposal = async () => {
    if (!selectedClient?.id) {
      showError("Por favor seleccione un cliente o prospecto destinatario.");
      setDrawerTab("client");
      return;
    }
    if (servicePositions.length === 0) {
      showError("La propuesta debe contener al menos un puesto de seguridad.");
      setDrawerTab("positions");
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

      const synthesizedBodyHtml = blocks
        .map((b) =>
          b.type === "clause"
            ? `<div class="noxia-clause-block"><h3 style="font-size: 1.05rem; font-weight: 700; color: #0F172A; margin: 16px 0 6px 0;">${b.title}</h3>${b.content}</div>`
            : `<div class="noxia-paragraph-block">${b.content}</div>`
        )
        .join("\n");

      await commercialProposalsApi.createProposal({
        clientId: selectedClient.id,
        tariffPeriodId: tariffPeriodId || "tariff-default",
        contractType: "NEW_CONTRACT",
        contractDurationMonths: Number(contractDurationMonths) || 12,
        promptPaymentDiscPercent: Number(promptPaymentDiscount) || 0,
        items: payloadItems,
        valueAddedItems: payloadVags,
        draftSnapshotJson: {
          bodyHtml: synthesizedBodyHtml,
          clauseBlocks: blocks,
          selectedSignerIds,
          selectedSystemUserIds,
          adHocSigners,
          showSignatures,
          headerLayout: DocumentHeaderLayout.MODERN_MINIMALIST,
          clientCity,
        },
      });

      // Clear draft backup
      localStorage.removeItem(`noxia_proposal_draft_${proposalId || "new"}`);

      showSuccess(`¡Propuesta comercial emitida exitosamente con folio correlativo ${proposalNumber}!`);
      router.push("/commercial/proposals");
    } catch (err: any) {
      showError(err.message || "Error al emitir y persistir la propuesta comercial.");
    } finally {
      setSaving(false);
    }
  };
  handleSaveProposalRef.current = handleSaveProposal;

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

  const allUnifiedVariables = useMemo(() => {
    const list: Array<{
      token: string;
      label: string;
      category: string;
      example?: string;
      isCustom?: boolean;
    }> = [];

    // 1. Campos de Categorías del Sistema (PostgreSQL Universal Dictionary)
    if (systemCategories && systemCategories.length > 0) {
      systemCategories.forEach((cat) => {
        cat.fields.forEach((f) => {
          list.push({
            token: f.token,
            label: f.label,
            category: cat.name,
            example: f.example,
            isCustom: false,
          });
        });
      });
    }

    // 2. Complemento de SYSTEM_VARIABLES predeterminados
    SYSTEM_VARIABLES.forEach((sv) => {
      if (!list.some((it) => it.token === sv.token)) {
        list.push({
          token: sv.token,
          label: sv.label,
          category: sv.category,
          example: `Ejemplo de ${sv.label}`,
          isCustom: false,
        });
      }
    });

    // 3. Variables Personalizadas del Usuario (FormatEngineApi)
    customVariables.forEach((cv) => {
      list.push({
        token: cv.key,
        label: cv.label,
        category: cv.category || "Mis Variables",
        example: cv.staticValue || "[Valor Personalizado]",
        isCustom: true,
      });
    });

    return list;
  }, [systemCategories, customVariables]);

  const filteredVariables = useMemo(() => {
    let result = allUnifiedVariables;

    if (variableCategoryFilter !== "all") {
      if (variableCategoryFilter === "custom") {
        result = result.filter((v) => v.isCustom);
      } else {
        result = result.filter((v) =>
          v.category.toLowerCase().includes(variableCategoryFilter.toLowerCase())
        );
      }
    }

    if (variableSearchQuery.trim()) {
      const q = variableSearchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.token.toLowerCase().includes(q) ||
          v.label.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          (v.example && v.example.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allUnifiedVariables, variableCategoryFilter, variableSearchQuery]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: "calc(100vh - 64px)",
        bgcolor: "#F1F5F9",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 1. OS-STYLE TOP WINDOW BAR (38px, #0F172A) */}
      <Box
        sx={{
          height: 38,
          minHeight: 38,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          bgcolor: "#0F172A",
          color: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1.25, sm: 2 },
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          userSelect: "none",
          position: "sticky",
          top: 0,
          zIndex: 100,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {/* Left: Window Controls, Title and Dropdown Menus */}
        <Stack
          direction="row"
          spacing={{ xs: 0.75, sm: 1.25 }}
          alignItems="center"
          sx={{
            minWidth: 0,
            flexShrink: 1,
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Security sx={{ fontSize: 18, color: "#818CF8", flexShrink: 0 }} />
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.82rem",
              letterSpacing: "0.02em",
              color: "#F8FAFC",
              mr: 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Cotizador Comercial • {proposalNumber}
          </Typography>

          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.12)", my: 0.75, flexShrink: 0 }} />

          {/* Menú: Archivo */}
          <Button
            size="small"
            onClick={(e) => setFileMenuAnchor(e.currentTarget)}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Archivo
          </Button>
          <Menu
            anchorEl={fileMenuAnchor}
            open={Boolean(fileMenuAnchor)}
            onClose={() => setFileMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 220, bgcolor: "#1E293B", color: "#F8FAFC" } } }}
          >
            <MenuItem onClick={() => { setFileMenuAnchor(null); handleSaveProposal(); }}>
              <SaveOutlined sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Guardar y Emitir Cotización
            </MenuItem>
            <MenuItem onClick={() => { setFileMenuAnchor(null); setFormatModalOpen(true); }}>
              <LibraryBooks sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Importar Formato / Plantilla...
            </MenuItem>
            <MenuItem onClick={() => { setFileMenuAnchor(null); setPdfPreviewModalOpen(true); }}>
              <PictureAsPdf sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Vista Previa PDF Oficial
            </MenuItem>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
            <MenuItem onClick={() => { setFileMenuAnchor(null); handleUndo(); }} disabled={!canUndo}>
              <UndoIcon sx={{ fontSize: 16, mr: 1.5 }} />
              Deshacer (Ctrl + Z)
            </MenuItem>
            <MenuItem onClick={() => { setFileMenuAnchor(null); handleRedo(); }} disabled={!canRedo}>
              <RedoIcon sx={{ fontSize: 16, mr: 1.5 }} />
              Rehacer (Ctrl + Y)
            </MenuItem>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
            <MenuItem onClick={() => { setFileMenuAnchor(null); router.push("/commercial/proposals"); }}>
              <CloseIcon sx={{ fontSize: 16, mr: 1.5, color: "#EF4444" }} />
              Cerrar y Volver al Módulo
            </MenuItem>
          </Menu>

          {/* Menú: Destinatario */}
          <Button
            size="small"
            onClick={(e) => setDestMenuAnchor(e.currentTarget)}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Destinatario
          </Button>
          <Menu
            anchorEl={destMenuAnchor}
            open={Boolean(destMenuAnchor)}
            onClose={() => setDestMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 220, bgcolor: "#1E293B", color: "#F8FAFC" } } }}
          >
            <MenuItem onClick={() => { setDestMenuAnchor(null); setDrawerTab("client"); }}>
              <EditOutlined sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Configurar Cliente / Prospecto
            </MenuItem>
          </Menu>

          {/* Menú: Puestos & Tarifas */}
          <Button
            size="small"
            onClick={(e) => setPosMenuAnchor(e.currentTarget)}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Puestos & Tarifas
          </Button>
          <Menu
            anchorEl={posMenuAnchor}
            open={Boolean(posMenuAnchor)}
            onClose={() => setPosMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 240, bgcolor: "#1E293B", color: "#F8FAFC" } } }}
          >
            <MenuItem onClick={() => { setPosMenuAnchor(null); setDrawerTab("positions"); }}>
              <EditOutlined sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Gestionar Puestos y Turnos...
            </MenuItem>
            <MenuItem onClick={() => { setPosMenuAnchor(null); setPositionDrawerSubTab("catalog"); setDrawerTab("positions"); }}>
              <ListAlt sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Elegir del Catálogo Oficial SVSP
            </MenuItem>
            <MenuItem onClick={() => { setPosMenuAnchor(null); handleAddPosition(); }}>
              <AddIcon sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Agregar Puesto Manual
            </MenuItem>
          </Menu>

          {/* Menú: Beneficios VAG */}
          <Button
            size="small"
            onClick={(e) => setVagMenuAnchor(e.currentTarget)}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Beneficios VAG
          </Button>
          <Menu
            anchorEl={vagMenuAnchor}
            open={Boolean(vagMenuAnchor)}
            onClose={() => setVagMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 240, bgcolor: "#1E293B", color: "#F8FAFC" } } }}
          >
            <MenuItem onClick={() => { setVagMenuAnchor(null); setDrawerTab("vags"); }}>
              <EditOutlined sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Gestionar Valores Agregados...
            </MenuItem>
            <MenuItem onClick={() => { setVagMenuAnchor(null); setVagDrawerSubTab("catalog"); setDrawerTab("vags"); }}>
              <CardGiftcard sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Catálogo de Beneficios Institucionales
            </MenuItem>
            <MenuItem onClick={() => { setVagMenuAnchor(null); handleAddManualVag(); }}>
              <AddIcon sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Agregar Beneficio Manual
            </MenuItem>
          </Menu>

          {/* Menú: Firmantes */}
          <Button
            size="small"
            onClick={(e) => setSignerMenuAnchor(e.currentTarget)}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Firmantes
          </Button>
          <Menu
            anchorEl={signerMenuAnchor}
            open={Boolean(signerMenuAnchor)}
            onClose={() => setSignerMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 240, bgcolor: "#1E293B", color: "#F8FAFC" } } }}
          >
            <MenuItem onClick={() => { setSignerMenuAnchor(null); setDrawerTab("signers"); }}>
              <EditOutlined sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Configurar Firmantes (Noxia Sign)
            </MenuItem>
            <MenuItem onClick={() => { setSignerMenuAnchor(null); setAdHocDialogOpen(true); }}>
              <PersonAdd sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Agregar Firmante Ad-hoc
            </MenuItem>
          </Menu>

          {/* Menú: Ver */}
          <Button
            size="small"
            onClick={(e) => setViewMenuAnchor(e.currentTarget)}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Ver
          </Button>
          <Menu
            anchorEl={viewMenuAnchor}
            open={Boolean(viewMenuAnchor)}
            onClose={() => setViewMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 220, bgcolor: "#1E293B", color: "#F8FAFC" } } }}
          >
            <MenuItem onClick={() => setShowSignatures((prev) => !prev)}>
              {showSignatures ? <Visibility sx={{ fontSize: 16, mr: 1.5, color: "#10B981" }} /> : <VisibilityOff sx={{ fontSize: 16, mr: 1.5, color: "#94A3B8" }} />}
              {showSignatures ? "Ocultar Bloque de Firmas" : "Mostrar Bloque de Firmas"}
            </MenuItem>
            <MenuItem onClick={() => setShowVags((prev) => !prev)}>
              {showVags ? <Visibility sx={{ fontSize: 16, mr: 1.5, color: "#10B981" }} /> : <VisibilityOff sx={{ fontSize: 16, mr: 1.5, color: "#94A3B8" }} />}
              {showVags ? "Ocultar Valores Agregados (VAG)" : "Mostrar Valores Agregados (VAG)"}
            </MenuItem>
            <MenuItem onClick={() => { setViewMenuAnchor(null); setDrawerTab("pnl"); }}>
              <Calculate sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Análisis Financiero P&L
            </MenuItem>
          </Menu>
        </Stack>

        {/* Right: P&L Health Status, Zoom selector & Exit button */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, ml: "auto", pl: 1 }}>
          {pnlResult && (
            <Chip
              icon={
                pnlResult.pnlStatus === "PROFITABLE" ? (
                  <TrendingUp fontSize="small" sx={{ color: "#10B981 !important" }} />
                ) : pnlResult.pnlStatus === "WARNING_LOW_MARGIN" ? (
                  <WarningAmber fontSize="small" sx={{ color: "#F59E0B !important" }} />
                ) : (
                  <Block fontSize="small" sx={{ color: "#EF4444 !important" }} />
                )
              }
              label={`P&L: ${pnlResult.netMarginPercentage.toFixed(1)}% (${
                pnlResult.pnlStatus === "PROFITABLE" ? "Rentable" : pnlResult.pnlStatus === "WARNING_LOW_MARGIN" ? "Ajustado" : "Déficit"
              })`}
              size="small"
              onClick={() => setDrawerTab("pnl")}
              sx={{
                height: 24,
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                bgcolor: "rgba(255,255,255,0.08)",
                color:
                  pnlResult.pnlStatus === "PROFITABLE"
                    ? "#34D399"
                    : pnlResult.pnlStatus === "WARNING_LOW_MARGIN"
                    ? "#FBBF24"
                    : "#F87171",
                border: "1px solid",
                borderColor:
                  pnlResult.pnlStatus === "PROFITABLE"
                    ? "rgba(52, 211, 153, 0.3)"
                    : pnlResult.pnlStatus === "WARNING_LOW_MARGIN"
                    ? "rgba(251, 191, 36, 0.3)"
                    : "rgba(248, 113, 113, 0.3)",
              }}
            />
          )}

          <Tooltip title="Salir y volver a propuestas">
            <IconButton
              size="small"
              onClick={() => router.push("/commercial/proposals")}
              sx={{ color: "#94A3B8", p: 0.5, "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.1)" } }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* 2. QUICK ACTIONS RIBBON / TOOLBAR (48px, #FFFFFF) */}
      <Box
        sx={{
          minHeight: 48,
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1.25, sm: 2 },
          position: "sticky",
          top: 38,
          zIndex: 90,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          overflowX: "auto",
          gap: { xs: 1, sm: 1.5 },
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { height: "3px" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#CBD5E1", borderRadius: "3px" },
        }}
      >
        {/* Left: Insertion Tools Styled as a Sleek Segmented Control */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            bgcolor: "#F8FAFC",
            p: "3px",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
            gap: "2px",
            flexShrink: 0,
          }}
        >
          <Button
            size="small"
            variant="text"
            startIcon={<TextFields sx={{ fontSize: 16, color: "#4F46E5" }} />}
            onClick={handleAddParagraph}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              color: "#334155",
              textTransform: "none",
              borderRadius: "6px",
              px: { xs: 0.75, sm: 1.25 },
              py: 0.4,
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transform: "translateY(-1px)" },
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            Texto
          </Button>

          <Button
            size="small"
            variant="text"
            startIcon={<PostAdd sx={{ fontSize: 16, color: "#4F46E5" }} />}
            onClick={handleAddClause}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              color: "#334155",
              textTransform: "none",
              borderRadius: "6px",
              px: { xs: 0.75, sm: 1.25 },
              py: 0.4,
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transform: "translateY(-1px)" },
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            Cláusula
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5, borderColor: "#CBD5E1" }} />

          <Button
            size="small"
            variant="text"
            startIcon={<AlternateEmail sx={{ fontSize: 16, color: "#7C3AED" }} />}
            onClick={() => setDrawerTab("variables")}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              color: "#334155",
              textTransform: "none",
              borderRadius: "6px",
              px: { xs: 0.75, sm: 1.25 },
              py: 0.4,
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transform: "translateY(-1px)" },
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", xl: "inline" } }}>Variable Dinámica</Box>
            <Box component="span" sx={{ display: { xs: "inline", xl: "none" } }}>Variable</Box>
          </Button>

          <Button
            size="small"
            variant="text"
            startIcon={<LibraryBooks sx={{ fontSize: 16, color: "#0284C7" }} />}
            onClick={() => setFormatModalOpen(true)}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              color: "#334155",
              textTransform: "none",
              borderRadius: "6px",
              px: { xs: 0.75, sm: 1.25 },
              py: 0.4,
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transform: "translateY(-1px)" },
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", xl: "inline" } }}>Importar Formato</Box>
            <Box component="span" sx={{ display: { xs: "inline", xl: "none" } }}>Importar</Box>
          </Button>
        </Box>

        {/* Center: Context Indicators & Drawer Triggers */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            minWidth: 0,
            flexShrink: 1,
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Chip
            icon={<PersonAdd sx={{ fontSize: "15px !important", color: selectedClient ? "#4338CA !important" : "#64748B !important" }} />}
            label={selectedClient ? selectedClient.name : "Seleccionar Destinatario"}
            color={selectedClient ? "primary" : "default"}
            variant={selectedClient ? "filled" : "outlined"}
            size="small"
            onClick={() => setDrawerTab("client")}
            sx={{
              fontWeight: 700,
              fontSize: "0.76rem",
              cursor: "pointer",
              maxWidth: { xs: 120, sm: 150, md: 180, xl: 220 },
              borderRadius: "6px",
              height: 28,
              flexShrink: 0,
              transition: "all 0.15s ease",
              "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
              "&:hover": { boxShadow: "0 2px 6px rgba(0,0,0,0.08)", transform: "translateY(-1px)" },
              "&:active": { transform: "scale(0.96)" },
            }}
          />
          <Chip
            icon={<Security sx={{ fontSize: "14px !important", color: "#475569 !important" }} />}
            label={`${servicePositions.length} Puesto${servicePositions.length === 1 ? "" : "s"} SVSP`}
            size="small"
            variant="outlined"
            onClick={() => setDrawerTab("positions")}
            sx={{
              fontWeight: 700,
              fontSize: "0.76rem",
              cursor: "pointer",
              borderRadius: "6px",
              height: 28,
              flexShrink: 0,
              borderColor: "#CBD5E1",
              bgcolor: "#F8FAFC",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "#FFFFFF", borderColor: "#94A3B8", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", transform: "translateY(-1px)" },
              "&:active": { transform: "scale(0.96)" },
            }}
          />
          <Chip
            icon={<CardGiftcard sx={{ fontSize: "14px !important", color: "#475569 !important" }} />}
            label={`${valueAddedItems.length} Beneficio${valueAddedItems.length === 1 ? "" : "s"} VAG`}
            size="small"
            variant="outlined"
            onClick={() => setDrawerTab("vags")}
            sx={{
              fontWeight: 700,
              fontSize: "0.76rem",
              cursor: "pointer",
              borderRadius: "6px",
              height: 28,
              flexShrink: 0,
              borderColor: "#CBD5E1",
              bgcolor: "#F8FAFC",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "#FFFFFF", borderColor: "#94A3B8", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", transform: "translateY(-1px)" },
              "&:active": { transform: "scale(0.96)" },
            }}
          />
          <Chip
            icon={<Draw sx={{ fontSize: "14px !important", color: "#475569 !important" }} />}
            label={`${allActiveSigners.length} Firmante${allActiveSigners.length === 1 ? "" : "s"}`}
            size="small"
            variant="outlined"
            onClick={() => setDrawerTab("signers")}
            sx={{
              fontWeight: 700,
              fontSize: "0.76rem",
              cursor: "pointer",
              borderRadius: "6px",
              height: 28,
              flexShrink: 0,
              borderColor: "#CBD5E1",
              bgcolor: "#F8FAFC",
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "#FFFFFF", borderColor: "#94A3B8", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", transform: "translateY(-1px)" },
              "&:active": { transform: "scale(0.96)" },
            }}
          />
        </Stack>

        {/* Right: Primary Action Button & Zoom Controller */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, ml: "auto" }}>
          {/* Zoom Controller */}
          <Box
            sx={{
              display: { xs: "none", lg: "inline-flex" },
              alignItems: "center",
              bgcolor: "#F1F5F9",
              p: "2px",
              borderRadius: "6px",
              border: "1px solid #E2E8F0",
              flexShrink: 0,
            }}
          >
            {[
              { val: 0.75, lbl: "75%" },
              { val: 0.9, lbl: "90%" },
              { val: 1.0, lbl: "100%" },
            ].map((z) => (
              <Button
                key={z.val}
                size="small"
                onClick={() => setZoomLevel(z.val)}
                sx={{
                  minWidth: 36,
                  px: 0.6,
                  py: 0.2,
                  fontSize: "0.72rem",
                  fontWeight: zoomLevel === z.val ? 800 : 600,
                  color: zoomLevel === z.val ? "#0F172A" : "#64748B",
                  bgcolor: zoomLevel === z.val ? "#FFFFFF" : "transparent",
                  boxShadow: zoomLevel === z.val ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  borderRadius: "4px",
                  textTransform: "none",
                  transition: "all 0.15s ease",
                  "&:hover": { color: "#0F172A" },
                }}
              >
                {z.lbl}
              </Button>
            ))}
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<PictureAsPdf sx={{ fontSize: 16, color: "#4F46E5" }} />}
            onClick={() => setPdfPreviewModalOpen(true)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              borderRadius: "7px",
              borderColor: "#CBD5E1",
              color: "#334155",
              py: 0.5,
              px: { xs: 1, sm: 1.5 },
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s ease",
              "&:hover": { bgcolor: "#F8FAFC", borderColor: "#94A3B8", color: "#0F172A" },
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            Vista Previa
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined sx={{ fontSize: 17 }} />}
            onClick={handleSaveProposal}
            disabled={saving}
            sx={{
              fontWeight: 800,
              fontSize: "0.82rem",
              px: { xs: 1.5, sm: 2.2 },
              py: 0.65,
              borderRadius: "7px",
              textTransform: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
              color: "#FFFFFF",
              transition: "all 0.15s ease-out",
              "&:hover": {
                background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
                boxShadow: "0 6px 18px rgba(79, 70, 229, 0.45)",
                transform: "translateY(-1px)",
              },
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {saving ? "Emitiendo..." : "Guardar y Emitir Cotización"}
            </Box>
            <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
              {saving ? "Emitiendo..." : "Guardar"}
            </Box>
          </Button>
        </Stack>
      </Box>

      {/* 3. WORKSPACE CANVAS CONTAINER (Dynamic Multi-Page A4 Engine) */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          p: { xs: 1.5, sm: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "#F1F5F9",
          transition: "padding 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
            <CircularProgress />
          </Box>
        ) : (
          /* THE WHITE A4 PAPER SHEETS CALIBRATED (Dynamically flowed across N pages) */
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: "100%", sm: "98%", md: "860px", lg: "900px", xl: "940px" },
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top center",
              transition: "transform 150ms cubic-bezier(0.2, 0, 0, 1), max-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
              mb: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {(() => {
              const renderHeaderAndRecipient = () => (
                <Box
                  sx={{
                    mb: 2.5,
                    pb: 2,
                    borderBottom: "1.5px solid #E2E8F0",
                    position: "relative",
                    "&:hover .edit-dest-btn": { opacity: 1 },
                  }}
                >
                  <Grid container spacing={2} alignItems="flex-start">
                    {/* Left Column: Recipient info */}
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          color: "#6366F1",
                          lineHeight: 1,
                          display: "block",
                          mb: 0.5,
                          fontSize: "0.68rem",
                        }}
                      >
                        OFERTA COMERCIAL INSTITUCIONAL DE SEGURIDAD PRIVADA
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748B", fontSize: "0.72rem" }}>
                          SEÑORES:
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem" }}>
                          {selectedClient ? selectedClient.name : "[SELECCIONAR CLIENTE O PROSPECTO]"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#475569", display: "block", mt: 0.25, fontSize: "0.74rem" }}>
                        NIT: {selectedClient?.nit || "Pendiente"} • Sede: {clientCity}
                      </Typography>
                    </Grid>

                    {/* Right Column: Folio, Date and Subject */}
                    <Grid size={{ xs: 12, sm: 5 }} sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "0.72rem" }}>
                        {clientCity}, {new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#4338CA", fontSize: "0.92rem", letterSpacing: "0.02em" }}>
                        Ref: {proposalNumber}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "0.7rem", mt: 0.25 }}>
                        Asunto: Propuesta Integral de Vigilancia y Seguridad
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Inline Edit Button */}
                  <Button
                    className="edit-dest-btn"
                    size="small"
                    variant="outlined"
                    startIcon={<EditOutlined fontSize="small" />}
                    onClick={() => setDrawerTab("client")}
                    sx={{
                      position: "absolute",
                      right: 0,
                      top: -4,
                      opacity: 0,
                      transition: "opacity 0.2s ease-in-out",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    Modificar Destinatario
                  </Button>
                </Box>
              );

              const renderContinuationHeader = (pageIdx: number, totalPages: number) => (
                <Box
                  sx={{
                    mb: 2.5,
                    pb: 1.5,
                    borderBottom: "1.5px solid #E2E8F0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: "#6366F1", letterSpacing: "0.08em", lineHeight: 1, display: "block" }}>
                      PROPUESTA COMERCIAL SVSP
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
                      {selectedClient ? selectedClient.name : "[Cliente Destinatario]"} • Hoja {pageIdx + 1} de {totalPages}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.68rem" }}>
                      Consecutivo
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#7C3AED", letterSpacing: "0.02em" }}>
                      {proposalNumber}
                    </Typography>
                  </Box>
                </Box>
              );

              const renderEconomicTariffs = () => (
                <Box sx={{ mb: 3, position: "relative", "&:hover .edit-pos-btn": { opacity: 1 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", textTransform: "uppercase", fontSize: "0.82rem", letterSpacing: "0.02em" }}>
                      Estructura Económica y Tarifas Mensuales (Decreto Ley SVSP 2026)
                    </Typography>
                    <Button
                      className="edit-pos-btn"
                      size="small"
                      variant="outlined"
                      startIcon={<EditOutlined fontSize="small" />}
                      onClick={() => setDrawerTab("positions")}
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.2s ease-in-out",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                      }}
                    >
                      Editar Puestos y Turnos
                    </Button>
                  </Box>

                  <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#0F172A", color: "#FFFFFF", textAlign: "left" }}>
                          <th style={{ padding: "6px 10px", fontWeight: 700 }}>Servicio / Cargo</th>
                          <th style={{ padding: "6px 10px", fontWeight: 700 }}>Modalidad</th>
                          <th style={{ padding: "6px 10px", fontWeight: 700 }}>Programación Turno</th>
                          <th style={{ padding: "6px 10px", fontWeight: 700, textAlign: "center" }}>Puestos</th>
                          <th style={{ padding: "6px 10px", fontWeight: 700, textAlign: "right" }}>Tarifa Mes (COP)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servicePositions.map((pos, idx) => (
                          <tr key={pos.id} style={{ borderBottom: "1px solid #F1F5F9", backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                            <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1E293B" }}>{pos.positionTitle}</td>
                            <td style={{ padding: "6px 10px", color: "#475569" }}>
                              {MODALITY_OPTIONS.find((m) => m.value === pos.weaponModality)?.label || pos.weaponModality}
                            </td>
                            <td style={{ padding: "6px 10px", color: "#475569" }}>
                              {SHIFT_OPTIONS.find((s) => s.value === pos.scheduleType)?.label || pos.scheduleType}
                            </td>
                            <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 700 }}>{pos.quantity}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>
                              $ {((Number(pos.unitMonthlyBilledPrice) || 0) * (Number(pos.quantity) || 1)).toLocaleString("es-CO")}
                            </td>
                          </tr>
                        ))}
                        {/* Subtotal */}
                        <tr style={{ backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0" }}>
                          <td colSpan={4} style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#475569" }}>
                            Subtotal Antes de Impuestos:
                          </td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700 }}>
                            $ {financialSummary.subtotal.toLocaleString("es-CO")}
                          </td>
                        </tr>
                        {/* IVA sobre AIU */}
                        <tr style={{ backgroundColor: "#F8FAFC" }}>
                          <td colSpan={4} style={{ padding: "5px 10px", textAlign: "right", fontSize: "0.72rem", color: "#64748B" }}>
                            IVA sobre AIU (19% sobre base AIU 10%):
                          </td>
                          <td style={{ padding: "5px 10px", textAlign: "right", fontSize: "0.75rem", color: "#475569" }}>
                            $ {financialSummary.iva.toLocaleString("es-CO")}
                          </td>
                        </tr>
                        {/* Total */}
                        <tr style={{ backgroundColor: "rgba(99, 102, 241, 0.08)" }}>
                          <td colSpan={4} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, fontSize: "0.82rem", color: "#4338CA" }}>
                            TOTAL FACTURADO CON IVA (COP):
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 800, fontSize: "0.92rem", color: "#4338CA" }}>
                            $ {financialSummary.total.toLocaleString("es-CO")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Box>
                </Box>
              );

              const renderValuesAdded = () => (
                <Box sx={{ mb: 3, position: "relative", "&:hover .edit-vag-btn": { opacity: 1 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", textTransform: "uppercase", fontSize: "0.82rem", letterSpacing: "0.02em" }}>
                      Valores Agregados y Beneficios en Especie (100% Bonificados / Cortesía Comercial)
                    </Typography>
                    <Button
                      className="edit-vag-btn"
                      size="small"
                      variant="outlined"
                      startIcon={<EditOutlined fontSize="small" />}
                      onClick={() => setDrawerTab("vags")}
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.2s ease-in-out",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                      }}
                    >
                      Editar Beneficios VAG
                    </Button>
                  </Box>

                  {valueAddedItems.length === 0 ? (
                    <Box
                      onClick={() => setDrawerTab("vags")}
                      sx={{
                        p: 1.5,
                        border: "1px dashed #CBD5E1",
                        borderRadius: "4px",
                        textAlign: "center",
                        cursor: "pointer",
                        "&:hover": { borderColor: "#6366F1", bgcolor: "rgba(99, 102, 241, 0.02)" },
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.75rem" }}>
                        Sin valores agregados cargados. Haga clic aquí para incluir comodatos o beneficios gratuitos.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#F8FAFC", color: "#475569", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                            <th style={{ padding: "6px 10px", fontWeight: 700 }}>Beneficio / Comodato Institucional</th>
                            <th style={{ padding: "6px 10px", fontWeight: 700, textAlign: "center" }}>Cantidad</th>
                            <th style={{ padding: "6px 10px", fontWeight: 700 }}>Periodicidad</th>
                            <th style={{ padding: "6px 10px", fontWeight: 700, textAlign: "right" }}>Valor de Referencia</th>
                            <th style={{ padding: "6px 10px", fontWeight: 700, textAlign: "right", color: "#059669" }}>Facturado al Cliente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {valueAddedItems.map((vag, idx) => (
                            <tr key={vag.id} style={{ borderBottom: "1px solid #F1F5F9", backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" }}>
                              <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1E293B" }}>
                                {vag.itemName}
                                {vag.notes && (
                                  <div style={{ fontSize: "0.68rem", color: "#64748B", marginTop: 2 }}>{vag.notes}</div>
                                )}
                              </td>
                              <td style={{ padding: "6px 10px", textAlign: "center" }}>{vag.quantity}</td>
                              <td style={{ padding: "6px 10px", color: "#475569" }}>
                                {vag.periodicity === "MONTHLY_RECURRING"
                                  ? "Mensual Recurrente"
                                  : vag.periodicity === "ANNUAL_RENEWAL"
                                  ? "Anual (Renovación)"
                                  : "Única Vez (Instalación)"}
                              </td>
                              <td style={{ padding: "6px 10px", textAlign: "right", textDecoration: "line-through", color: "#94A3B8" }}>
                                $ {Number(vag.itemInternalCost || 0).toLocaleString("es-CO")}
                              </td>
                              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 800, color: "#059669" }}>
                                $ 0 COP (CORTESÍA)
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )}
                </Box>
              );

              const renderSignatures = () => (
                <Box sx={{ mt: "auto", pt: 2, borderTop: "1px dashed #CBD5E1", mb: 1.5, position: "relative", "&:hover .sign-toggle-btn": { opacity: 1 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", fontSize: "0.72rem" }}>
                      Representación y Suscripción Formal
                    </Typography>
                    <Button
                      className="sign-toggle-btn"
                      size="small"
                      variant="text"
                      onClick={() => setShowSignatures(false)}
                      sx={{ opacity: 0, transition: "opacity 0.2s ease-in-out", textTransform: "none", fontSize: "0.7rem", color: "#94A3B8" }}
                    >
                      Ocultar Firmas
                    </Button>
                  </Box>
                  <Grid container spacing={2} justifyContent="space-around">
                    {allActiveSigners.map((s) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={s.id}>
                        <Box sx={{ textAlign: "center", p: 1 }}>
                          {s.signatureUrl ? (
                            <Box component="img" src={s.signatureUrl} alt={s.fullName} sx={{ height: 40, mx: "auto", mb: 0.5, objectFit: "contain" }} />
                          ) : (
                            <Box sx={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Typography variant="caption" sx={{ color: "#94A3B8", fontStyle: "italic", fontSize: "0.7rem" }}>
                                [Firma Digital Registrada]
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ width: "75%", mx: "auto", borderBottom: "1.5px solid #0F172A", mb: 0.5 }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                            {s.fullName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "0.7rem" }}>
                            {s.jobTitle}
                          </Typography>
                          {s.documentNumber && (
                            <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.68rem" }}>
                              C.C. {s.documentNumber}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );

              const renderPageFooter = (pageIdx: number, totalPages: number) => {
                const isLast = pageIdx === totalPages - 1;
                if (!isLast) {
                  return (
                    <Box
                      sx={{
                        mt: "auto",
                        pt: 2,
                        borderTop: "1px solid #E2E8F0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748B" }}>
                        {skin?.companyLegalName || "NOXIA SEGURIDAD PRIVADA S.A.S."} • {skin?.companyNit || "NIT: 900.000.000-1"}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: 700 }}>
                        Página {pageIdx + 1} de {totalPages} • No. {proposalNumber}
                      </Typography>
                    </Box>
                  );
                }

                return (
                  <Box sx={{ mt: "auto", pt: 1.5, borderTop: "1px solid #E2E8F0" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B" }}>
                        {skin?.companyLegalName || "NOXIA SEGURIDAD PRIVADA S.A.S."} • {skin?.companyNit || "NIT: 900.000.000-1"} • {skin?.supervigilanciaLicense || "Resolución SVSP No. 004921"}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "#94A3B8", fontFamily: "monospace" }}>
                        SHA-256: 7f8a9...b4c2
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Lock sx={{ fontSize: 10, color: "#94A3B8" }} />
                        <Typography variant="caption" sx={{ fontSize: "0.6rem", color: "#94A3B8" }}>
                          Documento emitido bajo Ley 527 de 1999 • Firma Digital y Trazabilidad Forense • Copia Oficial
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: 700 }}>
                        Página {pageIdx + 1} de {totalPages} • Fin del Documento
                      </Typography>
                    </Box>
                  </Box>
                );
              };

              return paginatedPages.map((pageItems, pageIdx) => {
                const isFirstPage = pageIdx === 0;
                const isLastPage = pageIdx === paginatedPages.length - 1;
                const isLastBlockPage = !paginatedPages.slice(pageIdx + 1).some((p) => p.some((it) => it.kind === "block"));

                return (
                  <React.Fragment key={pageIdx}>
                    <Paper
                      elevation={0}
                      sx={{
                        width: "100%",
                        minHeight: 1040,
                        bgcolor: "#FFFFFF",
                        borderRadius: "4px",
                        boxShadow: "0 10px 30px -4px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)",
                        p: { xs: "24px 20px", sm: "36px 44px", md: "40px 52px" },
                        color: "#1E293B",
                        fontFamily: "'Inter', sans-serif",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        border: "1px solid #E2E8F0",
                        transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      {isFirstPage ? renderHeaderAndRecipient() : renderContinuationHeader(pageIdx, paginatedPages.length)}

                      {/* Content Items on this physical A4 page */}
                      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        {pageItems.map((item) => {
                          if (item.kind === "block" && item.block) {
                            const bIdx = item.blockIndex ?? blocks.findIndex((b) => b.id === item.id);
                            return (
                              <NotionProposalBlock
                                key={item.id}
                                id={item.id}
                                index={bIdx}
                                type={item.block.type}
                                title={item.block.title}
                                content={item.block.content}
                                onUpdate={handleUpdateBlock}
                                onRemove={handleRemoveBlock}
                                onMoveUp={() => handleMoveBlock(bIdx, "up")}
                                onMoveDown={() => handleMoveBlock(bIdx, "down")}
                                canMoveUp={bIdx > 0}
                                canMoveDown={bIdx < blocks.length - 1}
                                isActive={activeBlockId === item.id}
                                onFocus={() => setActiveBlockId(item.id)}
                                onRegisterEditor={(id, ed) => {
                                  editorRefs.current[id] = ed;
                                }}
                                onDragStartBlock={handleDragStartBlock}
                                onDragOverBlock={handleDragOverBlock}
                                onDropBlock={handleDropBlock}
                                isDragOver={dragOverIndex === bIdx}
                              />
                            );
                          }
                          if (item.kind === "economic_tariffs") {
                            return <React.Fragment key="tariffs">{renderEconomicTariffs()}</React.Fragment>;
                          }
                          if (item.kind === "values_added") {
                            return <React.Fragment key="vags">{renderValuesAdded()}</React.Fragment>;
                          }
                          if (item.kind === "signatures") {
                            return <React.Fragment key="signatures">{renderSignatures()}</React.Fragment>;
                          }
                          return null;
                        })}

                        {/* Botón discreto para agregar bloques de texto (en la última página que contenga bloques) */}
                        {isLastBlockPage && (
                          <Box sx={{ display: "flex", gap: 1.5, mt: 1, mb: 2 }}>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<AddIcon fontSize="small" />}
                              onClick={handleAddParagraph}
                              sx={{ textTransform: "none", color: "#64748B", fontWeight: 600, fontSize: "0.78rem", "&:hover": { color: "#6366F1", bgcolor: "rgba(99, 102, 241, 0.04)" } }}
                            >
                              Agregar texto libre
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<AddIcon fontSize="small" />}
                              onClick={handleAddClause}
                              sx={{ textTransform: "none", color: "#64748B", fontWeight: 600, fontSize: "0.78rem", "&:hover": { color: "#6366F1", bgcolor: "rgba(99, 102, 241, 0.04)" } }}
                            >
                              Agregar cláusula contractual
                            </Button>
                          </Box>
                        )}
                      </Box>

                      {/* Footer Dinámico con Numeración de Páginas */}
                      {renderPageFooter(pageIdx, paginatedPages.length)}
                    </Paper>

                    {/* SEPARADOR VISUAL DE PÁGINAS A4 (Solo entre páginas) */}
                    {!isLastPage && (
                      <Box sx={{ my: 3.5, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 1.5 }}>
                        <Divider sx={{ flex: 1, borderColor: "#CBD5E1" }} />
                        <Chip
                          label={`PÁGINA ${pageIdx + 2} DE ${paginatedPages.length} • SALTO DE PÁGINA A4`}
                          size="small"
                          sx={{
                            bgcolor: "#E2E8F0",
                            color: "#475569",
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            letterSpacing: "0.04em",
                            border: "1px solid #CBD5E1",
                          }}
                        />
                        <Divider sx={{ flex: 1, borderColor: "#CBD5E1" }} />
                      </Box>
                    )}
                  </React.Fragment>
                );
              });
            })()}
          </Box>
        )}
      </Box>

      {/* 4. SLIDING CONFIGURATION DRAWER (Destinatario, Puestos, VAG, Firmantes, P&L) */}
      <Drawer
        anchor="right"
        open={Boolean(drawerTab)}
        onClose={() => setDrawerTab(null)}
        sx={{
          zIndex: 1400,
        }}
        ModalProps={{
          sx: { zIndex: 1400 },
        }}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 500 },
            p: 3,
            bgcolor: "#FFFFFF",
            boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.15)",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1.05rem" }}>
            {drawerTab === "client" && "Configuración del Destinatario"}
            {drawerTab === "positions" && "Estructura de Puestos y Turnos SVSP"}
            {drawerTab === "vags" && "Valores Agregados (VAG) y Comodatos"}
            {drawerTab === "signers" && "Firmantes Autorizados (Noxia Sign)"}
            {drawerTab === "pnl" && "Análisis Financiero P&L en Tiempo Real"}
            {drawerTab === "variables" && "Variables Dinámicas & Atajos"}
          </Typography>
          <IconButton size="small" onClick={() => setDrawerTab(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* CONTENIDO SEGÚN DRAWER TAB */}
        {drawerTab === "client" && (
          <Stack spacing={2}>
            <ClientAutocomplete
              value={selectedClient}
              onChange={(client) => setSelectedClient(client)}
              includeProspects={true}
              label="Cliente o Prospecto Destinatario *"
              required
            />
            <TextField
              label="Ciudad / Ubicación de la Sede"
              fullWidth
              size="small"
              value={clientCity}
              onChange={(e) => setClientCity(e.target.value)}
            />
            <TextField
              label="Duración del Contrato (Meses)"
              type="number"
              fullWidth
              size="small"
              value={contractDurationMonths}
              onChange={(e) => setContractDurationMonths(Number(e.target.value) || 12)}
            />
            <TextField
              label="Descuento Pronto Pago (%)"
              type="number"
              fullWidth
              size="small"
              value={promptPaymentDiscount}
              onChange={(e) => setPromptPaymentDiscount(Number(e.target.value) || 0)}
            />
          </Stack>
        )}

        {/* DRAWER TAB: PUESTOS & CATÁLOGO SVSP INTEGRADO */}
        {drawerTab === "positions" && (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Tabs
                value={positionDrawerSubTab}
                onChange={(_, v) => setPositionDrawerSubTab(v)}
                sx={{ minHeight: 36 }}
              >
                <Tab value="positions" label={`En Cotización (${servicePositions.length})`} sx={{ textTransform: "none", fontSize: "0.8rem", fontWeight: 700 }} />
                <Tab value="catalog" label={`Catálogo SVSP (${serviceCatalog.length})`} sx={{ textTransform: "none", fontSize: "0.8rem", fontWeight: 700 }} />
              </Tabs>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                onClick={handleAddPosition}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", borderRadius: 1.5 }}
              >
                Puesto Manual
              </Button>
            </Box>

            <Divider />

            {positionDrawerSubTab === "catalog" ? (
              <Stack spacing={1.5} sx={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", pr: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por cargo, turno o modalidad..."
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: "#94A3B8" }} />
                      </InputAdornment>
                    ),
                  }}
                />
                {serviceCatalog
                  .filter(
                    (item) =>
                      !catalogSearchQuery ||
                      item.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                      item.targetPosition.toLowerCase().includes(catalogSearchQuery.toLowerCase())
                  )
                  .map((service) => (
                    <Card
                      key={service.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: 2,
                        gap: 1.5,
                        "&:hover": { borderColor: "primary.main", bgcolor: "rgba(99, 102, 241, 0.02)" },
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.82rem" }} noWrap>
                          {service.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", display: "block" }}>
                          {SHIFT_OPTIONS.find((s) => s.value === service.scheduleType)?.label} • {service.weaponModality}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon fontSize="small" />}
                        onClick={() => handleSelectFromCatalog(service)}
                        sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", borderRadius: 1.5, flexShrink: 0 }}
                      >
                        Agregar
                      </Button>
                    </Card>
                  ))}
              </Stack>
            ) : (
              <Stack spacing={2} sx={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", pr: 0.5 }}>
                {servicePositions.map((pos) => (
                  <Paper key={pos.id} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {pos.positionTitle}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => handleRemovePosition(pos.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Grid container spacing={1.5}>
                      <Grid size={12}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Nombre del Puesto / Cargo"
                          value={pos.positionTitle}
                          onChange={(e) => handleUpdatePosition(pos.id, "positionTitle", e.target.value)}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label="Cantidad"
                          value={pos.quantity}
                          onChange={(e) => handleUpdatePosition(pos.id, "quantity", Number(e.target.value) || 1)}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          size="small"
                          fullWidth
                          select
                          label="Programación Turno"
                          value={pos.scheduleType}
                          onChange={(e) => handleUpdatePosition(pos.id, "scheduleType", e.target.value)}
                          SelectProps={{
                            MenuProps: {
                              sx: { zIndex: 99999 },
                              PaperProps: { sx: { zIndex: 99999 } },
                            },
                          }}
                        >
                          {SHIFT_OPTIONS.map((s) => (
                            <MenuItem key={s.value} value={s.value}>
                              {s.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          size="small"
                          fullWidth
                          select
                          label="Modalidad"
                          value={pos.weaponModality}
                          onChange={(e) => handleUpdatePosition(pos.id, "weaponModality", e.target.value)}
                          SelectProps={{
                            MenuProps: {
                              sx: { zIndex: 99999 },
                              PaperProps: { sx: { zIndex: 99999 } },
                            },
                          }}
                        >
                          {MODALITY_OPTIONS.map((m) => (
                            <MenuItem key={m.value} value={m.value}>
                              {m.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          size="small"
                          fullWidth
                          select
                          label="Sector Comercial"
                          value={pos.tariffCategory}
                          onChange={(e) => handleUpdatePosition(pos.id, "tariffCategory", e.target.value)}
                          SelectProps={{
                            MenuProps: {
                              sx: { zIndex: 99999 },
                              PaperProps: { sx: { zIndex: 99999 } },
                            },
                          }}
                        >
                          {SECTOR_OPTIONS.map((sec) => (
                            <MenuItem key={sec.value} value={sec.value}>
                              {sec.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label="Tarifa Billed Price (COP)"
                          value={pos.unitMonthlyBilledPrice}
                          onChange={(e) => handleUpdatePosition(pos.id, "unitMonthlyBilledPrice", Number(e.target.value) || 0)}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {/* DRAWER TAB: VALORES AGREGADOS & CATÁLOGO VAG INTEGRADO */}
        {drawerTab === "vags" && (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Tabs
                value={vagDrawerSubTab}
                onChange={(_, v) => setVagDrawerSubTab(v)}
                sx={{ minHeight: 36 }}
              >
                <Tab value="vags" label={`En Propuesta (${valueAddedItems.length})`} sx={{ textTransform: "none", fontSize: "0.8rem", fontWeight: 700 }} />
                <Tab value="catalog" label={`Catálogo VAG (${vagCatalog.length})`} sx={{ textTransform: "none", fontSize: "0.8rem", fontWeight: 700 }} />
              </Tabs>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                onClick={handleAddManualVag}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", borderRadius: 1.5 }}
              >
                Beneficio Manual
              </Button>
            </Box>

            <Divider />

            {vagDrawerSubTab === "catalog" ? (
              <Stack spacing={1.5} sx={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", pr: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por beneficio institucional..."
                  value={vagSearchQuery}
                  onChange={(e) => setVagSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: "#94A3B8" }} />
                      </InputAdornment>
                    ),
                  }}
                />
                {vagCatalog
                  .filter(
                    (v) =>
                      !vagSearchQuery ||
                      v.name.toLowerCase().includes(vagSearchQuery.toLowerCase()) ||
                      v.category.toLowerCase().includes(vagSearchQuery.toLowerCase())
                  )
                  .map((vag) => (
                    <Card
                      key={vag.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: 2,
                        gap: 1.5,
                        "&:hover": { borderColor: "primary.main", bgcolor: "rgba(99, 102, 241, 0.02)" },
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.82rem" }} noWrap>
                          {vag.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", display: "block" }}>
                          Costo Referencia: $ {Number(vag.internalReferenceCost || 0).toLocaleString("es-CO")} • {vag.category}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon fontSize="small" />}
                        onClick={() => handleSelectFromVagCatalog(vag)}
                        sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", borderRadius: 1.5, flexShrink: 0 }}
                      >
                        Agregar
                      </Button>
                    </Card>
                  ))}
              </Stack>
            ) : (
              <Stack spacing={2} sx={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", pr: 0.5 }}>
                {valueAddedItems.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center", border: "1px dashed #CBD5E1", borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      No hay beneficios en la propuesta actualmente.
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => setVagDrawerSubTab("catalog")}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      Explorar Catálogo VAG
                    </Button>
                  </Box>
                ) : (
                  valueAddedItems.map((vag) => (
                    <Paper key={vag.id} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {vag.itemName}
                        </Typography>
                        <IconButton size="small" color="error" onClick={() => handleRemoveVag(vag.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Grid container spacing={1.5}>
                        <Grid size={12}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Nombre del Beneficio / VAG"
                            value={vag.itemName}
                            onChange={(e) => handleUpdateVag(vag.id, "itemName", e.target.value)}
                          />
                        </Grid>
                        <Grid size={6}>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label="Cantidad"
                            value={vag.quantity}
                            onChange={(e) => handleUpdateVag(vag.id, "quantity", Number(e.target.value) || 1)}
                          />
                        </Grid>
                        <Grid size={6}>
                          <TextField
                            size="small"
                            fullWidth
                            select
                            label="Periodicidad"
                            value={vag.periodicity}
                            onChange={(e) => handleUpdateVag(vag.id, "periodicity", e.target.value)}
                            SelectProps={{
                              MenuProps: {
                                sx: { zIndex: 99999 },
                                PaperProps: { sx: { zIndex: 99999 } },
                              },
                            }}
                          >
                            {PERIODICITY_OPTIONS.map((p) => (
                              <MenuItem key={p.value} value={p.value}>
                                {p.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={12}>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label="Costo Interno Referencia (COP)"
                            value={vag.itemInternalCost}
                            onChange={(e) => handleUpdateVag(vag.id, "itemInternalCost", Number(e.target.value) || 0)}
                          />
                        </Grid>
                        <Grid size={12}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Notas / Observaciones"
                            value={vag.notes || ""}
                            onChange={(e) => handleUpdateVag(vag.id, "notes", e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))
                )}
              </Stack>
            )}
          </Stack>
        )}

        {/* DRAWER TAB: FIRMANTES AUTORIZADOS */}
        {drawerTab === "signers" && (
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch checked={showSignatures} onChange={(e) => setShowSignatures(e.target.checked)} />}
              label="Mostrar Bloque de Firmas en el Documento"
            />

            <Tabs
              value={signerDrawerTab}
              onChange={(_, v) => setSignerDrawerTab(v)}
              sx={{ minHeight: 36, borderBottom: "1px solid #E2E8F0" }}
            >
              <Tab value="institutional" label={`Institucionales (${signers.length})`} sx={{ textTransform: "none", fontSize: "0.78rem" }} />
              <Tab value="system_users" label={`Sistema (${systemUsers.length})`} sx={{ textTransform: "none", fontSize: "0.78rem" }} />
              <Tab value="adhoc" label={`Ad-hoc (${adHocSigners.length})`} sx={{ textTransform: "none", fontSize: "0.78rem" }} />
            </Tabs>

            {signerDrawerTab === "institutional" && (
              <Stack spacing={1}>
                {signers.map((s) => {
                  const isSel = selectedSignerIds.includes(s.id);
                  return (
                    <Card
                      key={s.id}
                      onClick={() =>
                        setSelectedSignerIds((prev) =>
                          isSel ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        )
                      }
                      sx={{
                        p: 1.5,
                        cursor: "pointer",
                        border: "1.5px solid",
                        borderColor: isSel ? "primary.main" : "#E2E8F0",
                        bgcolor: isSel ? "rgba(99, 102, 241, 0.05)" : "#FFFFFF",
                      }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {s.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.jobTitle}
                      </Typography>
                    </Card>
                  );
                })}
              </Stack>
            )}

            {signerDrawerTab === "system_users" && (
              <Stack spacing={1}>
                {systemUsers.map((u) => {
                  const isSel = selectedSystemUserIds.includes(u.id);
                  return (
                    <Card
                      key={u.id}
                      onClick={() =>
                        setSelectedSystemUserIds((prev) =>
                          isSel ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        )
                      }
                      sx={{
                        p: 1.5,
                        cursor: "pointer",
                        border: "1.5px solid",
                        borderColor: isSel ? "success.main" : "#E2E8F0",
                        bgcolor: isSel ? "rgba(16, 185, 129, 0.05)" : "#FFFFFF",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" fontWeight={700}>
                          {u.fullName}
                        </Typography>
                        {u.hasSignature && <Chip label="Firma OK" size="small" color="success" sx={{ height: 18, fontSize: "0.6rem" }} />}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {u.position || "Funcionario"} • C.C. {u.document}
                      </Typography>
                    </Card>
                  );
                })}
              </Stack>
            )}

            {signerDrawerTab === "adhoc" && (
              <Stack spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PersonAdd fontSize="small" />}
                  onClick={() => setAdHocDialogOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Agregar Firmante Ad-hoc
                </Button>
                {adHocSigners.map((adhoc) => (
                  <Card key={adhoc.id} sx={{ p: 1.5, border: "1px solid #E2E8F0" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {adhoc.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {adhoc.jobTitle}
                        </Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => setAdHocSigners((p) => p.filter((x) => x.id !== adhoc.id))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {/* DRAWER TAB: ANÁLISIS P&L */}
        {drawerTab === "pnl" && pnlResult && (
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", mb: 1.5, fontSize: "0.82rem" }}>
                Simulación Financiera P&L
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Subtotal Mensual
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    $ {pnlResult.subtotalMonthlyPreDisc.toLocaleString("es-CO")}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Costo Nómina Directa
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="text.secondary">
                    $ {pnlResult.estimatedMonthlyRealCost.toLocaleString("es-CO")}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Amortización VAG Mensual
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="text.secondary">
                    $ {pnlResult.monthlyVagAmortization.toLocaleString("es-CO")}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Margen Neto Mensual
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color={pnlResult.pnlStatus === "PROFITABLE" ? "success.main" : "error.main"}>
                    $ {pnlResult.netMonthlyMarginAmount.toLocaleString("es-CO")} ({pnlResult.netMarginPercentage.toFixed(1)}%)
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        )}

        {/* DRAWER TAB: VARIABLES DINÁMICAS & MINI-MÓDULO DE FORMATOS */}
        {drawerTab === "variables" && (
          <Stack spacing={2} sx={{ height: "calc(100vh - 160px)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                {filteredVariables.length} variables disponibles
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={showNewVarForm ? <ExpandLess fontSize="small" /> : <AddCircleOutline fontSize="small" />}
                onClick={() => setShowNewVarForm((prev) => !prev)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", borderRadius: 1.5 }}
              >
                {showNewVarForm ? "Cerrar Creador" : "Nueva Variable"}
              </Button>
            </Box>

            {/* Formulario Expandible para crear Variable Personal */}
            {showNewVarForm && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC", border: "1.5px solid #6366F1" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#4F46E5", mb: 1.5, fontSize: "0.82rem" }}>
                  Crear Variable Personalizada
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Clave / Token *"
                      placeholder="e.g. contacto_asesor"
                      value={newVarToken}
                      onChange={(e) => setNewVarToken(e.target.value)}
                      helperText="Se usará como {{clave}}"
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Etiqueta Descriptiva *"
                      placeholder="e.g. Asesor de Cuenta"
                      value={newVarLabel}
                      onChange={(e) => setNewVarLabel(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Categoría"
                      placeholder="e.g. Comercial"
                      value={newVarCategory}
                      onChange={(e) => setNewVarCategory(e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Valor Estático / Texto"
                      placeholder="e.g. Juan Pérez - 310..."
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                    />
                  </Grid>
                  <Grid size={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button size="small" onClick={() => setShowNewVarForm(false)}>
                      Cancelar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleCreateCustomVariable}
                      disabled={creatingVar}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {creatingVar ? "Guardando..." : "Guardar Variable"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Buscador de Variables */}
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar variable por token, etiqueta o categoría..."
              value={variableSearchQuery}
              onChange={(e) => setVariableSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Filtros de Categoría */}
            <Stack direction="row" spacing={0.5} sx={{ overflowX: "auto", pb: 0.5 }}>
              {[
                { id: "all", label: "Todas" },
                { id: "empresa", label: "Mi Empresa" },
                { id: "cliente", label: "Cliente" },
                { id: "propuesta", label: "Propuesta" },
                { id: "custom", label: "Mis Variables" },
              ].map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  size="small"
                  clickable
                  onClick={() => setVariableCategoryFilter(cat.id)}
                  color={variableCategoryFilter === cat.id ? "primary" : "default"}
                  variant={variableCategoryFilter === cat.id ? "filled" : "outlined"}
                  sx={{ fontSize: "0.72rem", fontWeight: 700 }}
                />
              ))}
            </Stack>

            {/* Lista Unificada de Variables */}
            <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
              <Stack spacing={1}>
                {filteredVariables.map((v) => (
                  <Paper
                    key={v.token}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                      "&:hover": { borderColor: "primary.main", bgcolor: "rgba(99, 102, 241, 0.02)" },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Chip
                          label={`{{${v.token}}}`}
                          size="small"
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            color: "#DC2626",
                            bgcolor: "#FEF2F2",
                            border: "1px solid #FECACA",
                          }}
                        />
                        <Chip
                          label={v.category}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600, color: "#64748B" }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }} noWrap>
                        {v.label}
                      </Typography>
                      {v.example && (
                        <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.72rem", display: "block" }} noWrap>
                          {v.example}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Tooltip title="Copiar token">
                        <IconButton size="small" onClick={() => handleCopyToken(v.token)}>
                          <ContentCopy sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleInsertVariable(v.token)}
                        sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem", px: 1.5, py: 0.25, borderRadius: 1 }}
                      >
                        Insertar
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        )}

        <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid #E2E8F0" }}>
          <Button fullWidth variant="contained" onClick={() => setDrawerTab(null)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            Aplicar y Volver a la Hoja
          </Button>
        </Box>
      </Drawer>

      {/* 5. MODAL: Importar Formatos / Plantillas */}
      <FormatSelectionModal
        open={formatModalOpen}
        onClose={() => setFormatModalOpen(false)}
        title="Importar Formato o Plantilla Institucional"
        onSelectFormat={(chosen) => {
          if (chosen) {
            const newClause: ProposalContentBlock = {
              id: `block-${Date.now()}`,
              type: "clause",
              title: chosen.title || "Cláusula Importada",
              content: chosen.bodyTemplate,
            };
            const next = [...blocks, newClause];
            setBlocks(next);
            pushToHistory(next);
            setActiveBlockId(newClause.id);
          }
        }}
        category={FormatCategory.COMMERCIAL}
      />

      {/* 6. MODAL: Vista Previa PDF Completa Calibrada */}
      <Dialog
        open={pdfPreviewModalOpen}
        onClose={() => setPdfPreviewModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: "#0F172A",
            maxHeight: "94vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 1.5,
          }}
        >
          <Typography component="span" variant="subtitle1" fontWeight={800}>
            Previsualización Dinámica Oficial de la Propuesta
          </Typography>
          <IconButton size="small" onClick={() => setPdfPreviewModalOpen(false)} sx={{ color: "#FFFFFF" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4, display: "flex", justifyContent: "center" }}>
          <ChameleonPdfPreview
            skin={skin}
            clientName={selectedClient?.name || "CONJUNTO RESIDENCIAL"}
            clientNit={selectedClient?.nit || "NIT: 900.000.000-1"}
            clientCity={clientCity}
            proposalNumber={proposalNumber}
            blocks={blocks}
            bodyHtml={blocks
              .map((b) =>
                b.type === "clause"
                  ? `<div class="noxia-clause-block"><h3 style="font-size: 1.05rem; font-weight: 700; color: #0F172A; margin: 16px 0 6px 0;">${b.title}</h3>${b.content}</div>`
                  : `<div class="noxia-paragraph-block">${b.content}</div>`
              )
              .join("\n")
            }
            serviceItems={previewServiceItems}
            valueAddedItems={valueAddedItems}
            signers={allActiveSigners}
            showSignatures={showSignatures}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#1E293B" }}>
          <Button onClick={() => window.print()} startIcon={<Print />} sx={{ color: "#FFFFFF" }}>
            Imprimir
          </Button>
          <Button variant="contained" onClick={() => setPdfPreviewModalOpen(false)}>
            Cerrar Vista Previa
          </Button>
        </DialogActions>
      </Dialog>

      {/* 10. DIALOG: Firmante Ad-hoc */}
      <Dialog open={adHocDialogOpen} onClose={() => setAdHocDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle component="div" sx={{ fontWeight: 800 }}>
          <Typography variant="h6" fontWeight={800}>
            Agregar Firmante Ad-hoc
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              label="Nombre Completo *"
              value={newAdHocSigner.fullName}
              onChange={(e) => setNewAdHocSigner({ ...newAdHocSigner, fullName: e.target.value })}
            />
            <TextField
              size="small"
              fullWidth
              label="Cargo o Rol *"
              value={newAdHocSigner.jobTitle}
              onChange={(e) => setNewAdHocSigner({ ...newAdHocSigner, jobTitle: e.target.value })}
            />
            <TextField
              size="small"
              fullWidth
              label="Cédula de Ciudadanía"
              value={newAdHocSigner.documentNumber}
              onChange={(e) => setNewAdHocSigner({ ...newAdHocSigner, documentNumber: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdHocDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!newAdHocSigner.fullName.trim() || !newAdHocSigner.jobTitle.trim()) {
                showError("Por favor ingrese el nombre y cargo.");
                return;
              }
              const created = {
                id: `adhoc-${Date.now()}`,
                fullName: newAdHocSigner.fullName.trim(),
                jobTitle: newAdHocSigner.jobTitle.trim(),
                documentNumber: newAdHocSigner.documentNumber.trim() || undefined,
              };
              setAdHocSigners((prev) => [...prev, created]);
              setShowSignatures(true);
              setNewAdHocSigner({ fullName: "", jobTitle: "", documentNumber: "" });
              setAdHocDialogOpen(false);
            }}
          >
            Agregar Firmante
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
