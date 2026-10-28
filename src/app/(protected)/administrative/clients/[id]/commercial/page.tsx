"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
} from "@mui/material";
import {
  ReceiptLongRounded as ReceiptLongIcon,
  AddRounded as AddIcon,
  PictureAsPdfRounded as PdfIcon,
  EditRounded as EditIcon,
  EmojiEventsRounded as TrophyIcon,
  FlashOnRounded as BoltIcon,
  CheckCircleOutlineRounded as CheckCircleIcon,
  TrendingUpRounded as TrendingUpIcon,
  CloseRounded as CloseIcon,
  PrintRounded as PrintIcon,
  PhoneRounded as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  EmailRounded as EmailIcon,
  GroupsRounded as GroupsIcon,
  VideocamRounded as VideoIcon,
  EngineeringRounded as EngineeringIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useClientDetail } from "../ClientContext";
import { useNotification } from "@/providers/NotificationProvider";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import ChameleonPdfPreview from "@/app/(protected)/commercial/proposals/components/ChameleonPdfPreview";
import {
  commercialProposalsApi,
  CommercialProposalDto,
} from "@/lib/api/commercial-proposals";
import {
  commercialServiceOrdersApi,
  ServiceOrderDto,
} from "@/lib/api/commercial-service-orders";
import {
  commercialCrmApi,
  CommercialFollowUpDto,
} from "@/lib/api/commercial-crm";

const CHANNEL_ICONS: Record<string, React.ReactElement> = {
  PHONE_CALL: <PhoneIcon fontSize="small" sx={{ color: "#0284C7" }} />,
  WHATSAPP_MESSAGE: <WhatsAppIcon fontSize="small" sx={{ color: "#16A34A" }} />,
  EMAIL: <EmailIcon fontSize="small" sx={{ color: "#D97706" }} />,
  IN_PERSON_MEETING: <GroupsIcon fontSize="small" sx={{ color: "#7C3AED" }} />,
  VIDEO_CONFERENCE: <VideoIcon fontSize="small" sx={{ color: "#2563EB" }} />,
  TECHNICAL_VISIT: <EngineeringIcon fontSize="small" sx={{ color: "#EA580C" }} />,
};

const CHANNEL_NAMES: Record<string, string> = {
  PHONE_CALL: "Llamada Telefónica",
  WHATSAPP_MESSAGE: "WhatsApp",
  EMAIL: "Correo Electrónico",
  IN_PERSON_MEETING: "Reunión Presencial",
  VIDEO_CONFERENCE: "Videoconferencia",
  TECHNICAL_VISIT: "Visita Técnica en Sitio",
};

const PROPOSAL_STATUS_CONFIG: Record<
  string,
  { label: string; color: "default" | "info" | "primary" | "warning" | "success" | "error" }
> = {
  DRAFT: { label: "Borrador", color: "default" },
  UNDER_REVIEW: { label: "En Revisión", color: "warning" },
  APPROVED_INTERNAL: { label: "Aprobada Internamente", color: "info" },
  SENT_TO_CLIENT: { label: "Enviada al Cliente", color: "primary" },
  WON: { label: "Ganada / Aceptada", color: "success" },
  LOST: { label: "Perdida", color: "error" },
  VOIDED: { label: "Anulada", color: "default" },
};

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: "default" | "info" | "primary" | "warning" | "success" | "error" }
> = {
  DRAFT_CONFIGURING: { label: "Borrador Configuración", color: "default" },
  ISSUED_DISPATCHED: { label: "Despachada a Operaciones", color: "primary" },
  IN_OPERATION: { label: "En Operación Activa", color: "success" },
  CANCELLED: { label: "Cancelada", color: "error" },
};

