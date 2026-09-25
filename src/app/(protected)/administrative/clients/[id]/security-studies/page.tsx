"use client";

import { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  FileCopy as FileCopyIcon,
  Block as BlockIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  Map as MapIcon,
  FolderSpecial as FolderSpecialIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import { useTenant } from "@/providers/TenantProvider";
import MapboxLocationPicker from "@/components/security-studies/MapboxLocationPicker";
import StudyFilesDialog from "@/components/security-studies/StudyFilesDialog";

// Load Konva CAD Editor dynamically to avoid Next.js SSR window errors
const SecurityCanvasEditor = dynamic(
  () => import("@/components/security-studies/SecurityCanvasEditor"),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 600,
        }}
      >
        <CircularProgress />
      </Box>
    ),
  },
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientSecurityStudiesPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const { isFeatureEnabled } = useTenant();
  const hasCanva = isFeatureEnabled("canva");

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any | null>(null);
  const [studies, setStudies] = useState<any[]>([]);

  // Views & Modals
  const [activeEditorStudy, setActiveEditorStudy] = useState<any | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [geofenceEditorActive, setGeofenceEditorActive] = useState(false);
  const [geofenceBaseImageUrl, setGeofenceBaseImageUrl] = useState<string | null>(null);
  const [filesStudy, setFilesStudy] = useState<any | null>(null);

  // Discontinue prompt
  const [discontinueStudy, setDiscontinueStudy] = useState<any | null>(null);
  const [discontinueConfirmText, setDiscontinueConfirmText] = useState("");
  const [discontinuing, setDiscontinuing] = useState(false);

  // New study setup dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newStudyName, setNewStudyName] = useState("");
  const [newStudyDescription, setNewStudyDescription] = useState("");
  const [creatingStudy, setCreatingStudy] = useState(false);

  // Edit study metadata dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<any | null>(null);
  const [editStudyName, setEditStudyName] = useState("");
  const [editStudyDescription, setEditStudyDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const { showError, showSuccess } = useNotification();

  const fetchStudies = async () => {
    setLoading(true);
    try {
      const res = await HttpClient.get<any>(
        `/administrative/security-studies/by-client/${clientId}`,
      );
      setClient(res.client);
      setStudies(res.studies || []);
    } catch (err: any) {
      showError(err.message || "Error al cargar estudios de seguridad.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, [clientId]);

  const hasGeofence = Boolean(client?.mapboxBaseImageS3Key && client?.geofence);

  // Handler when Mapbox generates the satellite base image (Geofence setup)
  const handleBaseGenerated = async (baseData: any) => {
    setLocationPickerOpen(false);
    setGeofenceBaseImageUrl(baseData.presignedUrl);
    await fetchStudies();
    // Open editor in geofence mode to draw and approve the client's perimeter
    setGeofenceEditorActive(true);
  };

  // Open dialog to create a new study
  const handleOpenCreateDialog = () => {
    setNewStudyName(
      studies.length === 0
        ? hasCanva
          ? "Estudio de Seguridad y Geofencing Inicial"
          : "Estudio de Seguridad Inicial"
        : hasCanva
        ? `Estudio de Seguridad v${studies.length + 1}`
        : `Estudio Documental v${studies.length + 1}`,
    );
    setNewStudyDescription("");
    setCreateDialogOpen(true);
  };

  // Confirm creation of new study
  const handleConfirmCreateStudy = async () => {
    if (!newStudyName.trim()) return;
    setCreatingStudy(true);

    try {
      const created = await HttpClient.post<any>(
        "/administrative/security-studies",
        {
          clientId,
          name: newStudyName.trim(),
          description: newStudyDescription.trim() || undefined,
        },
      );

      showSuccess("Estudio de seguridad creado exitosamente.");
      setCreateDialogOpen(false);
      await fetchStudies();

      if (hasCanva) {
        // Open CAD editor immediately
        setActiveEditorStudy(created);
      } else {
        // Open files dialog immediately so user can attach documents
        setFilesStudy(created);
      }
    } catch (err: any) {
      showError(err.message || "Error al crear estudio de seguridad.");
    } finally {
      setCreatingStudy(false);
    }
  };

  // Open dialog to edit study name and description
  const handleOpenEditDialog = (study: any) => {
    setEditingStudy(study);
    setEditStudyName(study.name || "");
    setEditStudyDescription(study.description || "");
    setEditDialogOpen(true);
  };

  // Confirm edit of study metadata
  const handleConfirmEditStudy = async () => {
    if (!editingStudy || !editStudyName.trim()) return;
    setSavingEdit(true);
    try {
      await HttpClient.patch(
        `/administrative/security-studies/${editingStudy.id}`,
        {
          name: editStudyName.trim(),
          description: editStudyDescription.trim() || undefined,
        },
      );
      showSuccess("Estudio de seguridad actualizado exitosamente.");
      setEditDialogOpen(false);
      setEditingStudy(null);
      await fetchStudies();
    } catch (err: any) {
      showError(err.message || "Error al actualizar el estudio de seguridad.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Discontinue study handler
  const handleConfirmDiscontinue = async () => {
    if (!discontinueStudy) return;
    if (discontinueConfirmText.trim().toLowerCase() !== "acepto") {
      showError('Debe escribir exactamente "acepto" para confirmar.');
      return;
    }

    setDiscontinuing(true);
    try {
      await HttpClient.post(
        `/administrative/security-studies/${discontinueStudy.id}/discontinue`,
        {
          confirmation: "acepto",
        },
      );
      showSuccess("Estudio de seguridad descontinuado exitosamente.");
      setDiscontinueStudy(null);
      setDiscontinueConfirmText("");
      fetchStudies();
    } catch (err: any) {
      showError(err.message || "Error al descontinuar estudio.");
    } finally {
      setDiscontinuing(false);
    }
  };

  // Duplicate study handler
  const handleDuplicateStudy = async (studyId: string) => {
    try {
      await HttpClient.post(
        `/administrative/security-studies/${studyId}/duplicate`,
        {},
      );
      showSuccess("Estudio duplicado exitosamente.");
      fetchStudies();
    } catch (err: any) {
      showError(
        err.message ||
          "No se puede duplicar. Asegúrese de descontinuar el estudio vigente primero.",
      );
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // --- FULLSCREEN GEOFENCE CAD EDITOR (Client SSOT Mode) ---
  if (geofenceEditorActive && client) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          bgcolor: "background.default",
        }}
      >
        <SecurityCanvasEditor
          clientId={clientId}
          mode="geofence"
          baseImageUrl={geofenceBaseImageUrl || client.mapboxBaseImageS3Key}
          bbox={{
            minLat: client.mapboxBboxMinLat ?? 0,
            minLng: client.mapboxBboxMinLng ?? 0,
            maxLat: client.mapboxBboxMaxLat ?? 0,
            maxLng: client.mapboxBboxMaxLng ?? 0,
          }}
          clientGeofence={client.geofence}
          clientName={client.name || "Cliente"}
          onPerimeterApproved={async () => {
            showSuccess("¡Geofence aprobado y guardado en el cliente!");
            setGeofenceEditorActive(false);
            await fetchStudies();
          }}
          onClose={() => {
            setGeofenceEditorActive(false);
            fetchStudies();
          }}
        />
      </Box>
    );
  }

  // --- FULLSCREEN CAD STUDY EDITOR (Devices & Facilities Mode) ---
  if (activeEditorStudy && hasCanva) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          bgcolor: "background.default",
        }}
      >
        <SecurityCanvasEditor
          studyId={activeEditorStudy.id}
          clientId={clientId}
          mode="study"
          baseImageUrl={activeEditorStudy.baseImageUrl || client?.mapboxBaseImageS3Key}
          bbox={{
            minLat: activeEditorStudy.mapboxBboxMinLat ?? client?.mapboxBboxMinLat ?? 0,
            minLng: activeEditorStudy.mapboxBboxMinLng ?? client?.mapboxBboxMinLng ?? 0,
            maxLat: activeEditorStudy.mapboxBboxMaxLat ?? client?.mapboxBboxMaxLat ?? 0,
            maxLng: activeEditorStudy.mapboxBboxMaxLng ?? client?.mapboxBboxMaxLng ?? 0,
          }}
          initialCanvasState={activeEditorStudy.canvasState}
          clientGeofence={client?.geofence}
          isReadOnly={activeEditorStudy.status === "DISCONTINUED"}
          clientName={client?.name || "Cliente"}
          onPerimeterApproved={() => fetchStudies()}
          onClose={() => {
            setActiveEditorStudy(null);
            fetchStudies();
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Top Breadcrumb and Actions */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            onClick={() => router.push("/administrative/clients")}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {hasCanva
                ? "Estudios de Seguridad y Geofencing"
                : "Estudios de Seguridad (Gestión Documental)"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conjunto / Cliente: <strong>{client?.name}</strong> • NIT:{" "}
              {client?.nit || "N/A"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {hasCanva && client?.geofence && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Geofencing Activo (SSOT)"
              color="success"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}

          {hasCanva ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={hasGeofence ? handleOpenCreateDialog : () => setLocationPickerOpen(true)}
              sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
            >
              Nuevo Estudio Satelital
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
            >
              Nuevo Estudio Documental
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Geofence Missing Prerequisite Alert (Only if hasCanva and geofence is not configured) */}
      {hasCanva && !hasGeofence && (
        <Alert
          severity="warning"
          sx={{ mb: 3, alignItems: "center" }}
          action={
            <Button
              color="warning"
              variant="contained"
              size="small"
              startIcon={<MapIcon />}
              onClick={() => setLocationPickerOpen(true)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Configurar Geofence
            </Button>
          }
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Geofence del Cliente no configurado
          </Typography>
          <Typography variant="body2">
            Para diseñar o crear estudios satelitales en Canva, primero debe establecer el perímetro y la imagen satelital base del cliente.
          </Typography>
        </Alert>
      )}

      {/* Mapbox Location Picker Dialog */}
      {locationPickerOpen && (
        <Dialog
          open={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Configurar Ubicación e Imagen Satelital del Cliente
          </DialogTitle>
          <DialogContent>
            <MapboxLocationPicker
              clientId={clientId}
              clientName={client?.name || ""}
              initialAddress={client?.address || ""}
              onBaseGenerated={handleBaseGenerated}
              onCancel={() => setLocationPickerOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* CASE A: No studies exist */}
      {studies.length === 0 ? (
        <Paper
          elevation={2}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: "center",
            borderRadius: 3,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          {hasCanva ? (
            <>
              <SecurityIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No hay estudios de seguridad asociados a este cliente
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: "auto", mb: 3 }}
              >
                {hasGeofence
                  ? "El perímetro geofencing del cliente ya está definido. Inicia un nuevo estudio de seguridad para diseñar la distribución de dispositivos y barreras físicas."
                  : "Para habilitar el sistema de geofencing y auditoría física, primero debemos ubicar la dirección del conjunto en el mapa satelital y trazar el polígono perimetral."}
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={hasGeofence ? <AddIcon /> : <MapIcon />}
                onClick={hasGeofence ? handleOpenCreateDialog : () => setLocationPickerOpen(true)}
                sx={{ px: 4, fontWeight: 700, borderRadius: 2 }}
              >
                {hasGeofence
                  ? "Iniciar Primer Estudio de Seguridad"
                  : "Configurar Geofence Primero"}
              </Button>
            </>
          ) : (
            <>
              <FolderSpecialIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No hay estudios de seguridad documentales asociados a este cliente
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 600, mx: "auto", mb: 3 }}
              >
                Crea un nuevo estudio de seguridad documental para registrar evaluaciones de vulnerabilidades y adjuntar informes técnicos periciales.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                sx={{ px: 4, fontWeight: 700, borderRadius: 2 }}
              >
                Crear Estudio de Seguridad
              </Button>
            </>
          )}
        </Paper>
      ) : (
        /* CASE B: Studies list */
        <Stack spacing={2.5}>
          {studies.map((study) => {
            const isCurrent = study.status === "CURRENT";
            return (
              <Card
                key={study.id}
                elevation={2}
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: isCurrent ? "primary.main" : "divider",
                  overflow: "hidden",
                }}
              >
                {/* Thumbnail Preview: Only if hasCanva and image exists, else clean document badge */}
                {hasCanva && study.baseImageUrl ? (
                  <CardMedia
                    component="img"
                    image={study.baseImageUrl}
                    alt={study.name}
                    sx={{
                      width: { xs: "100%", md: 260 },
                      height: { xs: 180, md: "auto" },
                      objectFit: "cover",
                      bgcolor: "black",
                    }}
                  />
                ) : !hasCanva ? (
                  <Box
                    sx={{
                      width: { xs: "100%", md: 140 },
                      minHeight: { xs: 100, md: "auto" },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "action.hover",
                      borderRight: { md: "1px solid" },
                      borderColor: "divider",
                    }}
                  >
                    <FolderSpecialIcon
                      sx={{
                        fontSize: 54,
                        color: isCurrent ? "primary.main" : "text.secondary",
                      }}
                    />
                  </Box>
                ) : null}

                {/* Content Details */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    p: 2.5,
                  }}
                >
                  <CardContent sx={{ flex: "1 0 auto", p: 0 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      alignItems={{ xs: "flex-start", md: "center" }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6" fontWeight={700}>
                          {study.name}
                        </Typography>
                        <Tooltip title="Editar título y descripción">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(study)}
                            sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-start", md: "center" } }}>
                        <Chip
                          label={`Versión ${study.version}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={isCurrent ? "VIGENTE (CURRENT)" : "DESCONTINUADO"}
                          color={isCurrent ? "success" : "default"}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {study.description || "Sin descripción adicional."}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={3}
                      flexWrap="wrap"
                      sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                    >
                      <span>
                        Creado: {new Date(study.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Autor: {study.createdBy?.fullName || "Sistema"}
                      </span>
                      {hasCanva && (
                        <>
                          <span>
                            Vértices:{" "}
                            {study.canvasState?.geofencePolygon?.points?.length || 0}{" "}
                            puntos
                          </span>
                          <span>
                            Dispositivos:{" "}
                            {study.canvasState?.devices?.length || 0} instalados
                          </span>
                        </>
                      )}
                      <span>
                        Archivos adjuntos: {study.files?.length || 0}
                      </span>
                    </Stack>
                  </CardContent>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Action Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                      justifyContent: "space-between",
                      gap: 1,
                      width: "100%",
                      m: 0,
                      p: 0,
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      sx={{ width: { xs: "100%", sm: "auto" }, m: 0 }}
                    >
                      {hasCanva && (
                        <Button
                          variant={isCurrent ? "contained" : "outlined"}
                          color="primary"
                          size="small"
                          startIcon={isCurrent ? <EditIcon /> : <VisibilityIcon />}
                          onClick={() => setActiveEditorStudy(study)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            width: { xs: "100%", sm: "auto" },
                            minHeight: 34,
                            px: 1.8,
                          }}
                        >
                          {isCurrent ? "Abrir Canva" : "Ver Canva"}
                        </Button>
                      )}

                      <Button
                        variant={hasCanva ? "outlined" : (isCurrent ? "contained" : "outlined")}
                        color="primary"
                        size="small"
                        startIcon={<AttachFileIcon />}
                        onClick={() => setFilesStudy(study)}
                        sx={{
                          textTransform: "none",
                          fontWeight: !hasCanva ? 600 : 500,
                          whiteSpace: "nowrap",
                          width: { xs: "100%", sm: "auto" },
                          minHeight: 34,
                          px: 1.8,
                        }}
                      >
                        {hasCanva
                          ? `Archivos (${study.files?.length || 0})`
                          : `Gestionar Archivos (${study.files?.length || 0})`}
                      </Button>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      sx={{ width: { xs: "100%", sm: "auto" }, m: 0 }}
                    >
                      {/* Edit Button */}
                      <Tooltip title="Editar título y descripción">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEditDialog(study)}
                          sx={{
                            textTransform: "none",
                            whiteSpace: "nowrap",
                            width: { xs: "100%", sm: "auto" },
                            minHeight: 34,
                            px: 1.5,
                          }}
                        >
                          Editar Datos
                        </Button>
                      </Tooltip>

                      {/* Duplicate Button */}
                      <Tooltip title="Duplicar estudio (Crea nueva versión editable)">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FileCopyIcon />}
                          onClick={() => handleDuplicateStudy(study.id)}
                          sx={{
                            textTransform: "none",
                            whiteSpace: "nowrap",
                            width: { xs: "100%", sm: "auto" },
                            minHeight: 34,
                            px: 1.5,
                          }}
                        >
                          Duplicar
                        </Button>
                      </Tooltip>

                      {/* Discontinue Button */}
                      {isCurrent && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<BlockIcon />}
                          onClick={() => setDiscontinueStudy(study)}
                          sx={{
                            textTransform: "none",
                            whiteSpace: "nowrap",
                            width: { xs: "100%", sm: "auto" },
                            minHeight: 34,
                            px: 1.5,
                          }}
                        >
                          Descontinuar
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Dialog to Create a New Study */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {hasCanva
            ? "Crear Nuevo Estudio de Seguridad"
            : "Crear Estudio de Seguridad Documental"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {hasCanva
              ? "El estudio heredará automáticamente la imagen satelital y el perímetro de geofencing establecido para este cliente."
              : "Este estudio servirá como repositorio documental para adjuntar informes, matrices de riesgo y anexos periciales."}
          </Typography>
          <TextField
            fullWidth
            label="Título / Nombre del Estudio"
            value={newStudyName}
            onChange={(e) => setNewStudyName(e.target.value)}
            disabled={creatingStudy}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción (Opcional)"
            value={newStudyDescription}
            onChange={(e) => setNewStudyDescription(e.target.value)}
            disabled={creatingStudy}
            sx={{ mb: 2 }}
          />
          <Alert severity="info">
            Al crearlo, este estudio pasará a estado <strong>CURRENT (Vigente)</strong>{" "}
            y cualquier estudio vigente previo será archivado como{" "}
            <strong>DISCONTINUED</strong>.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creatingStudy}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmCreateStudy}
            disabled={creatingStudy || !newStudyName.trim()}
          >
            {creatingStudy
              ? "Creando..."
              : hasCanva
              ? "Crear y Abrir Canva"
              : "Crear y Gestionar Archivos"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discontinue Study Confirmation Dialog */}
      <Dialog
        open={Boolean(discontinueStudy)}
        onClose={() => {
          setDiscontinueStudy(null);
          setDiscontinueConfirmText("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Descontinuar Estudio de Seguridad
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            ¿Estás seguro de que deseas descontinuar el estudio{" "}
            <strong>&quot;{discontinueStudy?.name}&quot;</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            El canva se convertirá en un plano de <strong>solo lectura</strong> y no
            podrá modificarse. El perímetro geofencing ya establecido para el cliente
            se mantendrá activo.
          </Alert>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Para confirmar, escribe la palabra exacta <strong>acepto</strong>:
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="acepto"
            value={discontinueConfirmText}
            onChange={(e) => setDiscontinueConfirmText(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setDiscontinueStudy(null);
              setDiscontinueConfirmText("");
            }}
            disabled={discontinuing}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDiscontinue}
            disabled={
              discontinuing ||
              discontinueConfirmText.trim().toLowerCase() !== "acepto"
            }
          >
            {discontinuing ? "Descontinuando..." : "Confirmar Descontinuación"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog to Edit Study Metadata */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          if (!savingEdit) {
            setEditDialogOpen(false);
            setEditingStudy(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Editar Estudio de Seguridad
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Actualiza el título y la descripción del estudio de seguridad.
          </Typography>
          <TextField
            fullWidth
            label="Título / Nombre del Estudio"
            value={editStudyName}
            onChange={(e) => setEditStudyName(e.target.value)}
            disabled={savingEdit}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción"
            value={editStudyDescription}
            onChange={(e) => setEditStudyDescription(e.target.value)}
            disabled={savingEdit}
            placeholder="Descripción detallada del estudio de seguridad..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditingStudy(null);
            }}
            disabled={savingEdit}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmEditStudy}
            disabled={savingEdit || !editStudyName.trim()}
          >
            {savingEdit ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Study Files Dialog */}
      {filesStudy && (
        <StudyFilesDialog
          open={Boolean(filesStudy)}
          onClose={() => setFilesStudy(null)}
          studyId={filesStudy.id}
          isDiscontinued={filesStudy.status === "DISCONTINUED"}
          files={filesStudy.files || []}
          onFilesUpdated={() => {
            fetchStudies();
            setFilesStudy(null);
          }}
        />
      )}
    </Box>
  );
}
