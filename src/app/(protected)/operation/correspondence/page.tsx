"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  LocalShipping as LocalShippingIcon,
  HomeWork as HomeWorkIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  CameraAlt as CameraIcon,
  UploadFile as UploadIcon,
  DeleteOutline as DeleteOutlineIcon,
  CloudDone as CloudDoneIcon,
  Visibility as VisibilityIcon,
  Inventory as PackageIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { formatDate, formatTime } from "@/lib/formatters";

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

  // Modal de Entrega con Evidencia Fotográfica (Mockup S3)
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedRecordForDelivery, setSelectedRecordForDelivery] = useState<any>(null);
  const [deliveredToName, setDeliveredToName] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);

  // Modal de Vista Previa de Evidencia
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFormData({
      date: now.toISOString().split("T")[0],
      time: currentTime + ":00",
      receivedTime: currentTime + ":00",
      destination: "",
      unitId: "",
      recipientResidentId: "",
      sender: "",
      courierCompany: "",
      trackingNumber: "",
      receivedByName: session?.user?.fullName || "Portería Principal",
      correspondenceType: "BOX",
      observations: "",
    });
    setIsEditing(false);
    setEditId(null);
    setDialogOpen(true);
  };

  // Handler: Editar paquete
  const handleEdit = async (id: string) => {
    try {
      const data = await HttpClient.get<any>(`/operation/minuta/correspondence/${id}`);
      setEditId(id);
      setIsEditing(true);
      setFormData({
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
        time: data.time ? formatTime(data.time) : "",
        receivedTime: data.receivedTime ? formatTime(data.receivedTime) : "",
        destination: data.destination || "",
        unitId: data.unitId || "",
        recipientResidentId: data.recipientResidentId || "",
        sender: data.sender || "",
        courierCompany: data.courierCompany || "",
        trackingNumber: data.trackingNumber || "",
        receivedByName: data.receivedByName || "",
        correspondenceType: data.correspondenceType || "BOX",
        observations: data.observations || "",
      });
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

  // Handler: Guardar paquete en recepción
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destination.trim()) {
      showError("El destino o unidad es requerido");
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

      if (isEditing && editId) {
        await HttpClient.patch(`/operation/minuta/correspondence/${editId}`, payload);
        showSuccess("Correspondencia actualizada exitosamente");
      } else {
        await HttpClient.post("/operation/minuta/correspondence", payload);
        showSuccess("Correspondencia/domicilio registrado en portería");
      }

      setDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al registrar la correspondencia");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Abrir Modal de Entrega con Evidencia Mockup
  const handleOpenDelivery = (row: any) => {
    setSelectedRecordForDelivery(row);
    setDeliveredToName(
      row.recipientResidentName ||
        (row.recipientResident ? `${row.recipientResident.firstName} ${row.recipientResident.lastName}` : "")
    );
    setDeliveryNotes("");
    setEvidencePhoto(null);
    setDeliveryDialogOpen(true);
  };

  // Handler: Simulación de Captura Fotográfica para S3 Mockup
  const handleSimulateCapture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Fondo degradado tecnológico
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Marco de visor
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 580, 420);

      // Textos de watermark
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("NOXIA SECURITY - COMPROBANTE DE ENTREGA", 50, 70);

      ctx.fillStyle = "#ffffff";
      ctx.font = "18px sans-serif";
      ctx.fillText(`Destino: ${selectedRecordForDelivery?.unitName || selectedRecordForDelivery?.destination || "Unidad"}`, 50, 130);
      ctx.fillText(`Guía: ${selectedRecordForDelivery?.trackingNumber || "Sin Guía"}`, 50, 170);
      ctx.fillText(`Empresa: ${selectedRecordForDelivery?.courierCompany || "Mensajería Directa"}`, 50, 210);
      ctx.fillText(`Receptor: ${deliveredToName || "Titular"}`, 50, 250);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "15px sans-serif";
      ctx.fillText(`Fecha y Hora: ${new Date().toLocaleString()}`, 50, 310);
      ctx.fillText("Estado: EVIDENCIA VALIDADA PARA AMAZON S3", 50, 350);

      // Sello Mockup
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(520, 380, 45, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ENTREGADO", 520, 375);
      ctx.fillText("S3 MOCK", 520, 395);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setEvidencePhoto(dataUrl);
      showSuccess("Fotografía simulada de entrega generada (Mockup S3)");
    }
  };

  // Handler: Subida de imagen real desde archivo o cámara
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEvidencePhoto(event.target?.result as string);
        showSuccess("Fotografía cargada como evidencia de entrega");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler: Confirmar Entrega
  const handleConfirmDelivery = async () => {
    if (!deliveredToName.trim()) {
      showError("Debes especificar el nombre de la persona que reclama el paquete");
      return;
    }

    setDelivering(true);
    try {
      const payload = {
        deliveredToName: deliveredToName.trim(),
        deliveryEvidenceUrl:
          evidencePhoto ||
          `https://s3.amazonaws.com/noxia-evidence/correspondence/${selectedRecordForDelivery.id}_mock.jpg`,
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

  // Handler: Eliminar
  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/correspondence/${id}`);
      showSuccess("Registro de correspondencia eliminado");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      showError(err.message || "Error al eliminar");
    }
  };

  // Filtrar residentes según la unidad seleccionada
  const availableResidents = formData.unitId
    ? residents.filter((r) => r.unitId === formData.unitId)
    : residents;

  const endpoint = activeClientId
    ? `/operation/minuta/correspondence?clientId=${activeClientId}`
    : "/operation/minuta/correspondence";

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 80 },
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
      width: 160,
      renderCell: (params) => {
        const dest =
          params.row.unitName ||
          params.row.unit?.unitName ||
          params.row.destination ||
          "—";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <HomeWorkIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {dest}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "recipientResidentName",
      headerName: "Destinatario",
      width: 180,
      renderCell: (params) => {
        const res =
          params.row.recipientResidentName ||
          (params.row.recipientResident
            ? `${params.row.recipientResident.firstName} ${params.row.recipientResident.lastName}`
            : "—");
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <PersonIcon sx={{ fontSize: 17, color: "text.secondary" }} />
            <Typography variant="body2">{res}</Typography>
          </Box>
        );
      },
    },
    {
      field: "courierCompany",
      headerName: "Mensajería",
      width: 140,
      renderCell: (params) => params.value || "Entrega Directa",
    },
    {
      field: "trackingNumber",
      headerName: "N° Guía",
      width: 130,
      renderCell: (params) =>
        params.value ? (
          <Chip
            size="small"
            icon={<PackageIcon sx={{ fontSize: 14 }} />}
            label={params.value}
            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
          />
        ) : (
          "—"
        ),
    },
    {
      field: "deliveryAction",
      headerName: "Estado / Entrega",
      width: 190,
      sortable: false,
      renderCell: (params) => {
        const isDelivered = params.row.status === "DELIVERED";
        if (isDelivered) {
          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip
                size="small"
                icon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                label={`Entregado: ${params.row.deliveredToName || "Residente"}`}
                color="success"
                sx={{ fontWeight: 600, fontSize: "0.73rem" }}
              />
              {params.row.deliveryEvidenceUrl && (
                <Tooltip title="Ver evidencia fotográfica">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setPreviewPhotoUrl(params.row.deliveryEvidenceUrl)}
                  >
                    <VisibilityIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        }
        return (
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
        );
      },
    },
    {
      field: "createdBy",
      headerName: "Portero",
      width: 140,
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
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 160 }}>
            Conjunto / Cliente Activo:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 280 }}>
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
        refreshTrigger={refreshTrigger}
        infoDescription="Recepción de correspondencia, encomiendas y paquetes en portería para su posterior entrega a los residentes."
        infoInstructions={`1. Registra cada paquete o domicilio recibido vinculando la Unidad (apartamento) y destinatario.
2. Al momento de entregar el paquete al residente en portería, pulsa 'Entregar al Residente', toma la fotografía de evidencia (Mockup S3) y confirma la entrega.`}
      />

      {/* Modal de Registro de Correspondencia */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
            {isEditing ? "Editar Correspondencia" : "Recepción de Paquete / Domicilio"}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* Sección Destino */}
              <Grid size={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <HomeWorkIcon sx={{ fontSize: 18 }} /> 1. Unidad Habitacional y Destinatario
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="corr-unit-label">Apartamento / Unidad</InputLabel>
                  <Select
                    labelId="corr-unit-label"
                    label="Apartamento / Unidad"
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
                  <InputLabel id="corr-resident-label">Residente Destinatario</InputLabel>
                  <Select
                    labelId="corr-resident-label"
                    label="Residente Destinatario"
                    value={formData.recipientResidentId}
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

              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Destino (Texto Libre / Snapshot)"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Ej: Torre 2 - Apartamento 401"
                />
              </Grid>

              {/* Sección Paquetería */}
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <PackageIcon sx={{ fontSize: 18 }} /> 2. Información del Paquete / Mensajería
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Empresa de Mensajería / Domicilio"
                  value={formData.courierCompany}
                  onChange={(e) => setFormData({ ...formData, courierCompany: e.target.value })}
                  placeholder="Ej: Servientrega, Coordinadora, Rappi, Amazon"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Número de Guía / Tracking"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  placeholder="Ej: TRK-98765432"
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
                    <MenuItem value="BOX">Paquete / Encomienda</MenuItem>
                    <MenuItem value="ENVELOPE">Sobre / Carta / Factura</MenuItem>
                    <MenuItem value="OTHER">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Remitente"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  placeholder="Ej: MercadoLibre, Banco de Bogotá"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Fecha Recepción"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="Hora Recepción"
                  value={formData.receivedTime}
                  onChange={(e) => setFormData({ ...formData, receivedTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
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
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ fontWeight: 600 }}>
              {submitting ? "Guardando..." : isEditing ? "Actualizar" : "Registrar en Portería"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal de Entrega al Residente con Evidencia Fotográfica (Mockup S3) */}
      <Dialog
        open={deliveryDialogOpen}
        onClose={() => !delivering && setDeliveryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <LocalShippingIcon color="primary" /> Entrega de Paquete al Residente
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
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

            {/* Módulo de Evidencia Fotográfica (Mockup S3) */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                <CameraIcon sx={{ fontSize: 18, color: "primary.main" }} /> Evidencia Fotográfica de Entrega (Mockup S3)
              </Typography>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              {evidencePhoto ? (
                <Box
                  sx={{
                    border: "2px solid",
                    borderColor: "success.main",
                    borderRadius: 2,
                    p: 1,
                    textAlign: "center",
                    bgcolor: "background.paper",
                  }}
                >
                  <Box
                    component="img"
                    src={evidencePhoto}
                    alt="Evidencia de entrega"
                    sx={{
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "contain",
                      borderRadius: 1.5,
                    }}
                  />
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      icon={<CloudDoneIcon sx={{ fontSize: 15 }} />}
                      label="Evidencia Lista para Amazon S3 (Mockup)"
                      color="success"
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlineIcon sx={{ fontSize: 15 }} />}
                      onClick={() => setEvidencePhoto(null)}
                      sx={{ textTransform: "none", fontSize: "0.75rem" }}
                    >
                      Quitar
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box
                  sx={{
                    border: "2px dashed",
                    borderColor: "primary.light",
                    borderRadius: 2,
                    p: 2.5,
                    textAlign: "center",
                    bgcolor: "action.hover",
                  }}
                >
                  <CameraIcon sx={{ fontSize: 38, color: "primary.main", mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Captura la foto de recepción como soporte
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    Esta evidencia se almacenará en Amazon S3 para auditoría y respaldo de la entrega.
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ textTransform: "none", fontSize: "0.75rem" }}
                    >
                      Subir / Cámara
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<CameraIcon sx={{ fontSize: 16 }} />}
                      onClick={handleSimulateCapture}
                      sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      Simular Foto Rápida (Mockup S3)
                    </Button>
                  </Stack>
                </Box>
              )}
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
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeliveryDialogOpen(false)} color="inherit" disabled={delivering}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelivery}
            variant="contained"
            color="success"
            disabled={delivering || !deliveredToName.trim()}
            startIcon={<CheckCircleIcon />}
            sx={{ fontWeight: 600 }}
          >
            {delivering ? "Procesando Entrega..." : "Confirmar y Entregar Paquete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Previsualización de Foto Guardada */}
      <Dialog
        open={Boolean(previewPhotoUrl)}
        onClose={() => setPreviewPhotoUrl(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          Soporte Fotográfico de Entrega
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, textAlign: "center" }}>
          {previewPhotoUrl && (
            <Box
              component="img"
              src={previewPhotoUrl}
              alt="Evidencia"
              sx={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 1.5 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewPhotoUrl(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
