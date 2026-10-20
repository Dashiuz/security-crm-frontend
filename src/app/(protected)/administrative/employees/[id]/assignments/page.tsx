"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Avatar,
  Divider,
  Stack,
  Skeleton,
  InputBase,
  IconButton,
  FormControlLabel,
  Checkbox,
  Drawer,
  TextField,
  CircularProgress,
  useTheme,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  SearchRounded as SearchIcon,
  BusinessRounded as BusinessIcon,
  DomainDisabledRounded as DomainDisabledIcon,
  HistoryRounded as HistoryIcon,
  CalendarMonthRounded as CalendarIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  CheckCircleRounded as CheckCircleIcon,
  LocationOnRounded as LocationIcon,
  InfoOutlined as InfoIcon,
  SwapHorizRounded as SwapHorizIcon,
  CloseRounded as CloseIcon,
} from "@mui/icons-material";
import { useEmployeeDetail, ActiveAssignmentItem } from "../EmployeeDetailContext";
import { HttpClient } from "@/lib/api/client";
import { useNotification } from "@/providers/NotificationProvider";
import { useRouter } from "next/navigation";

interface ClientOption {
  id: string;
  name: string;
  internalCode?: string | null;
  address?: string | null;
  city?: string | null;
  clientStatus?: string;
}

