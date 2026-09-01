"use client";

import { useState, useEffect, useCallback } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import DetailDialog from "@/components/common/DetailDialog";
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
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  CameraAlt as CameraIcon,
  Inventory as PackageIcon,
} from "@mui/icons-material";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
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

export default function CorrespondencePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Form de Nuevo Registro
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    receivedTime: "",
    destination: "",
    unitId: "",
    recipientResidentId: "",
    sender: "",
    courierCompany: "",
    trackingNumber: "",
    receivedByName: "",
    correspondenceType: "PACKAGE",
    observations: "",
  });

  // Modal de Entrega con Evidencias Fotográficas
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedRecordForDelivery, setSelectedRecordForDelivery] = useState<any>(null);
  const [deliveredToName, setDeliveredToName] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [receptionPhotoUrlForDelivery, setReceptionPhotoUrlForDelivery] = useState<string | null>(null);
  const [evidenceDeliveryFile, setEvidenceDeliveryFile] = useState<File | null>(null);
  const [existingDeliveryMediaUrl, setExistingDeliveryMediaUrl] = useState<string | null>(null);
  const [evidenceReceptionFile, setEvidenceReceptionFile] = useState<File | null>(null);
  const [existingReceptionMediaUrl, setExistingReceptionMediaUrl] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);

  // Modal de Detalle
  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [detailPhotos, setDetailPhotos] = useState<{ receptionUrl?: string | null; deliveryUrl?: string | null }>({});

  // Modal de Vista Previa de Evidencia
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState<{ receptionUrl?: string | null; deliveryUrl?: string | null }>({});
  const [previewTab, setPreviewTab] = useState<number>(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showError, showSuccess } = useNotification();
  const { session } = useAuth();

  const isGlobalUser = !session?.user?.clientId;
  const activeClientId = session?.user?.clientId || selectedClientId;

  // 1. Cargar clientes para usuarios globales
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

  // 2. Cargar unidades y residentes cuando cambia el cliente activo
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
      // Manejar error silenciosamente
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

  // Handler: Abrir modal de recepción de paquete
  const handleOpenCreate = () => {
    const now = new Date();
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);
    setEvidenceReceptionFile(null);
    setExistingReceptionMediaUrl(null);
    setIsEditing(false);
    setEditId(null);
    setFormData({
      date: now.toISOString().split("T")[0],
      time: currentTime,
      receivedTime: currentTime,
      destination: "",
      unitId: "",
      recipientResidentId: "",
      sender: "",
      courierCompany: "",
      trackingNumber: "",
      receivedByName: session?.user?.fullName || "",
      correspondenceType: "PACKAGE",
      observations: "",
    });
    setDialogOpen(true);
  };

  // Handler: Editar paquete
  const handleEdit = async (id: string) => {
    try {
      setEvidenceReceptionFile(null);
      setExistingReceptionMediaUrl(null);
      const data = await HttpClient.get<any>(`/operation/minuta/correspondence/${id}`);
      setEditId(id);
      setIsEditing(true);
      setFormData({
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
        time: data.time ? formatTimeToHHmm(data.time) : "",
        receivedTime: data.receivedTime ? formatTimeToHHmm(data.receivedTime) : (data.time ? formatTimeToHHmm(data.time) : ""),
        destination: data.destination || "",
        unitId: data.unitId || "",
        recipientResidentId: data.recipientResidentId || "",
        sender: data.sender || "",
        courierCompany: data.courierCompany || "",
        trackingNumber: data.trackingNumber || "",
        receivedByName: data.receivedByName || "",
        correspondenceType: data.correspondenceType || "PACKAGE",
        observations: data.observations || "",
      });

      // Cargar adjuntos de recepción existentes
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.CORRESPONDENCE, id);
      if (mediaList && mediaList.length > 0) {
        const reception = mediaList.find((m: any) => m.s3Key?.includes("reception")) || mediaList[0];
        setExistingReceptionMediaUrl(reception.presignedUrl || null);
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar la información del paquete");
    }
  };

  // Handler: Selección de Unidad
  const handleSelectUnit = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    setFormData((prev) => ({
      ...prev,
      unitId,
      destination: unit ? unit.unitName : prev.destination,
      recipientResidentId: "",
    }));
  };

  // Handler: Selección de Residente
  const handleSelectResident = (residentId: string) => {
    const resident = residents.find((r) => r.id === residentId);
    setFormData((prev) => ({
      ...prev,
      recipientResidentId: residentId,
      unitId: resident?.unitId || prev.unitId,
      destination: resident?.unit?.unitName || prev.destination,
    }));
  };

  // Handler: Guardar Recepción
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destination.trim()) {
      showError("Debes especificar el destino (Unidad o Apartamento)");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const payload: any = {
        date: formData.date || now.toISOString().split("T")[0],
        time: formData.time.length === 5 ? `${formData.time}:00` : formData.time,
        occurredAt: `${formData.date || now.toISOString().split("T")[0]}T${formData.time.length === 5 ? `${formData.time}:00` : formData.time}Z`,
        receivedTime: formData.receivedTime.length === 5 ? `${formData.receivedTime}:00` : formData.receivedTime,
        destination: formData.destination.trim(),
        sender: formData.sender?.trim() || null,
        courierCompany: formData.courierCompany?.trim() || null,
        trackingNumber: formData.trackingNumber?.trim() || null,
        receivedByName: formData.receivedByName?.trim() || null,
        correspondenceType: formData.correspondenceType,
        observations: formData.observations?.trim() || null,
        clientId: activeClientId || null,
        unitId: formData.unitId || null,
        recipientResidentId: formData.recipientResidentId || null,
      };

      let savedRecord: any;
      if (isEditing && editId) {
        savedRecord = await HttpClient.patch(`/operation/minuta/correspondence/${editId}`, payload);
        showSuccess("Correspondencia actualizada exitosamente");
      } else {
        savedRecord = await HttpClient.post("/operation/minuta/correspondence", payload);
        showSuccess("Correspondencia/domicilio registrado en portería");
      }

      const entityId = editId || savedRecord?.id;
      if (evidenceReceptionFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: evidenceReceptionFile,
            entityType: MediaTypeCategory.CORRESPONDENCE,
            entityId,
            clientId: activeClientId || null,
            subType: "reception",
          });
          showSuccess("Foto del paquete en recepción guardada");
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
        }
      }

      setDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la correspondencia");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Abrir Modal de Entrega
  const handleOpenDelivery = async (row: any) => {
    setSelectedRecordForDelivery(row);
    setDeliveredToName(
      row.recipientResidentName ||
        (row.recipientResident ? `${row.recipientResident.firstName} ${row.recipientResident.lastName}` : "")
    );
    setDeliveryNotes("");
    setEvidenceDeliveryFile(null);
    setExistingDeliveryMediaUrl(null);
    setReceptionPhotoUrlForDelivery(null);

    // Cargar fotos asociadas al paquete
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.CORRESPONDENCE, row.id);
      if (mediaList && mediaList.length > 0) {
        const reception = mediaList.find((m: any) => m.s3Key?.includes("reception")) || mediaList[0];
        const delivery = mediaList.find((m: any) => m.s3Key?.includes("delivery"));
        if (reception) setReceptionPhotoUrlForDelivery(reception.presignedUrl || null);
        if (delivery) setExistingDeliveryMediaUrl(delivery.presignedUrl || null);
      } else if (row.deliveryEvidenceUrl && row.deliveryEvidenceUrl.startsWith("http")) {
        setExistingDeliveryMediaUrl(row.deliveryEvidenceUrl);
      }
    } catch {}

    setDeliveryDialogOpen(true);
  };

  // Handler: Confirmar Entrega
  const handleConfirmDelivery = async () => {
    if (!deliveredToName.trim()) {
      showError("Debes especificar el nombre de la persona que reclama el paquete");
      return;
    }

    setDelivering(true);
    try {
      let uploadedUrl: string | undefined = undefined;

      // 1. Subir fotografía de entrega si se adjuntó
      if (evidenceDeliveryFile) {
        try {
          const media = await StorageApi.uploadMedia({
            file: evidenceDeliveryFile,
            entityType: MediaTypeCategory.CORRESPONDENCE,
            entityId: selectedRecordForDelivery.id,
            clientId: activeClientId || null,
            subType: "delivery",
          });
          uploadedUrl = media.url;
        } catch (s3Err) {
          console.error("Error subiendo foto de entrega:", s3Err);
        }
      }

      const payload = {
        deliveredToName: deliveredToName.trim(),
        deliveryEvidenceUrl: uploadedUrl || selectedRecordForDelivery.deliveryEvidenceUrl || null,
        deliveryNotes: deliveryNotes.trim() || null,
      };

      await HttpClient.patch(
        `/operation/minuta/correspondence/${selectedRecordForDelivery.id}/deliver`,
        payload
      );

      showSuccess("¡Paquete entregado al residente exitosamente!");
      setDeliveryDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la entrega");
    } finally {
      setDelivering(false);
    }
  };

  // Handler: Ver detalle completo del registro
  const handleViewDetail = async (row: any) => {
    setDetailRecord(row);
    setDetailPhotos({});
    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.CORRESPONDENCE, row.id);
      if (mediaList && mediaList.length > 0) {
        const reception = mediaList.find((m: any) => m.s3Key?.includes("reception")) || mediaList[0];
        const delivery = mediaList.find((m: any) => m.s3Key?.includes("delivery"));
        setDetailPhotos({
          receptionUrl: reception?.presignedUrl || null,
          deliveryUrl: delivery?.presignedUrl || row.deliveryEvidenceUrl || null,
        });
      } else if (row.deliveryEvidenceUrl) {
        setDetailPhotos({
          receptionUrl: null,
          deliveryUrl: row.deliveryEvidenceUrl,
        });
      }
    } catch {}
  };

  // Handler: Ver evidencia fotográfica modal
  const handleViewEvidence = async (row: any) => {
    setPreviewLoading(true);
    setPreviewPhotos({});
    setPreviewTab(0);
    setPreviewModalOpen(true);

    try {
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.CORRESPONDENCE, row.id);
      if (mediaList && mediaList.length > 0) {
        const reception = mediaList.find((m: any) => m.s3Key?.includes("reception")) || mediaList[0];
        const delivery = mediaList.find((m: any) => m.s3Key?.includes("delivery"));
        setPreviewPhotos({
          receptionUrl: reception?.presignedUrl || null,
          deliveryUrl: delivery?.presignedUrl || row.deliveryEvidenceUrl || null,
        });
        if (!reception && delivery) setPreviewTab(1);
      } else if (row.deliveryEvidenceUrl) {
        setPreviewPhotos({
          receptionUrl: null,
          deliveryUrl: row.deliveryEvidenceUrl,
        });
        setPreviewTab(1);
      } else {
        showError("No hay fotografías asociadas a este paquete");
      }
    } catch {
      showError("Error al obtener la evidencia fotográfica");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handler: Eliminar
  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/correspondence/${id}`);
      showSuccess("Registro de correspondencia eliminado");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al eliminar el registro");
    }
  };

  const endpoint = activeClientId
    ? `/operation/minuta/correspondence?clientId=${activeClientId}`
    : "/operation/minuta/correspondence";

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 60 },
    {
      field: "date",
      headerName: "Fecha",
      width: 105,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: "receivedTime",
      headerName: "Hora",
      width: 85,
      valueFormatter: (value: any) => formatTime(value),
    },
    {
      field: "destination",
      headerName: "Unidad / Destino",
      width: 150,
      renderCell: (params) => {
        const dest =
          params.row.unitName ||
          params.row.unit?.unitName ||
          params.row.destination ||
          "—";
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 0.8 }}>
            <HomeWorkIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {dest}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "recipientResidentName",
      headerName: "Destinatario",
      width: 170,
      renderCell: (params) => {
        const res =
          params.row.recipientResidentName ||
          (params.row.recipientResident
            ? `${params.row.recipientResident.firstName} ${params.row.recipientResident.lastName}`
            : "—");
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
      field: "courierCompany",
      headerName: "Mensajería",
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
            {params.value || "Directa"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "trackingNumber",
      headerName: "N° Guía",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          {params.value ? (
            <Chip
              size="small"
              icon={<PackageIcon sx={{ fontSize: 14 }} />}
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
        const hasMedia =
          (params.row.mediaAttachments && params.row.mediaAttachments.length > 0) ||
          Boolean(params.row.deliveryEvidenceUrl);
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
      field: "deliveryAction",
      headerName: "Estado / Entrega",
      width: 190,
      sortable: false,
      renderCell: (params) => {
        const isDelivered = params.row.status === "DELIVERED";
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {isDelivered ? (
              <Chip
                size="small"
                icon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                label={`Entregado: ${params.row.deliveredToName || "Residente"}`}
                color="success"
                sx={{ fontWeight: 600, fontSize: "0.73rem" }}
              />
            ) : (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon sx={{ fontSize: 15 }} />}
                onClick={() => handleOpenDelivery(params.row)}
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
                Entregar al Residente
              </Button>
            )}
          </Box>
        );
      },
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
        title="Control de Correspondencia y Paquetería"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Correspondencia" }]}
        onCreate={canCreate ? handleOpenCreate : undefined}
        onEdit={canEdit ? (id) => handleEdit(id) : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onView={handleViewDetail}
        refreshTrigger={refreshTrigger}
        infoDescription="Control integral de paquetes, encomiendas y correspondencia recibida en portería y entregada a residentes."
        infoInstructions={`1. Registra el paquete asociándolo a una Unidad/Apartamento con fotografía en recepción.
2. Al entregar al residente, pulsa 'Entregar al Residente' para capturar la fotografía de entrega y registrar la firma de recepción.`}
      />

      {/* Modal Detalle de Correspondencia */}
      <DetailDialog
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title="Detalles del Paquete / Correspondencia"
        headerContent={
          (detailPhotos.receptionUrl || detailPhotos.deliveryUrl) && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {detailPhotos.receptionUrl && (
                <Grid size={detailPhotos.deliveryUrl ? 6 : 12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, textAlign: "center" }}>
                    Foto en Recepción
                  </Typography>
                  <Box
                    component="img"
                    src={detailPhotos.receptionUrl}
                    alt="Foto Recepción"
                    sx={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "black" }}
                  />
                </Grid>
              )}
              {detailPhotos.deliveryUrl && (
                <Grid size={detailPhotos.receptionUrl ? 6 : 12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5, textAlign: "center" }}>
                    Foto en Entrega
                  </Typography>
                  <Box
                    component="img"
                    src={detailPhotos.deliveryUrl}
                    alt="Foto Entrega"
                    sx={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "black" }}
                  />
                </Grid>
              )}
            </Grid>
          )
        }
        fields={
          detailRecord
            ? [
                { label: "ID Registro", value: detailRecord.id },
                { label: "Fecha Recepción", value: formatDate(detailRecord.date) },
                { label: "Hora Recepción", value: formatTime(detailRecord.receivedTime || detailRecord.time) },
                {
                  label: "Destino (Unidad)",
                  value: detailRecord.unitName || detailRecord.destination || "N/A",
                },
                {
                  label: "Destinatario",
                  value: detailRecord.recipientResidentName || "Sin especificar",
                },
                { label: "Remitente", value: detailRecord.sender || "N/A" },
                { label: "Empresa de Mensajería", value: detailRecord.courierCompany || "Directa" },
                { label: "Número de Guía", value: detailRecord.trackingNumber || "Sin N°" },
                {
                  label: "Estado",
                  value: (
                    <Chip
                      size="small"
                      label={detailRecord.status === "DELIVERED" ? "Entregado" : "En Portería"}
                      color={detailRecord.status === "DELIVERED" ? "success" : "warning"}
                    />
                  ),
                },
                { label: "Reclamado / Recibido Por", value: detailRecord.deliveredToName || "Pendiente de entrega" },
                {
                  label: "Fecha de Entrega",
                  value: detailRecord.deliveredAt ? formatDateTime(detailRecord.deliveredAt) : "No entregado",
                },
                { label: "Recepcionado Por (Guardia)", value: detailRecord.receivedByName || detailRecord.createdBy || "Sistema" },
                { label: "Observaciones / Estado del Paquete", value: detailRecord.observations || "Sin observaciones" },
                { label: "Notas de Entrega", value: detailRecord.deliveryNotes || "Sin notas" },
              ]
            : []
        }
      />

      {/* Modal de Registro / Edición de Recepción de Paquete */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            {isEditing ? "Actualizar Paquete" : "Nuevo Ingreso de Paquete / Domicilio"}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha"
                  InputLabelProps={{ shrink: true }}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="Hora de Recepción"
                  InputLabelProps={{ shrink: true }}
                  value={formData.receivedTime || formData.time}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      time: e.target.value,
                      receivedTime: e.target.value,
                    })
                  }
                  required
                />
              </Grid>

              {/* Selector de Unidad */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel id="unit-select-label">Unidad / Apartamento</InputLabel>
                  <Select
                    labelId="unit-select-label"
                    label="Unidad / Apartamento"
                    value={formData.unitId}
                    onChange={(e) => handleSelectUnit(e.target.value)}
                  >
                    {units.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.unitName} {u.tower ? `(${u.tower.towerName})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Selector de Residente Destinatario */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="resident-select-label">Residente Destinatario</InputLabel>
                  <Select
                    labelId="resident-select-label"
                    label="Residente Destinatario"
                    value={formData.recipientResidentId}
                    onChange={(e) => handleSelectResident(e.target.value)}
                  >
                    <MenuItem value="">— Seleccionar (Opcional) —</MenuItem>
                    {residents
                      .filter((r) => !formData.unitId || r.unitId === formData.unitId)
                      .map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.firstName} {r.lastName}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Empresa de Mensajería (Servientrega, DHL, etc.)"
                  value={formData.courierCompany}
                  onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Número de Guía / Tracking"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remitente / Tienda (Ej: MercadoLibre, Amazon)"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="corr-type-label">Tipo de Correspondencia</InputLabel>
                  <Select
                    labelId="corr-type-label"
                    label="Tipo de Correspondencia"
                    value={formData.correspondenceType}
                    onChange={(e) => setFormData({ ...formData, correspondenceType: e.target.value })}
                  >
                    <MenuItem value="PACKAGE">Paquete / Caja</MenuItem>
                    <MenuItem value="LETTER">Sobre / Carta</MenuItem>
                    <MenuItem value="DOCUMENT">Documento</MenuItem>
                    <MenuItem value="FOOD_DELIVERY">Domicilio / Comida</MenuItem>
                    <MenuItem value="OTHER">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Observaciones / Estado del Paquete"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Ej: Caja cerrada, sin roturas evidentes..."
                />
              </Grid>

              {/* Fotografía de Recepción del Paquete */}
              <Grid size={12}>
                <ImageUploadCapture
                  label="Foto del Paquete en Recepción"
                  variant="evidence"
                  value={evidenceReceptionFile}
                  previewUrl={existingReceptionMediaUrl}
                  onChange={setEvidenceReceptionFile}
                  helperText="Toma una foto del paquete recibido para constatar su estado inicial en portería."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, flexDirection: { xs: "column-reverse", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={submitting} sx={{ width: { xs: "100%", sm: "auto" } }}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}>
              {submitting ? "Guardando..." : isEditing ? "Actualizar" : "Registrar en Portería"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal de Entrega al Residente con Doble Evidencia */}
      <Dialog
        open={deliveryDialogOpen}
        onClose={() => !delivering && setDeliveryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, fontSize: { xs: "1.05rem", sm: "1.25rem" }, display: "flex", alignItems: "center", gap: 1 }}>
          <LocalShippingIcon color="primary" /> Entrega de Paquete al Residente
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
          <Stack spacing={2.5}>
            {/* Card resumen del paquete */}
            <Card variant="outlined" sx={{ bgcolor: "action.hover", borderRadius: 2 }}>
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Destino:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedRecordForDelivery?.unitName || selectedRecordForDelivery?.destination || "—"}
                    </Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">
                      Mensajería / Guía:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedRecordForDelivery?.courierCompany || "Directo"} - {selectedRecordForDelivery?.trackingNumber || "Sin N°"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Preview de la Foto del Paquete en Recepción */}
            {receptionPhotoUrlForDelivery && (
              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5, bgcolor: "background.paper" }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 1 }}>
                  📦 Fotografía del Paquete al ser Recibido en Portería:
                </Typography>
                <Box
                  component="img"
                  src={receptionPhotoUrlForDelivery}
                  alt="Foto Recepción"
                  sx={{ width: "100%", maxHeight: 160, objectFit: "contain", borderRadius: 1.5, bgcolor: "black" }}
                />
              </Box>
            )}

            {/* Input persona que reclama */}
            <TextField
              fullWidth
              size="small"
              required
              label="Nombre de quien reclama el paquete"
              value={deliveredToName}
              onChange={(e) => setDeliveredToName(e.target.value)}
              helperText="Indica el nombre completo de la persona o residente que recibe"
            />

            {/* Input para la Segunda Fotografía: Foto del Residente Recibiendo */}
            <Box>
              <ImageUploadCapture
                label="Foto del Residente Recibiendo el Paquete"
                variant="evidence"
                value={evidenceDeliveryFile}
                previewUrl={existingDeliveryMediaUrl}
                onChange={setEvidenceDeliveryFile}
                helperText="Captura una foto de entrega en vivo o selecciona un archivo para soporte de entrega."
              />
            </Box>

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Notas adicionales de entrega (Opcional)"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Ej: Recibió en portería el residente titular..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, flexDirection: { xs: "column-reverse", sm: "row" }, gap: { xs: 1, sm: 0 } }}>
          <Button onClick={() => setDeliveryDialogOpen(false)} color="inherit" disabled={delivering} sx={{ width: { xs: "100%", sm: "auto" } }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelivery}
            variant="contained"
            color="success"
            disabled={delivering || !deliveredToName.trim()}
            startIcon={<CheckCircleIcon />}
            sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}
          >
            {delivering ? "Procesando Entrega..." : "Confirmar y Entregar Paquete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Previsualización de Evidencia */}
      <Dialog
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
      >
        <DialogTitle sx={{ pb: 0, fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
          Soporte Fotográfico de Correspondencia
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2 } }}>
          {previewLoading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Box>
              <Tabs
                value={previewTab}
                onChange={(_, val) => setPreviewTab(val)}
                sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
              >
                <Tab label="Foto en Recepción" disabled={!previewPhotos.receptionUrl} />
                <Tab label="Foto en Entrega" disabled={!previewPhotos.deliveryUrl} />
              </Tabs>

              {previewTab === 0 && previewPhotos.receptionUrl && (
                <Box sx={{ bgcolor: "black", textAlign: "center", borderRadius: 2, p: 1 }}>
                  <Box
                    component="img"
                    src={previewPhotos.receptionUrl}
                    alt="Foto Recepción"
                    sx={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: 1 }}
                  />
                </Box>
              )}

              {previewTab === 1 && previewPhotos.deliveryUrl && (
                <Box sx={{ bgcolor: "black", textAlign: "center", borderRadius: 2, p: 1 }}>
                  <Box
                    component="img"
                    src={previewPhotos.deliveryUrl}
                    alt="Foto Entrega"
                    sx={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: 1 }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={() => setPreviewModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
