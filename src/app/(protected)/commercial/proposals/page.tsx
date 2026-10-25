"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  DescriptionOutlined,
  PictureAsPdf,
  EditOutlined,
  TuneOutlined,
  TrendingUp,
  WarningAmber,
  Block,
  CheckCircle,
} from "@mui/icons-material";
import Link from "next/link";
import SplitScreenProposalWorkspace from "./components/SplitScreenProposalWorkspace";
import {
  commercialProposalsApi,
  CommercialProposalDto,
  ProposalStatus,
  PnlHealthStatus,
} from "@/lib/api/commercial-proposals";

export default function ProposalsPage() {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<CommercialProposalDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [proposals, setProposals] = useState<CommercialProposalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await commercialProposalsApi.getProposals(params);
      setProposals(res.data || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar las propuestas comerciales");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProposals();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProposals]);

  const getStatusChip = (status: ProposalStatus) => {
    switch (status) {
      case "WON":
        return <Chip label="Aceptada (Ganada)" size="small" color="success" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "SENT_TO_CLIENT":
        return <Chip label="Enviada al Cliente" size="small" color="primary" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "APPROVED_INTERNAL":
        return <Chip label="Aprobada Internamente" size="small" color="info" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "UNDER_REVIEW":
        return <Chip label="En Revisión P&L" size="small" color="warning" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "DRAFT":
        return <Chip label="Borrador" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "LOST":
        return <Chip label="Perdida / Descartada" size="small" color="error" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
      case "VOIDED":
        return <Chip label="Anulada" size="small" sx={{ fontWeight: 700, fontSize: "0.72rem", bgcolor: "neutral.200" }} />;
      default:
        return <Chip label={status} size="small" variant="outlined" />;
    }
  };

  const getPnlBadge = (status: PnlHealthStatus, marginPct: number) => {
    switch (status) {
      case "PROFITABLE":
        return (
          <Tooltip title="Margen Rentable (>= 15%)">
            <Chip
              icon={<TrendingUp fontSize="small" />}
              label={`${Number(marginPct || 0).toFixed(1)}%`}
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: "0.75rem" }}
            />
          </Tooltip>
        );
      case "WARNING_LOW_MARGIN":
        return (
          <Tooltip title="Margen Bajo (8% - 14.99%) - Requiere Aprobación">
            <Chip
              icon={<WarningAmber fontSize="small" />}
              label={`${Number(marginPct || 0).toFixed(1)}%`}
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: "0.75rem" }}
            />
          </Tooltip>
        );
      case "DEFICIT_BLOCKED":
        return (
          <Tooltip title="Margen Deficitario (< 8%) - Emisión Bloqueada">
            <Chip
              icon={<Block fontSize="small" />}
              label={`${Number(marginPct || 0).toFixed(1)}%`}
              size="small"
              color="error"
              variant="filled"
              sx={{ fontWeight: 700, fontSize: "0.75rem" }}
            />
          </Tooltip>
        );
    }
  };

  const handleOpenWorkspace = (proposal?: CommercialProposalDto) => {
    setSelectedProposal(proposal || null);
    setWorkspaceOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 1.5, fontSize: "0.85rem" }}>
        <Typography color="inherit">Dirección Comercial</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>
          Propuestas y Cotizaciones
        </Typography>
      </Breadcrumbs>

      {/* Hero Header */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
            Propuestas y Cotizaciones Comerciales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generación con semáforo P&L en vivo, cálculo estatutario SVSP y dossieres tácticos.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Link href="/commercial/settings" style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<TuneOutlined />}
              sx={{ borderRadius: 2 }}
            >
              Configurar Tarifas y Plantillas
            </Button>
          </Link>

          <Button
            variant="contained"
            size="medium"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenWorkspace()}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
          >
            Nueva Propuesta
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Total Propuestas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", my: 0.5 }}>
                {proposals.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Registradas en sistema
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Enviadas al Cliente
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#d97706", my: 0.5 }}>
                {proposals.filter((p) => p.status === "SENT_TO_CLIENT").length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pendientes de firma o decisión
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Aceptadas / Ganadas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "success.main", my: 0.5 }}>
                {proposals.filter((p) => p.status === "WON").length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Habilitadas para Orden de Servicio (OS)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2.5, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Pipeline Mensual (COP)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", my: 0.75 }}>
                $ {proposals.reduce((a, b) => a + Number(b.totalMonthlyWithTax || 0), 0).toLocaleString("es-CO")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Monto facturable mensual proyectado
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems="center">
          <TextField
            placeholder="Buscar por consecutivo, cliente o NIT..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: "100%", sm: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[
              { id: "ALL", label: "Todas" },
              { id: "DRAFT", label: "Borradores" },
              { id: "UNDER_REVIEW", label: "En Revisión" },
              { id: "APPROVED_INTERNAL", label: "Aprobadas" },
              { id: "SENT_TO_CLIENT", label: "Enviadas" },
              { id: "WON", label: "Ganadas" },
            ].map((st) => (
              <Chip
                key={st.id}
                label={st.label}
                onClick={() => setStatusFilter(st.id)}
                color={statusFilter === st.id ? "primary" : "default"}
                variant={statusFilter === st.id ? "filled" : "outlined"}
                sx={{ fontWeight: 600, fontSize: "0.75rem", mb: { xs: 0.5, sm: 0 } }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Proposals Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: "neutral.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Consecutivo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cliente / Razón Social</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Valor Mensual (COP)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Semáforo P&L</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha Creación</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Consultando propuestas comerciales...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : proposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <DescriptionOutlined sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    No hay propuestas registradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Haga clic en &quot;Nueva Propuesta&quot; para iniciar una cotización con semáforo P&L en vivo.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              proposals.map((row) => (
                <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 700, color: "primary.main", fontFamily: "monospace" }}>
                    {row.proposalFolioCode}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      v{row.versionNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.client?.name || "Cliente Sin Asignar"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      NIT: {row.client?.nit || "N/A"}
                      {row.client?.stratum ? ` • Estrato ${row.client.stratum}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.88rem" }}>
                    $ {Number(row.totalMonthlyWithTax || 0).toLocaleString("es-CO")}
                  </TableCell>
                  <TableCell align="center">
                    {getPnlBadge(row.pnlStatus, row.netMarginPercentage)}
                  </TableCell>
                  <TableCell align="center">{getStatusChip(row.status)}</TableCell>
                  <TableCell sx={{ fontSize: "0.85rem" }}>
                    {new Date(row.createdAt).toLocaleDateString("es-CO")}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Abrir en Workspace">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenWorkspace(row)}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver Detalle Documento">
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => handleOpenWorkspace(row)}
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Split-Screen Workspace Modal */}
      <SplitScreenProposalWorkspace
        open={workspaceOpen}
        onClose={() => {
          setWorkspaceOpen(false);
          fetchProposals();
        }}
        initialProposal={selectedProposal}
      />
    </Box>
  );
}