export default function EmployeeAssignmentsPage() {
  const { employeeId, summary, loading, reloadSummary } = useEmployeeDetail();
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();
  const router = useRouter();

  // Command Box states
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isConcurrent, setIsConcurrent] = useState(true);
  const [assignmentNotes, setAssignmentNotes] = useState("");

  // Assignment drawer state
  const [assignDrawerTarget, setAssignDrawerTarget] = useState<ClientOption | null>(null);
  const [assignDate, setAssignDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [unassignEstimatedDate, setUnassignEstimatedDate] = useState<string>("");
  const [assignDrawerNotes, setAssignDrawerNotes] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Unassign drawer state
  const [unassignTarget, setUnassignTarget] = useState<ActiveAssignmentItem | null>(null);
  const [unassignDate, setUnassignDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [unassignReason, setUnassignReason] = useState("Relevo operacional");
  const [unassignNotes, setUnassignNotes] = useState("");
  const [unassigning, setUnassigning] = useState(false);

  // Fetch clients for the Command Box
  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const res = await HttpClient.get<any>("/client?limit=200");
        const clientList = Array.isArray(res) ? res : res?.data || [];
        setClients(clientList);
      } catch (e: any) {
        console.error("Error loading clients:", e);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const activeAssignments = summary?.activeAssignments || [];
  const clientHistory = summary?.clientHistory || [];

  // Filter clients for Command Box
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return clients.slice(0, 6);
    }
    const term = searchTerm.toLowerCase();
    return clients
      .filter((c) => {
        const name = (c.name || "").toLowerCase();
        const code = (c.internalCode || "").toLowerCase();
        const addr = (c.address || "").toLowerCase();
        return name.includes(term) || code.includes(term) || addr.includes(term);
      })
      .slice(0, 8);
  }, [clients, searchTerm]);

  // Open Assign Drawer
  const handleOpenAssignDrawer = (client: ClientOption) => {
    setAssignDrawerTarget(client);
    setAssignDate(new Date().toISOString().split("T")[0]);
    setUnassignEstimatedDate("");
    setAssignDrawerNotes(assignmentNotes);
  };

  // Confirm Assign Client
  const handleConfirmAssign = async () => {
    if (!employeeId || !assignDrawerTarget) return;
    setAssigning(true);
    try {
      await HttpClient.post(`/employee/${employeeId}/assign-client`, {
        clientId: assignDrawerTarget.id,
        isConcurrent,
        notes: assignDrawerNotes.trim() || undefined,
        assignedAt: assignDate || new Date().toISOString().split("T")[0],
        unassignedAt: unassignEstimatedDate.trim() || undefined,
      });
      showSuccess(`Puesto asignado con éxito en: ${assignDrawerTarget.name}`);
      setAssignDrawerTarget(null);
      setAssignDrawerNotes("");
      setSearchTerm("");
      await reloadSummary();
    } catch (err: any) {
      showError(err.message || "Error al asignar cliente al empleado");
    } finally {
      setAssigning(false);
    }
  };

  // Confirm Unassign Client
  const handleConfirmUnassign = async () => {
    if (!employeeId || !unassignTarget) return;
    setUnassigning(true);
    try {
      await HttpClient.post(`/employee/${employeeId}/unassign-client`, {
        clientId: unassignTarget.clientId,
        reason: unassignReason,
        notes: unassignNotes.trim() || undefined,
        unassignedAt: unassignDate || new Date().toISOString().split("T")[0],
      });
      showSuccess(`Desvinculación procesada para: ${unassignTarget.clientName}`);
      setUnassignTarget(null);
      setUnassignNotes("");
      await reloadSummary();
    } catch (err: any) {
      showError(err.message || "Error al desvincular el cliente");
    } finally {
      setUnassigning(false);
    }
  };

  if (loading && !summary) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton height={120} sx={{ mb: 2 }} />
        <Skeleton height={200} sx={{ mb: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Active Concurrent Assignments Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <BusinessIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Puestos de Trabajo Activos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeAssignments.length === 0
                  ? "Este recurso actualmente está disponible (sin puestos asignados)."
                  : activeAssignments.length === 1
                  ? "1 puesto activo registrado con cobertura operacional."
                  : `${activeAssignments.length} puestos concurrentes activos (multisede / supervisión / relevo).`}
              </Typography>
            </Box>
          </Box>
          <Chip
            size="small"
            label={`${activeAssignments.length} Sedes Activas`}
            color={activeAssignments.length > 0 ? "success" : "default"}
            sx={{ fontWeight: 700, fontSize: "0.75rem" }}
          />
        </Box>

        {activeAssignments.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 2.5,
              border: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <DomainDisabledIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Recurso disponible para asignación
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Utiliza el buscador unificado inferior para vincular a este empleado a una o más sedes operativas.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {activeAssignments.map((assignment, idx) => {
              const isOnlyOne = activeAssignments.length === 1;
              return (
                <Grid size={{ xs: 12, md: isOnlyOne ? 12 : 6 }} key={assignment.clientId || idx}>
                  <Paper
                    variant="outlined"
                    onClick={() => router.push(`/administrative/clients/${assignment.clientId}/overview`)}
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      borderColor: "primary.main",
                      cursor: "pointer",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(33, 150, 243, 0.04)"
                          : "rgba(25, 118, 210, 0.02)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 2,
                      height: "100%",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: theme.shadows[4],
                        borderColor: "primary.dark",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap title={assignment.clientName}>
                            {assignment.clientName}
                          </Typography>
                          {assignment.clientCode && (
                            <Chip size="small" label={assignment.clientCode} variant="outlined" sx={{ height: 20, fontSize: "0.68rem" }} />
                          )}
                        </Box>
                        {assignment.roleName && (
                          <Chip
                            size="small"
                            label={assignment.roleName}
                            color="info"
                            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, mb: 1 }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}
                        >
                          <CalendarIcon sx={{ fontSize: 14, color: "primary.main" }} />
                          Asignado desde: <strong>{assignment.assignedAt}</strong>
                        </Typography>
                        {assignment.notes && (
                          <Typography
                            variant="caption"
                            sx={{ display: "block", color: "text.secondary", fontStyle: "italic", mt: 0.5 }}
                          >
                            &quot;{assignment.notes}&quot;
                          </Typography>
                        )}
                      </Box>

                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnassignDate(new Date().toISOString().split("T")[0]);
                          setUnassignTarget(assignment);
                        }}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          borderRadius: 2,
                          flexShrink: 0,
                        }}
                      >
                        Desvincular Cliente
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      {/* Unified Command Box: Vincular Sede */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ p: 2.5, pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Vincular a Nuevo Cliente / Sede
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Busca una copropiedad o cliente para agregar a las coberturas de este empleado.
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={isConcurrent}
                  onChange={(e) => setIsConcurrent(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption" fontWeight={600} color="text.primary">
                  Asignación Concurrente (mantener puestos actuales)
                </Typography>
              }
            />
          </Box>
        </Box>

        {/* Command Box Input */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2.5,
            py: 1.5,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.01)",
          }}
        >
          <SearchIcon sx={{ color: "text.secondary", mr: 1.5, fontSize: 22 }} />
          <InputBase
            fullWidth
            placeholder="Escribe el nombre o código del cliente para buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ fontSize: "0.95rem" }}
          />
          {loadingClients && <CircularProgress size={18} sx={{ color: "text.secondary" }} />}
        </Box>

        <Divider />

        {/* Optional Assignment Notes input */}
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: "background.paper" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Observaciones de la asignación (opcional, ej. Turno 2x2 diurno, supervisor zonal...)"
            value={assignmentNotes}
            onChange={(e) => setAssignmentNotes(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </Box>

        <Divider />

        {/* Results List */}
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1, maxHeight: 320, overflowY: "auto" }}>
          {filteredClients.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body2">No se encontraron clientes que coincidan con la búsqueda.</Typography>
            </Box>
          ) : (
            filteredClients.map((client) => {
              const isAlreadyAssigned = activeAssignments.some((a) => a.clientId === client.id);

              return (
                <Paper
                  key={client.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    px: 2,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    bgcolor: isAlreadyAssigned ? "action.hover" : "background.paper",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {client.name}
                      </Typography>
                      {client.internalCode && (
                        <Chip size="small" label={client.internalCode} variant="outlined" sx={{ height: 20, fontSize: "0.68rem" }} />
                      )}
                    </Box>
                    {client.address && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 13 }} />
                        {client.address} {client.city ? `• ${client.city}` : ""}
                      </Typography>
                    )}
                  </Box>

                  {isAlreadyAssigned ? (
                    <Chip
                      size="small"
                      icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                      label="Ya Asignado"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                    />
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenAssignDrawer(client)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.78rem",
                        borderRadius: 2,
                        px: 1.8,
                        flexShrink: 0,
                      }}
                    >
                      Asignar a este Puesto
                    </Button>
                  )}
                </Paper>
              );
            })
          )}
        </Box>
      </Paper>

      {/* Chronological History Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HistoryIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              Historial Cronológico de Puestos de Trabajo
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${clientHistory.length} registros`}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
        </Box>

        {clientHistory.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
            <HistoryIcon sx={{ fontSize: 36, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2">No registra historial previo de traslados o puestos.</Typography>
          </Box>
        ) : (
          <Stack spacing={2} sx={{ position: "relative", pl: { xs: 0.5, sm: 1.5 } }}>
            {[...clientHistory].reverse().map((item, idx) => {
              const isCurrent = item.unassignedAt === null;
              return (
                <Box
                  key={item.id || idx}
                  sx={{
                    position: "relative",
                    pl: 3,
                    pb: idx === clientHistory.length - 1 ? 0 : 2,
                    borderLeft: "2px solid",
                    borderColor: isCurrent ? "success.main" : "divider",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: -6,
                      top: 4,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: isCurrent ? "success.main" : "text.disabled",
                      border: "2px solid",
                      borderColor: "background.paper",
                    },
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: isCurrent ? "action.hover" : "background.paper",
                      borderColor: isCurrent ? "success.light" : "divider",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {item.clientName}
                          </Typography>
                          {item.clientCode && (
                            <Chip size="small" label={item.clientCode} variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 14 }} />
                          Desde: <strong>{item.assignedAt}</strong> — Hasta:{" "}
                          <strong>{item.unassignedAt || "Vigente (Presente)"}</strong>
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={isCurrent ? "Vigente" : item.reason || "Cerrado"}
                        color={isCurrent ? "success" : "default"}
                        variant={isCurrent ? "filled" : "outlined"}
                        sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                      />
                    </Box>

                    {item.notes && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: "action.hover", borderRadius: 1.5, borderLeft: "3px solid", borderColor: "primary.light" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                          &quot;{item.notes}&quot;
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>

      {/* Drawer: Desvincular Cliente */}
      <Drawer
        anchor="right"
        open={Boolean(unassignTarget)}
        onClose={() => !unassigning && setUnassignTarget(null)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10,
          "& .MuiDrawer-paper": {
            zIndex: (theme) => theme.zIndex.modal + 10,
            width: { xs: "100%", sm: 460 },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Desvincular Cliente
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cerrar cobertura operacional en {unassignTarget?.clientName}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => !unassigning && setUnassignTarget(null)}
            disabled={unassigning}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Esta acción registrará la fecha de salida en el historial del empleado y liberará la asignación activa en el cliente <strong>{unassignTarget?.clientName}</strong>.
          </Alert>

          <TextField
            fullWidth
            size="small"
            type="date"
            label="Fecha de Desvinculación / Salida"
            value={unassignDate}
            onChange={(e) => setUnassignDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Fecha en que cesa la actividad o turno en esta sede."
          />

          <TextField
            fullWidth
            size="small"
            label="Motivo de la Desvinculación"
            value={unassignReason}
            onChange={(e) => setUnassignReason(e.target.value)}
            placeholder="Ej. Relevo operacional, traslado, fin de cobertura..."
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Observaciones (opcional)"
            placeholder="Notas detalladas sobre el cierre del servicio..."
            value={unassignNotes}
            onChange={(e) => setUnassignNotes(e.target.value)}
          />
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1.5,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.02)",
          }}
        >
          <Button
            onClick={() => setUnassignTarget(null)}
            disabled={unassigning}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmUnassign}
            disabled={unassigning}
            sx={{ fontWeight: 600, px: 2.5 }}
          >
            {unassigning ? <CircularProgress size={20} color="inherit" /> : "Confirmar Desvinculación"}
          </Button>
        </Box>
      </Drawer>

      {/* Drawer: Asignar a Puesto / Cliente */}
      <Drawer
        anchor="right"
        open={Boolean(assignDrawerTarget)}
        onClose={() => !assigning && setAssignDrawerTarget(null)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10,
          "& .MuiDrawer-paper": {
            zIndex: (theme) => theme.zIndex.modal + 10,
            width: { xs: "100%", sm: 460 },
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Asignar Puesto de Trabajo
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Vincular cobertura operacional en {assignDrawerTarget?.name}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => !assigning && setAssignDrawerTarget(null)}
            disabled={assigning}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            El empleado heredará su cargo oficial (<strong>{summary?.employee?.positionName || "Colaborador"}</strong>) de forma estandarizada en el módulo de este cliente.
          </Alert>

          <TextField
            fullWidth
            size="small"
            type="date"
            label="Fecha de Inicio / Entrada"
            value={assignDate}
            onChange={(e) => setAssignDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Fecha en que el empleado comienza operaciones en este cliente."
          />

          <TextField
            fullWidth
            size="small"
            type="date"
            label="Fecha Estimada de Salida / Término (Opcional)"
            value={unassignEstimatedDate}
            onChange={(e) => setUnassignEstimatedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Dejar en blanco si la asignación es indefinida o permanente."
          />

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isConcurrent}
                onChange={(e) => setIsConcurrent(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2" fontWeight={600}>
                Asignación Concurrente (mantener otros puestos activos)
              </Typography>
            }
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Observaciones de la Asignación (opcional)"
            placeholder="Ej. Turno 2x2 rotativo, supervisor zonal, relevo fin de semana..."
            value={assignDrawerNotes}
            onChange={(e) => setAssignDrawerNotes(e.target.value)}
          />
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1.5,
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.02)"
                : "rgba(0, 0, 0, 0.02)",
          }}
        >
          <Button
            onClick={() => setAssignDrawerTarget(null)}
            disabled={assigning}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAssign}
            disabled={assigning}
            sx={{ fontWeight: 600, px: 2.5 }}
          >
            {assigning ? <CircularProgress size={20} color="inherit" /> : "Confirmar Asignación"}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
