"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import DetailDialog from "@/components/common/DetailDialog";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
import UnitAutocomplete, { UnitOption } from "@/components/common/UnitAutocomplete";
import ResidentAutocomplete, { ResidentOption } from "@/components/common/ResidentAutocomplete";
import MinutaFilterBar, { MinutaFilterValues } from "@/components/common/MinutaFilterBar";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  MenuItem,
  Paper,
  FormControl,
  Select,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  Chip,
  CircularProgress,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  InputLabel,
  Stack,
  Divider,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  Badge as BadgeIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  WarningAmber as WarningIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { formatDate, formatTime, formatDateTime, formatTimeToHHmm } from "@/lib/formatters";

const GUARD_POST_OPTIONS = [
  "Recepción",
  "Vehicular",
  "Recorredor",
  "Líder",
  "Supervisor de Puesto",
  "Operador Medios Tecnológicos",
  "Básico",
];

export default function MinutaGeneralPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    occurredAt: "",
    annotation: "",
    category: "GENERAL",
    priority: 3,
    isConfidential: false,
    guardPost: "Recepción",
    isResidentLinked: false,
    noveltySource: "",
  });

  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);

  // Detail & Filter State
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [detailImageUrl, setDetailImageUrl] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"CLIENT" | "INTERNAL">("CLIENT");
  const [filters, setFilters] = useState<MinutaFilterValues>({});
  const hasInitializedClient = useRef(false);

  const { showError, showSuccess } = useNotification();
  const { session } = useAuth();

  const isGlobalUser = !session?.user?.clientId;
  const activeClientId = isGlobalUser
    ? viewMode === "INTERNAL"
      ? undefined
      : selectedClientId || undefined
    : session?.user?.clientId || undefined;

  const selectedClientObj = useMemo(
    () => clients.find((c) => c.id === (isGlobalUser ? selectedClientId : session?.user?.clientId)),
    [clients, isGlobalUser, selectedClientId, session?.user?.clientId]
  );
  const activeClientName = selectedClientObj?.name;

  useEffect(() => {
    if (isGlobalUser) {
      HttpClient.get<any[]>("/client")
        .then((data) => {
          const list = data || [];
          setClients(list);
          if (list.length > 0 && !hasInitializedClient.current) {
            setSelectedClientId(list[0].id);
            hasInitializedClient.current = true;
          }
        })
        .catch(() => {});
    }
  }, [isGlobalUser]);

  const permissions = session?.permissions || [];
  const canDelete =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:delete");
  const canEdit =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:update");
  const canCreate =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:create");

  const handleCreate = () => {
    if (isGlobalUser && viewMode === "CLIENT" && !selectedClientId) {
      showError(
        "Debe escoger un cliente específico o seleccionar registros internos antes de generar un registro nuevo."
      );
      return;
    }
    setSelectedId(null);
    setEvidenceFile(null);
    setExistingMediaUrl(null);
    setSelectedUnit(null);
    setSelectedResident(null);
    const now = new Date();
    setFormData({
      date: now.toISOString().split("T")[0],
      time: formatTimeToHHmm(now),
      occurredAt: now.toISOString(),
      annotation: "",
      category: "GENERAL",
      priority: 3,
      isConfidential: false,
      guardPost: "Recepción",
      isResidentLinked: false,
      noveltySource: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      setEvidenceFile(null);
      setExistingMediaUrl(null);
      const data = await HttpClient.get<any>(`/operation/minuta/general/${id}`);
      setSelectedId(id);
      setFormData({
        date: data.date ? data.date.split("T")[0] : "",
        time: data.time ? formatTimeToHHmm(data.time) : (data.occurredAt ? formatTimeToHHmm(data.occurredAt) : ""),
        occurredAt: data.occurredAt || data.date || new Date().toISOString(),
        annotation: data.annotation || "",
        category: data.category || "GENERAL",
        priority: data.priority || 3,
        isConfidential: !!data.isConfidential,
        guardPost: data.guardPost || "Recepción",
        isResidentLinked: !!data.isResidentLinked,
        noveltySource: data.noveltySource || "",
      });

      if (data.unitId) {
        setSelectedUnit({
          id: data.unitId,
          unitName: data.unitName || "Unidad asignada",
        });
      } else {
        setSelectedUnit(null);
      }

      if (data.residentId) {
        setSelectedResident({
          id: data.residentId,
          firstName: data.residentName || "Residente asignado",
          lastName: "",
        });
      } else {
        setSelectedResident(null);
      }

      // Cargar adjuntos
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.MINUTA, id);
      if (mediaList && mediaList.length > 0) {
        setExistingMediaUrl(mediaList[0].presignedUrl || null);
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar la minuta");
    }
  };

  const handleView = async (row: any) => {
    setDetailRecord(row);
    setDetailImageUrl(null);
    try {
      if (row.mediaAttachments && row.mediaAttachments.length > 0) {
        const mediaId = row.mediaAttachments[0].id;
        const res = await StorageApi.getPresignedUrl(mediaId);
        setDetailImageUrl(res.presignedUrl);
      } else {
        const mediaList = await StorageApi.getByEntity(MediaTypeCategory.MINUTA, row.id);
        if (mediaList.length > 0 && mediaList[0].presignedUrl) {
          setDetailImageUrl(mediaList[0].presignedUrl);
        }
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/general/${id}`);
      showSuccess("Registro de minuta eliminado correctamente");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el registro");
    }
  };

  const handleViewEvidence = async (row: any) => {
    setPreviewLoading(true);
    setPreviewModalUrl(null);
    try {
      if (row.mediaAttachments && row.mediaAttachments.length > 0) {
        const mediaId = row.mediaAttachments[0].id;
        const res = await StorageApi.getPresignedUrl(mediaId);
        setPreviewModalUrl(res.presignedUrl);
      } else {
        const mediaList = await StorageApi.getByEntity(MediaTypeCategory.MINUTA, row.id);
        if (mediaList.length > 0 && mediaList[0].presignedUrl) {
          setPreviewModalUrl(mediaList[0].presignedUrl);
        } else {
          showError("No hay evidencia fotográfica asociada a este registro");
        }
      }
    } catch {
      showError("Error al obtener la imagen segura");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.annotation.trim()) {
      showError("La anotación o descripción de la novedad es requerida");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const timeVal = formData.time.length === 5 ? `${formData.time}:00` : formData.time;
      const dateVal = formData.date || now.toISOString().split("T")[0];

      const payload: any = {
        date: dateVal,
        time: timeVal,
        occurredAt: `${dateVal}T${timeVal}Z`,
        annotation: formData.annotation.trim(),
        category: formData.category,
        priority: Number(formData.priority) || 3,
        isConfidential: Boolean(formData.isConfidential),
        guardPost: formData.guardPost,
        isResidentLinked: formData.isResidentLinked,
        noveltySource: formData.isResidentLinked
          ? selectedResident
            ? `${selectedResident.firstName} ${selectedResident.lastName}`.trim()
            : selectedUnit?.unitName || null
          : formData.noveltySource.trim() || null,
        unitId: formData.isResidentLinked ? selectedUnit?.id || null : null,
        residentId: formData.isResidentLinked ? selectedResident?.id || null : null,
        clientId: isGlobalUser && viewMode === "INTERNAL" ? null : activeClientId || null,
      };

      let savedRecord: any;
      if (selectedId) {
        savedRecord = await HttpClient.patch(`/operation/minuta/general/${selectedId}`, payload);
        showSuccess("Minuta actualizada exitosamente");
      } else {
        savedRecord = await HttpClient.post("/operation/minuta/general", payload);
        showSuccess("Minuta registrada exitosamente");
      }

      const entityId = selectedId || savedRecord?.id;

      if (evidenceFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: evidenceFile,
            entityType: MediaTypeCategory.MINUTA,
            entityId,
            clientId: isGlobalUser && viewMode === "INTERNAL" ? null : activeClientId || null,
            subType: "general",
          });
          showSuccess("Evidencia fotográfica guardada");
        } catch (uploadErr: any) {
          console.error("S3 upload error:", uploadErr);
          showError("La minuta se guardó, pero hubo un inconveniente al subir la foto.");
        }
      }

      setDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al guardar la minuta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterChange = useCallback((newFilters: MinutaFilterValues) => {
    setFilters(newFilters);
  }, []);

  // Construir endpoint con query params
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (isGlobalUser && viewMode === "INTERNAL") {
      params.append("isInternal", "true");
    } else if (activeClientId) {
      params.append("clientId", activeClientId);
    }
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.search) params.append("search", filters.search);
    if (filters.unitId) params.append("unitId", filters.unitId);
    if (filters.residentId) params.append("residentId", filters.residentId);

    const queryStr = params.toString();
    return queryStr
      ? `/operation/minuta/general?${queryStr}`
      : "/operation/minuta/general";
  }, [activeClientId, isGlobalUser, viewMode, filters]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "date",
      headerName: "Fecha",
      width: 105,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: "time",
      headerName: "Hora",
      width: 85,
      valueFormatter: (value: any) => formatTime(value),
    },
    {
      field: "guardPost",
      headerName: "Puesto / Ubicación",
      width: 150,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value || "Recepción"}
          icon={<SecurityIcon sx={{ fontSize: 15 }} />}
          variant="outlined"
          color="primary"
          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
        />
      ),
    },
    {
      field: "noveltySource",
      headerName: "Fuente / Origen",
      width: 180,
      renderCell: (params) => {
        const isLinked = params.row.isResidentLinked;
        const resName = params.row.residentName;
        const uName = params.row.unitName;
        const text = params.value;

        if (isLinked) {
          return (
            <Tooltip title={`Unidad: ${uName || "N/A"}`}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <HomeWorkIcon sx={{ fontSize: 16, color: "success.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>
                  {resName || uName || text || "Residente"}
                </Typography>
              </Stack>
            </Tooltip>
          );
        }

        return (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
            {text || "—"}
          </Typography>
        );
      },
    },
    {
      field: "annotation",
      headerName: "Novedad / Anotación",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "priority",
      headerName: "Prioridad",
      width: 95,
      renderCell: (params) => (
        <Chip
          size="small"
          label={`Nivel ${params.value || 3}`}
          color={
            params.value >= 4 ? "error" : params.value === 3 ? "warning" : "default"
          }
        />
      ),
    },
    {
      field: "evidence",
      headerName: "Evidencia",
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const hasMedia = params.row.mediaAttachments?.length > 0;
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {!hasMedia ? (
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                —
              </Typography>
            ) : (
              <Tooltip title="Ver evidencia fotográfica">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleViewEvidence(params.row)}
                >
                  <CameraIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: "createdBy",
      headerName: "Creado Por",
      width: 140,
      valueGetter: (value: any) => value || "Sistema",
    },
  ];

  return (
    <>
      {isGlobalUser && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ flex: 1 }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.85rem", sm: "0.9rem" },
                whiteSpace: "nowrap",
              }}
            >
              Conjunto / Cliente Activo:
            </Typography>
            <FormControl
              size="small"
              sx={{ width: { xs: "100%", sm: 300 } }}
              disabled={viewMode === "INTERNAL"}
            >
              <Select
                value={viewMode === "INTERNAL" ? "" : selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">Todos los Clientes / Conjuntos</MenuItem>
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.internalCode || c.nit})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={viewMode === "INTERNAL"}
                onChange={(e) =>
                  setViewMode(e.target.checked ? "INTERNAL" : "CLIENT")
                }
                color="primary"
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.8rem", sm: "0.85rem" },
                  color: viewMode === "INTERNAL" ? "primary.main" : "text.secondary",
                }}
              >
                Ver Registros Internos
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Paper>
      )}

      {/* Barra de Filtros Reactiva y Ligera */}
      <MinutaFilterBar
        clientId={activeClientId}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Filtrar por texto de la novedad..."
        showTextSearch={true}
        showUnitFilter={true}
        showResidentFilter={true}
      />

      <DataTable
        title="Minuta General"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Minuta General" }]}
        onCreate={canCreate ? handleCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onView={handleView}
        refreshTrigger={refreshTrigger}
        infoDescription="Registro cronológico de novedades operativas en puestos de vigilancia con trazabilidad de origen y evidencia fotográfica."
        infoInstructions={`1. Selecciona el puesto de vigilancia y describe la novedad.
2. Si la novedad corresponde a un residente, activa el toggle para buscar por unidad o residente con autocompletado en tiempo real.
3. Adjunta una fotografía tomada con la cámara si requieres soporte fotográfico del suceso.`}
      />

      {/* Modal de Detalle de Minuta */}
      <DetailDialog
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title="Detalles de la Minuta General"
        headerContent={
          detailImageUrl && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <Box
                component="img"
                src={detailImageUrl}
                alt="Evidencia"
                sx={{
                  maxHeight: 220,
                  maxWidth: "100%",
                  objectFit: "contain",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
            </Box>
          )
        }
        fields={
          detailRecord
            ? [
                { label: "ID Registro", value: detailRecord.id },
                { label: "Fecha", value: formatDate(detailRecord.date) },
                { label: "Hora", value: formatTime(detailRecord.time) },
                { label: "Puesto / Ubicación", value: detailRecord.guardPost || "Recepción" },
                {
                  label: "¿Vinculada a Residente?",
                  value: detailRecord.isResidentLinked ? "Sí" : "No",
                },
                {
                  label: "Fuente / Origen",
                  value: detailRecord.isResidentLinked
                    ? `${detailRecord.residentName || "Residente"} (Unidad: ${detailRecord.unitName || "N/A"})`
                    : detailRecord.noveltySource || "No especificado",
                },
                { label: "Categoría", value: detailRecord.category || "GENERAL" },
                {
                  label: "Prioridad",
                  value: (
                    <Chip
                      size="small"
                      label={`Nivel ${detailRecord.priority || 3}`}
                      color={
                        detailRecord.priority >= 4
                          ? "error"
                          : detailRecord.priority === 3
                            ? "warning"
                            : "default"
                      }
                    />
                  ),
                },
                {
                  label: "Confidencial",
                  value: detailRecord.isConfidential ? "Sí" : "No",
                },
                { label: "Registrado Por", value: detailRecord.createdBy || "Sistema" },
                {
                  label: "Fecha Registro",
                  value: formatDateTime(detailRecord.createdAt || detailRecord.occurredAt),
                },
                { label: "Anotación / Novedad", value: detailRecord.annotation },
              ]
            : []
        }
      />

      {/* Modal de Creación / Edición de Minuta */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <SecurityIcon color="primary" />
          <Box component="span">
            {selectedId
              ? "Editar Minuta General"
              : isGlobalUser
              ? viewMode === "INTERNAL"
                ? "Nuevo Registro Interno"
                : activeClientName
                ? `Nuevo Registro para ${activeClientName}`
                : "Nuevo Registro de Minuta General"
              : "Nuevo Registro de Minuta General"}
          </Box>
          {isGlobalUser && !selectedId && (
            <Chip
              size="small"
              label={viewMode === "INTERNAL" ? "Registro Interno" : activeClientName || "Cliente"}
              color={viewMode === "INTERNAL" ? "secondary" : "primary"}
              variant="outlined"
              sx={{ fontWeight: 600, ml: "auto" }}
            />
          )}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2}>
              {/* Fecha y Hora */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="date"
                  label="Fecha del Suceso"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="time"
                  label="Hora del Suceso"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Puesto / Ubicación */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel id="guard-post-label">Puesto / Ubicación</InputLabel>
                  <Select
                    labelId="guard-post-label"
                    label="Puesto / Ubicación"
                    value={formData.guardPost}
                    onChange={(e) => setFormData({ ...formData, guardPost: e.target.value })}
                  >
                    {GUARD_POST_OPTIONS.map((post) => (
                      <MenuItem key={post} value={post}>
                        {post}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Categoría y Prioridad */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-label">Categoría</InputLabel>
                  <Select
                    labelId="category-label"
                    label="Categoría"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value="GENERAL">General</MenuItem>
                    <MenuItem value="SEGURIDAD">Seguridad</MenuItem>
                    <MenuItem value="MANTENIMIENTO">Mantenimiento</MenuItem>
                    <MenuItem value="CONVIVENCIA">Convivencia</MenuItem>
                    <MenuItem value="EMERGENCIA">Emergencia</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="priority-label">Prioridad</InputLabel>
                  <Select
                    labelId="priority-label"
                    label="Prioridad"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  >
                    <MenuItem value={1}>1 - Muy Baja</MenuItem>
                    <MenuItem value={2}>2 - Baja</MenuItem>
                    <MenuItem value={3}>3 - Normal</MenuItem>
                    <MenuItem value={4}>4 - Alta</MenuItem>
                    <MenuItem value={5}>5 - Crítica / Urgente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Sección Origen de Novedad con Toggle */}
              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                    Fuente / Origen de la Novedad
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isResidentLinked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({ ...formData, isResidentLinked: checked });
                          if (!checked) {
                            setSelectedUnit(null);
                            setSelectedResident(null);
                          }
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ¿Vinculada a un Residente?
                      </Typography>
                    }
                  />
                </Stack>
              </Grid>

              {formData.isResidentLinked ? (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <UnitAutocomplete
                      clientId={activeClientId}
                      value={selectedUnit}
                      onChange={(unit) => {
                        setSelectedUnit(unit);
                        if (unit && unit.residents && unit.residents.length > 0) {
                          // Si sólo hay un residente o queremos sincronizar
                          if (unit.residents.length === 1) {
                            setSelectedResident(unit.residents[0] as any);
                          }
                        }
                      }}
                      label="Buscar Apartamento / Unidad"
                      placeholder="Escribe ej: Torre 1 Apto 1001..."
                      required
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <ResidentAutocomplete
                      clientId={activeClientId}
                      unitId={selectedUnit?.id}
                      preloadedResidents={selectedUnit?.residents as any}
                      value={selectedResident}
                      onChange={(resident) => {
                        setSelectedResident(resident);
                        if (resident?.unit && !selectedUnit) {
                          setSelectedUnit(resident.unit as any);
                        }
                      }}
                      label="Residente Causante / Vinculado"
                      placeholder="Buscar por nombre o cédula..."
                    />
                  </Grid>
                </>
              ) : (
                <Grid size={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nombre / Detalle de la Fuente u Origen"
                    placeholder="Ej: Peatón externo, Técnico de internet, Guarda de turno, etc."
                    value={formData.noveltySource}
                    onChange={(e) => setFormData({ ...formData, noveltySource: e.target.value })}
                  />
                </Grid>
              )}

              {/* Anotación Principal */}
              <Grid size={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="Anotación / Descripción Detallada de la Novedad"
                  placeholder="Escribe de manera clara todos los detalles relevantes del suceso..."
                  value={formData.annotation}
                  onChange={(e) => setFormData({ ...formData, annotation: e.target.value })}
                />
              </Grid>

              {/* Evidencia Fotográfica */}
              <Grid size={12}>
                <ImageUploadCapture
                  label="Evidencia Fotográfica (Opcional)"
                  variant="evidence"
                  value={evidenceFile}
                  previewUrl={existingMediaUrl}
                  onChange={setEvidenceFile}
                  helperText="Toma una foto en vivo con la cámara o selecciona un archivo para respaldar la novedad."
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={18} color="inherit" />}
            >
              {submitting ? "Guardando..." : selectedId ? "Guardar Cambios" : "Registrar Minuta"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal Visor de Evidencia */}
      <Dialog
        open={Boolean(previewModalUrl || previewLoading)}
        onClose={() => setPreviewModalUrl(null)}
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <DialogContent
          sx={{
            p: 1,
            bgcolor: "black",
            textAlign: "center",
            minWidth: { xs: 260, sm: 320 },
            minHeight: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {previewLoading ? (
            <CircularProgress color="primary" />
          ) : (
            previewModalUrl && (
              <Box
                component="img"
                src={previewModalUrl}
                alt="Evidencia"
                sx={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: 1,
                }}
              />
            )
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: "background.paper", px: 2, py: 1 }}>
          <Button onClick={() => setPreviewModalUrl(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
