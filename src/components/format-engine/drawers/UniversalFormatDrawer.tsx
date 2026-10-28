"use client";

import React, { useState, useEffect, useRef } from "react";
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
  FormLabel,
  MenuItem,
  Select,
  InputLabel,
  Alert,
  Divider,
  Paper,
  Switch,
  Grid,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Description,
  CloudUpload,
  CheckCircle,
  Widgets,
  Security,
  HistoryEdu,
  TableChart,
  TextFields,
  AddPhotoAlternate,
  Badge,
  AttachMoney,
  Draw,
  Refresh,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import FormatTipTapEditor from "../editor/FormatTipTapEditor";
import FormatHeaderBlock from "../blocks/FormatHeaderBlock";
import FormatSvspCredentialsBlock, {
  SvspCredentialsData,
} from "../blocks/FormatSvspCredentialsBlock";
import FormatQualityBadgesBlock from "../blocks/FormatQualityBadgesBlock";
import FormatEconomicGridBlock from "../blocks/FormatEconomicGridBlock";
import FormatSignersBlock from "../blocks/FormatSignersBlock";
import FormatFooterBlock from "../blocks/FormatFooterBlock";
import {
  FormatEngineApi,
  UniversalDocumentFormat,
  FormatCategory,
  FormatVisibilityScope,
  FormatVariable,
  SystemFieldCategory,
} from "@/lib/api/format-engine";

export interface UniversalFormatDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  format?: UniversalDocumentFormat | null;
  availableVariables?: FormatVariable[];
}

