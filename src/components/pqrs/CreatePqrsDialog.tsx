"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import { PqrsApi, PqrsPriority, PqrsType } from "@/lib/api/pqrs";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import ClientAutocomplete from "@/components/common/ClientAutocomplete";
import { TYPE_CONFIG } from "./PqrsTypeChip";

interface CreatePqrsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newTicketId?: string) => void;
}

export default function CreatePqrsDialog({
  open,
  onClose,
  onSuccess,
}: CreatePqrsDialogProps) {
  const { session } = useAuth();
  const { showSuccess, showError } = useNotification();

  const isResidenceManager = session?.user?.userType === "RESIDENCE_MANAGER";
  const userClientId = session?.user?.clientId;

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PqrsType>(PqrsType.PETICION);
  const [priority, setPriority] = useState<PqrsPriority>(PqrsPriority.MEDIUM);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(
    null
  );
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSubject("");
      setDescription("");
      setType(PqrsType.PETICION);
      setPriority(PqrsPriority.MEDIUM);
      setSelectedClient(null);
      setFiles([]);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      showError("El asunto de la solicitud es obligatorio");
      return;
    }
    if (!description.trim()) {
      showError("La descripción es obligatoria");
      return;
    }
    if (!isResidenceManager && !userClientId && !selectedClient) {
      showError("Debe seleccionar el cliente o conjunto residencial para radicar");
      return;
    }

    setLoading(true);
    try {
      const ticket = await PqrsApi.create({
        subject: subject.trim(),
        description: description.trim(),
        type,
        priority: isResidenceManager ? PqrsPriority.MEDIUM : priority,
        clientId: selectedClient?.id || userClientId || undefined,
      });

      // Subir adjuntos si existen
      if (files.length > 0) {
        for (const file of files) {
          try {
            await StorageApi.uploadMedia({
              file,
              entityType: MediaTypeCategory.PQRS,
              entityId: ticket.id,
              clientId: ticket.clientId,
            });
          } catch {
            // Error en archivo individual no detiene la radicación
          }
        }
      }

      showSuccess(`Solicitud radicado con éxito: [${ticket.code}]`);
      onSuccess(ticket.id);
      onClose();
    } catch (err: any) {
      showError(err.message || "Error al radicar la solicitud PQRS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AddIcon color="primary" />
        Radicar Nueva Solicitud PQRS
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {isResidenceManager && (
            <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
              Radicando como Administrador del Conjunto:{" "}
              <strong>{session?.user?.client?.name || session?.user?.clientName}</strong>
            </Alert>
          )}

          {!isResidenceManager && !userClientId && (
            <ClientAutocomplete
              value={selectedClient}
              onChange={(client) => setSelectedClient(client)}
              required
              label="Cliente / Conjunto Residencial"
            />
          )}

          {isResidenceManager ? (
            <FormControl fullWidth size="small">
              <InputLabel id="pqrs-type-label">Tipo de Solicitud</InputLabel>
              <Select
                labelId="pqrs-type-label"
                value={type}
                label="Tipo de Solicitud"
                onChange={(e) => setType(e.target.value as PqrsType)}
              >
                {Object.values(PqrsType).map((t) => (
                  <MenuItem key={t} value={t}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {TYPE_CONFIG[t].icon}
                      <Typography variant="body2">{TYPE_CONFIG[t].label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="pqrs-type-label">Tipo de Solicitud</InputLabel>
                <Select
                  labelId="pqrs-type-label"
                  value={type}
                  label="Tipo de Solicitud"
                  onChange={(e) => setType(e.target.value as PqrsType)}
                >
                  {Object.values(PqrsType).map((t) => (
                    <MenuItem key={t} value={t}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {TYPE_CONFIG[t].icon}
                        <Typography variant="body2">{TYPE_CONFIG[t].label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="pqrs-priority-label">Prioridad</InputLabel>
                <Select
                  labelId="pqrs-priority-label"
                  value={priority}
                  label="Prioridad"
                  onChange={(e) => setPriority(e.target.value as PqrsPriority)}
                >
                  <MenuItem value={PqrsPriority.LOW}>Baja</MenuItem>
                  <MenuItem value={PqrsPriority.MEDIUM}>Media</MenuItem>
                  <MenuItem value={PqrsPriority.HIGH}>Alta</MenuItem>
                  <MenuItem value={PqrsPriority.CRITICAL}>Crítica</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          <TextField
            fullWidth
            size="small"
            required
            label="Asunto o Título del Requerimiento"
            placeholder="Ej: Solicitud de revisión de protocolo de acceso peatonal"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <TextField
            fullWidth
            required
            multiline
            rows={4}
            size="small"
            label="Descripción Detallada de la Solicitud"
            placeholder="Describe claramente los hechos, requerimientos o sugerencias para la empresa de seguridad..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Evidencias o Archivos Adjuntos (Fotos, Documentos, Reportes)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={<CloudUploadIcon />}
            >
              Seleccionar Archivos
              <input type="file" multiple hidden onChange={handleFileChange} />
            </Button>

            {files.length > 0 && (
              <List dense sx={{ mt: 1, bgcolor: "background.paper", borderRadius: 1 }}>
                {files.map((file, idx) => (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <IconButton edge="end" size="small" onClick={() => handleRemoveFile(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <FileIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(1)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !subject.trim() || !description.trim()}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
        >
          {loading ? "Radicando..." : "Radicar Solicitud"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
