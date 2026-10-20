"use client";

import { useState, useEffect } from "react";
import {
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
  Autocomplete,
  Avatar,
} from "@mui/material";
import {
  SwapHoriz as TransitionIcon,
  AssignmentInd as AssignIcon,
  Block as VoidIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { PqrsApi, PqrsStatus, PqrsTicket } from "@/lib/api/pqrs";
import { useNotification } from "@/providers/NotificationProvider";
import PqrsStatusChip, { STATUS_CONFIG } from "./PqrsStatusChip";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";

interface UpdatePqrsStatusDialogProps {
  open: boolean;
  ticket: PqrsTicket | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_TRANSITIONS: Record<PqrsStatus, PqrsStatus[]> = {
  [PqrsStatus.OPEN]: [PqrsStatus.ASSIGNED, PqrsStatus.REJECTED, PqrsStatus.VOIDED],
  [PqrsStatus.ASSIGNED]: [PqrsStatus.IN_PROGRESS, PqrsStatus.REJECTED, PqrsStatus.VOIDED],
  [PqrsStatus.IN_PROGRESS]: [PqrsStatus.RESOLVED],
  [PqrsStatus.RESOLVED]: [PqrsStatus.CLOSED, PqrsStatus.IN_PROGRESS],
  [PqrsStatus.CLOSED]: [],
  [PqrsStatus.REJECTED]: [],
  [PqrsStatus.VOIDED]: [],
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

  // Selector de Funcionario cuando el estado es ASSIGNED
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  const currentStatus = ticket?.status;
  const allowedNextStatuses = currentStatus ? ALLOWED_TRANSITIONS[currentStatus] || [] : [];
  const isTerminal = allowedNextStatuses.length === 0;

  useEffect(() => {
    if (open) {
      setSelectedStatus("");
      setReason("");
      setSelectedUser(ticket?.assignedTo || null);
    }
  }, [open, ticket]);

  // Cargar funcionarios cuando se selecciona ASSIGNED
  useEffect(() => {
    if (open && selectedStatus === PqrsStatus.ASSIGNED && users.length === 0) {
      setFetchingUsers(true);
      HttpClient.get<any[]>("/user?userType=EMPLOYEE")
        .then((data) => {
          const activeStaff = (data || []).filter(
            (u) => u.isActive && !u.isRetired && u.userType !== "RESIDENCE_MANAGER"
          );
          setUsers(activeStaff);
          if (ticket?.assignedToId) {
            const found = activeStaff.find((u) => u.id === ticket.assignedToId);
            if (found) setSelectedUser(found);
          }
        })
        .catch(() => {
          showError("Error al cargar la lista de funcionarios operativos");
        })
        .finally(() => {
          setFetchingUsers(false);
        });
    }
  }, [open, selectedStatus, users.length, ticket, showError]);

  const isAssigning = selectedStatus === PqrsStatus.ASSIGNED;
  const isVoiding = selectedStatus === PqrsStatus.VOIDED;

  const isFormValid = (() => {
    if (!selectedStatus || isTerminal) return false;
    if (isAssigning && !selectedUser?.id && !ticket?.assignedToId) return false;
    if (isVoiding && reason.trim().length < 10) return false;
    return true;
  })();

  const handleSubmit = async () => {
    if (!ticket || !selectedStatus || !isFormValid) return;
    setLoading(true);
    try {
      if (isVoiding) {
        await PqrsApi.void(ticket.id, {
          reason: reason.trim(),
        });
        showSuccess("Solicitud PQRS anulada formalmente");
      } else {
        await PqrsApi.updateStatus(ticket.id, {
          status: selectedStatus as PqrsStatus,
          reason: reason.trim() || undefined,
          assignedToId: isAssigning ? selectedUser?.id : undefined,
        });
        showSuccess("Estado de la solicitud actualizado exitosamente");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || "Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Actualizar Estado de la Solicitud"
      subtitle={
        ticket && currentStatus
          ? `${ticket.code} — Estado Actual: ${STATUS_CONFIG[currentStatus]?.label || currentStatus}`
          : "Gestión del ciclo de vida"
      }
      headerIcon={<TransitionIcon color="primary" />}
      isSubmitting={loading}
      submitButtonText={isVoiding ? "Anular Solicitud" : "Guardar Estado"}
      submitButtonColor={isVoiding ? "error" : "primary"}
      formId="update-pqrs-status-form"
      width={{ xs: "100%", md: 480 }}
    >
      <Box
        component="form"
        id="update-pqrs-status-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        {ticket && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.02)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              INFORMACIÓN DE LA SOLICITUD
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>
              {ticket.code} — {ticket.subject}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Estado Actual:
              </Typography>
              <PqrsStatusChip status={ticket.status} size="small" />
            </Stack>
          </Box>
        )}

        {isTerminal ? (
          <Alert severity="warning" sx={{ fontSize: "0.85rem" }}>
            Esta solicitud se encuentra en un estado terminal (
            <strong>{ticket ? STATUS_CONFIG[ticket.status].label : ""}</strong>) y no
            admite más transiciones.
          </Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
              Transiciones válidas desde el estado actual:{" "}
              <strong>
                {allowedNextStatuses
                  .map((s) => STATUS_CONFIG[s].label)
                  .join(", ")}
              </strong>
              .
            </Alert>

            <FormControl fullWidth size="small">
              <InputLabel id="status-select-label">Nuevo Estado *</InputLabel>
              <Select
                labelId="status-select-label"
                value={selectedStatus}
                label="Nuevo Estado *"
                onChange={(e) => setSelectedStatus(e.target.value as PqrsStatus)}
                required
              >
                {allowedNextStatuses.map((st) => (
                  <MenuItem key={st} value={st}>
                    <Stack direction="row" alignItems="center" spacing={1.2}>
                      <PqrsStatusChip status={st} size="small" />
                      <Typography variant="body2">{STATUS_CONFIG[st].label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Si se selecciona ASIGNADO: Selector obligatorio de funcionario */}
            {isAssigning && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(59, 130, 246, 0.08)"
                      : "rgba(59, 130, 246, 0.04)",
                  border: "1px solid",
                  borderColor: "rgba(59, 130, 246, 0.2)",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    mb: 1.5,
                    fontWeight: 700,
                  }}
                >
                  <AssignIcon color="primary" fontSize="small" />
                  Funcionario Responsable
                </Typography>

                {fetchingUsers ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Autocomplete
                    value={selectedUser}
                    onChange={(_e, val) => setSelectedUser(val)}
                    options={users}
                    getOptionLabel={(opt) =>
                      opt.fullName
                        ? `${opt.fullName} (${opt.position || opt.department || "Funcionario"})`
                        : ""
                    }
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    renderOption={(props, opt) => {
                      const { key, ...rest } = props as any;
                      const initials = (opt.fullName || "U")
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      return (
                        <Box
                          component="li"
                          key={key}
                          {...rest}
                          sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: "0.75rem",
                              bgcolor: "primary.main",
                              color: "#fff",
                            }}
                          >
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {opt.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {opt.position || "Operativo"} • {opt.department || "Seguridad"}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Seleccionar Funcionario Encargado *"
                        placeholder="Buscar por nombre..."
                        required
                        helperText="El funcionario seleccionado pasará a liderar la gestión del caso."
                      />
                    )}
                  />
                )}
              </Box>
            )}

            {/* Si se selecciona ANULADA: Advertencia de irreversibilidad y justificación obligatoria */}
            {isVoiding && (
              <Alert
                severity="error"
                icon={<VoidIcon />}
                sx={{ fontSize: "0.85rem" }}
              >
                <strong>Atención:</strong> La anulación es un estado{" "}
                <strong>terminal e irreversible</strong>. El radicado se
                preservará para auditorías pero ya no recibirá más actuaciones.
                Ingrese una justificación clara de al menos 10 caracteres.
              </Alert>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label={
                isVoiding
                  ? "Motivo de Anulación (Obligatorio, mín. 10 caracteres) *"
                  : "Motivo o Justificación del Cambio (Opcional)"
              }
              placeholder={
                isVoiding
                  ? "Explica detalladamente la causa formal de la anulación..."
                  : "Detalla la razón del cambio de estado o notas de seguimiento..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={isVoiding}
              error={isVoiding && reason.trim().length > 0 && reason.trim().length < 10}
              helperText={
                isVoiding
                  ? `${reason.trim().length}/10 caracteres mínimos requeridos`
                  : undefined
              }
            />
          </>
        )}
      </Box>
    </ResponsiveFormDrawer>
  );
}
