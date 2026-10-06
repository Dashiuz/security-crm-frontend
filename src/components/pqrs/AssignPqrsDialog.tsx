"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  Alert,
  Autocomplete,
  TextField,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  AssignmentInd as AssignIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { HttpClient } from "@/lib/api/client";
import { PqrsApi, PqrsTicket, PqrsPriority } from "@/lib/api/pqrs";
import { useNotification } from "@/providers/NotificationProvider";

interface AssignPqrsDialogProps {
  open: boolean;
  ticket: PqrsTicket | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignPqrsDialog({
  open,
  ticket,
  onClose,
  onSuccess,
}: AssignPqrsDialogProps) {
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [priority, setPriority] = useState<PqrsPriority>(PqrsPriority.MEDIUM);
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Debounce de 500ms para la búsqueda de funcionarios
  useEffect(() => {
    if (!inputValue) {
      setDebouncedSearch("");
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue.trim().toLowerCase());
      setIsDebouncing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Cargar funcionarios al abrir el modal
  useEffect(() => {
    if (open) {
      setFetchingUsers(true);
      setInputValue("");
      setDebouncedSearch("");
      setIsDebouncing(false);
      setPriority(ticket?.priority || PqrsPriority.MEDIUM);

      HttpClient.get<any[]>("/user")
        .then((data) => {
          const activeUsers = (data || []).filter(
            (u) =>
              u.isActive &&
              !u.isRetired &&
              u.userType !== "RESIDENCE_MANAGER"
          );
          setUsers(activeUsers);

          if (ticket?.assignedToId) {
            const found = activeUsers.find((u) => u.id === ticket.assignedToId);
            setSelectedUser(found || ticket.assignedTo || null);
          } else {
            setSelectedUser(null);
          }
        })
        .catch(() => {
          showError("Error al cargar la lista de funcionarios disponibles");
        })
        .finally(() => {
          setFetchingUsers(false);
        });
    }
  }, [open, ticket, showError]);

  // Filtrar funcionarios basado en el debounced search
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) {
      return users;
    }
    return users.filter((u) => {
      const name = (u.fullName || "").toLowerCase();
      const pos = (u.position || "").toLowerCase();
      const dep = (u.department || "").toLowerCase();
      const doc = (u.document || "").toLowerCase();
      return (
        name.includes(debouncedSearch) ||
        pos.includes(debouncedSearch) ||
        dep.includes(debouncedSearch) ||
        doc.includes(debouncedSearch)
      );
    });
  }, [users, debouncedSearch]);

  const handleSubmit = async () => {
    if (!ticket || !selectedUser?.id) return;
    setLoading(true);
    try {
      await PqrsApi.assign(ticket.id, {
        assignedToId: selectedUser.id,
        priority,
      });
      showSuccess("Solicitud PQRS asignada exitosamente");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || "Error al asignar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 3 },
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <AssignIcon color="primary" />
        Asignar Funcionario Encargado
      </DialogTitle>
      <DialogContent dividers>
        {ticket && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Ticket: <strong>{ticket.code}</strong> — {ticket.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliente: {ticket.client?.name || "No especificado"}
            </Typography>
          </Box>
        )}

        <Alert severity="info" sx={{ mb: 2.5 }}>
          Al asignar este ticket, si se encuentra en estado <strong>ABIERTO</strong>, pasará
          automáticamente a <strong>ASIGNADO</strong> y el funcionario asignado recibirá la
          notificación.
        </Alert>

        {fetchingUsers ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Autocomplete
            value={selectedUser}
            onChange={(_event, newValue) => {
              setSelectedUser(newValue);
            }}
            inputValue={inputValue}
            onInputChange={(_event, newInputValue, reason) => {
              if (reason === "input") {
                setInputValue(newInputValue);
              } else if (reason === "clear") {
                setInputValue("");
              }
            }}
            options={filteredUsers}
            getOptionLabel={(option) =>
              option.fullName
                ? `${option.fullName} (${option.position || option.department || "Funcionario"})`
                : ""
            }
            isOptionEqualToValue={(option, val) => option.id === val.id}
            loading={fetchingUsers || isDebouncing}
            filterOptions={(x) => x}
            noOptionsText={
              isDebouncing
                ? "Buscando funcionarios..."
                : "No se encontraron funcionarios que coincidan"
            }
            renderOption={(props, option) => {
              const { key, ...restProps } = props as any;
              const initials = (option.fullName || "U")
                .trim()
                .split(/\s+/)
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <Box
                  component="li"
                  key={option.id || key}
                  {...restProps}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1,
                    px: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      bgcolor: "primary.main",
                      color: "#ffffff",
                    }}
                  >
                    {initials}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {option.fullName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      display="block"
                    >
                      {option.position || option.department || "Operaciones"}
                      {option.document ? ` • C.C. ${option.document}` : ""}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar Funcionario"
                placeholder="Escribe el nombre, cargo o documento..."
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon color="action" sx={{ mr: 0.5, fontSize: 20 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {isDebouncing ? (
                        <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        )}

        <FormControl fullWidth size="small" sx={{ mt: 2.5 }}>
          <InputLabel id="assign-priority-label">Prioridad de la Solicitud</InputLabel>
          <Select
            labelId="assign-priority-label"
            value={priority}
            label="Prioridad de la Solicitud"
            onChange={(e) => setPriority(e.target.value as PqrsPriority)}
          >
            <MenuItem value={PqrsPriority.LOW}>🟢 Baja</MenuItem>
            <MenuItem value={PqrsPriority.MEDIUM}>🟡 Media</MenuItem>
            <MenuItem value={PqrsPriority.HIGH}>🟠 Alta</MenuItem>
            <MenuItem value={PqrsPriority.CRITICAL}>🔴 Crítica</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedUser?.id || loading || fetchingUsers}
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AssignIcon />
            )
          }
        >
          {loading ? "Asignando..." : "Confirmar Asignación"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
