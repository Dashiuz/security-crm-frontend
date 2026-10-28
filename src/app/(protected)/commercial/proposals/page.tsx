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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
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
  Close as CloseIcon,
  Print as PrintIcon,
  EmojiEvents as TrophyIcon,
  FlashOn as BoltIcon,
  CheckCircleOutline,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotification } from "@/providers/NotificationProvider";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import ChameleonPdfPreview from "./components/ChameleonPdfPreview";
import {
  commercialProposalsApi,
  CommercialProposalDto,
  ProposalStatus,
  PnlHealthStatus,
} from "@/lib/api/commercial-proposals";

export default function ProposalsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [previewProposal, setPreviewProposal] = useState<CommercialProposalDto | null>(null);
  const [wonTargetProposal, setWonTargetProposal] = useState<CommercialProposalDto | null>(null);
  const [transitioningWon, setTransitioningWon] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [proposals, setProposals] = useState<CommercialProposalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleOpenPreview = async (row: CommercialProposalDto) => {
    try {
      setPreviewProposal(row);
      const full = await commercialProposalsApi.getProposalById(row.id);
      if (full) {
        setPreviewProposal(full);
      }
    } catch {
      // fallback already set
    }
  };

  const handleConfirmWon = async (targetId: string, andCreateServiceOrder: boolean) => {
    try {
      setTransitioningWon(true);
      await commercialProposalsApi.updateStatus(targetId, "WON");
      showSuccess("¡Propuesta marcada como GANADA exitosamente!");
      setWonTargetProposal(null);
      await fetchProposals();
      if (andCreateServiceOrder) {
        router.push(`/commercial/service-orders?fromProposalId=${targetId}`);
      }
    } catch (err: any) {
      showError(err.message || "Error al actualizar estado de la propuesta.");
    } finally {
      setTransitioningWon(false);
    }
  };

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
        return <Chip label="En Revisión G&P" size="small" color="warning" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
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
      default:
        return null;
    }
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
            Generación con semáforo G&P en vivo, cálculo estatutario SVSP y dossieres tácticos.
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
            onClick={() => router.push("/commercial/proposals/new")}
            sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
          >
            Nueva Propuesta
          </Button>
        </Stack>
      </Box>

      {/* Interactive KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            onClick={() => setStatusFilter("ALL")}
            sx={{
              borderRadius: 2.5,
              cursor: "pointer",
              boxShadow: statusFilter === "ALL" ? "0 0 0 2px #4F46E5, 0 4px 12px rgba(79, 70, 229, 0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.08)" },
              "&:active": { transform: "scale(0.98)" },
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
                Total Propuestas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "primary.main", my: 0.5 }}>
                {proposals.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Registradas en sistema (clic para ver todas)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            onClick={() => setStatusFilter("SENT_TO_CLIENT")}
            sx={{
              borderRadius: 2.5,
              cursor: "pointer",
              boxShadow: statusFilter === "SENT_TO_CLIENT" ? "0 0 0 2px #d97706, 0 4px 12px rgba(217, 119, 6, 0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.08)" },
              "&:active": { transform: "scale(0.98)" },
            }}
          >
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
          <Card
            onClick={() => setStatusFilter("WON")}
            sx={{
              borderRadius: 2.5,
              cursor: "pointer",
              boxShadow: statusFilter === "WON" ? "0 0 0 2px #059669, 0 4px 12px rgba(5, 150, 105, 0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(0,0,0,0.08)" },
              "&:active": { transform: "scale(0.98)" },
            }}
          >
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
          <Card
            sx={{
              borderRadius: 2.5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
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
                sx={{ fontWeight: 600, fontSize: "0.75rem", mb: { xs: 0.5, sm: 0 }, cursor: "pointer" }}
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
              <TableCell align="center" sx={{ fontWeight: 700 }}>Semáforo G&P</TableCell>
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
                    Haga clic en &quot;Nueva Propuesta&quot; para iniciar una cotización con semáforo G&P en vivo.
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
                    <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                      {row.status === "WON" ? (
                        <Tooltip title="⚡ Generar / Ver Orden de Servicio">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<BoltIcon sx={{ fontSize: 14 }} />}
                            onClick={() => router.push(`/commercial/service-orders?fromProposalId=${row.id}`)}
                            sx={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              textTransform: "none",
                              py: 0.25,
                              px: 0.9,
                              borderRadius: "6px",
                              bgcolor: "#059669",
                              "&:hover": { bgcolor: "#047857" },
                              whiteSpace: "nowrap",
                            }}
                          >
                            Generar OS
                          </Button>
                        </Tooltip>
                      ) : row.status !== "LOST" && row.status !== "VOIDED" ? (
                        <Tooltip title="Marcar como Ganada (Cerrar Negocio)">
                          <IconButton
                            size="small"
                            onClick={() => setWonTargetProposal(row)}
                            sx={{
                              color: "#059669",
                              bgcolor: "rgba(5, 150, 105, 0.08)",
                              "&:hover": { bgcolor: "rgba(5, 150, 105, 0.18)" },
                            }}
                          >
                            <TrophyIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      ) : null}

                      <Tooltip title="Editar Propuesta (Canvas)">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => router.push(`/commercial/proposals/${row.id}/edit`)}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver Vista Previa PDF">
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => handleOpenPreview(row)}
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

      {/* Light PDF Preview Dialog without Hydration Warnings */}
      <Dialog
        open={Boolean(previewProposal)}
        onClose={() => setPreviewProposal(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, overflow: "hidden" } }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
            borderBottom: "1px solid #E2E8F0",
            bgcolor: "#F8FAFC",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
              Vista Previa: {previewProposal?.proposalFolioCode}
            </Typography>
            {previewProposal && getStatusChip(previewProposal.status)}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {previewProposal && previewProposal.status !== "WON" && previewProposal.status !== "LOST" && previewProposal.status !== "VOIDED" && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<TrophyIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  const target = previewProposal;
                  setPreviewProposal(null);
                  setWonTargetProposal(target);
                }}
                sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.78rem" }}
              >
                Marcar como Ganada
              </Button>
            )}
            {previewProposal && previewProposal.status === "WON" && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<BoltIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  const id = previewProposal.id;
                  setPreviewProposal(null);
                  router.push(`/commercial/service-orders?fromProposalId=${id}`);
                }}
                sx={{ fontWeight: 800, textTransform: "none", fontSize: "0.78rem", bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
              >
                Generar OS
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Imprimir
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<EditOutlined />}
              onClick={() => {
                const id = previewProposal?.id;
                setPreviewProposal(null);
                if (id) router.push(`/commercial/proposals/${id}/edit`);
              }}
            >
              Editar en Canvas
            </Button>
            <IconButton size="small" onClick={() => setPreviewProposal(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#F1F5F9", p: 3, display: "flex", justifyContent: "center" }}>
          {previewProposal && (
            <Box sx={{ width: "100%", maxWidth: "794px" }}>
              <ChameleonPdfPreview
                clientName={previewProposal.client?.name}
                clientNit={previewProposal.client?.nit}
                proposalNumber={previewProposal.proposalFolioCode}
                date={new Date(previewProposal.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                bodyHtml={
                  previewProposal.draftSnapshotJson?.clauseBlocks
                    ? previewProposal.draftSnapshotJson.clauseBlocks
                      .map((b: any) => `<h3>${b.title || ""}</h3>${b.content}`)
                      .join("<br/>")
                    : "<p>Propuesta técnica y económica generada.</p>"
                }
                serviceItems={previewProposal.items?.map((it: any) => ({
                  name: it.positionTitle,
                  modality: it.weaponModality,
                  hours: it.scheduleType,
                  postsCount: it.quantity,
                  monthlyTotal:
                    Number(it.totalMonthlyBilledPrice) ||
                    (Number(it.unitMonthlyBilledPrice) || 0) * (Number(it.quantity) || 1),
                }))}
                valueAddedItems={previewProposal.valueAddedItems?.map((v: any) => ({
                  itemName: v.itemName,
                  quantity: v.quantity,
                  periodicity: v.periodicity,
                  itemInternalCost: Number(v.itemInternalCost) || 0,
                  notes: v.notes,
                }))}
                signers={previewProposal.signers}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Drawer Asistente: Marcar Propuesta como Ganada y Emitir Orden de Servicio */}
      <ResponsiveFormDrawer
        open={Boolean(wonTargetProposal)}
        onClose={() => !transitioningWon && setWonTargetProposal(null)}
        title="Aprobar y Marcar como Ganada"
        subtitle="Cierre de negociación comercial y emisión de Orden de Servicio"
        headerIcon={<TrophyIcon sx={{ color: "#059669", fontSize: 28 }} />}
        width={{ xs: "100%", sm: 540, md: 580 }}
        customActions={
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
            <Button
              fullWidth
              variant="contained"
              disabled={transitioningWon}
              startIcon={transitioningWon ? <CircularProgress size={18} color="inherit" /> : <BoltIcon />}
              onClick={() => wonTargetProposal && handleConfirmWon(wonTargetProposal.id, true)}
              sx={{
                py: 1.4,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.92rem",
                letterSpacing: "0.2px",
                background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  background: "linear-gradient(135deg, #047857 0%, #059669 100%)",
                  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.45)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              {transitioningWon ? "Procesando y emitiendo orden..." : "⚡ Marcar como Ganada y Emitir Orden de Servicio"}
            </Button>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5 }}>
              <Button
                variant="text"
                onClick={() => setWonTargetProposal(null)}
                disabled={transitioningWon}
                sx={{
                  py: 1,
                  px: 2,
                  borderRadius: "8px",
                  textTransform: "none",
                  color: "text.secondary",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="outlined"
                disabled={transitioningWon}
                startIcon={<CheckCircleOutline />}
                onClick={() => wonTargetProposal && handleConfirmWon(wonTargetProposal.id, false)}
                sx={{
                  py: 1,
                  px: 2.5,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  border: "1.5px solid #059669",
                  color: "#059669",
                  bgcolor: "rgba(5, 150, 105, 0.04)",
                  "&:hover": {
                    border: "1.5px solid #047857",
                    bgcolor: "rgba(5, 150, 105, 0.1)",
                  },
                }}
              >
                Solo Marcar como Ganada
              </Button>
            </Box>
          </Box>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
            Está a punto de registrar la aceptación formal de la propuesta por parte del cliente. Al marcarla como ganada, concluye exitosamente la negociación comercial y se habilita la creación de la <strong>Orden de Servicio Operativa</strong>.
          </Typography>

          {wonTargetProposal && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "#F8FAFC",
                borderRadius: 2.5,
                border: "1px solid #E2E8F0",
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Folio de Cotización
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#4338CA", mt: 0.2 }}>
                    {wonTargetProposal.proposalFolioCode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Cliente / Destinatario
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A", mt: 0.2 }}>
                    {wonTargetProposal.client?.name || "Sin cliente asignado"}
                  </Typography>
                  {wonTargetProposal.client?.nit && (
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      NIT: {wonTargetProposal.client.nit}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Facturación Mensual (COP)
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#059669", mt: 0.2 }}>
                    $ {Number(wonTargetProposal.totalMonthlyWithTax || 0).toLocaleString("es-CO")}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.5 }}>
                    Margen Operativo P&L
                  </Typography>
                  <Box sx={{ mt: 0.2 }}>
                    <Chip
                      size="small"
                      icon={<TrendingUp sx={{ fontSize: "14px !important" }} />}
                      label={`${wonTargetProposal.netMarginPercentage}%`}
                      color={
                        wonTargetProposal.pnlStatus === "PROFITABLE"
                          ? "success"
                          : wonTargetProposal.pnlStatus === "WARNING_LOW_MARGIN"
                          ? "warning"
                          : "error"
                      }
                      sx={{ fontWeight: 700, fontSize: "0.78rem" }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          <Alert
            severity="info"
            icon={<BoltIcon sx={{ color: "#0284C7" }} />}
            sx={{
              borderRadius: 2,
              bgcolor: "#F0F9FF",
              border: "1px solid #BAE6FD",
              "& .MuiAlert-message": { fontSize: "0.85rem", color: "#0369A1", lineHeight: 1.5 },
            }}
          >
            <strong>Recomendación del Flujo Comercial:</strong> Cree de inmediato la Orden de Servicio Operativa. El sistema trasladará automáticamente el puesto de vigilancia, las especificaciones técnicas y asignará el correlativo con el Código OMEGA oficial.
          </Alert>
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
