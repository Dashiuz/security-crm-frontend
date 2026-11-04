"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  MenuItem,
  Paper,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Divider,
  Menu,
  InputAdornment,
  Card,
  Select,
  FormControl,
} from "@mui/material";
import {
  ArrowBack,
  SaveOutlined,
  Print,
  TextFields,
  PostAdd,
  TableChart,
  AlternateEmail,
  Draw,
  ZoomIn,
  ZoomOut,
  Close as CloseIcon,
  ContentCopy,
  EditOutlined,
  Add as AddIcon,
  DeleteOutline,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Search as SearchIcon,
  Visibility,
  VisibilityOff,
  Settings,
  Shield,
  AutoAwesome,
  CheckCircle,
  HelpOutline,
} from "@mui/icons-material";
import NotionProposalBlock from "@/app/(protected)/commercial/proposals/components/NotionProposalBlock";
import ChameleonPdfPreview from "@/app/(protected)/commercial/proposals/components/ChameleonPdfPreview";
import {
  FormatEngineApi,
  UniversalDocumentFormat,
  FormatCategory,
  FormatVisibilityScope,
  CreateFormatInput,
  UpdateFormatInput,
} from "@/lib/api/format-engine";
import {
  TenantDocumentSkin,
  DocumentHeaderLayout,
  CommercialSettingsApi,
} from "@/lib/api/commercial-settings";
import { useNotification } from "@/providers/NotificationProvider";

export interface UniversalFormatStudioWorkspaceProps {
  formatId?: string;
  initialFormat?: UniversalDocumentFormat | null;
}

interface FormatBlock {
  id: string;
  type: "clause" | "paragraph";
  title?: string;
  content: string;
}

interface FormatSigner {
  id: string;
  fullName: string;
  jobTitle: string;
  professionalCardNum?: string;
}

interface VariableDefinition {
  token: string;
  label: string;
  category: "empresa" | "cliente" | "empleado" | "operacion" | "fecha" | "custom";
  example: string;
}

const DEFAULT_BLOCKS: FormatBlock[] = [
  {
    id: "blk-intro",
    type: "paragraph",
    content:
      "<p>En la ciudad de <strong>{{cliente.ciudad}}</strong>, a los <strong>{{fecha.actual}}</strong>, se suscribe el presente documento administrativo y operativo entre las partes intervinientes.</p>",
  },
  {
    id: "blk-cl-1",
    type: "clause",
    title: "CLÁUSULA PRIMERA: OBJETO Y ALCANCE",
    content:
      "<p>El presente formato tiene como finalidad formalizar las condiciones de custodia, dotación y cumplimiento operativo en las instalaciones de <strong>{{cliente.nombre}}</strong> con NIT <strong>{{cliente.nit}}</strong>.</p>",
  },
  {
    id: "blk-cl-2",
    type: "clause",
    title: "CLÁUSULA SEGUNDA: DOTACIÓN Y ELEMENTOS DE SERVICIO",
    content:
      "<table style='width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;'><thead><tr style='background-color: #f8fafc;'><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Ítem</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Elemento / Activo</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Serial / Plaqueta</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Cant.</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Estado</th></tr></thead><tbody><tr><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>01</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>Radio Comunicador Portátil UHF</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>{{activo.serial}}</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>2</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Operativo</td></tr><tr><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>02</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>Linterna Recargable de Alta Potencia</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>LNT-LED-0042</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>2</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Nuevo</td></tr></tbody></table>",
  },
  {
    id: "blk-cl-3",
    type: "clause",
    title: "CLÁUSULA TERCERA: COMPROMISOS Y CONFIDENCIALIDAD",
    content:
      "<p>El funcionario <strong>{{empleado.nombre}}</strong> con documento <strong>{{empleado.documento}}</strong> asume la responsabilidad y custodia integral de los elementos descritos bajo los protocolos institucionales de seguridad.</p>",
  },
];

const DEFAULT_SIGNERS: FormatSigner[] = [
  {
    id: "signer-beneficiary",
    fullName: "{{empleado.nombre}}",
    jobTitle: "Funcionario Responsable / Custodio",
    professionalCardNum: "C.C. {{empleado.documento}}",
  },
  {
    id: "signer-operations",
    fullName: "Director de Operaciones SVSP",
    jobTitle: "Dirección de Seguridad y Operaciones",
    professionalCardNum: "Loro ERP Colombia",
  },
];

const SYSTEM_VARIABLES: VariableDefinition[] = [
  // Mi Empresa
  { token: "empresa.razon_social", label: "Razón Social Empresa", category: "empresa", example: "LORO ERP SEGURIDAD PRIVADA S.A.S." },
  { token: "empresa.nit", label: "NIT de la Empresa", category: "empresa", example: "900.000.000-1" },
  { token: "empresa.licencia", label: "Licencia SuperVigilancia", category: "empresa", example: "Resolución SVSP No. 004921" },
  { token: "empresa.direccion", label: "Dirección Principal Empresa", category: "empresa", example: "Calle 93B # 13-45 Of. 501, Bogotá D.C." },

  // Cliente / Puesto
  { token: "cliente.nombre", label: "Nombre / Razón Social Cliente", category: "cliente", example: "CONJUNTO RESIDENCIAL LOS ALPES P.H." },
  { token: "cliente.nit", label: "NIT del Cliente", category: "cliente", example: "901.442.189-3" },
  { token: "cliente.direccion", label: "Dirección de la Copropiedad / Sede", category: "cliente", example: "Carrera 7 # 127-48, Torre 2" },
  { token: "cliente.ciudad", label: "Ciudad / Municipio", category: "cliente", example: "Bogotá D.C." },
  { token: "cliente.representante", label: "Representante Legal / Administrador", category: "cliente", example: "Dra. Carolina Méndez" },
  { token: "puesto.nombre", label: "Puesto / Sector Operativo", category: "cliente", example: "Portería Principal y Acceso Vehicular" },

  // Empleado / Guardia
  { token: "empleado.nombre", label: "Nombre Completo del Guarda / Funcionario", category: "empleado", example: "Carlos Andrés Ruiz Salcedo" },
  { token: "empleado.documento", label: "Cédula de Ciudadanía", category: "empleado", example: "1.018.492.301" },
  { token: "empleado.cargo", label: "Cargo Operativo", category: "empleado", example: "Guarda de Seguridad y Control de Acceso" },
  { token: "empleado.rh", label: "Grupo Sanguíneo y Factor RH", category: "empleado", example: "O Positivo (O+)" },
  { token: "empleado.carnet_svsp", label: "Número Carnet SVSP", category: "empleado", example: "SVSP-GDA-2026-9942" },

  // Operación / Dotación
  { token: "activo.serial", label: "Serial de Fábrica del Activo", category: "operacion", example: "MOT-DEP450-7782" },
  { token: "activo.marca", label: "Marca / Modelo de Dotación", category: "operacion", example: "Motorola Solutions DEP450" },
  { token: "activo.placa", label: "Plaqueta de Inventario Interno", category: "operacion", example: "ACT-LORO-0042" },

  // Fechas
  { token: "fecha.actual", label: "Fecha Actual en Letras", category: "fecha", example: "4 de noviembre de 2026" },
  { token: "hora.actual", label: "Hora Actual", category: "fecha", example: "09:30 AM" },
];

