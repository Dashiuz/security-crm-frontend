"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import DataTable from "@/components/common/DataTable";
import FormDialog, { FormField } from "@/components/common/FormDialog";
import DetailDialog from "@/components/common/DetailDialog";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";
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
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  CameraAlt as CameraIcon,
} from "@mui/icons-material";
import { z } from "zod";
import { HttpClient } from "@/lib/api/client";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { formatDate, formatTime, formatDateTime, formatTimeToHHmm } from "@/lib/formatters";

const schema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().min(1, "La hora es requerida"),
  occurredAt: z.string().min(1, "La fecha/hora es requerida"),
  entryTime: z.string().min(1, "La hora de entrada es requerida"),
  parkingNumber: z.string().min(1, "El número de parqueadero es requerido"),
  plate: z.string().min(1, "La placa es requerida"),
  brand: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional().default("GOOD"),
  observations: z.string().optional(),
});

type ParkingForm = z.infer<typeof schema>;

const fields: FormField<ParkingForm>[] = [
  { name: "date", label: "Fecha", type: "date", required: true },
  { name: "time", label: "Hora", type: "time", required: true },
  { name: "occurredAt", label: "Ocurrido En", hidden: true },
  { name: "entryTime", label: "Hora Entrada", type: "time", required: true },
  { name: "parkingNumber", label: "N° Parqueadero", required: true },
  { name: "plate", label: "Placa Vehículo", required: true },
  { name: "brand", label: "Marca" },
  { name: "color", label: "Color" },
  {
    name: "condition",
    label: "Estado",
    type: "select",
    options: [
      { value: "GOOD", label: "Bueno" },
      { value: "BAD", label: "Malo" },
    ],
  },
  { name: "observations", label: "Observaciones" },
];

