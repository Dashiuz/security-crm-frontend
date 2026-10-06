"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Avatar,
  Breadcrumbs,
  Link as MuiLink,
  Badge,
  Collapse,
  Skeleton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  GridColDef,
  GridActionsCellItem,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  AssignmentInd as AssignIcon,
  SwapHoriz as TransitionIcon,
  Feedback as PqrsIcon,
  PendingActions as PendingIcon,
  Loop as InProgressIcon,
  TaskAlt as ResolvedIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  InfoOutlined as InfoIcon,
  VolumeUpRounded,
  VolumeOffRounded,
} from "@mui/icons-material";
import DataTable from "@/components/common/DataTable";
import ClientAutocomplete from "@/components/common/ClientAutocomplete";
import { useAuth } from "@/components/AuthContext";
import { useNotificationSound } from "@/utils/notification-sound";
import { formatDateTime } from "@/lib/formatters";
import { HttpClient, ApiError } from "@/lib/api/client";
import {
  PqrsApi,
  PqrsPriority,
  PqrsStatus,
  PqrsTicket,
  PqrsType,
} from "@/lib/api/pqrs";
import PqrsStatusChip from "@/components/pqrs/PqrsStatusChip";
import PqrsTypeChip, { TYPE_CONFIG } from "@/components/pqrs/PqrsTypeChip";
import PqrsPriorityChip from "@/components/pqrs/PqrsPriorityChip";
import CreatePqrsDialog from "@/components/pqrs/CreatePqrsDialog";
import AssignPqrsDialog from "@/components/pqrs/AssignPqrsDialog";
import UpdatePqrsStatusDialog from "@/components/pqrs/UpdatePqrsStatusDialog";

