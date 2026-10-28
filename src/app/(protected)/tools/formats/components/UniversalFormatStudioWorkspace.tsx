"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  MenuItem,
  Alert,
  Divider,
  Paper,
  Switch,
  Grid,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  ButtonGroup,
} from "@mui/material";
import {
  ArrowBack,
  SaveOutlined,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Description,
  CloudUpload,
  CheckCircle,
  TextFields,
  TableChart,
  AddPhotoAlternate,
  Security,
  AttachMoney,
  Draw,
  Refresh,
} from "@mui/icons-material";
import FormatTipTapEditor from "@/components/format-engine/editor/FormatTipTapEditor";
import FormatHeaderBlock from "@/components/format-engine/blocks/FormatHeaderBlock";
import FormatSvspCredentialsBlock, {
  SvspCredentialsData,
} from "@/components/format-engine/blocks/FormatSvspCredentialsBlock";
import FormatQualityBadgesBlock from "@/components/format-engine/blocks/FormatQualityBadgesBlock";
import FormatEconomicGridBlock from "@/components/format-engine/blocks/FormatEconomicGridBlock";
import FormatSignersBlock from "@/components/format-engine/blocks/FormatSignersBlock";
import FormatFooterBlock from "@/components/format-engine/blocks/FormatFooterBlock";
import {
  FormatEngineApi,
  UniversalDocumentFormat,
  FormatCategory,
  FormatVisibilityScope,
  FormatVariable,
  SystemFieldCategory,
} from "@/lib/api/format-engine";
import { useNotification } from "@/providers/NotificationProvider";

export interface UniversalFormatStudioWorkspaceProps {
  formatId?: string;
  initialFormat?: UniversalDocumentFormat | null;
}