export default function UniversalFormatDrawer({
  open,
  onClose,
  onSuccess,
  format,
  availableVariables = [],
}: UniversalFormatDrawerProps) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FormatCategory>(FormatCategory.GENERAL);
  const [scope, setScope] = useState<FormatVisibilityScope>(FormatVisibilityScope.PERSONAL);
  const [isDefault, setIsDefault] = useState(false);
  const [bodyTemplate, setBodyTemplate] = useState("<p>Comience a redactar el contenido o pegue tablas con Ctrl+V...</p>");

  // Configuración de componentes modulares del documento
  const [showHeader, setShowHeader] = useState(true);
  const [showSvsp, setShowSvsp] = useState(false);
  const [svspData, setSvspData] = useState<SvspCredentialsData>({ mode: "AUTO" });
  const [showBadges, setShowBadges] = useState(false);
  const [showEconomic, setShowEconomic] = useState(false);
  const [showSigners, setShowSigners] = useState(true);
  const [showFooter, setShowFooter] = useState(true);

  // Estados de parseo, catálogo y guardado
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [systemCatalog, setSystemCatalog] = useState<SystemFieldCategory[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-cálculo de consecutivo departamental
  const fetchNextCode = async (cat: FormatCategory) => {
    try {
      const res = await FormatEngineApi.getNextFormatCode(cat);
      if (res?.code) {
        setCode(res.code);
      }
    } catch {
      // Ignorar si hay error y permitir ingreso manual
    }
  };

  useEffect(() => {
    if (open) {
      FormatEngineApi.getSystemCatalog()
        .then((cats) => setSystemCatalog(cats || []))
        .catch(() => setSystemCatalog([]));
    }
  }, [open]);

  useEffect(() => {
    if (format) {
      setCode(format.code);
      setTitle(format.title);
      setDescription(format.description || "");
      setCategory(format.category);
      setScope(format.scope);
      setIsDefault(format.isDefault);
      setBodyTemplate(format.bodyTemplate || "");

      const cfg = format.sectionsConfig || {};
      setShowHeader(cfg.showHeader ?? true);
      setShowSvsp(cfg.showSvspCredentials ?? false);
      setSvspData({
        mode: cfg.svspCredentialsMode || "AUTO",
        ...cfg.manualSvspCredentials,
      });
      setShowBadges(cfg.showQualityBadges ?? false);
      setShowEconomic(cfg.showEconomicGrid ?? false);
      setShowSigners(cfg.showSigners ?? true);
      setShowFooter(cfg.showFooter ?? true);
    } else if (open) {
      setTitle("");
      setDescription("");
      setCategory(FormatCategory.GENERAL);
      setScope(FormatVisibilityScope.PERSONAL);
      setIsDefault(false);
      setBodyTemplate("<p>Comience a redactar el contenido o pegue tablas con Ctrl+V...</p>");

      setShowHeader(true);
      setShowSvsp(false);
      setSvspData({ mode: "AUTO" });
      setShowBadges(false);
      setShowEconomic(false);
      setShowSigners(true);
      setShowFooter(true);

      // Generar consecutivo para categoría inicial
      fetchNextCode(FormatCategory.GENERAL);
    }
    setError(null);
    setParseMessage(null);
  }, [format, open]);

  const handleCategoryChange = (newCat: FormatCategory) => {
    setCategory(newCat);
    if (!format) {
      fetchNextCode(newCat);
    }
  };

  // Manejo de carga de archivos Word (.docx) o Excel (.xlsx) con Parse & Drop
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseMessage(null);
    setError(null);

    try {
      const result = await FormatEngineApi.parseUploadedFile(file);
      setBodyTemplate(result.html);
      setParseMessage(
        `¡Archivo ${result.originalType} procesado en memoria con éxito! Se importaron las tablas y estilos. Zero S3.`
      );
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "No fue posible procesar el archivo. Asegúrese de que sea un archivo Word (.docx) o Excel (.xlsx) válido."
      );
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  // Inserción de componentes desde la barra lateral izquierda
  const handleInsertComponent = (type: string) => {
    if (type === "text_clause") {
      setBodyTemplate((prev) => `${prev}<h3>CLÁUSULA: Objeto y Alcance del Servicio</h3><p>El contratista prestará a favor del cliente el servicio de seguridad y vigilancia privada especializada...</p>`);
    } else if (type === "data_table") {
      setBodyTemplate((prev) => `${prev}<table class="table-dense-a4" style="width: 100%; border-collapse: collapse; margin: 12px 0;"><thead><tr style="background: #F1F5F9;"><th>Ítem</th><th>Descripción</th><th>Cantidad</th><th>Observaciones</th></tr></thead><tbody><tr><td>01</td><td>Puesto de Control Principal</td><td>1</td><td>Servicio activo 24/7</td></tr><tr><td>02</td><td>Ronda Perimetral Canina</td><td>1</td><td>Horario nocturno</td></tr></tbody></table>`);
    } else if (type === "security_posts") {
      setBodyTemplate((prev) => `${prev}<h4>Estructura Operativa de Seguridad</h4><table style="width: 100%; border-collapse: collapse; margin: 12px 0;"><thead><tr style="background: #F1F5F9;"><th>Cargo / Puesto</th><th>Turno</th><th>Modalidad</th><th>Guardas Req.</th></tr></thead><tbody><tr><td>Guarda de Seguridad 24H</td><td>Turno 2x2x2</td><td>Arma de Fuego</td><td>3 Guardas</td></tr></tbody></table>`);
    } else if (type === "economic_summary") {
      setShowEconomic((prev) => !prev);
    } else if (type === "signatures_block") {
      setShowSigners((prev) => !prev);
    } else if (type === "image_picker") {
      imageInputRef.current?.click();
    }
  };

  const handleImagePickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setBodyTemplate((prev) => `${prev}<img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 4px;" />`);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleInsertToken = (token: string) => {
    setBodyTemplate((prev) => `${prev} {{${token}}} `);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("El código del formato es obligatorio (ej: FOR-COM-01).");
      return;
    }
    if (!title.trim()) {
      setError("El título del formato es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);

    const sectionsConfig = {
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
    };

    try {
      if (format) {
        await FormatEngineApi.updateFormat(format.id, {
          code: code.trim().toUpperCase(),
          title: title.trim(),
          description: description.trim(),
          category,
          scope,
          isDefault,
          bodyTemplate,
          sectionsConfig,
        });
      } else {
        await FormatEngineApi.createFormat({
          code: code.trim().toUpperCase(),
          title: title.trim(),
          description: description.trim(),
          category,
          scope,
          isDefault,
          bodyTemplate,
          sectionsConfig,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al guardar el formato universal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title={format ? `Universal Document Studio: ${format.code}` : "Universal Document Studio"}
      subtitle="Diseño editorial avanzado con componentes modulares, tablas A4 y vista previa en tiempo real"
      headerIcon={<Description sx={{ color: "primary.main" }} />}
      width={{ xs: "100%", md: "96vw", lg: "95vw" }}
      customActions={
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={<CheckCircle />}
            sx={{ fontWeight: 700, px: 2.5, borderRadius: 2 }}
          >
            {loading ? "Guardando..." : format ? "Actualizar Formato" : "Guardar Formato"}
          </Button>
        </Box>
      }
    >
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleImagePickerChange}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {parseMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setParseMessage(null)}>
          {parseMessage}
        </Alert>
      )}

      {/* Studio Layout de 3 Columnas */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          minHeight: "78vh",
          alignItems: "stretch",
        }}
      >
        {/* PANEL IZQUIERDO: Barra de Herramientas y Variables (240px) */}
        <Box
          sx={{
            width: { xs: "100%", md: 240 },
            flexShrink: 0,
            bgcolor: "#F8FAFC",
            p: 2,
            borderRadius: 2,
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            maxHeight: { md: "82vh" },
            overflowY: "auto",
          }}
        >
          {/* Sección Componentes */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1 }}
            >
              Componentes
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<TextFields fontSize="small" />}
                onClick={() => handleInsertComponent("text_clause")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem", fontWeight: 600, py: 0.7 }}
              >
                Cláusula de Texto
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<TableChart fontSize="small" />}
                onClick={() => handleInsertComponent("data_table")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem", fontWeight: 600, py: 0.7 }}
              >
                Tabla de Datos A4
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<AddPhotoAlternate fontSize="small" />}
                onClick={() => handleInsertComponent("image_picker")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem", fontWeight: 600, py: 0.7 }}
              >
                Imagen / Anexo
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Security fontSize="small" />}
                onClick={() => handleInsertComponent("security_posts")}
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem", fontWeight: 600, py: 0.7 }}
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
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem", fontWeight: 600, py: 0.7 }}
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
                sx={{ justifyContent: "flex-start", textTransform: "none", fontSize: "0.8rem", fontWeight: 600, py: 0.7 }}
              >
                Bloque de Firmas
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Sección Variables del Sistema (Tokens Dinámicos) */}
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1 }}
            >
              Variables Dinámicas
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5, fontSize: "0.72rem" }}>
              Haga clic para insertar el token en el formato:
            </Typography>

            <Stack spacing={1.5}>
              {systemCatalog.map((cat) => (
                <Box key={cat.id}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block", mb: 0.5 }}>
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
                              fontSize: "0.68rem",
                              height: 20,
                              cursor: "pointer",
                              bgcolor: isImg ? "#EFF6FF" : "#FEF2F2",
                              borderColor: isImg ? "#93C5FD" : "#FECACA",
                              color: isImg ? "#1D4ED8" : "#DC2626",
                              fontWeight: 700,
                              "&:hover": {
                                bgcolor: isImg ? "#DBEAFE" : "#FEE2E2",
                              },
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
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block", mb: 0.5 }}>
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
                          fontSize: "0.68rem",
                          height: 20,
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

        {/* PANEL CENTRAL: Lienzo de Estructuración y Editor TipTap */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: { md: "82vh" },
            overflowY: "auto",
            pr: 1,
          }}
        >
          {/* Barra Superior con Metadatos e Importación Compacta */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#FFFFFF" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A" }}>
                Identificación del Formato
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component="label"
                disabled={isParsing}
                startIcon={isParsing ? <CircularProgress size={16} /> : <CloudUpload fontSize="small" />}
                sx={{
                  borderColor: "#6366F1",
                  color: "#6366F1",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 1.5,
                  fontSize: "0.78rem",
                  "&:hover": { borderColor: "#4F46E5", bgcolor: "#EEF2FF" },
                }}
              >
                {isParsing ? "Importando..." : "Importar Word / Excel"}
                <input
                  type="file"
                  hidden
                  accept=".docx,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>
            </Box>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Código Consecutivo"
                  fullWidth
                  size="small"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="FOR-COM-01"
                  required
                  InputProps={{
                    sx: { fontFamily: "monospace", fontWeight: 700 },
                    endAdornment: (
                      <Tooltip title="Regenerar consecutivo automático">
                        <IconButton size="small" onClick={() => fetchNextCode(category)}>
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Título del Formato"
                  fullWidth
                  size="small"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Minuta de Servicios de Vigilancia"
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="cat-label">Categoría Organizacional</InputLabel>
                  <Select
                    labelId="cat-label"
                    value={category}
                    label="Categoría Organizacional"
                    onChange={(e) => handleCategoryChange(e.target.value as FormatCategory)}
                  >
                    <MenuItem value={FormatCategory.COMMERCIAL}>Comercial & Ventas (COM)</MenuItem>
                    <MenuItem value={FormatCategory.OPERATIONS}>Operaciones & Seguridad (OPE)</MenuItem>
                    <MenuItem value={FormatCategory.HUMAN_RESOURCES}>Recursos Humanos (RRHH)</MenuItem>
                    <MenuItem value={FormatCategory.QUALITY_HSEQ}>Calidad & HSEQ (CAL)</MenuItem>
                    <MenuItem value={FormatCategory.LEGAL}>Jurídico & Legal (LEG)</MenuItem>
                    <MenuItem value={FormatCategory.GENERAL}>General & Administrativo (GEN)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl component="fieldset">
                  <RadioGroup
                    row
                    value={scope}
                    onChange={(e) => setScope(e.target.value as FormatVisibilityScope)}
                  >
                    <FormControlLabel
                      value={FormatVisibilityScope.PERSONAL}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>Personal</Typography>}
                    />
                    <FormControlLabel
                      value={FormatVisibilityScope.GLOBAL}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>Global (Empresa)</Typography>}
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Componentes Modulares del Documento */}
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", display: "block", mb: 1, textTransform: "uppercase" }}>
              Componentes Modulares del Documento
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showHeader} onChange={(e) => setShowHeader(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.78rem" }}>Encabezado Institucional</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showSvsp} onChange={(e) => setShowSvsp(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.78rem" }}>Credenciales SVSP</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showBadges} onChange={(e) => setShowBadges(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.78rem" }}>Sellos de Calidad</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showEconomic} onChange={(e) => setShowEconomic(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.78rem" }}>Resumen Económico</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showSigners} onChange={(e) => setShowSigners(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.78rem" }}>Bloque de Firmas</Typography>}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={showFooter} onChange={(e) => setShowFooter(e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: "0.78rem" }}>Pie de Página</Typography>}
                />
              </Grid>
            </Grid>

            {showSvsp && (
              <Box sx={{ mt: 1.5 }}>
                <FormatSvspCredentialsBlock
                  data={svspData}
                  onChange={setSvspData}
                  isEditable={true}
                />
              </Box>
            )}
          </Paper>

          {/* Editor de Contenido Principal TipTap */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.75 }}>
              Lienzo de Redacción y Tablas
            </Typography>
            <FormatTipTapEditor
              value={bodyTemplate}
              onChange={setBodyTemplate}
              minHeight={340}
            />
          </Box>
        </Box>

        {/* PANEL DERECHO: Vista Previa de Hoja Física A4 en Vivo */}
        <Box
          sx={{
            width: { xs: "100%", md: "40%" },
            flexShrink: 0,
            bgcolor: "#0F172A",
            p: 2.5,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxHeight: { md: "82vh" },
            overflowY: "auto",
          }}
        >
          <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Vista Previa A4 (Imprimible)
            </Typography>
            <Chip
              label={code || "FOR-001"}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#FFFFFF", fontFamily: "monospace", fontSize: "0.7rem", height: 20 }}
            />
          </Box>

          {/* Hoja A4 Simulada */}
          <Paper
            elevation={8}
            sx={{
              width: "100%",
              maxWidth: 520,
              minHeight: 735,
              bgcolor: "#FFFFFF",
              color: "#1E293B",
              p: 3,
              borderRadius: "2px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              fontSize: "0.85rem",
              lineHeight: 1.6,
            }}
          >
            {/* Encabezado A4 */}
            {showHeader && (
              <Box sx={{ borderBottom: "2px solid #0F172A", pb: 1.5, mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#0F172A", letterSpacing: "0.02em" }}>
                      EMPRESA DE SEGURIDAD PRIVADA
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B", display: "block" }}>
                      NIT: 900.123.456-7 • Licencia SVSP Res. Oficial
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#64748B" }}>
                    {code || "FOR-XXX"}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Credenciales SVSP */}
            {showSvsp && (
              <Box sx={{ mb: 1.5 }}>
                <FormatSvspCredentialsBlock data={svspData} isEditable={false} />
              </Box>
            )}

            {/* Sellos de Calidad */}
            {showBadges && (
              <Box sx={{ mb: 1.5 }}>
                <FormatQualityBadgesBlock />
              </Box>
            )}

            {/* Título en Hoja */}
            {title && (
              <Typography variant="subtitle1" sx={{ fontWeight: 800, textAlign: "center", mb: 2, color: "#0F172A" }}>
                {title.toUpperCase()}
              </Typography>
            )}

            {/* Cuerpo del Formato Interpolado / Renderizado */}
            <Box
              sx={{
                flex: 1,
                "& table": {
                  borderCollapse: "collapse",
                  width: "100%",
                  margin: "8px 0",
                  fontSize: "0.78rem",
                },
                "& table td, & table th": {
                  border: "1px solid #CBD5E1",
                  padding: "4px 6px",
                  verticalAlign: "top",
                  wordBreak: "break-word",
                },
                "& table th": {
                  backgroundColor: "#F1F5F9",
                  fontWeight: 700,
                },
                "& img": {
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                  margin: "8px auto",
                  borderRadius: "4px",
                },
                "& p": { margin: "6px 0" },
                "& h1, & h2, & h3, & h4": {
                  fontWeight: 700,
                  margin: "12px 0 6px 0",
                  color: "#0F172A",
                },
              }}
              dangerouslySetInnerHTML={{ __html: bodyTemplate }}
            />

            {/* Bloques de Cierre */}
            {showEconomic && (
              <Box sx={{ mt: 2 }}>
                <FormatEconomicGridBlock />
              </Box>
            )}

            {showSigners && (
              <Box sx={{ mt: 2 }}>
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
    </ResponsiveFormDrawer>
  );
}
