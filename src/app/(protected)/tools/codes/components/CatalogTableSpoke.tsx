"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Refresh as RefreshIcon,
  QrCode2 as QrIcon,
  ViewWeek as BarcodeIcon,
  ContentCopy as CopyIcon,
  Layers as BatchIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  OpenInNew as OpenIcon,
} from "@mui/icons-material";
import {
  UniversalCodesApi,
  UniversalCode,
  CodeType,
  CodePurpose,
  CodeStatus,
  BatchItemSummary,
} from "@/lib/api/universal-codes";
import {
  generateBarcode128Svg,
  getQrCodeImageUrl,
} from "@/utils/barcode-generator";
import DepartmentAutocomplete from "./DepartmentAutocomplete";

interface CatalogTableSpokeProps {
  initialSearch?: string;
  initialBatchId?: string;
  onSendToPrintStation: (codes: UniversalCode[]) => void;
}

export default function CatalogTableSpoke({
  initialSearch = "",
  initialBatchId = "",
  onSendToPrintStation,
}: CatalogTableSpokeProps) {
  const [codes, setCodes] = useState<UniversalCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Catálogo de lotes para el dropdown
  const [batchOptions, setBatchOptions] = useState<BatchItemSummary[]>([]);

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Ficha de edición integrada (In-Place Sub-View sin modales)
  const [editingCode, setEditingCode] = useState<UniversalCode | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editStatus, setEditStatus] = useState<CodeStatus>("ACTIVE");
  const [editDescription, setEditDescription] = useState("");

  // Metadatos operacionales contextuales
  const [editFloor, setEditFloor] = useState("1");
  const [editTargetInterval, setEditTargetInterval] = useState("60");
  const [editTolerance, setEditTolerance] = useState("10");
  const [editPostOrder, setEditPostOrder] = useState("");
  const [editZoneType, setEditZoneType] = useState("Común");
  const [editSerial, setEditSerial] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editInternalId, setEditInternalId] = useState("");
  const [editAssetCategory, setEditAssetCategory] = useState("Telecomunicaciones / Radio");
  const [editEmpDoc, setEditEmpDoc] = useState("");
  const [editEmpRole, setEditEmpRole] = useState("Guarda de Seguridad");
  const [editEmpBloodType, setEditEmpBloodType] = useState("O+");
  const [editVehUnit, setEditVehUnit] = useState("");
  const [editVehType, setEditVehType] = useState("Automóvil");
  const [editVehPlate, setEditVehPlate] = useState("");
  const [editVehParking, setEditVehParking] = useState("");

  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Copiado
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sincronización reactiva inmediata cuando cambia initialSearch o initialBatchId
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
      setDebouncedSearch(initialSearch);
      setPage(0);
    }
  }, [initialSearch]);

  useEffect(() => {
    if (initialBatchId !== undefined) {
      setSelectedBatchId(initialBatchId);
      setPage(0);
    }
  }, [initialBatchId]);

  const handleStartEdit = (item: UniversalCode) => {
    setEditingCode(item);
    setEditTitle(item.title || "");
    setEditDepartment(item.department || "");
    setEditStatus(item.status || "ACTIVE");
    setEditDescription(item.description || "");

    // Cargar metadatos según finalidad
    setEditFloor((item.metadata?.floor as string) || "1");
    setEditTargetInterval(item.metadata?.targetIntervalMinutes ? String(item.metadata.targetIntervalMinutes) : "60");
    setEditTolerance(item.metadata?.toleranceMinutes ? String(item.metadata.toleranceMinutes) : "10");
    setEditPostOrder((item.metadata?.postOrder as string) || "");
    setEditZoneType((item.metadata?.zoneType as string) || "Común");

    setEditSerial((item.metadata?.serialNumber as string) || (item.metadata?.plateOrSerial as string) || "");
    setEditBrand((item.metadata?.brand as string) || "");
    setEditModel((item.metadata?.model as string) || "");
    setEditInternalId((item.metadata?.internalAssetId as string) || "");
    setEditAssetCategory((item.metadata?.assetCategory as string) || "Telecomunicaciones / Radio");

    setEditEmpDoc((item.metadata?.documentNumber as string) || "");
    setEditEmpRole((item.metadata?.operationalRole as string) || "Guarda de Seguridad");
    setEditEmpBloodType((item.metadata?.bloodType as string) || "O+");

    setEditVehUnit((item.metadata?.unitNumber as string) || "");
    setEditVehType((item.metadata?.vehicleType as string) || "Automóvil");
    setEditVehPlate((item.metadata?.plateOrSerial as string) || (item.metadata?.serialNumber as string) || "");
    setEditVehParking((item.metadata?.parkingSpot as string) || "");

    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCode) return;
    if (!editTitle.trim()) {
      setEditError("El título o identificador es obligatorio.");
      return;
    }

    try {
      setSavingEdit(true);
      setEditError(null);

      const metadata: Record<string, unknown> = { ...(editingCode.metadata || {}) };

      if (editingCode.purpose === "PATROL_CHECKPOINT") {
        metadata.floor = editFloor.trim();
        metadata.targetIntervalMinutes = parseInt(editTargetInterval, 10) || 60;
        metadata.toleranceMinutes = parseInt(editTolerance, 10) || 10;
        metadata.postOrder = editPostOrder.trim();
        metadata.zoneType = editZoneType;
      } else if (editingCode.purpose === "EMPLOYEE_CREDENTIAL") {
        metadata.documentNumber = editEmpDoc.trim();
        metadata.operationalRole = editEmpRole;
        metadata.bloodType = editEmpBloodType;
      } else if (editingCode.purpose === "RESIDENT_VEHICLE") {
        metadata.unitNumber = editVehUnit.trim();
        metadata.vehicleType = editVehType;
        metadata.plateOrSerial = editVehPlate.trim();
        metadata.serialNumber = editVehPlate.trim();
        metadata.parkingSpot = editVehParking.trim();
      } else {
        if (editSerial) metadata.serialNumber = editSerial.trim();
        if (editBrand) metadata.brand = editBrand.trim();
        if (editModel) metadata.model = editModel.trim();
        if (editInternalId) metadata.internalAssetId = editInternalId.trim();
        metadata.assetCategory = editAssetCategory;
      }

      const updated = await UniversalCodesApi.update(editingCode.id, {
        title: editTitle.trim(),
        department: editDepartment.trim() || undefined,
        description: editDescription.trim() || undefined,
        status: editStatus,
        metadata,
      });

      setCodes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCode(null);
      setFeedback(`Ficha del código '${updated.code}' guardada con éxito.`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar el código.";
      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Cargar lotes disponibles para el selector
  useEffect(() => {
    UniversalCodesApi.listBatches().then(setBatchOptions).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await UniversalCodesApi.list({
        search: debouncedSearch.trim() || undefined,
        batchId: selectedBatchId || undefined,
        codeType: selectedType !== "ALL" ? (selectedType as CodeType) : undefined,
        purpose: selectedPurpose !== "ALL" ? (selectedPurpose as CodePurpose) : undefined,
        status: selectedStatus !== "ALL" ? (selectedStatus as CodeStatus) : undefined,
        page: page + 1,
        limit: rowsPerPage,
      });

      setCodes(res.data || []);
      setTotal(res.total);
    } catch {
      // Ignorar fallback
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedBatchId, selectedType, selectedPurpose, selectedStatus, page, rowsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copiar código al portapapeles
  const handleCopyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedId(codeStr);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Alternar estado de código (Activar / Inhabilitar)
  const handleToggleStatus = async (item: UniversalCode) => {
    try {
      const newStatus: CodeStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const updated = await UniversalCodesApi.update(item.id, { status: newStatus });
      setCodes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setFeedback(`Código '${item.code}' cambiado a ${newStatus === "ACTIVE" ? "Activo" : "Inactivo"}`);
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // Ignorar
    }
  };

  // Selección múltiple
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(codes.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePrintSelected = () => {
    const selectedCodes = codes.filter((c) => selectedIds.includes(c.id));
    if (selectedCodes.length > 0) {
      onSendToPrintStation(selectedCodes);
    }
  };

  // Sub-vista de Edición Integrada en Página (Sin Modales)
  if (editingCode) {
    const isQr = editingCode.codeType === "QR_CODE";
    return (
      <Box>
        {/* Barra superior de navegación / Retorno */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Button
            startIcon={<BackIcon />}
            variant="outlined"
            onClick={() => setEditingCode(null)}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Volver al Catálogo Maestro
          </Button>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={editingCode.code}
              color="primary"
              variant="outlined"
              sx={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.85rem" }}
            />
            <Chip
              label={
                editingCode.status === "ACTIVE"
                  ? "Operativo"
                  : editingCode.status === "INACTIVE"
                  ? "Inactivo"
                  : "Revocado"
              }
              color={editingCode.status === "ACTIVE" ? "success" : "default"}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Stack>

        {editError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setEditError(null)}>
            {editError}
          </Alert>
        )}

        <Grid container spacing={3.5}>
          {/* Columna Izquierda: Formulario de Edición */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                Editar Ficha del Código
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Actualiza los datos descriptivos, ubicación o número de serie único.
              </Typography>

              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Título o Identificador Descriptivo *"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <DepartmentAutocomplete
                    value={editDepartment}
                    onChange={setEditDepartment}
                  />

                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Estado Operativo"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as CodeStatus)}
                  >
                    <MenuItem value="ACTIVE">Activo / Operativo</MenuItem>
                    <MenuItem value="INACTIVE">Inactivo / En Pausa</MenuItem>
                    <MenuItem value="REVOKED">Revocado / De Baja</MenuItem>
                  </TextField>
                </Stack>

                {/* Campos Contextuales según la Finalidad Operativa */}
                {editingCode.purpose === "PATROL_CHECKPOINT" && (
                  <Box sx={{ p: 2, bgcolor: "neutral.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                      Parámetros de Ronda Física:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Piso o Nivel"
                          value={editFloor}
                          onChange={(e) => setEditFloor(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Frecuencia Esperada (min)"
                          value={editTargetInterval}
                          onChange={(e) => setEditTargetInterval(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Consigna Operativa de Verificación"
                          value={editPostOrder}
                          onChange={(e) => setEditPostOrder(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {editingCode.purpose === "EMPLOYEE_CREDENTIAL" && (
                  <Box sx={{ p: 2, bgcolor: "neutral.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                      Ficha de Guardia / Personal de Seguridad:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Cédula / Documento de Identidad"
                          value={editEmpDoc}
                          onChange={(e) => setEditEmpDoc(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Cargo Operativo"
                          value={editEmpRole}
                          onChange={(e) => setEditEmpRole(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Grupo Sanguíneo RH"
                          value={editEmpBloodType}
                          onChange={(e) => setEditEmpBloodType(e.target.value)}
                        >
                          {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((rh) => (
                            <MenuItem key={rh} value={rh}>{rh}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {editingCode.purpose === "RESIDENT_VEHICLE" && (
                  <Box sx={{ p: 2, bgcolor: "neutral.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, mb: 1.5, display: "block", textTransform: "uppercase", color: "primary.main" }}>
                      Datos de Vehículo de Residente:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Unidad / Apartamento"
                          value={editVehUnit}
                          onChange={(e) => setEditVehUnit(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Placa o Serial Marco"
                          value={editVehPlate}
                          onChange={(e) => setEditVehPlate(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Celda / Bahía Parqueadero"
                          value={editVehParking}
                          onChange={(e) => setEditVehParking(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {editingCode.purpose !== "PATROL_CHECKPOINT" &&
                  editingCode.purpose !== "EMPLOYEE_CREDENTIAL" &&
                  editingCode.purpose !== "RESIDENT_VEHICLE" && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Número de Serie / Placa del Activo"
                        placeholder="Ej: SN-49281048"
                        value={editSerial}
                        onChange={(e) => setEditSerial(e.target.value)}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Marca / Modelo"
                        placeholder="Ej: Dahua IPC-HFW"
                        value={editBrand}
                        onChange={(e) => setEditBrand(e.target.value)}
                      />
                    </Stack>
                  )}

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Descripción o Notas Adicionales"
                  placeholder="Observaciones de instalación, mantenimiento o estado..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />

                <Divider sx={{ my: 1 }} />

                {/* Trazabilidad y Auditoría */}
                <Box sx={{ p: 2, bgcolor: "neutral.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
                    Trazabilidad del Registro
                  </Typography>
                  <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Creado por:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {editingCode.createdBy?.fullName || "Sistema"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Última modificación:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {editingCode.updatedBy?.fullName || editingCode.createdBy?.fullName || "Sistema"}
                      </Typography>
                    </Grid>
                    {editingCode.batchId && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lote de Emisión:
                        </Typography>
                        <Chip
                          icon={<BatchIcon sx={{ fontSize: "14px !important" }} />}
                          label={editingCode.batchId}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700, mt: 0.3 }}
                        />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Fecha de Registro:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(editingCode.createdAt).toLocaleString("es-CO")}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Acciones */}
                <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={savingEdit ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    sx={{
                      px: 3.5,
                      py: 1.2,
                      borderRadius: 2.5,
                      fontWeight: 800,
                      textTransform: "none",
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    {savingEdit ? "Guardando..." : "Guardar Cambios"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => setEditingCode(null)}
                    disabled={savingEdit}
                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* Columna Derecha: Representación Visual Canónica y Acciones */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "neutral.50",
                textAlign: "center",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                Representación Canónica
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 3 }}>
                Simbología: {editingCode.codeType} • Finalidad: {editingCode.purpose}
              </Typography>

              {/* Rótulo / Visualizador */}
              <Box
                sx={{
                  p: 3,
                  bgcolor: "#ffffff",
                  borderRadius: 2.5,
                  border: "1px dashed #cbd5e1",
                  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  maxWidth: 320,
                  width: "100%",
                  mb: 3,
                }}
              >
                <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, color: "primary.main", letterSpacing: 0.5, textTransform: "uppercase", mb: 0.5 }}>
                  LORO ERP • CONTROL
                </Typography>
                <Typography noWrap variant="body2" sx={{ fontWeight: 800, maxWidth: "100%", mb: 1 }}>
                  {editTitle || editingCode.title}
                </Typography>

                <Box sx={{ my: 1 }}>
                  {isQr ? (
                    <Box
                      component="img"
                      src={getQrCodeImageUrl(editingCode.code, 180)}
                      alt={editingCode.code}
                      sx={{ width: 140, height: 140 }}
                    />
                  ) : (
                    <Box
                      dangerouslySetInnerHTML={{
                        __html: generateBarcode128Svg(editingCode.code, {
                          width: 220,
                          height: 60,
                          showText: true,
                        }),
                      }}
                    />
                  )}
                </Box>

                <Typography sx={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.85rem", mt: 1 }}>
                  {editingCode.code}
                </Typography>

                {editSerial && (
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mt: 0.5 }}>
                    SN: {editSerial}
                  </Typography>
                )}
              </Box>

              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<PrintIcon />}
                  onClick={() => onSendToPrintStation([editingCode])}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Imprimir Rótulo Individual
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={() => handleCopyCode(editingCode.code)}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  {copiedId === editingCode.code ? "¡Código Copiado!" : "Copiar Código Canónico"}
                </Button>

                <Button
                  variant="text"
                  startIcon={<OpenIcon />}
                  component="a"
                  href={`/verify/code/${encodeURIComponent(editingCode.code)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Ver Ficha Pública de Verificación
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Alerta de Notificación */}
      {feedback && (
        <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por código, título, serial o área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Lote de Emisión"
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Todos los Lotes</MenuItem>
              {batchOptions.map((b) => (
                <MenuItem key={b.batchId} value={b.batchId}>
                  {b.batchId} ({b.count})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Simbología"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">Todas</MenuItem>
              <MenuItem value="QR_CODE">Código QR</MenuItem>
              <MenuItem value="BARCODE_128">Code 128</MenuItem>
              <MenuItem value="BARCODE_EAN13">EAN-13</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="ACTIVE">Activos</MenuItem>
              <MenuItem value="INACTIVE">Inactivos</MenuItem>
              <MenuItem value="REVOKED">Revocados</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                sx={{ height: 40, borderRadius: 2, textTransform: "none" }}
              >
                Actualizar
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Banner de acceso directo a Fast Editor de Lote */}
        {selectedBatchId && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "secondary.50",
              border: "1px dashed",
              borderColor: "secondary.main",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <BatchIcon color="secondary" fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "secondary.dark" }}>
                Filtrando por Lote: {selectedBatchId}
              </Typography>
            </Stack>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<EditIcon />}
              component="a"
              href={`/tools/codes?spoke=batch&batchId=${encodeURIComponent(selectedBatchId)}`}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Abrir Lote en Fast Editor
            </Button>
          </Box>
        )}

        {/* Barra de Acciones por Selección */}
        {selectedIds.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px dashed", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
              {selectedIds.length} código(s) seleccionado(s)
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                color="warning"
                size="small"
                startIcon={<PrintIcon />}
                onClick={handlePrintSelected}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                Imprimir Selección ({selectedIds.length})
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => setSelectedIds([])}
                sx={{ textTransform: "none" }}
              >
                Deseleccionar
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Tabla de Registros */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "neutral.50" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={codes.length > 0 && selectedIds.length === codes.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < codes.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Código Canónico</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Título / Identificador</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Lote</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Serial / Atributos</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
                      Cargando catálogo maestro...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : codes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <Typography variant="body2">No se encontraron códigos con los filtros seleccionados.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                codes.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isExactSearchMatch = Boolean(debouncedSearch.trim() && item.code.toLowerCase() === debouncedSearch.trim().toLowerCase());

                  let attrText = "";
                  if (item.purpose === "PATROL_CHECKPOINT") {
                    attrText = [
                      item.metadata?.floor ? `Piso ${item.metadata.floor}` : null,
                      item.metadata?.targetIntervalMinutes ? `${item.metadata.targetIntervalMinutes}m` : null,
                    ].filter(Boolean).join(" • ");
                  } else if (item.purpose === "EMPLOYEE_CREDENTIAL") {
                    attrText = [
                      item.metadata?.documentNumber ? `CC: ${item.metadata.documentNumber}` : null,
                      item.metadata?.bloodType ? `RH: ${item.metadata.bloodType}` : null,
                    ].filter(Boolean).join(" • ");
                  } else if (item.purpose === "RESIDENT_VEHICLE") {
                    attrText = [
                      item.metadata?.unitNumber ? `Apto ${item.metadata.unitNumber}` : null,
                      (item.metadata?.plateOrSerial || item.metadata?.serialNumber) ? `Placa: ${item.metadata?.plateOrSerial || item.metadata?.serialNumber}` : null,
                    ].filter(Boolean).join(" • ");
                  } else {
                    const s = (item.metadata?.serialNumber as string) || (item.metadata?.plateOrSerial as string);
                    attrText = s ? `SN: ${s}` : "";
                  }

                  return (
                    <TableRow
                      key={item.id}
                      hover
                      selected={isSelected}
                      sx={isExactSearchMatch ? { bgcolor: "primary.50" } : {}}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(item.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={item.codeType}>
                          {item.codeType === "QR_CODE" ? (
                            <QrIcon color="primary" fontSize="small" />
                          ) : (
                            <BarcodeIcon color="action" fontSize="small" />
                          )}
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                            {item.code}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyCode(item.code)}
                            sx={{ p: 0.5 }}
                          >
                            <CopyIcon sx={{ fontSize: 14 }} color={copiedId === item.code ? "success" : "action"} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.purpose} {item.department ? `• ${item.department}` : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.batchId ? (
                          <Chip
                            icon={<BatchIcon sx={{ fontSize: "14px !important" }} />}
                            label={item.batchId}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            onClick={() => setSelectedBatchId(item.batchId || "")}
                            sx={{ fontWeight: 700, cursor: "pointer" }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            Individual
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {attrText ? (
                          <Typography variant="caption" sx={{ fontWeight: 600, fontFamily: "monospace", color: "text.primary" }}>
                            {attrText}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status === "ACTIVE" ? "Activo" : item.status === "INACTIVE" ? "Inactivo" : "Revocado"}
                          size="small"
                          color={item.status === "ACTIVE" ? "success" : item.status === "INACTIVE" ? "default" : "error"}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Editar Ficha / Serial">
                            <IconButton
                              size="small"
                              onClick={() => handleStartEdit(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Imprimir Rótulo">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => onSendToPrintStation([item])}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={item.status === "ACTIVE" ? "Inhabilitar Código" : "Reactivar Código"}>
                            <IconButton
                              size="small"
                              color={item.status === "ACTIVE" ? "default" : "success"}
                              onClick={() => handleToggleStatus(item)}
                            >
                              {item.status === "ACTIVE" ? (
                                <BlockIcon fontSize="small" />
                              ) : (
                                <ActivateIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>
    </Box>
  );
}