export default function ParkingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<ParkingForm | undefined>();
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [detailRecord, setDetailRecord] = useState<any | null>(null);
  const [detailImageUrl, setDetailImageUrl] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { showError, showSuccess } = useNotification();
  const { session } = useAuth();

  const isGlobalUser = !session?.user?.clientId;

  useEffect(() => {
    if (isGlobalUser) {
      HttpClient.get<any[]>("/client")
        .then((data) => setClients(data || []))
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
    setSelectedId(null);
    setEvidenceFile(null);
    setExistingMediaUrl(null);
    const now = new Date();
    setDefaultValues({
      date: now.toISOString().split("T")[0],
      time: formatTimeToHHmm(now),
      occurredAt: now.toISOString(),
      entryTime: formatTimeToHHmm(now),
      parkingNumber: "",
      plate: "",
      brand: "",
      color: "",
      condition: "GOOD",
      observations: "",
    } as any);
    setDialogOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      setEvidenceFile(null);
      setExistingMediaUrl(null);
      const data = await HttpClient.get<any>(`/operation/minuta/parking/${id}`);
      setSelectedId(id);
      setDefaultValues({
        ...data,
        date: data.date ? data.date.split("T")[0] : "",
        time: data.time ? formatTimeToHHmm(data.time) : "",
        entryTime: data.entryTime ? formatTimeToHHmm(data.entryTime) : (data.time ? formatTimeToHHmm(data.time) : ""),
        occurredAt: data.occurredAt || data.date || new Date().toISOString(),
      });

      // Load existing attachments
      const mediaList = await StorageApi.getByEntity(MediaTypeCategory.PARKING, id);
      if (mediaList && mediaList.length > 0) {
        setExistingMediaUrl(mediaList[0].presignedUrl || null);
      }

      setDialogOpen(true);
    } catch {
      showError("Error al cargar el registro de parqueadero");
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
        const mediaList = await StorageApi.getByEntity(MediaTypeCategory.PARKING, row.id);
        if (mediaList.length > 0 && mediaList[0].presignedUrl) {
          setDetailImageUrl(mediaList[0].presignedUrl);
        }
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await HttpClient.delete(`/operation/minuta/parking/${id}`);
      showSuccess("Registro eliminado");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      showError(error.message || "Error al eliminar el registro de parqueadero");
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
        const mediaList = await StorageApi.getByEntity(MediaTypeCategory.PARKING, row.id);
        if (mediaList.length > 0 && mediaList[0].presignedUrl) {
          setPreviewModalUrl(mediaList[0].presignedUrl);
        } else {
          showError("No hay fotografía del vehículo asociada");
        }
      }
    } catch {
      showError("Error al obtener la imagen segura");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (data: ParkingForm) => {
    try {
      let savedRecord: any;
      if (selectedId) {
        savedRecord = await HttpClient.patch(`/operation/minuta/parking/${selectedId}`, data);
      } else {
        savedRecord = await HttpClient.post("/operation/minuta/parking", data);
      }

      const entityId = selectedId || savedRecord?.id;

      // Upload file to S3 if attached
      if (evidenceFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: evidenceFile,
            entityType: MediaTypeCategory.PARKING,
            entityId,
            clientId: selectedClientId || session?.user?.clientId || null,
            subType: "parking",
          });
          showSuccess("Fotografía del vehículo guardada");
        } catch (uploadErr: any) {
          console.error("S3 upload error:", uploadErr);
          showError("El registro se guardó, pero hubo un inconveniente al subir la foto.");
        }
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  const endpoint = selectedClientId
    ? `/operation/minuta/parking?clientId=${selectedClientId}`
    : "/operation/minuta/parking";

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 60 },
    { field: "plate", headerName: "Placa", width: 110 },
    { field: "parkingNumber", headerName: "Parqueadero", width: 120 },
    {
      field: "entryTime",
      headerName: "Entrada",
      width: 100,
      valueFormatter: (value: any) => formatTime(value),
    },
    {
      field: "exitTime",
      headerName: "Salida",
      width: 100,
      valueFormatter: (value: any) => formatTime(value),
    },
    { field: "brand", headerName: "Marca", width: 120 },
    { field: "color", headerName: "Color", width: 100 },
    {
      field: "evidence",
      headerName: "Evidencia",
      width: 110,
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
              <MenuItem value="">Todos los Clientes / Conjuntos</MenuItem>
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
        title="Control de Parqueadero"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Parqueadero" }]}
        onCreate={canCreate ? handleCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onView={handleView}
        refreshTrigger={refreshTrigger}
        infoDescription="Sistema de control para el ingreso y salida de vehículos, asegurando el monitoreo de placas y tiempos de permanencia."
        infoInstructions={`Registra la placa del vehículo y selecciona el tipo (Residente, Visitante, etc.).
Asegúrate de marcar el estado 'ENTRADA' al ingresar y 'SALIDA' al retirar el vehículo.
Puedes capturar en vivo una foto del vehículo para respaldo.`}
      />

      {/* Modal Detalle de Parqueadero */}
      <DetailDialog
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title="Detalles del Registro de Parqueadero"
        headerContent={
          detailImageUrl && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <Box
                component="img"
                src={detailImageUrl}
                alt="Foto Vehículo"
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
                { label: "Placa", value: detailRecord.plate },
                { label: "N° Parqueadero", value: detailRecord.parkingNumber },
                { label: "Hora Entrada", value: formatTime(detailRecord.entryTime || detailRecord.time) },
                { label: "Hora Salida", value: detailRecord.exitTime ? formatTime(detailRecord.exitTime) : "En Parqueadero" },
                { label: "Marca", value: detailRecord.brand || "N/A" },
                { label: "Color", value: detailRecord.color || "N/A" },
                {
                  label: "Estado General",
                  value: (
                    <Chip
                      size="small"
                      label={detailRecord.condition === "GOOD" ? "Bueno" : "Malo / Con Observaciones"}
                      color={detailRecord.condition === "GOOD" ? "success" : "warning"}
                    />
                  ),
                },
                { label: "Creado Por", value: detailRecord.createdBy || "Sistema" },
                {
                  label: "Fecha Registro",
                  value: formatDateTime(detailRecord.createdAt || detailRecord.date),
                },
                { label: "Observaciones", value: detailRecord.observations || "Sin observaciones" },
              ]
            : []
        }
      />

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={
          selectedId
            ? "Actualizar Salida / Editar"
            : "Nuevo Ingreso a Parqueadero"
        }
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
      >
        <Box sx={{ mt: 2 }}>
          <ImageUploadCapture
            label="Fotografía del Vehículo / Estado"
            variant="evidence"
            value={evidenceFile}
            previewUrl={existingMediaUrl}
            onChange={setEvidenceFile}
            helperText="Toma una foto en vivo del vehículo/placas al ingresar para evidencia del estado general."
          />
        </Box>
      </FormDialog>

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
                alt="Foto Vehículo"
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
