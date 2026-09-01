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
  occurredAt: z.string().min(1, "La fecha/hora de ocurrencia es requerida"),
  annotation: z.string().min(1, "La anotación es requerida"),
  category: z.string().optional().default("GENERAL"),
  priority: z.coerce.number().int().min(1).max(5).optional().default(3),
  isConfidential: z.boolean().optional().default(false),
});

type MinutaForm = z.infer<typeof schema>;

const fields: FormField<MinutaForm>[] = [
  { name: "date", label: "Fecha", type: "date", required: true },
  { name: "time", label: "Hora", type: "time", required: true },
  { name: "occurredAt", label: "Ocurrido En", hidden: true },
  { name: "annotation", label: "Anotación / Novedad", required: true },
  { name: "category", label: "Categoría" },
  {
    name: "priority",
    label: "Prioridad (1-5)",
    type: "number",
    inputProps: { min: 1, max: 5 },
  },
  {
    name: "isConfidential",
    label: "Confidencial",
    type: "select",
    options: [
      { value: "true", label: "Sí" },
      { value: "false", label: "No" },
    ],
  },
];

export default function MinutaGeneralPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<MinutaForm | undefined>();
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
      annotation: "",
      category: "GENERAL",
      priority: 3,
      isConfidential: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      setEvidenceFile(null);
      setExistingMediaUrl(null);
      const data = await HttpClient.get<any>(`/operation/minuta/general/${id}`);
      setSelectedId(id);
      setDefaultValues({
        ...data,
        date: data.date ? data.date.split("T")[0] : "",
        time: data.time ? formatTimeToHHmm(data.time) : (data.occurredAt ? formatTimeToHHmm(data.occurredAt) : ""),
        occurredAt: data.occurredAt || data.date || new Date().toISOString(),
        isConfidential: !!data.isConfidential,
      });

      // Load existing attachments if any
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
      showSuccess("Registro eliminado");
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

  const handleSubmit = async (data: MinutaForm) => {
    try {
      let savedRecord: any;
      if (selectedId) {
        savedRecord = await HttpClient.patch(`/operation/minuta/general/${selectedId}`, data);
      } else {
        savedRecord = await HttpClient.post("/operation/minuta/general", data);
      }

      const entityId = selectedId || savedRecord?.id;

      // Upload file to S3 if attached
      if (evidenceFile && entityId) {
        try {
          await StorageApi.uploadMedia({
            file: evidenceFile,
            entityType: MediaTypeCategory.MINUTA,
            entityId,
            clientId: selectedClientId || session?.user?.clientId || null,
            subType: "general",
          });
          showSuccess("Evidencia fotográfica guardada");
        } catch (uploadErr: any) {
          console.error("S3 upload error:", uploadErr);
          showError("La minuta se guardó, pero hubo un inconveniente al subir la foto.");
        }
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      throw error;
    }
  };

  const endpoint = selectedClientId
    ? `/operation/minuta/general?clientId=${selectedClientId}`
    : "/operation/minuta/general";

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 60 },
    {
      field: "date",
      headerName: "Fecha",
      width: 110,
      valueFormatter: (value: any) => formatDate(value),
    },
    {
      field: "time",
      headerName: "Hora",
      width: 90,
      valueFormatter: (value: any) => formatTime(value),
    },
    { field: "annotation", headerName: "Anotación", flex: 1 },
    { field: "category", headerName: "Categoría", width: 110 },
    { field: "priority", headerName: "Prioridad", width: 80 },
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
        title="Minuta General"
        endpoint={endpoint}
        columns={columns}
        breadcrumbs={[{ label: "Operaciones" }, { label: "Minuta General" }]}
        onCreate={canCreate ? handleCreate : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onView={handleView}
        refreshTrigger={refreshTrigger}
        infoDescription="Registro cronológico y detallado de todas las novedades, incidentes y actividades relevantes ocurridas durante el turno de seguridad."
        infoInstructions={`Registra cada novedad con su nivel de prioridad (1-5) y una descripción clara.
Puedes tomar o adjuntar evidencia fotográfica en vivo con tu cámara para respaldo.`}
      />

      {/* Modal Detalle de Minuta */}
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
                { label: "Creado Por", value: detailRecord.createdBy || "Sistema" },
                {
                  label: "Fecha Registro",
                  value: formatDateTime(detailRecord.createdAt || detailRecord.occurredAt),
                },
                { label: "Anotación / Novedad", value: detailRecord.annotation },
              ]
            : []
        }
      />

      {/* Modal Formulario con Captura de Evidencia Fotográfica */}
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={selectedId ? "Editar Minuta" : "Crear Registro de Minuta"}
        schema={schema}
        fields={fields}
        defaultValues={defaultValues}
      >
        <Box sx={{ mt: 2 }}>
          <ImageUploadCapture
            label="Evidencia Fotográfica"
            variant="evidence"
            value={evidenceFile}
            previewUrl={existingMediaUrl}
            onChange={setEvidenceFile}
            helperText="Captura una fotografía en vivo con la cámara o selecciona una imagen de tu dispositivo."
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
                alt="Evidencia"
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