const SAMPLE_VARIABLE_VALUES: Record<string, string> = {
  "empresa.razon_social": "LORO ERP SEGURIDAD PRIVADA S.A.S.",
  "empresa.nit": "900.000.000-1",
  "empresa.licencia": "Resolución SVSP No. 004921",
  "empresa.direccion": "Calle 93B # 13-45 Of. 501, Bogotá D.C.",
  "cliente.nombre": "CONJUNTO RESIDENCIAL LOS ALPES P.H.",
  "cliente.nit": "901.442.189-3",
  "cliente.direccion": "Carrera 7 # 127-48, Torre 2",
  "cliente.ciudad": "Bogotá D.C.",
  "cliente.representante": "Dra. Carolina Méndez (Administradora)",
  "puesto.nombre": "Portería Principal y Acceso Vehicular",
  "empleado.nombre": "Carlos Andrés Ruiz Salcedo",
  "empleado.documento": "1.018.492.301",
  "empleado.cargo": "Guarda de Seguridad y Control de Acceso",
  "empleado.rh": "O Positivo (O+)",
  "empleado.carnet_svsp": "SVSP-GDA-2026-9942",
  "activo.serial": "MOT-DEP450-7782",
  "activo.marca": "Motorola Solutions DEP450",
  "activo.placa": "ACT-LORO-0042",
  "fecha.actual": new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }),
  "hora.actual": "09:30 AM",
};