export default function UniversalFormatStudioWorkspace({
  formatId,
  initialFormat,
}: UniversalFormatStudioWorkspaceProps) {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FormatCategory>(FormatCategory.GENERAL);
  const [scope, setScope] = useState<FormatVisibilityScope>(FormatVisibilityScope.PERSONAL);
  const [isDefault, setIsDefault] = useState(false);
  const [bodyTemplate, setBodyTemplate] = useState("<p>Comience a redactar el contenido o pegue tablas con Ctrl+V...</p>");

  // Componentes modulares
  const [showHeader, setShowHeader] = useState(true);
  const [showSvsp, setShowSvsp] = useState(false);
  const [svspData, setSvspData] = useState<SvspCredentialsData>({ mode: "AUTO" });
  const [showBadges, setShowBadges] = useState(false);
  const [showEconomic, setShowEconomic] = useState(false);
  const [showSigners, setShowSigners] = useState(true);
  const [showFooter, setShowFooter] = useState(true);

  // Parseo, catálogos y estado
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [systemCatalog, setSystemCatalog] = useState<SystemFieldCategory[]>([]);
  const [availableVariables, setAvailableVariables] = useState<FormatVariable[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Escala / Zoom del Canvas A4 (0.75, 0.90, 1.0)
  const [zoomLevel, setZoomLevel] = useState<number>(0.9);

  // Carga inicial
  useEffect(() => {
    loadCatalogAndVariables();
    if (formatId) {
      loadExistingFormat(formatId);
    } else if (initialFormat) {
      populateFromFormat(initialFormat);
    } else {
      fetchNextCode(FormatCategory.GENERAL);
    }
  }, [formatId]);

  const loadCatalogAndVariables = async () => {
    try {
      const [catRes, varsRes] = await Promise.all([
        FormatEngineApi.getSystemCatalog().catch(() => []),
        FormatEngineApi.getVariables().catch(() => []),
      ]);
      setSystemCatalog(catRes);
      setAvailableVariables(varsRes);
    } catch {
      // Ignore
    }
  };

  const loadExistingFormat = async (id: string) => {
    try {
      setLoading(true);
      const allFormats = await FormatEngineApi.getFormats();
      const match = allFormats.find((f) => f.id === id);
      if (match) {
        populateFromFormat(match);
      } else {
        showError("Formato no encontrado");
      }
    } catch (err: any) {
      showError(err.message || "Error al cargar formato");
    } finally {
      setLoading(false);
    }
  };

  const populateFromFormat = (f: UniversalDocumentFormat) => {
    setCode(f.code);
    setTitle(f.title);
    setDescription(f.description || "");
    setCategory(f.category);
    setScope(f.scope);
    setIsDefault(f.isDefault);
    setBodyTemplate(f.bodyTemplate || "");

    const sec = f.sectionsConfig || {};
    setShowHeader(sec.showHeader ?? true);
    setShowSvsp(sec.showSvspCredentials ?? false);
    setSvspData({
      mode: sec.svspCredentialsMode || "AUTO",
      ...sec.manualSvspCredentials,
    });
    setShowBadges(sec.showQualityBadges ?? false);
    setShowEconomic(sec.showEconomicGrid ?? false);
    setShowSigners(sec.showSigners ?? true);
    setShowFooter(sec.showFooter ?? true);
  };

  const fetchNextCode = async (cat: FormatCategory) => {
    try {
      const res = await FormatEngineApi.getNextFormatCode(cat);
      if (res?.code) {
        setCode(res.code);
      }
    } catch {
      // Fallback
    }
  };

  const handleCategoryChange = (newCat: FormatCategory) => {
    setCategory(newCat);
    if (!formatId && !initialFormat) {
      fetchNextCode(newCat);
    }
  };

  // Inserción de tokens dinámicos
  const handleInsertToken = (token: string) => {
    const formattedToken = `{{${token}}}`;
    setBodyTemplate((prev) => `${prev} <span class="mention" data-type="mention" data-id="${token}">${formattedToken}</span> `);
    showSuccess(`Variable ${formattedToken} copiada al lienzo`);
  };

  // Inserción de componentes
  const handleInsertComponent = (type: string) => {
    switch (type) {
      case "text_clause":
        setBodyTemplate((prev) => `${prev}<h3>CLÁUSULA: [Título de la Cláusula]</h3><p>Redacte aquí los términos operativos...</p>`);
        break;
      case "data_table":
        setBodyTemplate(
          (prev) =>
            `${prev}<table style="width:100%; border-collapse: collapse; margin: 12px 0;"><thead><tr><th style="border: 1px solid #CBD5E1; padding: 6px; background: #F1F5F9;">Ítem</th><th style="border: 1px solid #CBD5E1; padding: 6px; background: #F1F5F9;">Descripción</th><th style="border: 1px solid #CBD5E1; padding: 6px; background: #F1F5F9;">Cantidad</th></tr></thead><tbody><tr><td style="border: 1px solid #CBD5E1; padding: 6px;">1</td><td style="border: 1px solid #CBD5E1; padding: 6px;">Servicio de Monitoreo</td><td style="border: 1px solid #CBD5E1; padding: 6px;">1</td></tr></tbody></table>`
        );
        break;
      case "image_picker":
        if (imageInputRef.current) {
          imageInputRef.current.click();
        }
        break;
      case "security_posts":
        setShowEconomic(true);
        setBodyTemplate((prev) => `${prev}<p><strong>ESTRUCTURA DE PUESTOS Y TURNOS:</strong></p>{{tabla_puestos_vigilancia}}`);
        break;
      case "economic_summary":
        setShowEconomic((prev) => !prev);
        break;
      case "signatures_block":
        setShowSigners((prev) => !prev);
        break;
    }
  };

  const handleImagePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setBodyTemplate((prev) => `${prev}<p><img src="${base64}" alt="${file.name}" style="max-width:100%; border-radius: 4px;" /></p>`);
      showSuccess(`Imagen ${file.name} insertada`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Parse & Drop DOCX / XLSX
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseMessage(null);
    try {
      const res = await FormatEngineApi.parseUploadedFile(file);
      if (res?.html) {
        setBodyTemplate((prev) => `${prev}<hr/>${res.html}`);
        const count = res.detectedVariables?.length || 0;
        setParseMessage(`Documento importado con éxito. Se detectaron ${count} variables dinámicas.`);
        showSuccess(`Importación exitosa (${count} variables detectadas)`);
      }
    } catch (err: any) {
      showError(err.message || "Error al importar documento Word / Excel");
    } finally {
      setIsParsing(false);
    }
  };

  // Guardar Formato
  const handleSave = async () => {
    if (!code.trim() || !title.trim()) {
      showError("El código y el título del formato son obligatorios.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        scope,
        isDefault,
        bodyTemplate,
        sectionsConfig: {
          showHeader,
          showSvspCredentials: showSvsp,
          svspCredentialsMode: svspData.mode,
          manualSvspCredentials:
            svspData.mode === "MANUAL"
              ? {
                  license: svspData.license,
                  licenseDate: svspData.licenseDate,
                  licenseExpiry: svspData.licenseExpiry,
                  uniformsResolution: svspData.uniformsResolution,
                  overtimeResolution: svspData.overtimeResolution,
                }
              : undefined,
          showQualityBadges: showBadges,
          showEconomicGrid: showEconomic,
          showSigners,
          showFooter,
        },
      };

      if (formatId) {
        await FormatEngineApi.updateFormat(formatId, payload);
        showSuccess("Formato actualizado con éxito");
      } else {
        await FormatEngineApi.createFormat(payload);
        showSuccess("Formato institucional creado con éxito");
      }
      router.push("/tools/formats");
    } catch (err: any) {
      showError(err.message || "Error al guardar el formato");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", bgcolor: "#F8FAFC", overflow: "hidden" }}>
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleImagePickerChange}
      />

      {/* 38px OS Top Bar */}
      <Box
        sx={{
          height: 44,
          bgcolor: "#0F172A",
          color: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => router.push("/tools/formats")}
            sx={{
              color: "#94A3B8",
              textTransform: "none",
              fontSize: "0.78rem",
              fontWeight: 600,
              "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            Formatos
          </Button>

          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.12)", my: 0.8 }} />

          <Typography variant="body2" sx={{ fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.02em" }}>
            Universal Document Studio
          </Typography>

          <Chip
            label={code || "NUEVO"}
            size="small"
            sx={{
              fontFamily: "monospace",
              bgcolor: "rgba(99, 102, 241, 0.2)",
              color: "#A5B4FC",
              fontWeight: 800,
              fontSize: "0.72rem",
              height: 22,
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Zoom Controller */}
          <ButtonGroup size="small" sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 1.5 }}>
            <Tooltip title="Alejar (75%)">
              <Button
                onClick={() => setZoomLevel(0.75)}
                variant={zoomLevel === 0.75 ? "contained" : "text"}
                sx={{ px: 1, py: 0.2, minWidth: 42, fontSize: "0.72rem", fontWeight: 700 }}
              >
                75%
              </Button>
            </Tooltip>
            <Tooltip title="Escala Normal (90%)">
              <Button
                onClick={() => setZoomLevel(0.9)}
                variant={zoomLevel === 0.9 ? "contained" : "text"}
                sx={{ px: 1, py: 0.2, minWidth: 42, fontSize: "0.72rem", fontWeight: 700 }}
              >
                90%
              </Button>
            </Tooltip>
            <Tooltip title="Tamaño Completo (100%)">
              <Button
                onClick={() => setZoomLevel(1.0)}
                variant={zoomLevel === 1.0 ? "contained" : "text"}
                sx={{ px: 1, py: 0.2, minWidth: 42, fontSize: "0.72rem", fontWeight: 700 }}
              >
                100%
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              fontWeight: 700,
              fontSize: "0.8rem",
              px: 2,
              borderRadius: 1.5,
              transition: "transform 0.1s ease",
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            {saving ? "Guardando..." : formatId ? "Actualizar Formato" : "Guardar Formato"}
          </Button>
        </Stack>
      </Box>

      {/* 3-Panel Studio Layout */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden", p: 1.5, gap: 1.5 }}>
        {/* PANEL IZQUIERDO: Paleta de Componentes y Variables (260px) */}
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            bgcolor: "#FFFFFF",
            p: 2,
            borderRadius: 2,
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
          }}
        >
          {/* Componentes Rápidos */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748B", textTransform: "uppercase", display: "block", mb: 1 }}>
              Componentes A4
            </Typography>
            <Stack spacing={0.8}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<TextFields fontSize="small" />}
                onClick={() => handleInsertComponent("text_clause")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.78rem", fontWeight: 600, py: 0.6 }}
              >
                Cláusula de Texto
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<TableChart fontSize="small" />}
                onClick={() => handleInsertComponent("data_table")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.78rem", fontWeight: 600, py: 0.6 }}
              >
                Tabla de Datos A4
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<AddPhotoAlternate fontSize="small" />}
                onClick={() => handleInsertComponent("image_picker")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.78rem", fontWeight: 600, py: 0.6 }}
              >
                Imagen / Anexo
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Security fontSize="small" />}
                onClick={() => handleInsertComponent("security_posts")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.78rem", fontWeight: 600, py: 0.6 }}
              >
                Puestos de Vigilancia
              </Button>
              <Button
                variant={showEconomic ? "contained" : "outlined"}
                size="small"
                fullWidth
                color={showEconomic ? "primary" : "inherit"}
                startIcon={<AttachMoney fontSize="small" />}
                onClick={() => handleInsertComponent("economic_summary")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.78rem", fontWeight: 600, py: 0.6 }}
              >
                Resumen Económico
              </Button>
              <Button
                variant={showSigners ? "contained" : "outlined"}
                size="small"
                fullWidth
                color={showSigners ? "primary" : "inherit"}
                startIcon={<Draw fontSize="small" />}
                onClick={() => handleInsertComponent("signatures_block")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.78rem", fontWeight: 600, py: 0.6 }}
              >
                Bloque de Firmas
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Tokens Dinámicos */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748B", textTransform: "uppercase", display: "block", mb: 0.5 }}>
              Variables Dinámicas
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontSize: "0.7rem" }}>
              Clic para insertar en el documento:
            </Typography>

            <Stack spacing={1.5}>
              {systemCatalog.map((cat) => (
                <Box key={cat.id}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block", mb: 0.5, fontSize: "0.72rem" }}>
                    {cat.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {cat.fields.map((f) => {
                      const isImg = f.dataType === "IMAGE";
                      return (
                        <Tooltip key={f.token} title={`Ej: ${f.example || f.label}`}>
                          <Chip
                            label={`{{${f.token}}}`}
                            size="small"
                            onClick={() => handleInsertToken(f.token)}
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.65rem",
                              height: 19,
                              cursor: "pointer",
                              bgcolor: isImg ? "#EFF6FF" : "#FEF2F2",
                              borderColor: isImg ? "#93C5FD" : "#FECACA",
                              color: isImg ? "#1D4ED8" : "#DC2626",
                              fontWeight: 700,
                              "&:hover": { bgcolor: isImg ? "#DBEAFE" : "#FEE2E2" },
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Stack>
                </Box>
              ))}

              {availableVariables.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block", mb: 0.5, fontSize: "0.72rem" }}>
                    Variables de Usuario
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {availableVariables.map((v) => (
                      <Chip
                        key={v.key}
                        label={`{{${v.key}}}`}
                        size="small"
                        onClick={() => handleInsertToken(v.key)}
                        sx={{
                          fontFamily: "monospace",
                          fontSize: "0.65rem",
                          height: 19,
                          cursor: "pointer",
                          bgcolor: "#F3E8FF",
                          borderColor: "#D8B4FE",
                          color: "#7E22CE",
                          fontWeight: 700,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>

        {/* PANEL CENTRAL: Editor TipTap e Importación (Flex) */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {parseMessage && (
            <Alert severity="success" onClose={() => setParseMessage(null)} sx={{ borderRadius: 2 }}>
              {parseMessage}
            </Alert>
          )}

          {/* Tarjeta de Metadatos */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#FFFFFF" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A" }}>
                Identificación y Configuración
              </Typography>

              {/* Botón Importar Word/Excel */}
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={isParsing ? <CircularProgress size={14} /> : <CloudUpload />}
                disabled={isParsing}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.78rem" }}
              >
                {isParsing ? "Importando..." : "Importar Word / Excel"}
                <input
                  type="file"
                  hidden
                  accept=".docx,.xlsx,.doc,.xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
              </Button>
            </Box>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Código Formato"
                  size="small"
                  fullWidth
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: MIN-COM-001"
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="Título del Formato"
                  size="small"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Minuta Estándar de Vigilancia"
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Categoría"
                  size="small"
                  fullWidth
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as FormatCategory)}
                >
                  <MenuItem value={FormatCategory.COMMERCIAL}>Comercial / Cotizaciones</MenuItem>
                  <MenuItem value={FormatCategory.OPERATIONS}>Operaciones & Minutas</MenuItem>
                  <MenuItem value={FormatCategory.HUMAN_RESOURCES}>Recursos Humanos</MenuItem>
                  <MenuItem value={FormatCategory.QUALITY_HSEQ}>HSEQ & Calidad</MenuItem>
                  <MenuItem value={FormatCategory.LEGAL}>Jurídico & Pólizas</MenuItem>
                  <MenuItem value={FormatCategory.GENERAL}>General Transversal</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Descripción u Objetivo"
                  size="small"
                  fullWidth
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Uso previsto, normatividad o aclaraciones operativas..."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl component="fieldset">
                  <RadioGroup row value={scope} onChange={(e) => setScope(e.target.value as FormatVisibilityScope)}>
                    <FormControlLabel
                      value={FormatVisibilityScope.PERSONAL}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2" sx={{ fontSize: "0.78rem" }}>Personal</Typography>}
                    />
                    <FormControlLabel
                      value={FormatVisibilityScope.GLOBAL}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2" sx={{ fontSize: "0.78rem" }}>Global Empresa</Typography>}
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Componentes Modulares de Hoja */}
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", display: "block", mb: 0.8, textTransform: "uppercase" }}>
              Componentes Modulares Visibles
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showHeader} onChange={(e) => setShowHeader(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>Encabezado Institucional</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showSvsp} onChange={(e) => setShowSvsp(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>Credenciales SVSP</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showBadges} onChange={(e) => setShowBadges(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>Sellos de Calidad</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showEconomic} onChange={(e) => setShowEconomic(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>Resumen Económico</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showSigners} onChange={(e) => setShowSigners(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>Bloque de Firmas</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showFooter} onChange={(e) => setShowFooter(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>Pie de Página</Typography>}
                />
              </Grid>
            </Grid>

            {showSvsp && (
              <Box sx={{ mt: 1.5 }}>
                <FormatSvspCredentialsBlock data={svspData} onChange={setSvspData} isEditable={true} />
              </Box>
            )}
          </Paper>

          {/* Editor TipTap */}
          <Box sx={{ flex: 1, minHeight: 380 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5 }}>
              Lienzo Editorial TipTap
            </Typography>
            <FormatTipTapEditor value={bodyTemplate} onChange={setBodyTemplate} minHeight={380} />
          </Box>
        </Box>

        {/* PANEL DERECHO: Hoja A4 en Vivo Calibrada con Zoom */}
        <Box
          sx={{
            width: "42%",
            flexShrink: 0,
            bgcolor: "#0F172A",
            p: 2,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflowY: "auto",
          }}
        >
          <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Hoja Física A4 en Tiempo Real
            </Typography>
            <Chip
              label={`${Math.round(zoomLevel * 100)}%`}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#FFFFFF", fontFamily: "monospace", fontSize: "0.68rem", height: 18 }}
            />
          </Box>

          {/* Lienzo A4 con transform scale */}
          <Box
            sx={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top center",
              transition: "transform 150ms cubic-bezier(0.2, 0, 0, 1)",
              width: "100%",
              maxWidth: "540px",
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: "100%",
                minHeight: 760,
                bgcolor: "#FFFFFF",
                p: "28px 34px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                borderRadius: "2px",
                boxShadow: "0 10px 30px -4px rgba(0,0,0,0.5)",
              }}
            >
              {showHeader && (
                <Box sx={{ mb: 2 }}>
                  <FormatHeaderBlock
                    title={title || "DOCUMENTO INSTITUCIONAL"}
                    code={code || "FOR-001"}
                  />
                </Box>
              )}

              {showSvsp && (
                <Box sx={{ mb: 2 }}>
                  <FormatSvspCredentialsBlock data={svspData} isEditable={false} />
                </Box>
              )}

              {showBadges && (
                <Box sx={{ mb: 2 }}>
                  <FormatQualityBadgesBlock />
                </Box>
              )}

              {/* Contenido HTML */}
              <Box
                sx={{
                  flex: 1,
                  fontSize: "0.85rem",
                  color: "#1E293B",
                  lineHeight: 1.6,
                  "& table": {
                    width: "100%",
                    borderCollapse: "collapse",
                    margin: "10px 0",
                    fontSize: "0.78rem",
                  },
                  "& th, & td": {
                    border: "1px solid #CBD5E1",
                    padding: "6px 8px",
                  },
                  "& th": {
                    bgcolor: "#F8FAFC",
                    fontWeight: 700,
                  },
                  "& h1, & h2, & h3": {
                    color: "#0F172A",
                    marginTop: "12px",
                    marginBottom: "6px",
                  },
                  "& img": {
                    maxWidth: "100%",
                    height: "auto",
                  },
                  "& .mention": {
                    backgroundColor: "#FEF2F2",
                    color: "#DC2626",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: "0.8em",
                  },
                }}
                dangerouslySetInnerHTML={{ __html: bodyTemplate }}
              />

              {showEconomic && (
                <Box sx={{ my: 2 }}>
                  <FormatEconomicGridBlock />
                </Box>
              )}

              {showSigners && (
                <Box sx={{ mt: 3, mb: 2 }}>
                  <FormatSignersBlock />
                </Box>
              )}

              {showFooter && (
                <Box sx={{ mt: "auto", pt: 2, borderTop: "1px solid #E2E8F0" }}>
                  <FormatFooterBlock />
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
