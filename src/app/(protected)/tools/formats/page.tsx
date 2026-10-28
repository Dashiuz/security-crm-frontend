"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Description,
  Add,
  Search,
  Code,
  Storage,
  Edit,
  Delete,
  ContentCopy,
  TableChart,
  Public,
  Person,
  CheckCircle,
  HelpOutline,
  FolderOpen,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import VariableEditorDrawer from "@/components/format-engine/drawers/VariableEditorDrawer";
import PromptConfirmDialog from "@/components/common/PromptConfirmDialog";
import {
  FormatEngineApi,
  UniversalDocumentFormat,
  FormatVariable,
  FormatCategory,
  FormatVisibilityScope,
  VariableSourceType,
  SystemFieldCategory,
} from "@/lib/api/format-engine";

export default function UniversalFormatsPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);

  // Formatos
  const [formats, setFormats] = useState<UniversalDocumentFormat[]>([]);
  const [loadingFormats, setLoadingFormats] = useState(false);
  const [formatSearch, setFormatSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");

  // Variables
  const [variables, setVariables] = useState<FormatVariable[]>([]);
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [variableSearch, setVariableSearch] = useState("");

  // Catálogo del Sistema
  const [systemCatalog, setSystemCatalog] = useState<SystemFieldCategory[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Modales y Drawers
  const [formatDrawerOpen, setFormatDrawerOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<UniversalDocumentFormat | null>(null);

  const [variableDrawerOpen, setVariableDrawerOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<FormatVariable | null>(null);

  // Diálogo de Confirmación
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "FORMAT" | "VARIABLE"; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copiado al portapapeles
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadFormats();
    loadVariables();
    loadCatalog();
  }, []);

  const loadFormats = async () => {
    setLoadingFormats(true);
    try {
      const data = await FormatEngineApi.getFormats({
        category: selectedCategory !== "ALL" ? (selectedCategory as FormatCategory) : undefined,
        scope: selectedScope !== "ALL" ? (selectedScope as FormatVisibilityScope) : undefined,
        search: formatSearch.trim() || undefined,
      });
      setFormats(data);
    } catch {
      setFormats([]);
    } finally {
      setLoadingFormats(false);
    }
  };

  const loadVariables = async () => {
    setLoadingVariables(true);
    try {
      const data = await FormatEngineApi.getVariables(variableSearch.trim() || undefined);
      setVariables(data);
    } catch {
      setVariables([]);
    } finally {
      setLoadingVariables(false);
    }
  };

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const data = await FormatEngineApi.getSystemCatalog();
      setSystemCatalog(data);
    } catch {
      setSystemCatalog([]);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(`{{${token}}}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === "FORMAT") {
        await FormatEngineApi.deleteFormat(itemToDelete.id);
        await loadFormats();
      } else {
        await FormatEngineApi.deleteVariable(itemToDelete.id);
        await loadVariables();
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Encabezado Principal */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Description sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A" }}>
              Elaboración de Formatos & Variables Dinámicas
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Motor universal transversal: diseñe formatos institucionales, importe tablas de Word/Excel y configure atajos de datos por usuario.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Code />}
            onClick={() => {
              setSelectedVariable(null);
              setVariableDrawerOpen(true);
            }}
            sx={{ fontWeight: 700 }}
          >
            Nueva Variable / Atajo
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => router.push("/tools/formats/new")}
            sx={{ fontWeight: 700 }}
          >
            Nuevo Formato
          </Button>
        </Stack>
      </Stack>

      {/* Pestañas Principales */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
          <Tab
            icon={<Description fontSize="small" />}
            iconPosition="start"
            label="Catálogo de Formatos"
            sx={{ fontWeight: 700 }}
          />
          <Tab
            icon={<Code fontSize="small" />}
            iconPosition="start"
            label="Mis Variables & Atajos"
            sx={{ fontWeight: 700 }}
          />
          <Tab
            icon={<Storage fontSize="small" />}
            iconPosition="start"
            label="Diccionario de Datos BD"
            sx={{ fontWeight: 700 }}
          />
        </Tabs>
      </Box>

      {/* TAB 0: CATÁLOGO DE FORMATOS */}
      {tabValue === 0 && (
        <Stack spacing={3}>
          {/* Filtros */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  placeholder="Buscar formato por título, código o descripción..."
                  size="small"
                  fullWidth
                  value={formatSearch}
                  onChange={(e) => setFormatSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadFormats();
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-filter-label">Categoría</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    value={selectedCategory}
                    label="Categoría"
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setTimeout(loadFormats, 50);
                    }}
                  >
                    <MenuItem value="ALL">Todas las Categorías</MenuItem>
                    <MenuItem value={FormatCategory.COMMERCIAL}>Comercial</MenuItem>
                    <MenuItem value={FormatCategory.OPERATIONS}>Operaciones</MenuItem>
                    <MenuItem value={FormatCategory.HUMAN_RESOURCES}>Recursos Humanos</MenuItem>
                    <MenuItem value={FormatCategory.QUALITY_HSEQ}>Calidad / HSEQ</MenuItem>
                    <MenuItem value={FormatCategory.LEGAL}>Jurídico</MenuItem>
                    <MenuItem value={FormatCategory.GENERAL}>General</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="scope-filter-label">Ámbito</InputLabel>
                  <Select
                    labelId="scope-filter-label"
                    value={selectedScope}
                    label="Ámbito"
                    onChange={(e) => {
                      setSelectedScope(e.target.value);
                      setTimeout(loadFormats, 50);
                    }}
                  >
                    <MenuItem value="ALL">Todos los Ámbitos</MenuItem>
                    <MenuItem value={FormatVisibilityScope.GLOBAL}>Global (Empresa)</MenuItem>
                    <MenuItem value={FormatVisibilityScope.PERSONAL}>Personal (Solo yo)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                <Button variant="outlined" fullWidth onClick={loadFormats}>
                  Filtrar
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Grid de Formatos */}
          {loadingFormats ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : formats.length === 0 ? (
            <Box
              sx={{
                p: 6,
                textAlign: "center",
                bgcolor: "#F8FAFC",
                borderRadius: 2,
                border: "1px dashed #CBD5E1",
              }}
            >
              <FolderOpen sx={{ fontSize: 52, color: "#94A3B8", mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>
                No hay formatos registrados
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                Cree un formato desde cero o cargue un archivo Word (.docx) o Excel (.xlsx) existente.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push("/tools/formats/new")}
              >
                Crear Primer Formato
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {formats.map((fmt) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={fmt.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      borderColor: "#E2E8F0",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: "primary.main",
                        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.06)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent sx={{ flex: 1, p: 2.5 }}>
                      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Chip
                          label={fmt.code}
                          size="small"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            bgcolor: "#EFF6FF",
                            color: "#1D4ED8",
                          }}
                        />
                        <Chip
                          icon={fmt.scope === "GLOBAL" ? <Public sx={{ fontSize: "14px !important" }} /> : <Person sx={{ fontSize: "14px !important" }} />}
                          label={fmt.scope === "GLOBAL" ? "Global" : "Personal"}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 22 }}
                        />
                      </Stack>

                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.5, lineHeight: 1.3 }}>
                        {fmt.title}
                      </Typography>

                      <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, display: "block", mb: 1 }}>
                        {fmt.category}
                      </Typography>

                      {fmt.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#64748B",
                            fontSize: "0.85rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mb: 2,
                          }}
                        >
                          {fmt.description}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        <Chip
                          label={`${fmt.detectedVariables?.length || 0} variables`}
                          size="small"
                          sx={{ fontSize: "0.7rem", bgcolor: "#FEF2F2", color: "#DC2626", fontWeight: 700 }}
                        />
                        {fmt.sectionsConfig?.showSvspCredentials && (
                          <Chip label="SVSP" size="small" sx={{ fontSize: "0.68rem" }} />
                        )}
                        {fmt.sectionsConfig?.showSigners && (
                          <Chip label="Firmas" size="small" sx={{ fontSize: "0.68rem" }} />
                        )}
                      </Stack>
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ p: 1.5, justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                        {fmt.user ? `Por: ${fmt.user.fullName}` : "Institucional"}
                      </Typography>

                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Editar Formato en Studio">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => router.push(`/tools/formats/${fmt.id}/edit`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Eliminar Formato">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setItemToDelete({ type: "FORMAT", id: fmt.id, name: fmt.title });
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      )}

      {/* TAB 1: MIS VARIABLES & ATAJOS DINÁMICOS */}
      {tabValue === 1 && (
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
              <TextField
                placeholder="Buscar variables por clave o descripción..."
                size="small"
                value={variableSearch}
                onChange={(e) => setVariableSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadVariables();
                }}
                sx={{ maxWidth: 420 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setSelectedVariable(null);
                  setVariableDrawerOpen(true);
                }}
              >
                Agregar Variable
              </Button>
            </Stack>
          </Paper>

          {loadingVariables ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : variables.length === 0 ? (
            <Box
              sx={{
                p: 6,
                textAlign: "center",
                bgcolor: "#F8FAFC",
                borderRadius: 2,
                border: "1px dashed #CBD5E1",
              }}
            >
              <Code sx={{ fontSize: 52, color: "#94A3B8", mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>
                No hay variables personalizadas
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B", mb: 2 }}>
                Cree variables fijas o atajos que se autocompletarán en cualquier formato que redacte.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setSelectedVariable(null);
                  setVariableDrawerOpen(true);
                }}
              >
                Crear Mi Primera Variable
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Token / Variable</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Etiqueta Descriptiva</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Tipo de Origen</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Valor / Mapeo</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Ámbito</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#334155" }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variables.map((v) => (
                    <TableRow key={v.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={`{{${v.key}}}`}
                            size="small"
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              color: "#DC2626",
                              bgcolor: "#FEF2F2",
                              border: "1px solid #FECACA",
                            }}
                          />
                          <Tooltip title={copiedToken === v.key ? "¡Copiado!" : "Copiar token"}>
                            <IconButton size="small" onClick={() => handleCopy(v.key)}>
                              <ContentCopy fontSize="small" sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#0F172A" }}>
                        {v.label}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.sourceType === VariableSourceType.STATIC_TEXT ? "Texto Fijo" : "BD Sistema"}
                          size="small"
                          color={v.sourceType === VariableSourceType.STATIC_TEXT ? "default" : "primary"}
                          variant="outlined"
                          sx={{ fontSize: "0.72rem" }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "#475569", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v.sourceType === VariableSourceType.STATIC_TEXT
                          ? v.staticValue || "--"
                          : v.systemPath || "--"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.scope === "GLOBAL" ? "Global" : "Personal"}
                          size="small"
                          sx={{ fontSize: "0.7rem", height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Editar Variable">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedVariable(v);
                                setVariableDrawerOpen(true);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar Variable">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setItemToDelete({ type: "VARIABLE", id: v.id, name: v.key });
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      )}

      {/* TAB 2: DICCIONARIO DE DATOS BD */}
      {tabValue === 2 && (
        <Stack spacing={3}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Este diccionario lista todos los campos que el motor universal puede resolver automáticamente en tiempo real desde la base de datos de PostgreSQL según la entidad asociada (Cliente, Empleado, Mi Empresa o Propuesta).
          </Alert>

          {loadingCatalog ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {systemCatalog.map((category) => (
                <Grid size={{ xs: 12, md: 6 }} key={category.id}>
                  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1E293B" }}>
                        {category.name}
                      </Typography>
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Token</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Campo</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Ejemplo Real</TableCell>
                            <TableCell align="right"></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {category.fields.map((field) => (
                            <TableRow key={field.systemPath} hover>
                              <TableCell>
                                <Chip
                                  label={`{{${field.token}}}`}
                                  size="small"
                                  sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: "#DC2626",
                                    bgcolor: "#FEF2F2",
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                                {field.label}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.8rem", color: "#64748B" }}>
                                {field.example}
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Copiar Token">
                                  <IconButton size="small" onClick={() => handleCopy(field.token)}>
                                    <ContentCopy fontSize="small" sx={{ fontSize: 15 }} />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      )}

      {/* Drawers y Modales */}

      <VariableEditorDrawer
        open={variableDrawerOpen}
        onClose={() => setVariableDrawerOpen(false)}
        onSuccess={() => {
          loadVariables();
        }}
        variable={selectedVariable}
        systemCatalog={systemCatalog}
      />

      <PromptConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteItem}
        title={itemToDelete?.type === "FORMAT" ? "Eliminar Formato" : "Eliminar Variable"}
        description={`Para confirmar la eliminación permanente de ${itemToDelete?.name}, escriba ELIMINAR:`}
        expectedValue="ELIMINAR"
        inputLabel="Confirmación"
        confirmButtonText="Eliminar"
        confirmColor="error"
      />
    </Box>
  );
}
