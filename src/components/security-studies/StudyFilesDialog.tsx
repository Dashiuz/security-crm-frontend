"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
} from "@mui/material";
import {
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  CloudUpload as CloudUploadIcon,
  OpenInNew as OpenInNewIcon,
  FileDownload as DownloadIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import ImageUploadCapture from "@/components/common/ImageUploadCapture";

interface StudyFilesDialogProps {
  open: boolean;
  onClose: () => void;
  studyId: string;
  isDiscontinued: boolean;
  files: any[];
  onFilesUpdated: () => void;
}

export default function StudyFilesDialog({
  open,
  onClose,
  studyId,
  isDiscontinued,
  files = [],
  onFilesUpdated,
}: StudyFilesDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showError, showSuccess } = useNotification();

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      await HttpClient.upload(
        `/administrative/security-studies/${studyId}/attachments`,
        formData,
      );
      showSuccess(`Archivo "${file.name}" cargado exitosamente.`);
      onFilesUpdated();
    } catch (err: any) {
      showError(err.message || "Error al cargar archivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenFile = (file: any) => {
    if (file.url) {
      window.open(file.url, "_blank", "noopener,noreferrer");
    } else {
      showError("El enlace del archivo no está disponible en este momento.");
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!fileId) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el archivo "${fileName}"?`)) {
      return;
    }

    setDeletingId(fileId);
    try {
      await HttpClient.delete(
        `/administrative/security-studies/${studyId}/attachments/${fileId}`,
      );
      showSuccess(`Archivo "${fileName}" eliminado.`);
      onFilesUpdated();
    } catch (err: any) {
      showError(err.message || "Error al eliminar archivo.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 14000 }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Documentos y Archivos Adjuntos del Estudio
      </DialogTitle>
      <DialogContent dividers>
        {isDiscontinued && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Este estudio está en estado <strong>DESCONTINUADO</strong>. No se permite
            adjuntar ni modificar archivos.
          </Alert>
        )}

        {!isDiscontinued && (
          <Box sx={{ mb: 3 }}>
            <ImageUploadCapture
              label="Cargar Archivo (PDF / Imagen) o Tomar Foto"
              variant="evidence"
              onChange={handleFileUpload}
              disabled={uploading}
              helperText="Formatos soportados: PDF, JPG, PNG (Hasta 10 MB)"
              modalZIndex={15000}
            />
            {uploading && (
              <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="primary">Subiendo a S3...</Typography>
              </Box>
            )}
          </Box>
        )}

        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Archivos Registrados ({files.length}):
        </Typography>

        {files.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            No hay archivos adjuntos en este estudio.
          </Typography>
        ) : (
          <List dense disablePadding>
            {files.map((file, idx) => (
              <ListItem
                key={file.id || idx}
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  mb: 1.5,
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: "action.hover",
                    borderColor: "primary.light",
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ minWidth: 0, flex: 1, mr: 1.5 }}
                >
                  {file.mimeType?.includes("image") && file.url ? (
                    <Avatar
                      src={file.url}
                      variant="rounded"
                      sx={{
                        width: 42,
                        height: 42,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 1.5,
                        bgcolor: file.mimeType?.includes("pdf") ? "#ffebee" : "#e3f2fd",
                        color: file.mimeType?.includes("pdf") ? "#d32f2f" : "#1976d2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {file.mimeType?.includes("pdf") ? <PdfIcon /> : <DocIcon />}
                    </Box>
                  )}

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      noWrap
                      title={file.name}
                      sx={{
                        cursor: file.url ? "pointer" : "default",
                        color: "text.primary",
                        "&:hover": {
                          color: "primary.main",
                          textDecoration: "underline",
                        },
                      }}
                      onClick={() => handleOpenFile(file)}
                    >
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {file.sizeBytes ? `${Math.round(file.sizeBytes / 1024)} KB` : "Documento"} •{" "}
                      {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : ""}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Tooltip title="Abrir documento o imagen en una pestaña nueva">
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<OpenInNewIcon fontSize="small" />}
                        onClick={() => handleOpenFile(file)}
                        disabled={!file.url}
                        sx={{
                          textTransform: "none",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          px: 1.2,
                        }}
                      >
                        Abrir
                      </Button>
                    </span>
                  </Tooltip>

                  {file.url && (
                    <Tooltip title="Descargar archivo a tu equipo">
                      <IconButton
                        size="small"
                        component="a"
                        href={file.url}
                        download={file.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="default"
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}

                  {!isDiscontinued && (
                    <Tooltip title="Eliminar archivo adjunto">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        disabled={deletingId === file.id}
                      >
                        {deletingId === file.id ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
