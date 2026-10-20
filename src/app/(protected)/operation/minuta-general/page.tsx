"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import DetailDialog from "@/components/common/DetailDialog";
import UnitAutocomplete, { UnitOption } from "@/components/common/UnitAutocomplete";
import ResidentAutocomplete, { ResidentOption } from "@/components/common/ResidentAutocomplete";
import ClientAutocomplete, { ClientOption } from "@/components/common/ClientAutocomplete";
import MinutaFilterBar, { MinutaFilterValues } from "@/components/common/MinutaFilterBar";
import { useTenant } from "@/providers/TenantProvider";
import { GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
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
  Alert,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
  Badge as BadgeIcon,
  HomeWork as HomeWorkIcon,
  Security as SecurityIcon,
  WarningAmber as WarningIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PictureAsPdfIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import AudioVoiceNoteRecorder from "@/components/common/AudioVoiceNoteRecorder";
import MultiMediaEvidencePicker from "@/components/common/MultiMediaEvidencePicker";
import { generateMinutaSingleSheetPdf } from "@/lib/pdf/minutaPdfGenerator";
import MinutaExportPdfDrawer from "./MinutaExportPdfDrawer";
import dayjs from "dayjs";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { formatDate, formatTime, formatDateTime, formatTimeToHHmm, getPriorityInfo } from "@/lib/formatters";

const GUARD_POST_OPTIONS = [
  "Recepción / Portería Principal",
  "Acceso Vehicular",
  "Acceso Peatonal",
  "Parqueadero Residentes",
  "Parqueadero Visitantes",
  "Áreas Comunes / Club House",
  "Piscina / Zonas Húmedas",
  "Zona Infantil / Juegos",
  "Torre / Bloque Residencial",
  "Ronda Perimetral",
  "Cuarto Técnico / Basuras",
  "Otro",
];

interface MinutaGeneralPageProps {
  isInternal?: boolean;
}

export default function MinutaGeneralPage({ isInternal = false }: MinutaGeneralPageProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [voiceNoteFile, setVoiceNoteFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Export PDF Drawer State
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const initialAnnotationRef = useRef<string>("");

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

  // Limpiar notas de voz y videos si el usuario baja la prioridad a < 4
  useEffect(() => {
    if (formData.priority < 4) {
      if (voiceNoteFile) setVoiceNoteFile(null);
      if (videoFile) setVideoFile(null);
      if (photoFiles.length > 2) setPhotoFiles((prev) => prev.slice(0, 2));
    }
  }, [formData.priority, voiceNoteFile, videoFile, photoFiles.length]);

  const [selectedUnit, setSelectedUnit] = useState<UnitOption | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);

  // Internal client link state
  const [isClientLinked, setIsClientLinked] = useState(false);
  const [selectedClientForRecord, setSelectedClientForRecord] = useState<ClientOption | null>(null);

  // Detail & Filter State
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [detailImageUrl, setDetailImageUrl] = useState<string | null>(null);
  const [detailVoiceNoteUrl, setDetailVoiceNoteUrl] = useState<string | null>(null);
  const [detailVideoUrl, setDetailVideoUrl] = useState<string | null>(null);
  const [detailPhotoUrls, setDetailPhotoUrls] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedClientFilter, setSelectedClientFilter] = useState<ClientOption | null>(null);
  const [filters, setFilters] = useState<MinutaFilterValues>({});

  const { showError, showSuccess } = useNotification();
  const { session } = useAuth();
  const { tenant } = useTenant();

  const isGlobalUser = !session?.user?.clientId;
  const activeClientId = isGlobalUser
    ? isInternal
      ? undefined
      : selectedClientFilter?.id || undefined
    : session?.user?.clientId || undefined;
  const activeClientName = isGlobalUser
    ? selectedClientFilter?.name
    : undefined;

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
  const canExport =
    permissions.includes("godlike:manage") ||
    permissions.includes("minuta:manage") ||
    permissions.includes("minuta:export");

  const handleCreate = () => {
    if (!isInternal && isGlobalUser && !activeClientId) {
      showError(
        "Debe escoger un cliente específico antes de generar un registro de minuta del cliente."
      );
      return;
    }
    setSelectedId(null);
    setPhotoFiles([]);
    setVideoFile(null);
    setVoiceNoteFile(null);
    setExistingMediaUrl(null);
    setSelectedUnit(null);
    setSelectedResident(null);
    setIsClientLinked(false);
    setSelectedClientForRecord(null);
    const today = dayjs();
    setFormData({
      date: today.format("YYYY-MM-DD"),
      time: today.format("HH:mm"),
      occurredAt: today.toISOString(),
      annotation: "",
      category: "GENERAL",
      priority: 3,
      isConfidential: false,
      guardPost: "Recepción / Portería Principal",
      isResidentLinked: false,
      noveltySource: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      setPhotoFiles([]);
      setVideoFile(null);
      setVoiceNoteFile(null);
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

      if (data.clientId) {
        setIsClientLinked(true);
        setSelectedClientForRecord({
          id: data.clientId,
          name: data.clientName || "Cliente asignado",
        });
      } else {
        setIsClientLinked(false);
        setSelectedClientForRecord(null);
      }

      // Cargar adjuntos
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.MINUTA, id);
      if (mediaList && mediaList.length > 0) {
        const photo = mediaList.find((m) => m.mimeType?.startsWith("image/"));
        if (photo) {
          setExistingMediaUrl(photo.presignedUrl || null);
        }
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar la minuta");
    }
  };

  const handleView = async (row: any) => {
    setDetailRecord(row);
    setDetailImageUrl(null);
    setDetailVoiceNoteUrl(null);
    setDetailVideoUrl(null);
    setDetailPhotoUrls([]);

    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.MINUTA, row.id);
      const photos: string[] = [];

      for (const item of mediaList) {
        if (item.presignedUrl) {
          const mime = item.mimeType || "";
          const name = item.fileName || "";
          if (mime.startsWith("audio/") || name.includes("voice_note")) {
            setDetailVoiceNoteUrl(item.presignedUrl);
          } else if (mime.startsWith("video/") || name.includes("clip")) {
            setDetailVideoUrl(item.presignedUrl);
          } else if (mime.startsWith("image/")) {
            photos.push(item.presignedUrl);
          }
        }
      }

      setDetailPhotoUrls(photos);
      if (photos.length > 0) {
        setDetailImageUrl(photos[0]);
      }
    } catch {
      // Ignorar fallo de carga de preview
    }
  };

  const handleExportSingleSheet = async (row: any) => {
    if (!row?.id) return;
    try {
      showSuccess("Generando Ficha Técnica PDF con evidencias...");
      let photoUrls: string[] = [];

      try {
        const mediaList = await StorageApi.getByEntity(MediaTypeCategory.MINUTA, row.id);
        photoUrls = mediaList
          .filter(
            (m) =>
              Boolean(m.presignedUrl) &&
              ((m.mimeType && m.mimeType.startsWith("image/")) ||
                m.subType === "photo" ||
                /\.(jpe?g|png|webp|gif|bmp)$/i.test(m.fileName || ""))
          )
          .map((m) => m.presignedUrl as string);
      } catch (mediaErr) {
        console.warn("No se pudieron consultar adjuntos en vivo para el PDF:", mediaErr);
      }

      // Fallback si estamos en el drawer de detalles y ya tenemos fotos cargadas
      if (photoUrls.length === 0 && detailRecord?.id === row.id && detailPhotoUrls.length > 0) {
        photoUrls = [...detailPhotoUrls];
      }

      await generateMinutaSingleSheetPdf({
        minuta: row,
        tenant,
        photoUrls,
      });
      showSuccess("Ficha Técnica PDF generada con éxito");
    } catch (err: any) {
      console.error("PDF export error:", err);
      showError("Error al generar el PDF de la minuta");
    }
  };

  const handleDelete = async (idOrRow: any) => {
    const targetId = typeof idOrRow === "string" ? idOrRow : idOrRow?.id;
    if (!targetId) return;
    try {
      await HttpClient.delete(`/operation/minuta/general/${targetId}`);
      showSuccess("Registro de minuta eliminado correctamente");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al eliminar el registro");
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

    if (isInternal && isClientLinked && !selectedClientForRecord) {
      showError("Ha seleccionado vincular la minuta a un cliente; por favor escoja el cliente.");
      return;
    }

    setSubmitting(true);
    try {
      const timeVal = formData.time.length === 5 ? `${formData.time}:00` : formData.time;
      const dateVal = formData.date || dayjs().format("YYYY-MM-DD");
      const localMoment = dayjs(`${dateVal} ${timeVal}`);
      const occurredAtVal = localMoment.isValid() ? localMoment.toISOString() : new Date().toISOString();

      const payload: any = {
        date: dateVal,
        time: timeVal,
        occurredAt: occurredAtVal,
        annotation: formData.annotation.trim(),
        category: formData.category,
        priority: Number(formData.priority) || 3,
        isConfidential: Boolean(formData.isConfidential),
        guardPost: formData.guardPost,
        isInternal: isInternal,
        isResidentLinked: isInternal ? false : formData.isResidentLinked,
        noveltySource: isInternal
          ? selectedClientForRecord
            ? `Cliente: ${selectedClientForRecord.name}`
            : formData.noveltySource.trim() || null
          : formData.isResidentLinked
            ? selectedResident
              ? `${selectedResident.firstName} ${selectedResident.lastName}`.trim()
              : selectedUnit?.unitName || null
            : formData.noveltySource.trim() || null,
        unitId: isInternal ? null : formData.isResidentLinked ? selectedUnit?.id || null : null,
        residentId: isInternal ? null : formData.isResidentLinked ? selectedResident?.id || null : null,
        clientId: isInternal
          ? isClientLinked
            ? selectedClientForRecord?.id || null
            : null
          : activeClientId || null,
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

      if (entityId) {
        // 1. Upload Photos
        for (const photo of photoFiles) {
          try {
            await StorageApi.uploadMedia({
              file: photo,
              entityType: MediaTypeCategory.MINUTA,
              entityId,
              clientId: isInternal
                ? isClientLinked
                  ? selectedClientForRecord?.id || null
                  : null
                : activeClientId || null,
              subType: "photo",
            });
          } catch (uploadErr: any) {
            console.error("S3 photo upload error:", uploadErr);
          }
        }

        // 2. Upload Video Clip (if any)
        if (videoFile) {
          try {
            await StorageApi.uploadMedia({
              file: videoFile,
              entityType: MediaTypeCategory.MINUTA,
              entityId,
              clientId: isInternal
                ? isClientLinked
                  ? selectedClientForRecord?.id || null
                  : null
                : activeClientId || null,
              subType: "video",
            });
          } catch (uploadErr: any) {
            console.error("S3 video upload error:", uploadErr);
          }
        }

        // 3. Upload Voice Note (if any)
        if (voiceNoteFile) {
          try {
            await StorageApi.uploadMedia({
              file: voiceNoteFile,
              entityType: MediaTypeCategory.MINUTA,
              entityId,
              clientId: isInternal
                ? isClientLinked
                  ? selectedClientForRecord?.id || null
                  : null
                : activeClientId || null,
              subType: "voice_note",
            });
          } catch (uploadErr: any) {
            console.error("S3 voice note upload error:", uploadErr);
          }
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
    params.append("isInternal", isInternal ? "true" : "false");
    if (!isInternal && activeClientId) {
      params.append("clientId", activeClientId);
    }
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.search) params.append("search", filters.search);
    if (!isInternal) {
      if (filters.unitId) params.append("unitId", filters.unitId);
      if (filters.residentId) params.append("residentId", filters.residentId);
    }

    const queryStr = params.toString();
    return queryStr
      ? `/operation/minuta/general?${queryStr}`
      : "/operation/minuta/general";
  }, [activeClientId, isInternal, filters]);

  const columns: GridColDef[] = useMemo(() => [
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
      headerName: "Ubicación",
      width: 170,
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
      field: "creatorPosition",
      headerName: "Cargo",
      width: 150,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value || params.row.creatorPosition || "Guarda"}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.72rem", borderColor: "divider" }}
        />
      ),
    },
    {
      field: "noveltySource",
      headerName: isInternal ? "Cliente / Origen" : "Fuente / Origen",
      flex: 0.8,
      minWidth: 160,
      renderCell: (params) => {
        if (isInternal) {
          if (params.row.clientId && params.row.clientName) {
            return (
              <Tooltip title="Vinculado a Cliente">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <BadgeIcon sx={{ fontSize: 16, color: "secondary.main" }} />
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: "0.8rem", color: "secondary.dark" }}
                  >
                    {params.row.clientName}
                  </Typography>
                </Stack>
              </Tooltip>
            );
          }
          return (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
              {params.value || "—"}
            </Typography>
          );
        }

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
      width: 110,
      renderCell: (params) => {
        const info = getPriorityInfo(params.value);
        return (
          <Chip
            size="small"
            label={info.label}
            color={info.color}
            sx={{ fontWeight: 700, fontSize: "0.75rem" }}
          />
        );
      },
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
  ], [isInternal]);

  return (
    <>
      {!isInternal && isGlobalUser && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
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
          <Box sx={{ width: { xs: "100%", sm: 380 } }}>
            <ClientAutocomplete
              value={selectedClientFilter}
              onChange={(client) => setSelectedClientFilter(client)}
              allowAllOption={true}
              allOptionLabel="Todos los Clientes / Conjuntos"
              placeholder="Buscar cliente o puesto de seguridad..."
              size="small"
            />
          </Box>
        </Paper>
      )}

      {/* Barra de Filtros Reactiva y Ligera */}
      <MinutaFilterBar
        clientId={activeClientId}
        onFilterChange={handleFilterChange}
        searchPlaceholder={
          isInternal
            ? "Filtrar por texto de la novedad interna..."
            : "Filtrar por texto de la novedad..."
        }
        showTextSearch={true}
        showUnitFilter={!isInternal}
        showResidentFilter={!isInternal}
      />

      <DataTable
        title={
          isInternal
            ? `Minuta General - ${tenant?.name || "Interna"}`
            : "Minuta General"
        }
        hideStatusFilter={true}
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={
          isInternal
            ? [
              { label: "Operaciones" },
              { label: `Minutas de ${tenant?.name || "la Empresa"}` },
              { label: "Minuta General" },
            ]
            : [
              { label: "Operaciones" },
              { label: "Minutas del Cliente" },
              { label: "Minuta General" },
            ]
        }
        onCreate={canCreate ? handleCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        confirmDelete={true}
        deleteDialogTitle="Confirmar Eliminación de Minuta"
        deleteDialogMessage="¿Estás seguro de que deseas eliminar este registro de la minuta? Esta acción no se puede deshacer."
        deleteActionLabel="Eliminar"
        deleteIcon={<DeleteIcon color="error" />}
        onView={handleView}
        refreshTrigger={refreshTrigger}
        extraHeaderActions={
          canExport ? (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => setExportDialogOpen(true)}
              sx={{ fontWeight: 600, textTransform: "none", borderRadius: 1.5 }}
            >
              Exportar PDF
            </Button>
          ) : undefined
        }
        customActions={(row) => [
          ...(canExport
            ? [
              <GridActionsCellItem
                key="export-pdf"
                icon={<PictureAsPdfIcon sx={{ fontSize: 18, color: "primary.main" }} />}
                label="Exportar Ficha PDF"
                onClick={() => handleExportSingleSheet(row)}
                showInMenu
              />,
            ]
            : []),
        ]}
        infoDescription={
          isInternal
            ? "Registro cronológico de novedades operativas internas de la empresa/tenant, con trazabilidad opcional a clientes."
            : "Registro cronológico de novedades operativas en puestos de vigilancia con trazabilidad de origen y evidencia fotográfica."
        }
        infoInstructions={
          isInternal
            ? `1. Selecciona el puesto de vigilancia y describe la novedad operativa interna.
2. Si la novedad corresponde o impacta a un cliente específico, activa el switch para vincularlo.
3. Adjunta una fotografía tomada con la cámara si requieres soporte fotográfico del suceso.`
            : `1. Selecciona el puesto de vigilancia y describe la novedad.
2. Si la novedad corresponde a un residente, activa el toggle para buscar por unidad o residente con autocompletado en tiempo real.
3. Adjunta una fotografía tomada con la cámara si requieres soporte fotográfico del suceso.`
        }
      />

      {/* Modal de Detalle de Minuta */}
      <DetailDialog
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title={
          isInternal
            ? "Detalles de la Minuta General Interna"
            : "Detalles de la Minuta General"
        }
        subtitle={
          detailRecord
            ? `Radicado Oficial: RAD-${(detailRecord.id || "").slice(-8).toUpperCase()}`
            : undefined
        }
        secondaryAction={
          canExport && detailRecord ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleExportSingleSheet(detailRecord)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                py: 0.8,
                px: 2.5,
              }}
            >
              Descargar Ficha PDF
            </Button>
          ) : undefined
        }
        headerContent={
          detailRecord && (detailPhotoUrls.length > 0 || detailVoiceNoteUrl || detailVideoUrl) && (
            <Stack spacing={2} sx={{ width: "100%" }}>
              {/* Nota de voz probatoria */}
              {detailVoiceNoteUrl && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "success.light",
                    bgcolor: "#f0fdf4",
                    borderRadius: 2,
                  }}
                >
                  <Stack spacing={0.8}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "success.dark" }}>
                      🎙️ Nota de Voz Probatoria Grabada en Puesto:
                    </Typography>
                    <Box component="audio" controls src={detailVoiceNoteUrl} sx={{ width: "100%", height: 36 }} />
                  </Stack>
                </Paper>
              )}

              {/* Clip de Video probatorio */}
              {detailVideoUrl && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "warning.light",
                    bgcolor: "#fffdf8",
                    borderRadius: 2,
                  }}
                >
                  <Stack spacing={0.8}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.dark" }}>
                      🎥 Clip de Video Probatorio:
                    </Typography>
                    <Box
                      component="video"
                      controls
                      src={detailVideoUrl}
                      sx={{ width: "100%", maxHeight: 220, borderRadius: 1.5, bgcolor: "black" }}
                    />
                  </Stack>
                </Paper>
              )}

              {/* Galería de Fotos - Symmetrical & Clean */}
              {detailPhotoUrls.length > 0 && (
                <Box sx={{ width: "100%" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "text.secondary",
                      mb: 1,
                      display: "block",
                      textAlign: "center",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Evidencias Fotográficas ({detailPhotoUrls.length}):
                  </Typography>

                  {detailPhotoUrls.length === 1 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", width: "100%", py: 0.5 }}>
                      <Box
                        component="img"
                        src={detailPhotoUrls[0]}
                        alt="Evidencia fotográfica"
                        onClick={() => setPreviewModalUrl(detailPhotoUrls[0])}
                        sx={{
                          maxWidth: "100%",
                          maxHeight: 240,
                          objectFit: "contain",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                          cursor: "pointer",
                          transition: "transform 0.2s ease, opacity 0.2s ease",
                          "&:hover": { transform: "scale(1.02)", opacity: 0.95 },
                        }}
                      />
                    </Box>
                  ) : (
                    <Grid container spacing={1.5} justifyContent="center">
                      {detailPhotoUrls.map((pUrl, idx) => (
                        <Grid size={{ xs: 6, sm: 4 }} key={idx}>
                          <Box
                            component="img"
                            src={pUrl}
                            alt={`Evidencia ${idx + 1}`}
                            onClick={() => setPreviewModalUrl(pUrl)}
                            sx={{
                              width: "100%",
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              cursor: "pointer",
                              transition: "transform 0.2s ease, opacity 0.2s ease",
                              "&:hover": { transform: "scale(1.03)", opacity: 0.9 },
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
            </Stack>
          )
        }
        fields={
          detailRecord
            ? [
              { label: "ID Registro", value: detailRecord.id },
              { label: "Fecha", value: formatDate(detailRecord.date) },
              { label: "Hora", value: formatTime(detailRecord.time) },
              { label: "Ubicación", value: detailRecord.guardPost || "Recepción" },
              ...(isInternal
                ? [
                  {
                    label: "¿Vinculada a Cliente?",
                    value: detailRecord.clientId ? "Sí" : "No",
                  },
                  ...(detailRecord.clientId
                    ? [
                      {
                        label: "Cliente Vinculado",
                        value: detailRecord.clientName || detailRecord.clientId,
                      },
                    ]
                    : []),
                  {
                    label: "Fuente / Origen",
                    value: detailRecord.noveltySource || "No especificado",
                  },
                ]
                : [
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
                ]),
              { label: "Categoría", value: detailRecord.category || "GENERAL" },
              {
                label: "Prioridad",
                value: (() => {
                  const info = getPriorityInfo(detailRecord.priority);
                  return (
                    <Chip
                      size="small"
                      label={info.label}
                      color={info.color}
                      sx={{ fontWeight: 700 }}
                    />
                  );
                })(),
              },
              {
                label: "Confidencial",
                value: detailRecord.isConfidential ? "Sí" : "No",
              },
              { label: "Registrado Por", value: detailRecord.createdBy || "Sistema" },
              { label: "Cargo Registrador", value: detailRecord.creatorPosition || "Guarda" },
              {
                label: "Fecha Registro",
                value: formatDateTime(detailRecord.createdAt || detailRecord.occurredAt),
              },
              { label: "Anotación / Novedad", value: detailRecord.annotation },
            ]
            : []
        }
      />

      {/* Drawer de Creación / Edición de Minuta */}
      <ResponsiveFormDrawer
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={
          selectedId
            ? isInternal
              ? "Editar Minuta General Interna"
              : "Editar Minuta General"
            : isInternal
              ? `Nuevo Registro - ${tenant?.name || "Empresa"}`
              : activeClientName
                ? `Nuevo Registro para ${activeClientName}`
                : "Nuevo Registro de Minuta General"
        }
        headerIcon={<SecurityIcon color="primary" />}
        headerBadge={
          isInternal ? (
            <Chip
              size="small"
              label="Uso Interno"
              color="secondary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ) : undefined
        }
        actions={
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, width: "100%", flexDirection: { xs: "column-reverse", sm: "row" } }}>
            <Button onClick={() => setDialogOpen(false)} disabled={submitting} color="inherit" sx={{ width: { xs: "100%", sm: "auto" } }}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="minuta-general-form"
              variant="contained"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={18} color="inherit" />}
              sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}
            >
              {submitting ? "Guardando..." : selectedId ? "Guardar Cambios" : "Registrar Minuta"}
            </Button>
          </Box>
        }
      >
        <Box component="form" id="minuta-general-form" onSubmit={handleSubmit}>
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

            {/*Ubicación */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel id="guard-post-label">Ubicación</InputLabel>
                <Select
                  labelId="guard-post-label"
                  label="Ubicación"
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
                  onChange={(e) => {
                    const newPriority = Number(e.target.value);
                    setFormData((prev) => ({ ...prev, priority: newPriority }));
                    if (newPriority < 4) {
                      setVideoFile(null);
                      setVoiceNoteFile(null);
                      if (photoFiles.length > 2) {
                        setPhotoFiles(photoFiles.slice(0, 2));
                      }
                    }
                  }}
                >
                  <MenuItem value={1}>Muy baja</MenuItem>
                  <MenuItem value={2}>Baja</MenuItem>
                  <MenuItem value={3}>Normal</MenuItem>
                  <MenuItem value={4}>Alta</MenuItem>
                  <MenuItem value={5}>Crítica</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sección Origen / Vinculación */}
            {isInternal ? (
              <>
                <Grid size={12}>
                  <Divider sx={{ my: 1 }} />
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      Vinculación Opcional con Cliente
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isClientLinked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsClientLinked(checked);
                            if (!checked) {
                              setSelectedClientForRecord(null);
                            }
                          }}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ¿Vinculada a un cliente?
                        </Typography>
                      }
                    />
                  </Stack>
                </Grid>

                {isClientLinked && (
                  <Grid size={12}>
                    <ClientAutocomplete
                      value={selectedClientForRecord}
                      onChange={(client) => setSelectedClientForRecord(client)}
                      label="Seleccionar Cliente Vinculado"
                      placeholder="Buscar cliente por nombre o NIT..."
                      required
                    />
                  </Grid>
                )}

                <Grid size={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fuente / Origen de la Novedad Interna"
                    placeholder="Ej: Ronda de supervisión, Notificación de RRHH, Operador de CCTV, etc."
                    value={formData.noveltySource}
                    onChange={(e) => setFormData({ ...formData, noveltySource: e.target.value })}
                  />
                </Grid>
              </>
            ) : (
              <>
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
              </>
            )}

            {/* Anotación Principal con Dictador de Voz Incorporado */}
            <Grid size={12}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: (theme) =>
                      theme.palette.mode === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)",
                  },
                  "&:focus-within": {
                    borderColor: "primary.main",
                    boxShadow: (theme) =>
                      `0 0 0 1px ${theme.palette.primary.main}`,
                  },
                }}
              >
                <Box sx={{ px: 1.5, pt: 1.2, pb: formData.priority >= 4 ? 0 : 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "text.secondary",
                      display: "block",
                      fontSize: "0.75rem",
                    }}
                  >
                    Anotación / Descripción Detallada de la Novedad *
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={formData.priority >= 4 ? 3 : 3.5}
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    placeholder="Escribe de manera clara todos los detalles relevantes del suceso..."
                    value={formData.annotation}
                    onChange={(e) => setFormData({ ...formData, annotation: e.target.value })}
                    sx={{
                      mt: 0.5,
                      "& .MuiInputBase-root": {
                        fontSize: "0.88rem",
                        lineHeight: 1.45,
                      },
                    }}
                  />
                </Box>

                {/* Dictador de Voz Incorporado en la base de la misma caja (Solo Prioridad >= 4) */}
                {formData.priority >= 4 && (
                  <AudioVoiceNoteRecorder
                    embedded
                    onRecordingStart={() => {
                      initialAnnotationRef.current = formData.annotation;
                    }}
                    onTranscript={(sessionText) => {
                      setFormData((prev) => {
                        const base = initialAnnotationRef.current ? initialAnnotationRef.current.trim() : "";
                        const combined = base ? `${base} ${sessionText}` : sessionText;
                        return { ...prev, annotation: combined };
                      });
                    }}
                    onDiscard={() => {
                      setFormData((prev) => ({ ...prev, annotation: initialAnnotationRef.current }));
                      setVoiceNoteFile(null);
                    }}
                    onAudioFileReady={setVoiceNoteFile}
                    disabled={submitting}
                  />
                )}
              </Box>
            </Grid>

            {/* Evidencias Multimedia (Grid Symmetrical con Fotos + Video 30s) */}
            <Grid size={12}>
              <MultiMediaEvidencePicker
                priority={formData.priority}
                photoFiles={photoFiles}
                onPhotosChange={setPhotoFiles}
                videoFile={videoFile}
                onVideoChange={setVideoFile}
                disabled={submitting}
              />
            </Grid>

            {/* Mensaje Informativo Sutil al Final del Formulario (Solo para Prioridad Alta o Crítica) */}
            {formData.priority >= 4 && (
              <Grid size={12}>
                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ px: 0.5, opacity: 0.85 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem", lineHeight: 1.25 }}>
                    {formData.priority === 5
                      ? "Este registro notificará inmediatamente por correo y en tiempo real a la Dirección Operativa, Coordinador y Supervisores."
                      : "Este registro notificará en tiempo real al Coordinador y Supervisores de turno."}
                  </Typography>
                </Stack>
              </Grid>
            )}
          </Grid>
        </Box>
      </ResponsiveFormDrawer>

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

      {/* Drawer Exportar Reporte PDF por Rango */}
      <MinutaExportPdfDrawer
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        isInternal={isInternal}
        activeClientId={activeClientId}
        activeClientName={activeClientName}
        tenant={tenant}
      />
    </>
  );
}