export default function ClientCommercialDossierPage() {
  const { clientId, client } = useClientDetail();
  const router = useRouter();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [proposals, setProposals] = useState<CommercialProposalDto[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrderDto[]>([]);
  const [followUps, setFollowUps] = useState<CommercialFollowUpDto[]>([]);

  // Preview & Won states
  const [previewProposal, setPreviewProposal] = useState<CommercialProposalDto | null>(null);
  const [wonTargetProposal, setWonTargetProposal] = useState<CommercialProposalDto | null>(null);
  const [transitioningWon, setTransitioningWon] = useState(false);

  const loadDossierData = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const [proposalsRes, ordersRes, followUpsRes] = await Promise.all([
        commercialProposalsApi.getProposals({ clientId, take: 50 }).catch(() => ({ data: [] })),
        commercialServiceOrdersApi.getServiceOrders({ clientId, take: 50 }).catch(() => ({ data: [] })),
        commercialCrmApi.getFollowUpsByClient(clientId).catch(() => []),
      ]);

      setProposals(proposalsRes.data || []);
      setServiceOrders(ordersRes.data || []);
      setFollowUps(Array.isArray(followUpsRes) ? followUpsRes : (followUpsRes as any)?.data || []);
    } catch {
      showError("Error al cargar el historial comercial del cliente.");
    } finally {
      setLoading(false);
    }
  }, [clientId, showError]);

  useEffect(() => {
    loadDossierData();
  }, [loadDossierData]);

  // Handle Mark Won
  const handleConfirmWon = async (targetProposalId: string, createServiceOrderNow: boolean) => {
    try {
      setTransitioningWon(true);
      await commercialProposalsApi.updateStatus(targetProposalId, "WON");
      showSuccess("Propuesta aprobada y marcada como GANADA.");

      if (createServiceOrderNow) {
        setWonTargetProposal(null);
        router.push(`/commercial/service-orders?fromProposalId=${targetProposalId}`);
      } else {
        setWonTargetProposal(null);
        await loadDossierData();
      }
    } catch {
      showError("Error al marcar la propuesta como ganada.");
    } finally {
      setTransitioningWon(false);
    }
  };

  // KPI Calculations
  const totalProposals = proposals.length;
  const wonProposals = proposals.filter((p) => p.status === "WON");
  const totalWonMonthlyCop = wonProposals.reduce(
    (acc, p) => acc + (Number(p.totalMonthlyWithTax) || 0),
    0
  );
  const totalOrders = serviceOrders.length;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* Executive Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <ReceiptLongIcon sx={{ color: "primary.main", fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
              Hoja de Vida Comercial y Trazabilidad Operativa
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Historial consolidado de cotizaciones, ofertas estatutarias, órdenes de servicio y bitácora CRM para{" "}
            <strong>{client?.name || "este cliente"}</strong>.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<BoltIcon />}
            onClick={() => router.push(`/commercial/service-orders?clientId=${clientId}`)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 2,
            }}
          >
            Nueva Orden de Servicio
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push(`/commercial/proposals/new?clientId=${clientId}`)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
              },
            }}
          >
            + Nueva Cotización
          </Button>
        </Box>
      </Box>

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.5)" : "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
              Total Cotizaciones
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mt: 0.5 }}>
              {totalProposals}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Ofertas comerciales emitidas
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.5)" : "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
              Cotizaciones Ganadas
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#059669", mt: 0.5 }}>
              {wonProposals.length}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {totalProposals > 0 ? `${Math.round((wonProposals.length / totalProposals) * 100)}% tasa de éxito` : "Sin cotizaciones"}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.5)" : "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
              Facturación Mensual Ganada
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#2563EB", mt: 0.5 }}>
              $ {totalWonMonthlyCop.toLocaleString("es-CO")}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Monto contratado recurrente COP
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.5)" : "#FFFFFF",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
              Órdenes de Servicio
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#7C3AED", mt: 0.5 }}>
              {totalOrders}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Activaciones operativas en terreno
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Layout */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            px: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "#FAFAFA",
          }}
        >
          <Tab
            label={`📋 Cotizaciones y Propuestas (${proposals.length})`}
            sx={{ fontWeight: 700, textTransform: "none", py: 2 }}
          />
          <Tab
            label={`⚡ Órdenes de Servicio Operativas (${serviceOrders.length})`}
            sx={{ fontWeight: 700, textTransform: "none", py: 2 }}
          />
          <Tab
            label={`🤝 Bitácora CRM y Seguimientos (${followUps.length})`}
            sx={{ fontWeight: 700, textTransform: "none", py: 2 }}
          />
        </Tabs>

        {loading ? (
          <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            {/* TAB 0: COTIZACIONES Y PROPUESTAS */}
            {activeTab === 0 && (
              <>
                {proposals.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <ReceiptLongIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      No se registran cotizaciones para este cliente
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                      Puede crear la primera oferta comercial con cálculo estatutario SVSP en vivo.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => router.push(`/commercial/proposals/new?clientId=${clientId}`)}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                    >
                      + Crear Primera Cotización
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Folio</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Fecha Emisión</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Puestos SVSP</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Total Mensual (COP)</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Margen P&L</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {proposals.map((prop) => {
                          const statusCfg = PROPOSAL_STATUS_CONFIG[prop.status] || {
                            label: prop.status,
                            color: "default",
                          };
                          const positionsCount = prop.items?.length || 0;

                          return (
                            <TableRow key={prop.id} hover>
                              <TableCell>
                                <Typography
                                  component="span"
                                  onClick={() => router.push(`/commercial/proposals/${prop.id}`)}
                                  sx={{
                                    fontWeight: 800,
                                    color: "primary.main",
                                    cursor: "pointer",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {prop.proposalFolioCode}
                                </Typography>
                                <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                                  v{prop.versionNumber}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {new Date(prop.createdAt).toLocaleDateString("es-CO", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                <Chip
                                  size="small"
                                  label={`${positionsCount} Puesto${positionsCount === 1 ? "" : "s"}`}
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800, color: "text.primary" }}>
                                $ {Number(prop.totalMonthlyWithTax || 0).toLocaleString("es-CO")}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  icon={<TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
                                  label={`${prop.netMarginPercentage}%`}
                                  color={
                                    prop.pnlStatus === "PROFITABLE"
                                      ? "success"
                                      : prop.pnlStatus === "WARNING_LOW_MARGIN"
                                      ? "warning"
                                      : "error"
                                  }
                                  sx={{ fontWeight: 700 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={statusCfg.label}
                                  color={statusCfg.color}
                                  sx={{ fontWeight: 700 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                                  {prop.status !== "WON" && (
                                    <Tooltip title="Aprobar y Marcar como Ganada (WON)">
                                      <IconButton
                                        size="small"
                                        color="success"
                                        onClick={() => setWonTargetProposal(prop)}
                                      >
                                        <TrophyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Editar en Canvas">
                                    <IconButton
                                      size="small"
                                      onClick={() => router.push(`/commercial/proposals/${prop.id}`)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Vista Previa de Propuesta">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => setPreviewProposal(prop)}
                                    >
                                      <PdfIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {/* TAB 1: ÓRDENES DE SERVICIO */}
            {activeTab === 1 && (
              <>
                {serviceOrders.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <BoltIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      No se registran órdenes de servicio emitidas
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                      Las órdenes de servicio activan formalmente la operación en terreno y vinculan el Código OMEGA.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<BoltIcon />}
                      onClick={() => router.push(`/commercial/service-orders?clientId=${clientId}`)}
                      sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                    >
                      + Emitir Primera Orden de Servicio
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Folio OS</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Código OMEGA</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Tipo de Orden</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Puestos Operativos</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Fecha Instalación</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Estado</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {serviceOrders.map((os) => {
                          const orderStatus = ORDER_STATUS_CONFIG[os.status] || {
                            label: os.status,
                            color: "default",
                          };
                          const positionsTotal = os.positions?.reduce((a, b) => a + (b.quantityGuards || 1), 0) || 0;

                          return (
                            <TableRow key={os.id} hover>
                              <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>
                                {os.orderFolioCode}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={os.omegaCode || "OMEGA PENDIENTE"}
                                  color="secondary"
                                  sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {os.orderType === "NEW_SITE"
                                  ? "Nueva Instalación"
                                  : os.orderType === "CONTRACT_RENEWAL"
                                  ? "Renovación Contractual"
                                  : "Adición de Puesto"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                <Chip
                                  size="small"
                                  label={`${positionsTotal} Guardias`}
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.85rem" }}>
                                {os.installationDate
                                  ? new Date(os.installationDate).toLocaleDateString("es-CO")
                                  : "Por definir"}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={orderStatus.label}
                                  color={orderStatus.color}
                                  sx={{ fontWeight: 700 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => router.push(`/commercial/service-orders?search=${os.orderFolioCode}`)}
                                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}
                                >
                                  Ver Detalle
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {/* TAB 2: BITÁCORA CRM */}
            {activeTab === 2 && (
              <>
                {followUps.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <GroupsIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      No se registran gestiones comerciales en bitácora
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Todas las llamadas, visitas y cotizaciones registradas durante la etapa de prospecto y cliente se visualizan aquí.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {followUps.map((fu) => (
                      <Paper
                        key={fu.id}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          border: `1px solid ${theme.palette.divider}`,
                          bgcolor: theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.4)" : "#F8FAFC",
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            {CHANNEL_ICONS[fu.contactChannel] || <PhoneIcon fontSize="small" />}
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {CHANNEL_NAMES[fu.contactChannel] || fu.contactChannel}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              • {new Date(fu.interactionDate).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={
                              fu.statusAfterFollowUp === "WON"
                                ? "Ganado / Cerrado"
                                : fu.statusAfterFollowUp === "PENDING"
                                ? "En Seguimiento"
                                : fu.statusAfterFollowUp === "LOST"
                                ? "Perdido vs Competencia"
                                : "Cancelado"
                            }
                            color={
                              fu.statusAfterFollowUp === "WON"
                                ? "success"
                                : fu.statusAfterFollowUp === "PENDING"
                                ? "warning"
                                : "default"
                            }
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>

                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5, whiteSpace: "pre-line" }}>
                          {fu.managementSummary}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", fontSize: "0.8rem", color: "text.secondary" }}>
                          <Box>
                            <strong>Contacto:</strong> {fu.contactPersonName} {fu.contactPersonRole ? `(${fu.contactPersonRole})` : ""}
                          </Box>
                          {fu.assignedCommercial && (
                            <Box>
                              <strong>Comercial a Cargo:</strong> {fu.assignedCommercial.fullName}
                            </Box>
                          )}
                          {fu.nextContactDate && (
                            <Box>
                              <strong>Próximo Contacto:</strong> {new Date(fu.nextContactDate).toLocaleDateString("es-CO")}
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </Paper>

      {/* Drawer: Marcar Propuesta como Ganada */}
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
                startIcon={<CheckCircleIcon />}
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
                      icon={<TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
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
            <strong>Recomendación Operativa:</strong> Proceda a emitir la Orden de Servicio para desplegar la operación e incorporar el Código OMEGA.
          </Alert>
        </Box>
      </ResponsiveFormDrawer>

      {/* Modal: Vista Previa PDF de Propuesta */}
      <Dialog
        open={Boolean(previewProposal)}
        onClose={() => setPreviewProposal(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: "92vh",
            maxHeight: "92vh",
            borderRadius: 3,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Vista Previa: {previewProposal?.proposalFolioCode}
            </Typography>
            {previewProposal && (
              <Chip
                size="small"
                label={PROPOSAL_STATUS_CONFIG[previewProposal.status]?.label || previewProposal.status}
                color={PROPOSAL_STATUS_CONFIG[previewProposal.status]?.color || "default"}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Imprimir
            </Button>
            {previewProposal && (
              <Button
                size="small"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  const id = previewProposal.id;
                  setPreviewProposal(null);
                  router.push(`/commercial/proposals/${id}`);
                }}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Editar en Canvas
              </Button>
            )}
            <IconButton onClick={() => setPreviewProposal(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1, bgcolor: "#F1F5F9", overflowY: "auto" }}>
          {previewProposal && (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <ChameleonPdfPreview
                proposalNumber={previewProposal.proposalFolioCode}
                date={new Date(previewProposal.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                clientName={previewProposal.client?.name || client?.name || "Cliente"}
                clientNit={previewProposal.client?.nit || client?.nit || ""}
                clientCity={previewProposal.draftSnapshotJson?.clientCity || client?.city || "Bogotá D.C."}
                skin={previewProposal.draftSnapshotJson?.skin || {
                  primaryColor: "#0F172A",
                  secondaryColor: "#4338CA",
                  headerLogoUrl: "",
                  footerText: "Propuesta de Seguridad Privada",
                }}
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
    </Box>
  );
}