export default function UniversalFormatStudioWorkspace({
  formatId,
  initialFormat,
}: UniversalFormatStudioWorkspaceProps) {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  // Metadatos del Formato
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FormatCategory>(FormatCategory.GENERAL);
  const [scope, setScope] = useState<FormatVisibilityScope>(FormatVisibilityScope.PERSONAL);
  const [isDefault, setIsDefault] = useState(false);

  // Configuración de visualización y secciones
  const [showHeader, setShowHeader] = useState(true);
  const [showSigners, setShowSigners] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [hydratePreview, setHydratePreview] = useState(false);

  // Bloques modulares estilo Notion
  const [blocks, setBlocks] = useState<FormatBlock[]>(DEFAULT_BLOCKS);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const editorInstancesRef = useRef<Record<string, any>>({});

  // Historial Deshacer / Rehacer
  const [history, setHistory] = useState<FormatBlock[][]>([DEFAULT_BLOCKS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Firmantes
  const [signers, setSigners] = useState<FormatSigner[]>(DEFAULT_SIGNERS);

  // Variables y personalizadas
  const [customVariables, setCustomVariables] = useState<VariableDefinition[]>([]);
  const [variableSearchQuery, setVariableSearchQuery] = useState("");
  const [variableCategoryFilter, setVariableCategoryFilter] = useState<string>("all");
  const [showNewVarForm, setShowNewVarForm] = useState(false);
  const [newVarToken, setNewVarToken] = useState("");
  const [newVarLabel, setNewVarLabel] = useState("");
  const [newVarExample, setNewVarExample] = useState("");

  // Control de Cajones / Modales
  type DrawerTab = "properties" | "variables" | "signers" | null;
  const [drawerTab, setDrawerTab] = useState<DrawerTab>(null);
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);

  // Menús superiores y cinta
  const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);
  const [tableMenuAnchor, setTableMenuAnchor] = useState<null | HTMLElement>(null);

  // Skin institucional
  const [skin, setSkin] = useState<Partial<TenantDocumentSkin>>({
    primaryBrandColorHex: "#4338CA",
    accentBrandColorHex: "#6366F1",
    companyLegalName: "LORO ERP SEGURIDAD PRIVADA S.A.S.",
    companyNit: "900.000.000-1",
    supervigilanciaLicense: "Resolución SVSP No. 004921",
    headerLayout: DocumentHeaderLayout.CLASSIC_CORPORATE,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Manejo de Historial (Undo / Redo)
  const pushToHistory = useCallback((newBlocks: FormatBlock[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newBlocks];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setBlocks(history[prevIdx]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setBlocks(history[nextIdx]);
    }
  }, [history, historyIndex]);

  // Teclado para Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const populateFromFormat = useCallback((f: UniversalDocumentFormat) => {
    setCode(f.code);
    setTitle(f.title);
    setDescription(f.description || "");
    setCategory(f.category);
    setScope(f.scope);
    setIsDefault(f.isDefault);

    const sec = f.sectionsConfig as {
      showHeader?: boolean;
      showSignaturesBlock?: boolean;
      blocks?: FormatBlock[];
      signers?: FormatSigner[];
    } | undefined;

    setShowHeader(sec?.showHeader ?? true);
    setShowSigners(sec?.showSignaturesBlock ?? true);

    if (Array.isArray(sec?.signers) && sec.signers.length > 0) {
      setSigners(sec.signers);
    }

    if (Array.isArray(sec?.blocks) && sec.blocks.length > 0) {
      setBlocks(sec.blocks);
      setHistory([sec.blocks]);
      setHistoryIndex(0);
    } else if (f.bodyTemplate) {
      const single: FormatBlock[] = [
        {
          id: "blk-imported",
          type: "paragraph",
          content: f.bodyTemplate,
        },
      ];
      setBlocks(single);
      setHistory([single]);
      setHistoryIndex(0);
    }
  }, []);

  const fetchNextCode = useCallback(async (cat: FormatCategory) => {
    try {
      const res = await FormatEngineApi.getNextFormatCode(cat);
      setCode(res.code);
      setTitle((prev) => (prev ? prev : `Nuevo Formato - ${res.code}`));
    } catch {
      setCode(`FOR-${Date.now().toString().slice(-4)}`);
    }
  }, []);

  const loadExistingFormat = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const match = await FormatEngineApi.getFormatById(id);
        if (match) {
          populateFromFormat(match);
        } else {
          showError("Formato no encontrado");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al cargar formato";
        showError(msg);
      } finally {
        setLoading(false);
      }
    },
    [populateFromFormat, showError]
  );

  const loadSettingsAndCatalogs = useCallback(async () => {
    try {
      const [varsRes, settingsRes] = await Promise.all([
        FormatEngineApi.getVariables().catch(() => []),
        CommercialSettingsApi.getSettings().catch(() => null),
      ]);
      if (Array.isArray(varsRes) && varsRes.length > 0) {
        const mapped = varsRes.map((v: any) => ({
          token: v.key || v.token,
          label: v.name || v.label || v.key,
          category: (v.category?.toLowerCase() || "custom") as any,
          example: v.example || `{{${v.key}}}`,
        }));
        setCustomVariables(mapped);
      }
      if (settingsRes?.documentSkin) {
        setSkin(settingsRes.documentSkin);
      }
    } catch {
      // Ignorar fallback silencioso
    }
  }, []);

  useEffect(() => {
    loadSettingsAndCatalogs();
    if (formatId) {
      loadExistingFormat(formatId);
    } else if (initialFormat) {
      populateFromFormat(initialFormat);
    } else {
      fetchNextCode(FormatCategory.GENERAL);
    }
  }, [formatId, initialFormat, loadSettingsAndCatalogs, loadExistingFormat, populateFromFormat, fetchNextCode]);

  // Gestión de Bloques
  const handleAddParagraph = () => {
    const newId = `blk-${Date.now()}`;
    const newBlock: FormatBlock = {
      id: newId,
      type: "paragraph",
      content: "<p>Escriba aquí el contenido libre o informativo del formato...</p>",
    };
    const next = [...blocks, newBlock];
    setBlocks(next);
    pushToHistory(next);
    setActiveBlockId(newId);
  };

  const handleAddClause = () => {
    const newId = `blk-${Date.now()}`;
    const clauseCount = blocks.filter((b) => b.type === "clause").length + 1;
    const newBlock: FormatBlock = {
      id: newId,
      type: "clause",
      title: `CLÁUSULA ${clauseCount}: NUEVA ESTIPULACIÓN OPERATIVA`,
      content: "<p>Describa aquí los compromisos, términos de servicio o instrucciones...</p>",
    };
    const next = [...blocks, newBlock];
    setBlocks(next);
    pushToHistory(next);
    setActiveBlockId(newId);
  };

  const handleInsertTablePreset = (type: "equipment" | "checklist" | "attendance" | "custom") => {
    setTableMenuAnchor(null);
    const newId = `blk-${Date.now()}`;
    let htmlContent = "";

    switch (type) {
      case "equipment":
        htmlContent =
          "<table style='width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;'><thead><tr style='background-color: #f8fafc;'><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Ítem</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Elemento / Dotación</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Serial / Plaqueta</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Cant.</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Estado</th></tr></thead><tbody><tr><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>01</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>Radio Comunicador Portátil UHF</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>{{activo.serial}}</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>1</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Operativo</td></tr><tr><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>02</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>Armamento de Dotación / Chaleco</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>SER-9021-SVSP</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>1</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Operativo</td></tr></tbody></table>";
        break;
      case "checklist":
        htmlContent =
          "<table style='width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;'><thead><tr style='background-color: #f8fafc;'><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Punto de Inspección / Control</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Cumple</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>No Cumple</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Observación / Hallazgo</th></tr></thead><tbody><tr><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>01. Funcionamiento de talanqueras y control vehicular</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>[ X ]</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>[ ]</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>Sin novedad</td></tr><tr><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>02. Estado de cámaras de circuito cerrado de TV (CCTV)</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>[ X ]</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>[ ]</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>Operativas 100%</td></tr></tbody></table>";
        break;
      case "attendance":
        htmlContent =
          "<table style='width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;'><thead><tr style='background-color: #f8fafc;'><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Funcionario / Guarda</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Documento C.C.</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Hora Ingreso</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Hora Salida</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Firma</th></tr></thead><tbody><tr><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>{{empleado.nombre}}</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>{{empleado.documento}}</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>06:00</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>18:00</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>________________</td></tr></tbody></table>";
        break;
      case "custom":
      default:
        htmlContent =
          "<table style='width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;'><thead><tr style='background-color: #f8fafc;'><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Columna 1</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left;'>Columna 2</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Cant.</th><th style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Estado</th></tr></thead><tbody><tr><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>Registro 01</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px;'>Descripción detallada</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>1</td><td style='border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center;'>Conforme</td></tr></tbody></table>";
        break;
    }

    const newBlock: FormatBlock = {
      id: newId,
      type: "paragraph",
      content: htmlContent,
    };
    const next = [...blocks, newBlock];
    setBlocks(next);
    pushToHistory(next);
    setActiveBlockId(newId);
  };

  const handleUpdateBlock = (id: string, updates: { title?: string; content?: string }) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const handleRemoveBlock = (id: string) => {
    const next = blocks.filter((b) => b.id !== id);
    setBlocks(next);
    pushToHistory(next);
  };

  const handleMoveBlock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setBlocks(next);
    pushToHistory(next);
  };

  // Concatenación HTML de bloques
  const fullHtmlBody = useMemo(() => {
    return blocks
      .map((b) => {
        if (b.type === "clause") {
          return `<div class="loro-clause-block" style="margin-bottom: 16px;"><h3 style="font-size: 1rem; font-weight: 700; color: #0F172A; margin: 14px 0 6px 0; text-transform: uppercase;">${b.title}</h3>${b.content}</div>`;
        }
        return `<div class="loro-text-block" style="margin-bottom: 14px;">${b.content}</div>`;
      })
      .join("");
  }, [blocks]);

  // Lista unificada de variables
  const allVariables = useMemo(() => {
    const combined = [...SYSTEM_VARIABLES];
    customVariables.forEach((cv) => {
      if (!combined.some((v) => v.token === cv.token)) {
        combined.push(cv);
      }
    });
    return combined;
  }, [customVariables]);

  const filteredVariables = useMemo(() => {
    return allVariables.filter((v) => {
      const matchesSearch =
        !variableSearchQuery ||
        v.token.toLowerCase().includes(variableSearchQuery.toLowerCase()) ||
        v.label.toLowerCase().includes(variableSearchQuery.toLowerCase()) ||
        v.example.toLowerCase().includes(variableSearchQuery.toLowerCase());
      const matchesCat =
        variableCategoryFilter === "all" || v.category === variableCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [allVariables, variableSearchQuery, variableCategoryFilter]);

  // Inserción de Token en Editor Activo
  const handleInsertToken = (token: string) => {
    const tokenStr = `{{${token}}}`;
    const activeEditor = activeBlockId ? editorInstancesRef.current[activeBlockId] : null;

    if (activeEditor) {
      activeEditor.commands.insertContent(tokenStr);
      showSuccess(`Variable ${tokenStr} insertada en el bloque.`);
    } else if (blocks.length > 0) {
      const targetId = activeBlockId || blocks[blocks.length - 1].id;
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === targetId
            ? { ...b, content: `${b.content} <span style="color: #4F46E5; font-weight: 700;">${tokenStr}</span>` }
            : b
        )
      );
      showSuccess(`Variable ${tokenStr} agregada al bloque.`);
    } else {
      navigator.clipboard.writeText(tokenStr);
      showSuccess(`Variable ${tokenStr} copiada al portapapeles.`);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(`{{${token}}}`);
    showSuccess(`Variable {{${token}}} copiada al portapapeles.`);
  };

  const handleCreateCustomVariable = () => {
    if (!newVarToken.trim() || !newVarLabel.trim()) {
      showError("Por favor ingrese la clave y el nombre de la variable.");
      return;
    }
    const cleanKey = newVarToken
      .trim()
      .toLowerCase()
      .replace(/[{}]/g, "")
      .replace(/\s+/g, "_");

    const created: VariableDefinition = {
      token: cleanKey,
      label: newVarLabel.trim(),
      category: "custom",
      example: newVarExample.trim() || cleanKey,
    };

    setCustomVariables((prev) => [...prev, created]);
    setNewVarToken("");
    setNewVarLabel("");
    setNewVarExample("");
    setShowNewVarForm(false);
    showSuccess(`Variable personalizada {{${cleanKey}}} registrada.`);
  };

  // Hidratación para simulación
  const hydrateHtml = useCallback((html: string, shouldHydrate: boolean) => {
    if (!shouldHydrate) return html;
    let res = html;
    Object.entries(SAMPLE_VARIABLE_VALUES).forEach(([k, v]) => {
      res = res.replaceAll(`{{${k}}}`, v);
      res = res.replaceAll(`[[${k}]]`, v);
    });
    return res;
  }, []);

  const previewBlocks = useMemo(() => {
    if (!hydratePreview) return blocks;
    return blocks.map((b) => ({
      ...b,
      title: b.title ? hydrateHtml(b.title, true) : undefined,
      content: hydrateHtml(b.content, true),
    }));
  }, [blocks, hydratePreview, hydrateHtml]);

  const previewSigners = useMemo(() => {
    if (!hydratePreview) return signers;
    return signers.map((s) => ({
      ...s,
      fullName: hydrateHtml(s.fullName, true),
      jobTitle: hydrateHtml(s.jobTitle, true),
      professionalCardNum: s.professionalCardNum ? hydrateHtml(s.professionalCardNum, true) : undefined,
    }));
  }, [signers, hydratePreview, hydrateHtml]);

  // Guardar Formato
  const handleSave = async () => {
    if (!code.trim() || !title.trim()) {
      setDrawerTab("properties");
      showError("El código y título del formato son obligatorios. Por favor complételos.");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateFormatInput = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        scope,
        isDefault,
        bodyTemplate: fullHtmlBody,
        sectionsConfig: {
          showHeader,
          showSignaturesBlock: showSigners,
          blocks,
          signers,
        },
      };

      if (formatId) {
        const updatePayload: UpdateFormatInput = payload;
        await FormatEngineApi.updateFormat(formatId, updatePayload);
        showSuccess("Formato actualizado correctamente en Loro Toolbox.");
      } else {
        await FormatEngineApi.createFormat(payload);
        showSuccess("Nuevo formato institucional registrado exitosamente.");
        router.push("/tools/formats");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar el formato";
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", bgcolor: "#F1F5F9", overflow: "hidden" }}>
      {/* 1. TOP MENU BAR (38px, #0F172A) */}
      <Box
        sx={{
          minHeight: 38,
          bgcolor: "#0F172A",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1, sm: 2 },
          zIndex: 100,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          width: "100%",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Volver al Catálogo de Formatos">
            <IconButton
              size="small"
              onClick={() => router.push("/tools/formats")}
              sx={{ color: "#94A3B8", p: 0.5, "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.08)" } }}
            >
              <ArrowBack sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.8rem", letterSpacing: "0.02em" }}>
              Loro Studio
            </Typography>
            <Chip
              label={code || "FOR-SIN-CÓDIGO"}
              size="small"
              onClick={() => setDrawerTab("properties")}
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontFamily: "monospace",
                fontWeight: 700,
                bgcolor: "rgba(99, 102, 241, 0.2)",
                color: "#A5B4FC",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                cursor: "pointer",
                "&:hover": { bgcolor: "rgba(99, 102, 241, 0.3)" },
              }}
            />
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.12)", my: 0.75 }} />

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
            <MenuItem onClick={() => { setFileMenuAnchor(null); handleSave(); }}>
              <SaveOutlined sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Guardar Formato
            </MenuItem>
            <MenuItem onClick={() => { setFileMenuAnchor(null); setPdfPreviewModalOpen(true); }}>
              <Print sx={{ fontSize: 16, mr: 1.5, color: "#818CF8" }} />
              Vista Previa / Imprimir PDF
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
            <MenuItem onClick={() => { setFileMenuAnchor(null); router.push("/tools/formats"); }}>
              <CloseIcon sx={{ fontSize: 16, mr: 1.5, color: "#EF4444" }} />
              Salir al Catálogo
            </MenuItem>
          </Menu>

          {/* Menú Directo: Propiedades del Formato */}
          <Button
            size="small"
            startIcon={<Settings sx={{ fontSize: 14, color: "#818CF8" }} />}
            onClick={() => setDrawerTab("properties")}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Propiedades del Formato
          </Button>

          {/* Menú Directo: Variables Dinámicas */}
          <Button
            size="small"
            startIcon={<AlternateEmail sx={{ fontSize: 14, color: "#A855F7" }} />}
            onClick={() => setDrawerTab("variables")}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Variables Dinámicas
          </Button>

          {/* Menú Directo: Firmantes */}
          <Button
            size="small"
            startIcon={<Draw sx={{ fontSize: 14, color: "#38BDF8" }} />}
            onClick={() => setDrawerTab("signers")}
            sx={{ color: "#E2E8F0", textTransform: "none", fontSize: "0.78rem", py: 0.25, px: 1, minWidth: "auto", "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            Firmantes ({signers.length})
          </Button>

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
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 230, bgcolor: "#1E293B", color: "#F8FAFC" } } }}
          >
            <MenuItem onClick={() => setShowHeader((prev) => !prev)}>
              {showHeader ? <Visibility sx={{ fontSize: 16, mr: 1.5, color: "#10B981" }} /> : <VisibilityOff sx={{ fontSize: 16, mr: 1.5, color: "#94A3B8" }} />}
              {showHeader ? "Ocultar Membrete Oficial" : "Mostrar Membrete Oficial"}
            </MenuItem>
            <MenuItem onClick={() => setShowSigners((prev) => !prev)}>
              {showSigners ? <Visibility sx={{ fontSize: 16, mr: 1.5, color: "#10B981" }} /> : <VisibilityOff sx={{ fontSize: 16, mr: 1.5, color: "#94A3B8" }} />}
              {showSigners ? "Ocultar Bloque de Firmas" : "Mostrar Bloque de Firmas"}
            </MenuItem>
            <MenuItem onClick={() => setHydratePreview((prev) => !prev)}>
              {hydratePreview ? <CheckCircle sx={{ fontSize: 16, mr: 1.5, color: "#6366F1" }} /> : <AutoAwesome sx={{ fontSize: 16, mr: 1.5, color: "#94A3B8" }} />}
              {hydratePreview ? "Desactivar Simulación (Ver Tokens)" : "Activar Simulación con Datos Reales"}
            </MenuItem>
          </Menu>
        </Stack>

        {/* Right Menu Items */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Deshacer (Ctrl+Z)">
            <span>
              <IconButton size="small" onClick={handleUndo} disabled={!canUndo} sx={{ color: "#94A3B8" }}>
                <UndoIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Rehacer (Ctrl+Y)">
            <span>
              <IconButton size="small" onClick={handleRedo} disabled={!canRedo} sx={{ color: "#94A3B8" }}>
                <RedoIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Cerrar y volver">
            <IconButton
              size="small"
              onClick={() => router.push("/tools/formats")}
              sx={{ color: "#94A3B8", ml: 1, "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.1)" } }}
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
          px: { xs: 1, sm: 2 },
          zIndex: 90,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          gap: { xs: 0.75, sm: 1.5 },
        }}
      >
        {/* Left: Insertion Tools */}
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
              "&:hover": { bgcolor: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
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
              "&:hover": { bgcolor: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
            }}
          >
            Cláusula
          </Button>

          <Button
            size="small"
            variant="text"
            startIcon={<TableChart sx={{ fontSize: 16, color: "#0284C7" }} />}
            onClick={(e) => setTableMenuAnchor(e.currentTarget)}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              color: "#334155",
              textTransform: "none",
              borderRadius: "6px",
              px: { xs: 0.75, sm: 1.25 },
              py: 0.4,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
            }}
          >
            + Tabla
          </Button>
          <Menu
            anchorEl={tableMenuAnchor}
            open={Boolean(tableMenuAnchor)}
            onClose={() => setTableMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 260 } } }}
          >
            <MenuItem onClick={() => handleInsertTablePreset("equipment")}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Dotación y Armamento</Typography>
                <Typography variant="caption" color="text.secondary">Seriales, placa, descripción, estado</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => handleInsertTablePreset("checklist")}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Checklist y Protocolos</Typography>
                <Typography variant="caption" color="text.secondary">Puntos de control perimetral / CCTV</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => handleInsertTablePreset("attendance")}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Control de Asistencia y Turno</Typography>
                <Typography variant="caption" color="text.secondary">Horas ingreso/salida y firma guarda</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleInsertTablePreset("custom")}>
              <Typography variant="body2" fontWeight={600}>Tabla Libre Personalizada</Typography>
            </MenuItem>
          </Menu>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5, borderColor: "#CBD5E1" }} />

          <Button
            size="small"
            variant={showSigners ? "contained" : "text"}
            startIcon={<Draw sx={{ fontSize: 16, color: showSigners ? "#FFFFFF" : "#7C3AED" }} />}
            onClick={() => setShowSigners((prev) => !prev)}
            sx={{
              fontWeight: 700,
              fontSize: "0.78rem",
              color: showSigners ? "#FFFFFF" : "#334155",
              bgcolor: showSigners ? "#7C3AED" : "transparent",
              textTransform: "none",
              borderRadius: "6px",
              px: { xs: 0.75, sm: 1.25 },
              py: 0.4,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: showSigners ? "#6D28D9" : "#FFFFFF" },
            }}
          >
            + Firmas
          </Button>

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
              "&:hover": { bgcolor: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
            }}
          >
            @ Variable Dinámica
          </Button>
        </Box>

        {/* Center: Context Indicators */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flexShrink: 1 }}>
          <Tooltip title="Clic para configurar metadatos y código oficial">
            <Chip
              icon={<Settings sx={{ fontSize: "14px !important", color: "#4338CA !important" }} />}
              label={`${title || "Formato"} • ${code || "FOR-001"}`}
              variant="outlined"
              size="small"
              onClick={() => setDrawerTab("properties")}
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
                maxWidth: { xs: 120, sm: 180, md: 240 },
                borderRadius: "6px",
                height: 28,
                bgcolor: "#F8FAFC",
                "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", px: 1 },
                "&:hover": { boxShadow: "0 2px 6px rgba(0,0,0,0.08)" },
              }}
            />
          </Tooltip>

          <Tooltip title={hydratePreview ? "Desactivar modo simulación (ver tokens {{...}})" : "Simular con datos de prueba reales"}>
            <Chip
              icon={<AutoAwesome sx={{ fontSize: "14px !important", color: hydratePreview ? "#10B981 !important" : "#64748B !important" }} />}
              label={hydratePreview ? "Simulación Activa" : "Datos de Prueba"}
              color={hydratePreview ? "success" : "default"}
              variant={hydratePreview ? "filled" : "outlined"}
              size="small"
              onClick={() => setHydratePreview((prev) => !prev)}
              sx={{
                fontWeight: 700,
                fontSize: "0.74rem",
                cursor: "pointer",
                borderRadius: "6px",
                height: 28,
              }}
            />
          </Tooltip>
        </Stack>

        {/* Right: Actions and Zoom */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, ml: "auto" }}>
          <FormControl size="small" sx={{ display: { xs: "none", md: "inline-flex" }, minWidth: 86 }}>
            <Select
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              size="small"
              sx={{
                height: 28,
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "#1E293B",
                bgcolor: "#F8FAFC",
                borderRadius: "6px",
                "& .MuiSelect-select": { py: 0.3, px: 1 },
              }}
            >
              <MenuItem value={0.75}>75%</MenuItem>
              <MenuItem value={0.9}>90%</MenuItem>
              <MenuItem value={1.0}>100%</MenuItem>
              <MenuItem value={1.2}>120%</MenuItem>
              <MenuItem value={1.4}>140%</MenuItem>
            </Select>
          </FormControl>

          <Button
            size="small"
            variant="outlined"
            startIcon={<Print sx={{ fontSize: 16, color: "#4F46E5" }} />}
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
              "&:hover": { bgcolor: "#F8FAFC", borderColor: "#94A3B8" },
            }}
          >
            Vista Previa
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined sx={{ fontSize: 17 }} />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              fontWeight: 800,
              fontSize: "0.82rem",
              px: { xs: 1.5, sm: 2.2 },
              py: 0.65,
              borderRadius: "7px",
              textTransform: "none",
              whiteSpace: "nowrap",
              background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
              color: "#FFFFFF",
              "&:hover": {
                background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
                boxShadow: "0 6px 18px rgba(79, 70, 229, 0.45)",
              },
            }}
          >
            {saving ? "Guardando..." : formatId ? "Actualizar Formato" : "Guardar Formato"}
          </Button>
        </Stack>
      </Box>

      {/* 3. WORKSPACE CANVAS CONTAINER (Single-Sheet A4 Engine) */}
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
        }}
      >
        {/* THE WHITE A4 PAPER SHEET */}
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: "98%", md: "860px", lg: "900px" },
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top center",
            transition: "transform 150ms cubic-bezier(0.2, 0, 0, 1)",
            mb: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              width: "100%",
              minHeight: "1000px",
              bgcolor: "#FFFFFF",
              borderRadius: "4px",
              p: { xs: 3, sm: 5 },
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E2E8F0",
              position: "relative",
            }}
          >
            {/* Header Interactivo en Hoja */}
            {showHeader ? (
              <Box
                sx={{
                  mb: 3,
                  pb: 2,
                  borderBottom: "2px solid #E2E8F0",
                  position: "relative",
                  "&:hover .edit-header-btn": { opacity: 1 },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ pr: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Shield sx={{ fontSize: 18, color: skin.primaryBrandColorHex || "#4338CA" }} />
                      <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: "0.1em", color: skin.primaryBrandColorHex || "#4338CA" }}>
                        {skin.companyLegalName || "LORO ERP SEGURIDAD PRIVADA S.A.S."}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                      {title ? (hydratePreview ? hydrateHtml(title, true) : title) : "FORMATO INSTITUCIONAL OFICIAL"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                      {skin.companyNit || "NIT: 900.000.000-1"} • {skin.supervigilanciaLicense || "Resolución SVSP No. 004921"}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.7rem" }}>
                      Código / Consecutivo
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: skin.accentBrandColorHex || "#6366F1", fontFamily: "monospace" }}>
                      {code || "FOR-SIN-CÓDIGO"}
                    </Typography>
                    <Chip
                      label={category}
                      size="small"
                      sx={{ mt: 0.5, height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                    />
                  </Box>
                </Box>

                <Button
                  className="edit-header-btn"
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined fontSize="small" />}
                  onClick={() => setDrawerTab("properties")}
                  sx={{
                    position: "absolute",
                    right: 0,
                    top: -6,
                    opacity: 0,
                    transition: "opacity 0.2s ease-in-out",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  Configurar Formato
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  mb: 2.5,
                  p: 1.5,
                  bgcolor: "#F8FAFC",
                  borderRadius: 1.5,
                  border: "1px dashed #CBD5E1",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  Membrete oficial oculto (ideal para impresión sobre papel membretado preimpreso)
                </Typography>
                <Button size="small" onClick={() => setShowHeader(true)} sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 700 }}>
                  Activar Membrete
                </Button>
              </Box>
            )}

            {/* Lista de Bloques Notion Interactivos */}
            <Stack spacing={2} sx={{ mb: 4 }}>
              {blocks.map((block, index) => (
                <NotionProposalBlock
                  key={block.id}
                  id={block.id}
                  index={index}
                  type={block.type}
                  title={block.title}
                  content={block.content}
                  isActive={activeBlockId === block.id}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                  onFocus={() => setActiveBlockId(block.id)}
                  onRegisterEditor={(id, editor) => {
                    editorInstancesRef.current[id] = editor;
                  }}
                  onUpdate={(id, updates) => handleUpdateBlock(id, updates)}
                  onRemove={(id) => handleRemoveBlock(id)}
                  onMoveUp={() => handleMoveBlock(index, index - 1)}
                  onMoveDown={() => handleMoveBlock(index, index + 1)}
                />
              ))}
            </Stack>

            {/* Botones Rápidos al Pie del Contenido en Hoja */}
            <Box
              sx={{
                py: 2,
                px: 2,
                border: "1px dashed #CBD5E1",
                borderRadius: 2,
                bgcolor: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                mb: 4,
              }}
            >
              <Button
                size="small"
                variant="text"
                startIcon={<AddIcon fontSize="small" />}
                onClick={handleAddParagraph}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.8rem", color: "#4F46E5" }}
              >
                + Agregar texto libre
              </Button>
              <Divider orientation="vertical" flexItem />
              <Button
                size="small"
                variant="text"
                startIcon={<PostAdd fontSize="small" />}
                onClick={handleAddClause}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.8rem", color: "#4F46E5" }}
              >
                + Agregar cláusula
              </Button>
              <Divider orientation="vertical" flexItem />
              <Button
                size="small"
                variant="text"
                startIcon={<TableChart fontSize="small" />}
                onClick={(e) => setTableMenuAnchor(e.currentTarget)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.8rem", color: "#0284C7" }}
              >
                + Insertar tabla operativa
              </Button>
            </Box>

            {/* Bloque de Firmas al Final de la Hoja */}
            {showSigners ? (
              <Box
                sx={{
                  pt: 4,
                  mt: 4,
                  borderTop: "1px solid #E2E8F0",
                  position: "relative",
                  "&:hover .edit-signers-btn": { opacity: 1 },
                }}
              >
                <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(signers.length || 1, 3)}, 1fr)`, gap: 3 }}>
                  {previewSigners.map((s) => (
                    <Box key={s.id} sx={{ textAlign: "center", pt: 5 }}>
                      <Box sx={{ borderBottom: "1.5px solid #0F172A", width: "80%", mx: "auto", mb: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.82rem" }}>
                        {s.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.72rem" }}>
                        {s.jobTitle}
                      </Typography>
                      {s.professionalCardNum && (
                        <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "0.68rem" }}>
                          {s.professionalCardNum}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>

                <Button
                  className="edit-signers-btn"
                  size="small"
                  variant="outlined"
                  startIcon={<EditOutlined fontSize="small" />}
                  onClick={() => setDrawerTab("signers")}
                  sx={{
                    position: "absolute",
                    right: 0,
                    top: 10,
                    opacity: 0,
                    transition: "opacity 0.2s ease-in-out",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  Gestionar Firmantes
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Button
                  size="small"
                  onClick={() => setShowSigners(true)}
                  sx={{ textTransform: "none", fontSize: "0.75rem", color: "text.secondary", textDecoration: "underline" }}
                >
                  Bloque de Firmas Desactivado (Clic para activar)
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* 4. SLIDING CONFIGURATION DRAWER (Properties, Variables, Signers) */}
      <Drawer
        anchor="right"
        open={Boolean(drawerTab)}
        onClose={() => setDrawerTab(null)}
        sx={{ zIndex: 1400 }}
        PaperProps={{
          sx: {
            width: { xs: "100vw", sm: 520 },
            p: 3,
            bgcolor: "#FFFFFF",
            boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.15)",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
              {drawerTab === "properties" && "Propiedades Generales del Formato"}
              {drawerTab === "variables" && "Catálogo de Variables Dinámicas"}
              {drawerTab === "signers" && "Firmantes Oficiales del Formato"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {drawerTab === "properties" && "Metadatos, categorización y opciones institucionales"}
              {drawerTab === "variables" && "Inserta tokens operacionales o crea variables personalizadas"}
              {drawerTab === "signers" && "Define los cargos y funcionarios que legalizan este documento"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDrawerTab(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* TAB 1: PROPERTIES */}
        {drawerTab === "properties" && (
          <Stack spacing={2.5} sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Código de Formato *"
                size="small"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                sx={{ width: 170 }}
                inputProps={{ style: { fontFamily: "monospace", fontWeight: 700 } }}
              />
              <TextField
                label="Título Oficial del Formato *"
                size="small"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Categoría"
                size="small"
                fullWidth
                value={category}
                onChange={(e) => {
                  const val = e.target.value as FormatCategory;
                  setCategory(val);
                  fetchNextCode(val);
                }}
              >
                <MenuItem value="GENERAL">General / Administrativo</MenuItem>
                <MenuItem value="HUMAN_RESOURCES">Talento Humano / Contratos</MenuItem>
                <MenuItem value="OPERATIONS">Operaciones y Minutas</MenuItem>
                <MenuItem value="SECURITY_STUDY">Estudios de Seguridad</MenuItem>
                <MenuItem value="MINUTA">Control de Rondas y Portería</MenuItem>
                <MenuItem value="PQRS">Atención a Clientes y PQRS</MenuItem>
              </TextField>

              <TextField
                select
                label="Visibilidad"
                size="small"
                fullWidth
                value={scope}
                onChange={(e) => setScope(e.target.value as FormatVisibilityScope)}
              >
                <MenuItem value="PERSONAL">Privado (Solo mi usuario)</MenuItem>
                <MenuItem value="TENANT">Institucional (Toda la empresa)</MenuItem>
              </TextField>
            </Stack>

            <TextField
              label="Descripción y Finalidad Operativa"
              size="small"
              multiline
              rows={3}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Especifique el objetivo y uso de este formato (ej: acta de entrega de dotación a guardas, inspección física de puestos)..."
            />

            <Divider />

            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
              Opciones de Presentación
            </Typography>

            <FormControlLabel
              control={<Switch checked={showHeader} onChange={(e) => setShowHeader(e.target.checked)} size="small" />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Membrete Oficial Loro ERP</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Incluye logotipo, razón social y resolución SVSP</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={showSigners} onChange={(e) => setShowSigners(e.target.checked)} size="small" />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Bloque de Firmas</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Habilita el espacio para firmas al pie de página</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} size="small" />}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Formato Predeterminado</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Plantilla por defecto para su categoría</Typography>
                </Box>
              }
            />
          </Stack>
        )}

        {/* TAB 2: VARIABLES */}
        {drawerTab === "variables" && (
          <Stack spacing={2} sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
                Variables Dinámicas Disponibles
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => setShowNewVarForm((prev) => !prev)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem", borderRadius: 1.5 }}
              >
                {showNewVarForm ? "Cerrar Formulario" : "Nueva Variable"}
              </Button>
            </Box>

            {showNewVarForm && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, fontSize: "0.8rem" }}>
                  Crear Variable Personalizada
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Clave / Token *"
                    placeholder="ej: supervisor.nombre"
                    value={newVarToken}
                    onChange={(e) => setNewVarToken(e.target.value)}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Etiqueta / Descripción *"
                    placeholder="ej: Nombre del Supervisor de Turno"
                    value={newVarLabel}
                    onChange={(e) => setNewVarLabel(e.target.value)}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Valor de Ejemplo"
                    placeholder="ej: Cap. Fernando Reyes"
                    value={newVarExample}
                    onChange={(e) => setNewVarExample(e.target.value)}
                  />
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1 }}>
                    <Button size="small" onClick={() => setShowNewVarForm(false)}>Cancelar</Button>
                    <Button size="small" variant="contained" onClick={handleCreateCustomVariable}>Guardar Variable</Button>
                  </Box>
                </Stack>
              </Paper>
            )}

            <TextField
              size="small"
              fullWidth
              placeholder="Buscar variable por token, etiqueta o ejemplo..."
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

            <Stack direction="row" spacing={0.5} sx={{ overflowX: "auto", pb: 0.5 }}>
              {[
                { id: "all", label: "Todas" },
                { id: "empresa", label: "Mi Empresa" },
                { id: "cliente", label: "Cliente" },
                { id: "empleado", label: "Empleado" },
                { id: "operacion", label: "Operaciones" },
                { id: "fecha", label: "Fechas" },
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
                          color: "#4338CA",
                          bgcolor: "#EEF2FF",
                          border: "1px solid #C7D2FE",
                        }}
                      />
                      <Chip
                        label={v.category}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: "0.62rem", fontWeight: 600, color: "#64748B" }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem" }} noWrap>
                      {v.label}
                    </Typography>
                    {v.example && (
                      <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.72rem", display: "block" }} noWrap>
                        Ejemplo: {v.example}
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
                      onClick={() => handleInsertToken(v.token)}
                      sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem", px: 1.25, py: 0.3, borderRadius: 1 }}
                    >
                      Insertar
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        )}

        {/* TAB 3: SIGNERS */}
        {drawerTab === "signers" && (
          <Stack spacing={2.5} sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
            <FormControlLabel
              control={<Switch checked={showSigners} onChange={(e) => setShowSigners(e.target.checked)} size="small" />}
              label={<Typography variant="body2" fontWeight={700}>Mostrar Bloque de Firmas en el Documento</Typography>}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
                Firmantes ({signers.length})
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => {
                  const newSigner: FormatSigner = {
                    id: `signer-${Date.now()}`,
                    fullName: "Nombre del Firmante o {{variable}}",
                    jobTitle: "Cargo o Función",
                    professionalCardNum: "Documento de Identidad",
                  };
                  setSigners((prev) => [...prev, newSigner]);
                }}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem", borderRadius: 1.5 }}
              >
                + Agregar Firmante
              </Button>
            </Box>

            <Stack spacing={2}>
              {signers.map((signer, index) => (
                <Paper key={signer.id} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={800} fontSize="0.8rem">
                      Firmante #{index + 1}
                    </Typography>
                    {signers.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setSigners((prev) => prev.filter((s) => s.id !== signer.id))}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <Stack spacing={1.5}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Nombre o Token Dinámico *"
                      value={signer.fullName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSigners((prev) => prev.map((s) => (s.id === signer.id ? { ...s, fullName: val } : s)));
                      }}
                      placeholder="ej: {{empleado.nombre}} o Director Operaciones"
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Cargo o Rol *"
                      value={signer.jobTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSigners((prev) => prev.map((s) => (s.id === signer.id ? { ...s, jobTitle: val } : s)));
                      }}
                      placeholder="ej: Guarda de Seguridad o Responsable de Puesto"
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Documento / C.C. / Matrícula"
                      value={signer.professionalCardNum || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSigners((prev) => prev.map((s) => (s.id === signer.id ? { ...s, professionalCardNum: val } : s)));
                      }}
                      placeholder="ej: C.C. {{empleado.documento}}"
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        )}

        <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid #E2E8F0" }}>
          <Button fullWidth variant="contained" onClick={() => setDrawerTab(null)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            Aplicar y Volver a la Hoja
          </Button>
        </Box>
      </Drawer>

      {/* 5. MODAL: VISTA PREVIA PDF COMPLETA CALIBRADA */}
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
            "@media print": {
              bgcolor: "transparent !important",
              maxHeight: "none !important",
              height: "auto !important",
              boxShadow: "none !important",
              border: "none !important",
              overflow: "visible !important",
              margin: "0 !important",
              maxWidth: "100% !important",
              width: "100% !important",
            },
          },
        }}
        sx={{
          "@media print": {
            position: "static",
            "& .MuiBackdrop-root": {
              display: "none !important",
            },
            "& .MuiDialog-container": {
              display: "block !important",
              position: "static !important",
              height: "auto !important",
              padding: "0 !important",
            },
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
            "@media print": {
              display: "none !important",
            },
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography component="span" variant="subtitle1" fontWeight={800}>
              Previsualización Oficial del Formato A4
            </Typography>
            <Chip
              label={hydratePreview ? "Datos Reales Simulados" : "Tokens Originales {{...}}"}
              size="small"
              color={hydratePreview ? "success" : "default"}
              sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.7rem", height: 22 }}
            />
          </Stack>
          <IconButton size="small" onClick={() => setPdfPreviewModalOpen(false)} sx={{ color: "#FFFFFF" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 4,
            display: "flex",
            justifyContent: "center",
            "@media print": {
              p: "0 !important",
              border: "none !important",
              bgcolor: "transparent !important",
              overflow: "visible !important",
              display: "block !important",
            },
          }}
        >
          <ChameleonPdfPreview
            skin={skin}
            layout={skin.headerLayout || DocumentHeaderLayout.CLASSIC_CORPORATE}
            clientName={hydratePreview ? "CONJUNTO RESIDENCIAL LOS ALPES P.H." : "{{cliente.nombre}}"}
            clientNit={hydratePreview ? "NIT: 901.442.189-3" : "NIT: {{cliente.nit}}"}
            clientCity={hydratePreview ? "Bogotá D.C." : "{{cliente.ciudad}}"}
            proposalNumber={code || "FOR-2026-001"}
            date={new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
            documentTitle={title || "FORMATO INSTITUCIONAL DE SEGURIDAD PRIVADA"}
            documentBadgeText={category}
            showHeader={showHeader}
            showRecipientBox={false}
            blocks={previewBlocks}
            serviceItems={[]}
            valueAddedItems={[]}
            signers={showSigners ? previewSigners : []}
            showSignatures={showSigners}
          />
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: "#1E293B",
            display: "flex",
            justifyContent: "space-between",
            "@media print": {
              display: "none !important",
            },
          }}
        >
          <FormControlLabel
            control={<Switch checked={hydratePreview} onChange={(e) => setHydratePreview(e.target.checked)} size="small" />}
            label={<Typography variant="caption" sx={{ color: "#E2E8F0", fontWeight: 700 }}>Simular Datos Reales</Typography>}
          />
          <Stack direction="row" spacing={1.5}>
            <Button onClick={() => window.print()} startIcon={<Print />} sx={{ color: "#FFFFFF", fontWeight: 700 }}>
              Imprimir / Exportar PDF
            </Button>
            <Button variant="contained" onClick={() => setPdfPreviewModalOpen(false)}>
              Cerrar Vista Previa
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
