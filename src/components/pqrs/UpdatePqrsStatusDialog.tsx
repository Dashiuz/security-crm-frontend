"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Typography,
  Box,
  Alert,
  Stack,
} from "@mui/material";
import { SwapHoriz as TransitionIcon } from "@mui/icons-material";
import { PqrsApi, PqrsStatus, PqrsTicket } from "@/lib/api/pqrs";
import { useNotification } from "@/providers/NotificationProvider";
import PqrsStatusChip, { STATUS_CONFIG } from "./PqrsStatusChip";

interface UpdatePqrsStatusDialogProps {
  open: boolean;
  ticket: PqrsTicket | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_TRANSITIONS: Record<PqrsStatus, PqrsStatus[]> = {
  [PqrsStatus.OPEN]: [PqrsStatus.ASSIGNED, PqrsStatus.REJECTED],
  [PqrsStatus.ASSIGNED]: [PqrsStatus.IN_PROGRESS, PqrsStatus.REJECTED],
  [PqrsStatus.IN_PROGRESS]: [PqrsStatus.RESOLVED],
  [PqrsStatus.RESOLVED]: [PqrsStatus.CLOSED, PqrsStatus.IN_PROGRESS],
  [PqrsStatus.CLOSED]: [],
  [PqrsStatus.REJECTED]: [],
};

export default function UpdatePqrsStatusDialog({
  open,
  ticket,
  onClose,
  onSuccess,
}: UpdatePqrsStatusDialogProps) {
  const { showSuccess, showError } = useNotification();
  const [selectedStatus, setSelectedStatus] = useState<PqrsStatus | "">("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const currentStatus = ticket?.status;
  const allowedNextStatuses = currentStatus ? ALLOWED_TRANSITIONS[currentStatus] || [] : [];
  const isTerminal = allowedNextStatuses.length === 0;

  useEffect(() => {
    if (open) {
      setSelectedStatus("");
      setReason("");
    }
  }, [open, ticket]);

  const handleSubmit = async () => {
    if (!ticket || !selectedStatus) return;
    setLoading(true);
    try {
      await PqrsApi.updateStatus(ticket.id, {
        status: selectedStatus as PqrsStatus,
        reason: reason.trim() || undefined,
      });
      showSuccess("Estado de la solicitud actualizado exitosamente");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || "Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TransitionIcon color="primary" />
        Actualizar Estado de la Solicitud
      </DialogTitle>
      <DialogContent dividers>
        {ticket && (
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Ticket: <strong>{ticket.code}</strong> — {ticket.subject}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Estado Actual:
                </Typography>
                <PqrsStatusChip status={ticket.status} />
              </Stack>
            </Box>

            {isTerminal ? (
              <Alert severity="warning">
                Esta solicitud se encuentra en un estado terminal (
                <strong>{STATUS_CONFIG[ticket.status].label}</strong>) y no admite más transiciones.
              </Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
                  Por regla del sistema, los estados avanzan de forma secuencial:{" "}
                  <strong>
                    {allowedNextStatuses.map((s) => STATUS_CONFIG[s].label).join(" o ")}
                  </strong>
                  .
                </Alert>

                <FormControl fullWidth size="small">
                  <InputLabel id="status-select-label">Nuevo Estado</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={selectedStatus}
                    label="Nuevo Estado"
                    onChange={(e) => setSelectedStatus(e.target.value as PqrsStatus)}
                  >
                    {allowedNextStatuses.map((st) => (
                      <MenuItem key={st} value={st}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PqrsStatusChip status={st} size="small" />
                          <Typography variant="body2">{STATUS_CONFIG[st].label}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Motivo o Justificación del Cambio (Opcional)"
                  placeholder="Detalla la razón del cambio de estado o notas de seguimiento..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedStatus || loading || isTerminal}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <TransitionIcon />}
        >
          {loading ? "Actualizando..." : "Guardar Estado"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