export default function PqrsListPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { isMuted, toggleMute } = useNotificationSound();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userType = session?.user?.userType;
  const isResidenceManager = userType === "RESIDENCE_MANAGER";
  const permissions = session?.permissions || [];
  const canManagePqrs =
    permissions.includes("pqrs:manage") ||
    permissions.includes("godlike:manage");
  const canUpdateStatus =
    permissions.includes("pqrs:update") ||
    permissions.includes("godlike:manage");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignTicket, setAssignTicket] = useState<PqrsTicket | null>(null);
  const [statusTicket, setStatusTicket] = useState<PqrsTicket | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tickets Data State for Mobile Card List & Desktop Table
  const [tickets, setTickets] = useState<PqrsTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Metrics summary state
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Fetch metrics summary (aislado por cliente para administradores de conjunto o filtro)
  useEffect(() => {
    PqrsApi.getStats(selectedClient?.id)
      .then((res) => {
        setMetrics(res);
      })
      .catch(() => {});
  }, [refreshTrigger, selectedClient?.id]);

  // Escuchar eventos en tiempo real de PQRS vía SSE para sincronización instantánea
  useEffect(() => {
    const handlePqrsUpdate = () => {
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener("app:pqrs_updated", handlePqrsUpdate);
    return () => {
      window.removeEventListener("app:pqrs_updated", handlePqrsUpdate);
    };
  }, []);

  // Dynamic endpoint with query parameters
  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.append("status", statusFilter);
    if (typeFilter !== "ALL") params.append("type", typeFilter);
    if (priorityFilter !== "ALL") params.append("priority", priorityFilter);
    if (selectedClient?.id) params.append("clientId", selectedClient.id);
    if (debouncedSearch) params.append("search", debouncedSearch);

    const queryStr = params.toString();
    return `/administrative/pqrs${queryStr ? `?${queryStr}` : ""}`;
  }, [statusFilter, typeFilter, priorityFilter, selectedClient, debouncedSearch]);

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setPriorityFilter("ALL");
    setSelectedClient(null);
  };

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    selectedClient !== null;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (typeFilter !== "ALL") count++;
    if (priorityFilter !== "ALL") count++;
    if (selectedClient !== null) count++;
    return count;
  }, [statusFilter, typeFilter, priorityFilter, selectedClient]);

  // Fetch tickets for both desktop and mobile
  const fetchTickets = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const data = await HttpClient.get<any>(endpoint);
        setTickets(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error("Error loading PQRS tickets:", err);
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    const isSilent = tickets.length > 0;
    fetchTickets(isSilent);
  }, [fetchTickets, refreshTrigger]);

  // Grid columns
  const columns: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: "code",
        headerName: "Código",
        width: 160,
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontFamily: "monospace",
              color: "primary.main",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => router.push(`/administrative/pqrs/${params.row.id}`)}
          >
            {params.value}
          </Typography>
        ),
      },
    ];

    if (!isResidenceManager) {
      cols.push({
        field: "client",
        headerName: "Cliente / Conjunto",
        width: 220,
        valueGetter: (_value, row) => row.client?.name || "No especificado",
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {params.value}
          </Typography>
        ),
      });
    }

    cols.push(
      {
        field: "subject",
        headerName: "Asunto",
        minWidth: 260,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {params.value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: "block" }}
            >
              {params.row.description}
            </Typography>
          </Box>
        ),
      },
      {
        field: "type",
        headerName: "Tipo",
        width: 140,
        renderCell: (params: GridRenderCellParams) => (
          <PqrsTypeChip type={params.value as PqrsType} />
        ),
      },
      {
        field: "priority",
        headerName: "Prioridad",
        width: 110,
        renderCell: (params: GridRenderCellParams) => (
          <PqrsPriorityChip priority={params.value as PqrsPriority} />
        ),
      },
      {
        field: "status",
        headerName: "Estado",
        width: 140,
        renderCell: (params: GridRenderCellParams) => (
          <PqrsStatusChip status={params.value as PqrsStatus} />
        ),
      }
    );

    if (!isResidenceManager) {
      cols.push({
        field: "assignedTo",
        headerName: "Asignado A",
        width: 220,
        valueGetter: (_value, row) =>
          row.assignedTo ? row.assignedTo.fullName : "Sin Asignar",
        renderCell: (params: GridRenderCellParams) => {
          if (!params.row.assignedTo) {
            return (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    fontSize: "0.75rem",
                    bgcolor: "action.disabledBackground",
                    color: "text.disabled",
                  }}
                >
                  ?
                </Avatar>
                <Typography variant="body2" color="text.secondary" fontStyle="italic" noWrap>
                  Sin asignar
                </Typography>
              </Stack>
            );
          }

          const name = params.row.assignedTo.fullName;
          const initials = name
            .trim()
            .split(/\s+/)
            .map((n: string) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
              <Avatar
                sx={{
                  width: 26,
                  height: 26,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  bgcolor: "primary.main",
                  color: "#ffffff",
                }}
              >
                {initials}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                {name}
              </Typography>
            </Stack>
          );
        },
      });
    }

    cols.push(
      {
        field: "_count",
        headerName: "Respuestas",
        width: 110,
        headerAlign: "center",
        align: "center",
        valueGetter: (_value, row) => row._count?.messages ?? 0,
        renderCell: (params: GridRenderCellParams) => (
          <Typography
            variant="caption"
            sx={{
              bgcolor: (params.value as number) > 0 ? "primary.50" : "grey.100",
              color: (params.value as number) > 0 ? "primary.main" : "text.secondary",
              fontWeight: 700,
              px: 1.2,
              py: 0.4,
              borderRadius: "12px",
            }}
          >
            {params.value as number}
          </Typography>
        ),
      },
      {
        field: "createdAt",
        headerName: "Radicado El",
        width: 165,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(params.value)}
          </Typography>
        ),
      }
    );

    return cols;
  }, [isResidenceManager, router]);

  // Row custom actions
  const customActions = (row: PqrsTicket) => {
    const actions = [];
    const isTerminal =
      row.status === PqrsStatus.CLOSED || row.status === PqrsStatus.REJECTED;

    // Accion Asignar (Solo administradores del Tenant si no está en estado terminal)
    if (canManagePqrs && !isResidenceManager && !isTerminal) {
      actions.push(
        <GridActionsCellItem
          key="assign"
          icon={<AssignIcon color="primary" fontSize="small" />}
          label="Asignar Funcionario"
          title="Asignar Funcionario"
          onClick={() => setAssignTicket(row)}
          showInMenu={false}
        />
      );
    }

    // Accion Cambiar Estado (si no es estado terminal)
    const canTransition =
      canUpdateStatus ||
      canManagePqrs ||
      row.assignedToId === session?.user?.id;

    if (canTransition && !isTerminal) {
      actions.push(
        <GridActionsCellItem
          key="status"
          icon={<TransitionIcon color="secondary" fontSize="small" />}
          label="Avanzar Estado"
          title="Avanzar Estado"
          onClick={() => setStatusTicket(row)}
          showInMenu={false}
        />
      );
    }

    return actions;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: "100%", overflowX: "hidden" }}>
      {/* 1. Top Header Block (Jerarquía Visual: Breadcrumbs, Título y Acciones al inicio) */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-end" }}
        spacing={1.5}
      >
        <Box sx={{ width: "100%" }}>
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{ mb: 0.5, "& .MuiBreadcrumbs-li": { fontSize: { xs: "0.75rem", sm: "0.85rem" } } }}
          >
            <MuiLink key="dashboard" component={Link} underline="hover" color="inherit" href="/dashboard">
              Dashboard
            </MuiLink>
            {!isResidenceManager && (
              <MuiLink key="resources" component={Link} underline="hover" color="inherit" href="/administrative">
                Mis Recursos
              </MuiLink>
            )}
            <Typography key="current" color="text.primary" sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" }, fontWeight: 600 }}>
              {isResidenceManager ? "Solicitudes PQRS" : "Gestión de PQRS"}
            </Typography>
          </Breadcrumbs>

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.35rem", sm: "1.65rem", md: "1.9rem" },
                  letterSpacing: "-0.02em",
                }}
              >
                {isResidenceManager
                  ? `Solicitudes PQRS - ${session?.user?.client?.name || session?.user?.clientName || "Conjunto"}`
                  : "Gestión Integral de PQRS"}
              </Typography>
              <Tooltip title="Información de la vista">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setInfoDialogOpen(true)}
                  sx={{ mt: 0.2 }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Mobile Header Action Buttons (Mute & Refresh) */}
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ display: { xs: "flex", sm: "none" } }}
            >
              <Tooltip
                title={
                  isMuted
                    ? "Activar notificaciones sonoras"
                    : "Silenciar notificaciones sonoras"
                }
              >
                <IconButton
                  onClick={toggleMute}
                  size="small"
                  color={isMuted ? "default" : "primary"}
                  sx={{ p: 0.5 }}
                  aria-label={
                    isMuted
                      ? "Activar notificaciones sonoras"
                      : "Silenciar notificaciones sonoras"
                  }
                >
                  {isMuted ? (
                    <VolumeOffRounded fontSize="small" />
                  ) : (
                    <VolumeUpRounded fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Actualizar solicitudes">
                <IconButton
                  onClick={() => setRefreshTrigger((prev) => prev + 1)}
                  disabled={loading}
                  size="small"
                  sx={{ p: 0.5 }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Tooltip
            title={
              isMuted
                ? "Activar notificaciones sonoras"
                : "Silenciar notificaciones sonoras"
            }
          >
            <IconButton
              size="small"
              onClick={toggleMute}
              color={isMuted ? "default" : "primary"}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 0.85,
                bgcolor: isMuted ? "background.paper" : "primary.50",
                transition: "all 0.2s",
              }}
              aria-label={
                isMuted
                  ? "Activar notificaciones sonoras"
                  : "Silenciar notificaciones sonoras"
              }
            >
              {isMuted ? (
                <VolumeOffRounded fontSize="small" />
              ) : (
                <VolumeUpRounded fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              borderRadius: 2,
              px: 2,
              py: 0.75,
              bgcolor: "background.paper",
            }}
          >
            Refrescar
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              width: { xs: "100%", sm: "auto" },
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              borderRadius: 2,
              px: 2.2,
              py: 0.75,
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.25)",
            }}
          >
            {isResidenceManager ? "Radicar Solicitud" : "Crear Solicitud"}
          </Button>
        </Stack>
      </Stack>

      {/* 2. Tarjetas de Resumen (KPIs) en Cuadrícula 2x2 en Móvil (xs={6}, md={3}) */}
      <Grid container spacing={{ xs: 1.25, sm: 2 }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              background: "linear-gradient(135deg, #f8f9fa 0%, #eef2f6 100%)",
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Box
              sx={{
                p: { xs: 0.85, sm: 1.2 },
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
              }}
            >
              <PqrsIcon sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" } }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                noWrap
                display="block"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
              >
                Total Solicitudes
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ fontSize: { xs: "1.15rem", sm: "1.5rem" } }}
              >
                {metrics.total}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              background: "linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)",
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Box
              sx={{
                p: { xs: 0.85, sm: 1.2 },
                borderRadius: 2,
                bgcolor: "warning.main",
                color: "white",
                display: "flex",
              }}
            >
              <PendingIcon sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" } }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                noWrap
                display="block"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
              >
                Abiertas / Asignadas
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                color="warning.dark"
                sx={{ fontSize: { xs: "1.15rem", sm: "1.5rem" } }}
              >
                {metrics.pending}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Box
              sx={{
                p: { xs: 0.85, sm: 1.2 },
                borderRadius: 2,
                bgcolor: "info.main",
                color: "white",
                display: "flex",
              }}
            >
              <InProgressIcon sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" } }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                noWrap
                display="block"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
              >
                En Progreso
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                color="info.dark"
                sx={{ fontSize: { xs: "1.15rem", sm: "1.5rem" } }}
              >
                {metrics.inProgress}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Box
              sx={{
                p: { xs: 0.85, sm: 1.2 },
                borderRadius: 2,
                bgcolor: "success.main",
                color: "white",
                display: "flex",
              }}
            >
              <ResolvedIcon sx={{ fontSize: { xs: "1.1rem", sm: "1.5rem" } }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                noWrap
                display="block"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
              >
                Resueltas / Cerradas
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                color="success.dark"
                sx={{ fontSize: { xs: "1.15rem", sm: "1.5rem" } }}
              >
                {metrics.resolved}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 3. Panel de Filtros Colapsable en Móvil con Badge */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por código o asunto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />

              {/* Botón de Filtros para Móvil con Badge de filtros activos */}
              <Box sx={{ display: { xs: "block", md: "none" } }}>
                <Badge badgeContent={activeFiltersCount} color="primary">
                  <Button
                    variant={mobileFiltersOpen || activeFiltersCount > 0 ? "contained" : "outlined"}
                    color={activeFiltersCount > 0 ? "primary" : "inherit"}
                    size="small"
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                    startIcon={<FilterListIcon />}
                    sx={{
                      minWidth: "auto",
                      textTransform: "none",
                      height: 40,
                      px: 1.5,
                      borderRadius: 1.5,
                      fontWeight: 600,
                      fontSize: "0.825rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Filtros
                  </Button>
                </Badge>
              </Box>
            </Stack>
          </Grid>

          {/* Filtros en Desktop (md en adelante) */}
          <Grid
            size={{ xs: 12, md: 9 }}
            sx={{ display: { xs: "none", md: "block" } }}
          >
            <Grid container spacing={1.5} alignItems="center">
              <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filter-status-label">Estado</InputLabel>
                  <Select
                    labelId="filter-status-label"
                    value={statusFilter}
                    label="Estado"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">Todos los Estados</MenuItem>
                    <MenuItem value={PqrsStatus.OPEN}>Abierto</MenuItem>
                    <MenuItem value={PqrsStatus.ASSIGNED}>Asignado</MenuItem>
                    <MenuItem value={PqrsStatus.IN_PROGRESS}>En Progreso</MenuItem>
                    <MenuItem value={PqrsStatus.RESOLVED}>Resuelto</MenuItem>
                    <MenuItem value={PqrsStatus.CLOSED}>Cerrado</MenuItem>
                    <MenuItem value={PqrsStatus.REJECTED}>Rechazado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filter-type-label">Tipo</InputLabel>
                  <Select
                    labelId="filter-type-label"
                    value={typeFilter}
                    label="Tipo"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">Todos los Tipos</MenuItem>
                    {Object.values(PqrsType).map((t) => (
                      <MenuItem key={t} value={t}>
                        {TYPE_CONFIG[t].label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="filter-priority-label">Prioridad</InputLabel>
                  <Select
                    labelId="filter-priority-label"
                    value={priorityFilter}
                    label="Prioridad"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <MenuItem value="ALL">Todas las Prioridades</MenuItem>
                    <MenuItem value={PqrsPriority.LOW}>Baja</MenuItem>
                    <MenuItem value={PqrsPriority.MEDIUM}>Media</MenuItem>
                    <MenuItem value={PqrsPriority.HIGH}>Alta</MenuItem>
                    <MenuItem value={PqrsPriority.CRITICAL}>Crítica</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {!isResidenceManager && canManagePqrs && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <ClientAutocomplete
                    value={selectedClient}
                    onChange={(client) => setSelectedClient(client)}
                    label="Filtrar por Cliente"
                  />
                </Grid>
              )}

              {hasActiveFilters && (
                <Grid size={{ xs: 12, sm: "auto", md: "auto" }}>
                  <Tooltip title="Limpiar todos los filtros">
                    <Button
                      variant="text"
                      size="small"
                      color="inherit"
                      onClick={handleResetFilters}
                      startIcon={<ClearIcon />}
                      sx={{ textTransform: "none", fontSize: "0.8rem" }}
                    >
                      Limpiar
                    </Button>
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>

        {/* Panel Colapsable de Filtros en Móvil (xs y sm) */}
        <Collapse in={mobileFiltersOpen} timeout="auto" unmountOnExit sx={{ display: { xs: "block", md: "none" } }}>
          <Divider sx={{ my: 1.5 }} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="mobile-filter-status-label">Estado</InputLabel>
                <Select
                  labelId="mobile-filter-status-label"
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Todos los Estados</MenuItem>
                  <MenuItem value={PqrsStatus.OPEN}>Abierto</MenuItem>
                  <MenuItem value={PqrsStatus.ASSIGNED}>Asignado</MenuItem>
                  <MenuItem value={PqrsStatus.IN_PROGRESS}>En Progreso</MenuItem>
                  <MenuItem value={PqrsStatus.RESOLVED}>Resuelto</MenuItem>
                  <MenuItem value={PqrsStatus.CLOSED}>Cerrado</MenuItem>
                  <MenuItem value={PqrsStatus.REJECTED}>Rechazado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="mobile-filter-type-label">Tipo</InputLabel>
                <Select
                  labelId="mobile-filter-type-label"
                  value={typeFilter}
                  label="Tipo"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Todos los Tipos</MenuItem>
                  {Object.values(PqrsType).map((t) => (
                    <MenuItem key={t} value={t}>
                      {TYPE_CONFIG[t].label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="mobile-filter-priority-label">Prioridad</InputLabel>
                <Select
                  labelId="mobile-filter-priority-label"
                  value={priorityFilter}
                  label="Prioridad"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="ALL">Todas</MenuItem>
                  <MenuItem value={PqrsPriority.LOW}>Baja</MenuItem>
                  <MenuItem value={PqrsPriority.MEDIUM}>Media</MenuItem>
                  <MenuItem value={PqrsPriority.HIGH}>Alta</MenuItem>
                  <MenuItem value={PqrsPriority.CRITICAL}>Crítica</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {!isResidenceManager && canManagePqrs && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <ClientAutocomplete
                  value={selectedClient}
                  onChange={(client) => setSelectedClient(client)}
                  label="Filtrar por Cliente"
                />
              </Grid>
            )}

            {hasActiveFilters && (
              <Grid size={{ xs: 12 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  color="inherit"
                  onClick={handleResetFilters}
                  startIcon={<ClearIcon />}
                  sx={{ textTransform: "none", py: 0.5, borderRadius: 1.5 }}
                >
                  Limpiar todos los filtros
                </Button>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </Paper>

      {/* 4. Vista de Contenido: Tarjetas en Móvil (xs/sm) o Tabla en Desktop (md+) */}
      {(!mounted || isMobile) ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {loading ? (
          Array.from(new Array(4)).map((_, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Skeleton width={120} height={24} />
                  <Skeleton width={80} height={24} />
                </Stack>
                <Skeleton width="90%" height={20} />
                <Skeleton width="60%" height={16} />
                <Stack direction="row" spacing={1}>
                  <Skeleton width={70} height={24} />
                  <Skeleton width={50} height={24} />
                </Stack>
              </Stack>
            </Paper>
          ))
        ) : tickets.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.paper",
            }}
          >
            <PqrsIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              No se encontraron solicitudes PQRS
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {hasActiveFilters
                ? "No hay resultados que coincidan con los filtros aplicados."
                : "Aún no se han radicado solicitudes de PQRS."}
            </Typography>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                startIcon={<ClearIcon />}
                sx={{ textTransform: "none" }}
              >
                Limpiar filtros
              </Button>
            )}
          </Paper>
        ) : (
          tickets.map((row) => {
            const isTerminal =
              row.status === PqrsStatus.CLOSED || row.status === PqrsStatus.REJECTED;
            const canTransition =
              canUpdateStatus ||
              canManagePqrs ||
              row.assignedToId === session?.user?.id;

            return (
              <Paper
                key={row.id}
                variant="outlined"
                onClick={() => router.push(`/administrative/pqrs/${row.id}`)}
                sx={{
                  p: 1.75,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  },
                }}
              >
                {/* Cabecera de tarjeta: Código a la izq y Chip de Estado a la der */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      fontFamily: "monospace",
                      color: "primary.main",
                      fontSize: "0.95rem",
                    }}
                  >
                    {row.code}
                  </Typography>
                  <PqrsStatusChip status={row.status} />
                </Stack>

                {/* Cuerpo: Asunto, Cliente y Chips de Tipo y Prioridad */}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: "text.primary",
                    mb: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.subject}
                </Typography>

                {!isResidenceManager && row.client && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mb: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.client.name}
                  </Typography>
                )}

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ mb: 1.25, flexWrap: "wrap", gap: 0.75 }}
                >
                  <PqrsTypeChip type={row.type} />
                  <PqrsPriorityChip priority={row.priority} />
                  {row._count && row._count.messages > 0 && (
                    <Chip
                      size="small"
                      label={`${row._count.messages} ${row._count.messages === 1 ? "mensaje" : "mensajes"}`}
                      variant="outlined"
                      color="primary"
                      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                    />
                  )}
                </Stack>

                {/* Pie de tarjeta: Fecha a la izq y Botones de acción a la der */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    pt: 1,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(row.createdAt)}
                  </Typography>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {canManagePqrs && !isResidenceManager && !isTerminal && (
                      <Tooltip title="Asignar funcionario">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignTicket(row);
                          }}
                          sx={{ p: 0.5 }}
                        >
                          <AssignIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {canTransition && !isTerminal && (
                      <Tooltip title="Avanzar estado">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusTicket(row);
                          }}
                          sx={{ p: 0.5 }}
                        >
                          <TransitionIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Ver detalle">
                      <IconButton
                        size="small"
                        color="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/administrative/pqrs/${row.id}`);
                        }}
                        sx={{ p: 0.5 }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            );
          })
        )}
      </Box>
    ) : (
      <DataTable
        title={
          isResidenceManager
            ? `Solicitudes PQRS - ${session?.user?.client?.name || session?.user?.clientName || "Conjunto"}`
            : "Gestión Integral de PQRS"
        }
        endpoint={endpoint}
        rows={tickets}
        loading={loading}
        hideHeader={true}
        columns={columns}
        breadcrumbs={
          isResidenceManager
            ? [{ label: "Solicitudes PQRS" }]
            : [{ label: "Mis Recursos" }, { label: "Gestión de PQRS" }]
        }
        onCreate={() => setCreateDialogOpen(true)}
        onView={(row) => router.push(`/administrative/pqrs/${row.id}`)}
        customActions={customActions}
        refreshTrigger={refreshTrigger}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        hideStatusFilter
      />
    )}

      {/* Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Información del Módulo de PQRS
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            Canal B2B formal de radicación y seguimiento de Peticiones, Quejas, Reclamos, Sugerencias y Felicitaciones entre Administradores de Conjuntos y la Empresa de Seguridad.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Haz clic en 'Radicar Solicitud' para crear un nuevo ticket con anexos y evidencias. Utiliza el ícono del ojo para ver el historial y responder al cliente en el hilo de mensajes. Los administradores pueden asignar el ticket a funcionarios y avanzar su estado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Entendido</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogs */}
      <CreatePqrsDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={(newId) => {
          setRefreshTrigger((prev) => prev + 1);
          if (newId) {
            router.push(`/administrative/pqrs/${newId}`);
          }
        }}
      />

      <AssignPqrsDialog
        open={Boolean(assignTicket)}
        ticket={assignTicket}
        onClose={() => setAssignTicket(null)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <UpdatePqrsStatusDialog
        open={Boolean(statusTicket)}
        ticket={statusTicket}
        onClose={() => setStatusTicket(null)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </Box>
  );
}
