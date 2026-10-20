"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Paper,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  InputAdornment,
} from "@mui/material";
import {
  BusinessOutlined as BusinessIcon,
  Domain as DomainIcon,
  DomainDisabled as DomainDisabledIcon,
  LinkOff as LinkOffIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline as CheckCircleIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";

interface ClientOption {
  id: string;
  name: string;
  internalCode?: string;
  address?: string;
}

interface EmployeeAssignClientDrawerProps {
  open: boolean;
  onClose: () => void;
  employee: any | null;
  onSuccess: () => void;
}

export default function EmployeeAssignClientDrawer({
  open,
  onClose,
  employee,
  onSuccess,
}: EmployeeAssignClientDrawerProps) {
  const { showError, showSuccess } = useNotification();
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Search & Clients List
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);

  // Form States for Assignment
  const [isUnassignToday, setIsUnassignToday] = useState(true);
  const [customUnassignDate, setCustomUnassignDate] = useState(todayIso);
  const [isAssignToday, setIsAssignToday] = useState(true);
  const [customAssignDate, setCustomAssignDate] = useState(todayIso);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form States for Direct Unassignment
  const [showDirectUnassign, setShowDirectUnassign] = useState(false);
  const [directUnassignToday, setDirectUnassignToday] = useState(true);
  const [directUnassignCustomDate, setDirectUnassignCustomDate] = useState(todayIso);
  const [directUnassignNotes, setDirectUnassignNotes] = useState("");
  const [unassigning, setUnassigning] = useState(false);

  // Debounce search term by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load clients when drawer opens
  useEffect(() => {
    if (open) {
      setLoadingClients(true);
      HttpClient.get<any[]>("/client")
        .then((data) => {
          if (Array.isArray(data)) {
            setClients(
              data.map((c) => ({
                id: c.id,
                name: c.name,
                internalCode: c.internalCode,
                address: c.address,
              })),
            );
          }
        })
        .catch((err) => {
          console.error("Error fetching clients:", err);
        })
        .finally(() => {
          setLoadingClients(false);
        });
    } else {
      // Reset state on close
      setSearchTerm("");
      setSelectedClient(null);
      setShowDirectUnassign(false);
      setIsUnassignToday(true);
      setCustomUnassignDate(todayIso);
      setIsAssignToday(true);
      setCustomAssignDate(todayIso);
      setNotes("");
      setDirectUnassignNotes("");
    }
  }, [open, todayIso]);

  // Filter clients by search query (excluding the currently assigned client)
  const filteredClients = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return clients
      .filter((c) => c.id !== employee?.clientId)
      .filter(
        (c) =>
          !query ||
          c.name.toLowerCase().includes(query) ||
          (c.internalCode && c.internalCode.toLowerCase().includes(query)),
      )
      .slice(0, 15);
  }, [clients, debouncedSearch, employee?.clientId]);

  const initials = employee?.fullName
    ? employee.fullName
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
    : "EM";

  const historyList = useMemo(() => {
    if (!employee || !Array.isArray(employee.clientHistory)) return [];
    return [...employee.clientHistory].reverse();
  }, [employee]);

  // Handle Client Assignment Submission
  const handleAssignSubmit = async () => {
    if (!employee || !selectedClient) return;

    const assignedAt = isAssignToday ? todayIso : customAssignDate;
    const unassignedAt = isUnassignToday ? todayIso : customUnassignDate;

    if (employee.clientId && unassignedAt > assignedAt) {
      showError(
        "La fecha de desvinculación del puesto anterior no puede ser posterior a la fecha de inicio en el nuevo puesto.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await HttpClient.patch(`/employee/${employee.id}/assign-client`, {
        clientId: selectedClient.id,
        assignedAt,
        unassignedAt: employee.clientId ? unassignedAt : undefined,
        notes: notes.trim() || undefined,
      });

      showSuccess(
        `Empleado asignado exitosamente a ${selectedClient.name}`,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || "Error al asignar cliente");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Direct Unassignment Submission
  const handleDirectUnassignSubmit = async () => {
    if (!employee || !employee.clientId) return;

    const unassignedAt = directUnassignToday
      ? todayIso
      : directUnassignCustomDate;

    setUnassigning(true);
    try {
      await HttpClient.patch(`/employee/${employee.id}/unassign-client`, {
        unassignedAt,
        notes: directUnassignNotes.trim() || undefined,
      });

      showSuccess(
        "Empleado desvinculado del puesto exitosamente. Estado actual: Sin Asignar",
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || "Error al desvincular al empleado");
    } finally {
      setUnassigning(false);
    }
  };

  return (
    <ResponsiveFormDrawer
      open={open}
      onClose={onClose}
      title="Asignar Cliente / Puesto"
      subtitle="Gestión operativa de vinculación y relevos de puesto de trabajo"
      headerIcon={
        <BusinessIcon color="primary" sx={{ fontSize: { xs: 24, sm: 28 } }} />
      }
      width={{ xs: "100%", sm: 540, md: 580 }}
    >
      <Stack spacing={2.5}>
        {/* 1. Header Empleado */}
        {employee && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (t) =>
                t.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.03)"
                  : "grey.50",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: "primary.main",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {employee.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {employee.documentType || "CC"}: {employee.document}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap", gap: 0.5 }}>
                  <Chip
                    size="small"
                    label={employee.positionName || "Sin Cargo"}
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    label={employee.departmentName || "Operaciones"}
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
                  />
                </Stack>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* 2. Puesto / Situación Actual */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: employee?.clientId ? "primary.light" : "divider",
            bgcolor: employee?.clientId
              ? (t) =>
                  t.palette.mode === "dark"
                    ? "rgba(25, 118, 210, 0.12)"
                    : "rgba(25, 118, 210, 0.04)"
              : "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              {employee?.clientId ? (
                <DomainIcon color="primary" sx={{ fontSize: 28 }} />
              ) : (
                <DomainDisabledIcon color="action" sx={{ fontSize: 28 }} />
              )}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase" }}>
                  Puesto de Trabajo Actual
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {employee?.clientName || "Sin Asignar (Disponible)"}
                </Typography>
              </Box>
            </Box>
            <Chip
              size="small"
              label={employee?.clientId ? "ACTIVO" : "DISPONIBLE"}
              color={employee?.clientId ? "primary" : "default"}
              sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }}
            />
          </Box>

          {/* Botón y Formulario de Desvinculación Directa */}
          {employee?.clientId && (
            <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
              {!showDirectUnassign ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<LinkOffIcon />}
                  onClick={() => setShowDirectUnassign(true)}
                  sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.8rem" }}
                >
                  Desvincular del puesto actual
                </Button>
              ) : (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: (t) =>
                      t.palette.mode === "dark"
                        ? "rgba(237, 108, 2, 0.12)"
                        : "rgba(237, 108, 2, 0.08)",
                    border: "1px solid",
                    borderColor: "warning.main",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "warning.main", mb: 1 }}>
                    Desvinculación de {employee.clientName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    El empleado quedará en estado <strong>Sin Asignar / Disponible</strong>.
                  </Typography>

                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={directUnassignToday}
                        onChange={(e) => setDirectUnassignToday(e.target.checked)}
                      />
                    }
                    label={
                      <Typography component="span" variant="body2" sx={{ fontSize: "0.85rem" }}>
                        Fecha de desvinculación: <strong>Hoy ({todayIso})</strong>
                      </Typography>
                    }
                  />

                  {!directUnassignToday && (
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Fecha de Desvinculación Efectiva"
                      value={directUnassignCustomDate}
                      onChange={(e) => setDirectUnassignCustomDate(e.target.value)}
                      sx={{ mt: 1, mb: 1.5 }}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Motivo u observaciones del retiro (opcional)"
                    value={directUnassignNotes}
                    onChange={(e) => setDirectUnassignNotes(e.target.value)}
                    sx={{ mt: 1, mb: 1.5 }}
                  />

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      color="inherit"
                      disabled={unassigning}
                      onClick={() => setShowDirectUnassign(false)}
                      sx={{ textTransform: "none" }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      disabled={unassigning}
                      onClick={handleDirectUnassignSubmit}
                      startIcon={
                        unassigning ? <CircularProgress size={14} color="inherit" /> : <LinkOffIcon />
                      }
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {unassigning ? "Desvinculando..." : "Confirmar Desvinculación"}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </Paper>

        <Divider />

        {/* 3. Selección y Asignación de Nuevo Cliente */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentTurnedInIcon color="primary" fontSize="small" />
            Vincular a Nuevo Cliente
          </Typography>

          {!selectedClient ? (
            <Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar cliente por nombre o código (ej. San Telmo, CLI-2005)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        {loadingClients ? (
                          <CircularProgress size={18} />
                        ) : (
                          <SearchIcon color="action" fontSize="small" />
                        )}
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ mb: 1.5 }}
              />

              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 220,
                  overflowY: "auto",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                }}
              >
                {filteredClients.length > 0 ? (
                  <List dense disablePadding>
                    {filteredClients.map((client) => (
                      <ListItemButton
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        sx={{
                          py: 1,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {client.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="div">
                            {[client.internalCode ? `Código: ${client.internalCode}` : "", client.address]
                              .filter(Boolean)
                              .join(" • ")}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: "none", fontSize: "0.75rem", ml: 1 }}
                        >
                          Seleccionar
                        </Button>
                      </ListItemButton>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm.trim()
                        ? "No se encontraron clientes coincidentes"
                        : "No hay más clientes disponibles"}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          ) : (
            /* Cliente Seleccionado y Formulario de Confirmación */
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "2px solid",
                borderColor: "primary.main",
                bgcolor: (t) =>
                  t.palette.mode === "dark"
                    ? "rgba(25, 118, 210, 0.16)"
                    : "rgba(25, 118, 210, 0.05)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                    Cliente Seleccionado para Asignación
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: "1.05rem" }}>
                    {selectedClient.name}
                  </Typography>
                  {selectedClient.internalCode && (
                    <Chip
                      size="small"
                      label={`Código: ${selectedClient.internalCode}`}
                      variant="outlined"
                      color="primary"
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, mt: 0.5 }}
                    />
                  )}
                </Box>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setSelectedClient(null)}
                  sx={{ textTransform: "none", fontSize: "0.75rem" }}
                >
                  Cambiar
                </Button>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Selección de Fechas */}
              <Stack spacing={1.5}>
                {/* Si ya tenía cliente asignado: Preguntar por desvinculación */}
                {employee?.clientId && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block", mb: 0.5 }}>
                      1. Desvinculación de {employee.clientName}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={isUnassignToday}
                          onChange={(e) => setIsUnassignToday(e.target.checked)}
                        />
                      }
                      label={
                        <Typography component="span" variant="body2" sx={{ fontSize: "0.85rem" }}>
                          Fecha de salida: <strong>Hoy ({todayIso})</strong>
                        </Typography>
                      }
                    />
                    {!isUnassignToday && (
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Fecha de Salida Efectiva"
                        value={customUnassignDate}
                        onChange={(e) => setCustomUnassignDate(e.target.value)}
                        sx={{ mt: 0.75 }}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    )}
                  </Box>
                )}

                {/* Preguntar por vinculación a nuevo cliente */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.primary", display: "block", mb: 0.5 }}>
                    {employee?.clientId ? "2." : "1."} Vinculación a {selectedClient.name}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={isAssignToday}
                        onChange={(e) => setIsAssignToday(e.target.checked)}
                      />
                    }
                    label={
                      <Typography component="span" variant="body2" sx={{ fontSize: "0.85rem" }}>
                        Fecha de inicio: <strong>Hoy ({todayIso})</strong>
                      </Typography>
                    }
                  />
                  {!isAssignToday && (
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Fecha de Inicio Efectiva"
                      value={customAssignDate}
                      onChange={(e) => setCustomAssignDate(e.target.value)}
                      sx={{ mt: 0.75 }}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                </Box>

                {/* Observaciones */}
                <TextField
                  fullWidth
                  size="small"
                  label="Observaciones o Motivo del Relevo (opcional)"
                  placeholder="Ej. Solicitud de puesto por administración, relevo operativo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={2}
                />
              </Stack>

              <Box sx={{ mt: 2.5, display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                <Button
                  onClick={() => setSelectedClient(null)}
                  disabled={submitting}
                  color="inherit"
                  sx={{ textTransform: "none" }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  onClick={handleAssignSubmit}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <CheckCircleIcon />
                    )
                  }
                  sx={{ fontWeight: 700, textTransform: "none" }}
                >
                  {submitting ? "Guardando..." : "Confirmar Asignación"}
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* 4. Acordeón de Historial de Puestos Previos */}
        <Accordion
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px !important",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HistoryIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Historial de Puestos de Trabajo ({historyList.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
            {historyList.length > 0 ? (
              <List dense disablePadding>
                {historyList.map((item: any, idx: number) => {
                  const isCurrent = item.unassignedAt === null;
                  return (
                    <ListItem
                      key={item.id || idx}
                      sx={{
                        py: 1.25,
                        px: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: isCurrent ? "primary.light" : "divider",
                        bgcolor: isCurrent
                          ? (t) =>
                              t.palette.mode === "dark"
                                ? "rgba(25, 118, 210, 0.12)"
                                : "rgba(25, 118, 210, 0.04)"
                          : "background.paper",
                      }}
                    >
                      <Box sx={{ width: "100%" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {item.clientName}
                          </Typography>
                          {isCurrent ? (
                            <Chip
                              size="small"
                              label="Vigente"
                              color="success"
                              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="Finalizado"
                              variant="outlined"
                              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" component="div">
                            Periodo: <strong>{item.assignedAt || item.startDate}</strong> —{" "}
                            {item.unassignedAt || item.endDate ? (
                              <strong>{item.unassignedAt || item.endDate}</strong>
                            ) : (
                              "Presente"
                            )}
                          </Typography>
                          {item.notes && (
                            <Typography variant="caption" color="text.secondary" component="div" sx={{ fontStyle: "italic", mt: 0.25 }}>
                              Nota: {item.notes}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ p: 1.5, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Sin historial de asignaciones registrado para este empleado.
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>
    </ResponsiveFormDrawer>
  );
}
