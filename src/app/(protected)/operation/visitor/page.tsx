"use client";

import { useState, useEffect, useCallback } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import { GridColDef } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Badge as BadgeIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  CameraAlt as CameraIcon,
} from "@mui/icons-material";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
import DetailDialog from "@/components/common/DetailDialog";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { formatDate, formatTime, formatDateTime, formatTimeToHHmm } from "@/lib/formatters";

interface UnitOption {
  id: string;
  unitName: string;
  unitType?: string;
  tower?: { towerName: string };
  floor?: { floorNumber: number };
}

interface ResidentOption {
  id: string;
  unitId: string;
  firstName: string;
  lastName: string;
  document: string;
  phoneNumber?: string;
  unit?: { unitName: string };
}

export default function VisitorControlPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Form State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    entryTime: "",
    exitTime: "",
    visitorFullName: "",
    visitorIdNumber: "",
    visitorIdType: "CC",
    peopleCount: 1,
    mode: "PEDESTRIAN",
    ticketNumber: "",
    unitId: "",
    residentId: "",
    destinationApartment: "",
    destinationInterior: "",
    hostName: "",
    authorizedByFullName: "",
    brand: "",
    plate: "",
    observations: "",
  });

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [detailImageUrl, setDetailImageUrl] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError, showSuccess } = useNotification();
  const { session } = useAuth();

  const isGlobalUser = !session?.user?.clientId;
  const activeClientId = session?.user?.clientId || selectedClientId;

  // 1. Load clients for global user
  useEffect(() => {
    if (isGlobalUser) {
      HttpClient.get<any[]>("/client")
        .then((data) => {
          const list = data || [];
          setClients(list);
          if (list.length > 0 && !selectedClientId) {
            setSelectedClientId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isGlobalUser, selectedClientId]);

  // 2. Load units and residents whenever active client changes
  const loadCatalogs = useCallback(async (clientId: string) => {
    if (!clientId) {
      setUnits([]);
      setResidents([]);
      return;
    }
    setLoadingCatalog(true);
    try {
      const [clientData, residentsData] = await Promise.all([
        HttpClient.get<any>(`/client/${clientId}`).catch(() => null),
        HttpClient.get<any[]>(`/resident/by-client/${clientId}`).catch(() => []),
      ]);

      setUnits(clientData?.units || []);
      setResidents(residentsData || []);
    } catch {
      // Ignorar fallo de carga de catálogos secundarios
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    if (activeClientId) {
      loadCatalogs(activeClientId);
    }
  }, [activeClientId, loadCatalogs]);

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

  // Handler: Abrir modal de nuevo registro
  const handleOpenCreate = () => {
    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);
    setEvidenceFile(null);
    setExistingMediaUrl(null);
    setFormData({
      date: now.toISOString().split("T")[0],
      time: currentTime + ":00",
      entryTime: currentTime + ":00",
      exitTime: "",
      visitorFullName: "",
      visitorIdNumber: "",
      visitorIdType: "CC",
      peopleCount: 1,
      mode: "PEDESTRIAN",
      ticketNumber: "",
      unitId: "",
      residentId: "",
      destinationApartment: "",
      destinationInterior: "",
      hostName: "",
      authorizedByFullName: "",
      brand: "",
      plate: "",
      observations: "",
    });
    setIsEditing(false);
    setEditId(null);
    setDialogOpen(true);
  };

  // Handler: Editar registro
  const handleEdit = async (id: string) => {
    try {
      setEvidenceFile(null);
      setExistingMediaUrl(null);
      const data = await HttpClient.get<any>(`/operation/minuta/visitor/${id}`);
      setEditId(id);
      setIsEditing(true);
      setFormData({
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
        time: data.time ? formatTimeToHHmm(data.time) : "",
        entryTime: data.entryTime ? formatTimeToHHmm(data.entryTime) : (data.time ? formatTimeToHHmm(data.time) : ""),
        exitTime: data.exitTime ? formatTimeToHHmm(data.exitTime) : "",
        visitorFullName: data.visitorFullName || "",
        visitorIdNumber: data.visitorIdNumber || "",
        visitorIdType: data.visitorIdType || "CC",
        peopleCount: data.peopleCount || 1,
        mode: data.mode || "PEDESTRIAN",
        ticketNumber: data.ticketNumber || "",
        unitId: data.unitId || "",
        residentId: data.residentId || "",
        destinationApartment: data.destinationApartment || data.apartment || "",
        destinationInterior: data.destinationInterior || data.block || "",
        hostName: data.hostName || data.authorizedByFullName || "",
        authorizedByFullName: data.authorizedByFullName || "",
        brand: data.brand || "",
        plate: data.plate || "",
        observations: data.observations || "",
      });

      // Load existing S3 media
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.VISITOR, id);
      if (mediaList && mediaList.length > 0) {
        setExistingMediaUrl(mediaList[0].presignedUrl || null);
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar la información del visitante");
    }
  };

  // Handler: Selección de Unidad
  const handleSelectUnit = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    setFormData((prev) => ({
      ...prev,
      unitId,
      destinationApartment: unit ? unit.unitName : prev.destinationApartment,
      destinationInterior: unit?.tower?.towerName || prev.destinationInterior,
      residentId: "", // reset resident if unit changes
    }));
  };

  // Handler: Selección de Residente
  const handleSelectResident = (residentId: string) => {
    const resident = residents.find((r) => r.id === residentId);
    setFormData((prev) => ({
      ...prev,
      residentId,
      hostName: resident ? `${resident.firstName} ${resident.lastName}` : prev.hostName,
      unitId: resident?.unitId || prev.unitId,
      destinationApartment: resident?.unit?.unitName || prev.destinationApartment,
    }));
  };

  // Handler: Guardar (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitorFullName.trim()) {
      showError("El nombre del visitante es requerido");
      return;
    }
    if (!formData.visitorIdNumber.trim()) {
      showError("El documento del visitante es requerido");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const payload: any = {
        date: formData.date || now.toISOString().split("T")[0],
        time: formData.time.length === 5 ? `${formData.time}:00` : formData.time,
        occurredAt: `${formData.date || now.toISOString().split("T")[0]}T${formData.time.length === 5 ? `${formData.time}:00` : formData.time}Z`,
        entryTime: formData.entryTime.length === 5 ? `${formData.entryTime}:00` : formData.entryTime,
        visitorFullName: formData.visitorFullName.trim(),
        visitorIdNumber: formData.visitorIdNumber.trim(),
        visitorIdType: formData.visitorIdType,
        mode: formData.mode,
        peopleCount: Number(formData.peopleCount) || 1,
        ticketNumber: formData.ticketNumber?.trim() || null,
        destination: formData.destinationApartment || null,
        apartment: formData.destinationApartment || null,
        block: formData.destinationInterior || null,
        authorizedByFullName: formData.hostName || formData.authorizedByFullName || null,
        observations: formData.observations?.trim() || null,
        clientId: activeClientId || null,
        unitId: formData.unitId || null,
        residentId: formData.residentId || null,
      };

      if (formData.mode === "VEHICLE") {
        payload.brand = formData.brand?.trim() || null;
        payload.plate = formData.plate?.trim() || null;
      }

      let savedRecord: any;
      if (isEditing && editId) {
        if (formData.exitTime) {
          payload.exitTime = formData.exitTime.length === 5 ? `${formData.exitTime}:00` : formData.exitTime;
        }
        savedRecord = await HttpClient.patch(`/operation/minuta/visitor/${editId}`, payload);
        showSuccess("Registro de visitante actualizado correctamente");
      } else {
        savedRecord = await HttpClient.post("/operation/minuta/visitor", payload);
        showSuccess("Ingreso de visitante registrado exitosamente");
      }

      const entityId = editId || savedRecord?.id;
      if (evidenceFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: evidenceFile,
            entityType: MediaTypeCategory.VISITOR,
            entityId,
            clientId: activeClientId || null,
            subType: "visitor",
          });
          showSuccess("Fotografía/Evidencia de visitante subida a AWS S3");
        } catch (uploadErr) {
          console.error("S3 upload error:", uploadErr);
          showError("Registro guardado, pero ocurrió un problema al subir la foto a S3");
        }
      }

      setDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al procesar el registro");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Marcar Salida Rápida
  const handleMarkExit = async (id: string) => {
    try {
      await HttpClient.patch(`/operation/minuta/visitor/${id}/exit`, {});
      showSuccess("Salida de visitante registrada exitosamente");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la salida");
    }
  };

  // Handler: Ver Detalle
  const handleViewDetail = async (row: any) => {
    setDetailRecord(row);
    setDetailImageUrl(null);
    try {
      if (row.mediaAttachments && row.mediaAttachments.length > 0) {
        const res = await StorageApi.getPresignedUrl(row.mediaAttachments[0].id);
        setDetailImageUrl(res.presignedUrl);
      } else {
        const mediaList = await StorageApi.getByEntity(MediaTypeCategory.VISITOR, row.id);
        if (mediaList.length > 0 && mediaList[0].presignedUrl) {
          setDetailImageUrl(mediaList[0].presignedUrl);
        }
      }
    } catch {}
  };

  // Handler: Ver evidencia fotográfica
  const handleViewEvidence = async (row: any) => {
    setPreviewLoading(true);
    setPreviewModalUrl(null);
    try {
      if (row.mediaAttachments && row.mediaAttachments.length > 0) {
        const mediaId = row.mediaAttachments[0].id;
        const res = await StorageApi.getPresignedUrl(mediaId);
        setPreviewModalUrl(res.presignedUrl);
      } else {
        const mediaList = await StorageApi.getByEntity(MediaTypeCategory.VISITOR, row.id);
        if (mediaList.length > 0 && mediaList[0].presignedUrl) {
          setPreviewModalUrl(mediaList[0].presignedUrl);
        } else {
          showError("No hay fotografía/evidencia asociada a este visitante");
        }
      }
    } catch {
      showError("Error al obtener la imagen segura de AWS S3");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handler: Eliminar
  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/visitor/${id}`);
      showSuccess("Registro eliminado");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al eliminar el registro");
    }
  };

  // Filtrar residentes según la unidad seleccionada
  const availableResidents = formData.unitId
    ? residents.filter((r) => r.unitId === formData.unitId)
    : residents;

  const endpoint = activeClientId
    ? `/operation/minuta/visitor?clientId=${activeClientId}`
    : "/operation/minuta/visitor";

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 60 },
    {
      field: "date",
      headerName: "Fecha",
      width: 105,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: "entryTime",
      headerName: "Ingreso",
      width: 90,
      valueFormatter: (value: any) => formatTime(value),
    },
    {
      field: "visitorFullName",
      headerName: "Visitante",
      width: 190,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.15 }}>
            {params.row.visitorFullName}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", lineHeight: 1, mt: "2px", fontSize: "0.75rem" }}
          >
            {params.row.visitorIdType || "CC"} {params.row.visitorIdNumber}
          </Typography>
        </Box>
      ),
    },
    {
      field: "unitName",
      headerName: "Unidad / Apto",
      width: 150,
      renderCell: (params) => {
        const name =
          params.row.unitName ||
          params.row.unit?.unitName ||
          params.row.destinationApartment ||
          params.row.destination ||
          "—";
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.8 }}>
            <HomeWorkIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {name}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "residentName",
      headerName: "Residente / Anfitrión",
      width: 180,
      renderCell: (params) => {
        const res =
          params.row.residentName ||
          (params.row.resident
            ? `${params.row.resident.firstName} ${params.row.resident.lastName}`
            : params.row.hostName || params.row.authorizedByFullName || "—");
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.6 }}>
            <PersonIcon sx={{ fontSize: 17, color: "text.secondary" }} />
            <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
              {res}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "mode",
      headerName: "Tipo",
      width: 120,
      renderCell: (params) => {
        const isVehicle = params.row.mode === "VEHICLE" || Boolean(params.row.plate);
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {isVehicle ? (
              <Chip
                size="small"
                icon={<CarIcon sx={{ fontSize: 15 }} />}
                label={params.row.plate || "Vehicular"}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: "0.72rem" }}
              />
            ) : (
              <Chip
                size="small"
                label="Peatonal"
                variant="outlined"
                sx={{ fontSize: "0.72rem" }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: "ticketNumber",
      headerName: "Ficha",
      width: 90,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          {params.value ? (
            <Chip
              size="small"
              icon={<BadgeIcon sx={{ fontSize: 14 }} />}
              label={params.value}
              sx={{ fontWeight: 600, fontSize: "0.72rem" }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: "text.disabled" }}>
              —
            </Typography>
          )}
        </Box>
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
      field: "exitAction",
      headerName: "Estado / Salida",
      width: 170,
      sortable: false,
      renderCell: (params) => {
        const hasExit = Boolean(params.row.exitTime || params.row.exitAt);
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {hasExit ? (
              <Chip
                size="small"
                icon={<TimeIcon sx={{ fontSize: 15 }} />}
                label={`Salió: ${formatTime(params.row.exitTime || params.row.exitAt)}`}
                color="default"
                variant="outlined"
                sx={{ fontWeight: 500, fontSize: "0.75rem", bgcolor: "action.hover" }}
              />
            ) : (
              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={<LogoutIcon sx={{ fontSize: 15 }} />}
                onClick={() => handleMarkExit(params.row.id)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  py: 0.3,
                  px: 1.2,
                  borderRadius: 1.5,
                  boxShadow: "none",
                }}
              >
                Marcar Salida
              </Button>
            )}
          </Box>
        );
      },
    },
    {
      field: "createdBy",
      headerName: "Registrado Por",
      width: 150,
      valueGetter: (value: any) => value || "Sistema",
    },
  ];

  return (
    <>
      {/* Selector de Cliente para usuarios globales */}
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
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              minWidth: { xs: "auto", sm: 160 },
              fontSize: { xs: "0.85rem", sm: "0.9rem" },
            }}
          >
            Conjunto / Cliente Activo:
          </Typography>
          <FormControl size="small" sx={{ width: { xs: "100%", sm: 280 } }}>
            <Select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              displayEmpty
            >
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.internalCode || c.nit})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      <DataTable
        title="Control de Visitantes e Ingresos"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Visitantes" }]}
        onCreate={canCreate ? handleOpenCreate : undefined}
        onEdit={canEdit ? (id) => handleEdit(id) : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onView={handleViewDetail}
        refreshTrigger={refreshTrigger}
        infoDescription="Control de accesos y permanencia de visitantes en el conjunto residencial o sede corporativa."
        infoInstructions={`1. Registra el visitante vinculando obligatoriamente la Unidad y el Residente que autoriza su entrada.
2. Cuando el visitante se retire del predio, pulsa el botón 'Marcar Salida' en su fila correspondiente para cerrar el ciclo.`}
      />

      {/* Modal Detalle de Visitante */}
      <DetailDialog
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title="Detalles del Ingreso de Visitante"
        headerContent={
          detailImageUrl && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <Box
                component="img"
                src={detailImageUrl}
                alt="Foto Visitante"
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
                { label: "Hora Ingreso", value: formatTime(detailRecord.entryTime || detailRecord.time) },
                {
                  label: "Hora Salida",
                  value: detailRecord.exitTime ? formatTime(detailRecord.exitTime) : (
                    <Chip size="small" label="Dentro del predio" color="warning" />
                  ),
                },
                { label: "Visitante", value: detailRecord.visitorFullName },
                {
                  label: "Documento",
                  value: `${detailRecord.visitorIdType || "CC"}: ${detailRecord.visitorIdNumber}`,
                },
                { label: "N° Personas", value: detailRecord.peopleCount || 1 },
                {
                  label: "Tipo Acceso",
                  value: (
                    <Chip
                      size="small"
                      label={detailRecord.mode === "VEHICLE" || detailRecord.plate ? `Vehicular (${detailRecord.plate || "Sin Placa"})` : "Peatonal"}
                      color={detailRecord.mode === "VEHICLE" || detailRecord.plate ? "secondary" : "default"}
                    />
                  ),
                },
                { label: "Ficha / Ticket", value: detailRecord.ticketNumber || "N/A" },
                {
                  label: "Unidad / Destino",
                  value: detailRecord.unitName || detailRecord.destinationApartment || "N/A",
                },
                {
                  label: "Residente Anfitrión",
                  value: detailRecord.residentName || detailRecord.hostName || "N/A",
                },
                { label: "Autorizado Por", value: detailRecord.authorizedByFullName || "N/A" },
                { label: "Marca / Color Vehículo", value: detailRecord.brand ? `${detailRecord.brand}` : "N/A" },
                { label: "Creado Por", value: detailRecord.createdBy || "Sistema" },
                {
                  label: "Fecha Creación",
                  value: formatDateTime(detailRecord.createdAt || detailRecord.date),
                },
                { label: "Observaciones", value: detailRecord.observations || "Sin observaciones" },
              ]
            : []
        }
      />

      {/* Modal de Registro / Edición de Visitante */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            {isEditing ? "Actualizar Registro de Visitante" : "Nuevo Ingreso de Visitante"}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2}>
              {/* Sección 1: Vinculación a Unidad y Residente */}
              <Grid size={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <HomeWorkIcon sx={{ fontSize: 18 }} /> 1. Destino Residencial y Residente
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="unit-select-label">Apartamento / Unidad Residencial</InputLabel>
                  <Select
                    labelId="unit-select-label"
                    label="Apartamento / Unidad Residencial"
                    value={formData.unitId}
                    onChange={(e) => handleSelectUnit(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Seleccionar Unidad --</em>
                    </MenuItem>
                    {units.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.unitName} {u.tower?.towerName ? `(Torre ${u.tower.towerName})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="resident-select-label">Residente que Autoriza / Visita</InputLabel>
                  <Select
                    labelId="resident-select-label"
                    label="Residente que Autoriza / Visita"
                    value={formData.residentId}
                    onChange={(e) => handleSelectResident(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Seleccionar Residente --</em>
                    </MenuItem>
                    {availableResidents.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} {r.unit?.unitName ? `[${r.unit.unitName}]` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Destino Manual / Apto (Snapshot)"
                  value={formData.destinationApartment}
                  onChange={(e) => setFormData({ ...formData, destinationApartment: e.target.value })}
                  placeholder="Ej: Apto 304, Torre A"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombre de quien autoriza (Manual)"
                  value={formData.hostName}
                  onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </Grid>

              {/* Sección 2: Datos del Visitante */}
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <PersonIcon sx={{ fontSize: 18 }} /> 2. Datos del Visitante
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Nombre Completo del Visitante"
                  value={formData.visitorFullName}
                  onChange={(e) => setFormData({ ...formData, visitorFullName: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="id-type-label">Tipo Doc.</InputLabel>
                  <Select
                    labelId="id-type-label"
                    label="Tipo Doc."
                    value={formData.visitorIdType}
                    onChange={(e) => setFormData({ ...formData, visitorIdType: e.target.value })}
                  >
                    <MenuItem value="CC">Cédula Ciudadanía (CC)</MenuItem>
                    <MenuItem value="CE">Cédula Extranjería (CE)</MenuItem>
                    <MenuItem value="PASSPORT">Pasaporte</MenuItem>
                    <MenuItem value="TI">Tarjeta Identidad</MenuItem>
                    <MenuItem value="OTHER">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Número de Documento"
                  value={formData.visitorIdNumber}
                  onChange={(e) => setFormData({ ...formData, visitorIdNumber: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Cant. Personas"
                  value={formData.peopleCount}
                  onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="N° Ficha / Gafete"
                  value={formData.ticketNumber}
                  onChange={(e) => setFormData({ ...formData, ticketNumber: e.target.value })}
                  placeholder="Ej: F-12"
                />
              </Grid>

              {/* Sección 3: Fechas y Horas */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="Hora Ingreso"
                  value={formData.entryTime}
                  onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="mode-select-label">Modalidad de Ingreso</InputLabel>
                  <Select
                    labelId="mode-select-label"
                    label="Modalidad de Ingreso"
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  >
                    <MenuItem value="PEDESTRIAN">Peatonal</MenuItem>
                    <MenuItem value="VEHICLE">Vehicular</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.mode === "VEHICLE" && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Marca / Modelo del Vehículo"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ej: Renault Duster"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Placa del Vehículo"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      placeholder="Ej: ABC-123"
                    />
                  </Grid>
                </>
              )}

              {isEditing && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    label="Hora Salida (Opcional)"
                    value={formData.exitTime}
                    onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}

              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Observaciones"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Detalles sobre el ingreso o pertenencias..."
                />
              </Grid>

              {/* Sección 4: Evidencia Fotográfica (S3) */}
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <CameraIcon sx={{ fontSize: 18 }} /> 4. Evidencia Fotográfica (AWS S3)
                </Typography>
                <ImageUploadCapture
                  label="Fotografía del Visitante / Documento / Vehículo"
                  variant="evidence"
                  value={evidenceFile}
                  previewUrl={existingMediaUrl}
                  onChange={setEvidenceFile}
                  helperText="Toma una foto en vivo con la cámara o selecciona una imagen de tu dispositivo."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, flexDirection: { xs: "column-reverse", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={submitting} sx={{ width: { xs: "100%", sm: "auto" } }}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}>
              {submitting ? "Guardando..." : isEditing ? "Actualizar Registro" : "Registrar Ingreso"}
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
        <DialogContent sx={{ p: 1, bgcolor: "black", textAlign: "center", minWidth: { xs: 260, sm: 320 }, minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {previewLoading ? (
            <CircularProgress color="primary" />
          ) : (
            previewModalUrl && (
              <Box
                component="img"
                src={previewModalUrl}
                alt="Foto Visitante"
                sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 1 }}
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
