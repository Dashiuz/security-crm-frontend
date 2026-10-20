"use client";

import { useState, useEffect } from "react";
import {
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
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Feedback as PqrsIcon,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { PqrsApi, PqrsPriority, PqrsType } from "@/lib/api/pqrs";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import { useNotification } from "@/providers/NotificationProvider";
import { useAuth } from "@/components/AuthContext";
import ClientAutocomplete from "@/components/common/ClientAutocomplete";
import { TYPE_CONFIG } from "./PqrsTypeChip";

export interface CreatePqrsDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newTicketId?: string) => void;
}

export default function CreatePqrsDrawer({
  open,
  onClose,
  onSuccess,
}: CreatePqrsDrawerProps) {
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

      showSuccess(`Solicitud radicada con éxito: [${ticket.code}]`);
      onSuccess(ticket.id);
      onClose();
    } catch (err: any) {
      showError(err.message || "Error al radicar la solicitud PQRS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Radicar Nueva Solicitud PQRS"
      subtitle="Registre la petición, queja, reclamo, sugerencia o felicitación institucional."
      headerIcon={<PqrsIcon color="primary" />}
      width={{ xs: "100%", sm: 540 }}
      isSubmitting={loading}
      submitButtonText={loading ? "Radicando..." : "Radicar Solicitud"}
      actions={
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", width: "100%" }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !subject.trim() || !description.trim()}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            sx={{ fontWeight: 600, minWidth: 150 }}
          >
            {loading ? "Radicando..." : "Radicar Solicitud"}
          </Button>
        </Box>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {isResidenceManager && (
          <Alert severity="info" sx={{ fontSize: "0.85rem", borderRadius: 2 }}>
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
            <InputLabel id="drawer-pqrs-type-label">Tipo de Solicitud</InputLabel>
            <Select
              labelId="drawer-pqrs-type-label"
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
              <InputLabel id="drawer-pqrs-type-label">Tipo de Solicitud</InputLabel>
              <Select
                labelId="drawer-pqrs-type-label"
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
              <InputLabel id="drawer-pqrs-priority-label">Prioridad</InputLabel>
              <Select
                labelId="drawer-pqrs-priority-label"
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
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Evidencias o Archivos Adjuntos (Fotos, Documentos, Reportes)
          </Typography>
          <Button
            variant="outlined"
            component="label"
            size="small"
            startIcon={<CloudUploadIcon />}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Seleccionar Archivos
            <input type="file" multiple hidden onChange={handleFileChange} />
          </Button>

          {files.length > 0 && (
            <List dense sx={{ mt: 1, bgcolor: "action.hover", borderRadius: 2 }}>
              {files.map((file, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => handleRemoveFile(idx)}>
                      <DeleteIcon fontSize="small" color="error" />
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
    </ResponsiveFormDrawer>
  );
}
