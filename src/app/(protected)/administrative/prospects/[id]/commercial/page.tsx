"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  Alert,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  AddRounded as AddIcon,
  ReceiptLongRounded as ReceiptLongIcon,
  TimelineRounded as TimelineIcon,
  PictureAsPdfRounded as PdfIcon,
  CheckCircleOutlineRounded as CheckCircleIcon,
  EditOutlined as EditIcon,
  TrendingUpRounded as TrendingUpIcon,
  PhoneRounded as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  EmailRounded as EmailIcon,
  GroupsRounded as GroupsIcon,
  VideoCallRounded as VideoIcon,
  EngineeringRounded as EngineeringIcon,
  EventRepeatRounded as RecaptationIcon,
  CloseRounded as CloseIcon,
  BoltRounded as BoltIcon,
} from "@mui/icons-material";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import ChameleonPdfPreview from "@/app/(protected)/commercial/proposals/components/ChameleonPdfPreview";
import {
  commercialProposalsApi,
  CommercialProposalDto,
} from "@/lib/api/commercial-proposals";
import {
  commercialCrmApi,
  CommercialFollowUpDto,
  InteractionChannel,
  FollowUpMilestoneStatus,
  DealLossReasonCategory,
  CreateFollowUpPayload,
} from "@/lib/api/commercial-crm";
import { useNotification } from "@/providers/NotificationProvider";
import { useProspectDetail } from "../ProspectContext";

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
  SENT_TO_CLIENT: { label: "Enviada al Prospecto", color: "primary" },
  WON: { label: "Ganada / Aceptada", color: "success" },
  LOST: { label: "Perdida", color: "error" },
  VOIDED: { label: "Anulada", color: "default" },
};

const LOSS_REASON_LABELS: Record<string, string> = {
  COMPETITOR_PRICE: "Precio inferior de la competencia",
  AUTOMATIC_RENEWAL: "Renovó automáticamente con el proveedor actual",
  PERMANENCE_CLAUSE: "Cláusula de permanencia vigente",
  HIGHER_VALUE_ADDED: "Competidor ofreció mayor valor agregado",
  BUDGET_LIMITATION: "Limitación o recorte presupuestal",
  PREFERS_CONCIERGE: "Prefiere conserjería / informalidad",
  NO_DECISION_CANCELLED: "Proceso cancelado o sin decisión",
  FAILED_COMPLIANCE: "No cumplió requisitos de compliance",
  OTHER: "Otra causa no especificada",
};

export default function ProspectCommercialPage() {
  const { prospectId, prospect, convertProspect } = useProspectDetail();
  const router = useRouter();
  const theme = useTheme();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const [proposals, setProposals] = useState<CommercialProposalDto[]>([]);
  const [followUps, setFollowUps] = useState<CommercialFollowUpDto[]>([]);

  // Preview & Won states
  const [previewProposal, setPreviewProposal] = useState<CommercialProposalDto | null>(null);
  const [wonTargetProposal, setWonTargetProposal] = useState<CommercialProposalDto | null>(null);
  const [transitioningWon, setTransitioningWon] = useState(false);
  const [wonContractForm, setWonContractForm] = useState({
    contractNumber: "",
    contractDate: new Date().toISOString().split("T")[0],
    lastContractDate: new Date().toISOString().split("T")[0],
  });

  // Follow-up interaction drawer states
  const [followUpDrawerOpen, setFollowUpDrawerOpen] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    contactChannel: "PHONE_CALL" as InteractionChannel,
    interactionDate: new Date().toISOString().split("T")[0],
    contactPerson: "",
    contactRole: "",
    summaryNotes: "",
    nextContactDate: "",
    status: "PENDING" as FollowUpMilestoneStatus,
    lossReasonCategory: "COMPETITOR_PRICE" as DealLossReasonCategory,
    lossDetails: "",
  });

  const loadData = useCallback(async () => {
    if (!prospectId) return;
    try {
      setLoading(true);
      const [proposalsRes, followUpsRes] = await Promise.all([
        commercialProposalsApi.getProposals({ clientId: prospectId }),
        commercialCrmApi.getFollowUps({ clientId: prospectId }),
      ]);
      setProposals(proposalsRes?.data || []);
      setFollowUps(followUpsRes?.data || []);
    } catch (err: any) {
      showError(err?.message || "Error al cargar la información comercial.");
    } finally {
      setLoading(false);
    }
  }, [prospectId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveFollowUp = async () => {
    if (!followUpForm.summaryNotes.trim()) {
      showError("Debe ingresar un resumen o nota de la interacción.");
      return;
    }
    try {
      setSavingFollowUp(true);
      const payload: CreateFollowUpPayload = {
        clientId: prospectId,
        contactChannel: followUpForm.contactChannel,
        interactionDate: followUpForm.interactionDate,
        contactPersonName: followUpForm.contactPerson || "Contacto Prospecto",
        contactPersonRole: followUpForm.contactRole || undefined,
        managementSummary: followUpForm.summaryNotes,
        nextContactDate: followUpForm.nextContactDate || undefined,
        statusAfterFollowUp: followUpForm.status,
        lossReasonCategory:
          followUpForm.status === "LOST" ? followUpForm.lossReasonCategory : undefined,
        lossReasonDescription:
          followUpForm.status === "LOST" ? followUpForm.lossDetails : undefined,
      };

      await commercialCrmApi.createFollowUp(payload);
      showSuccess("Interacción comercial registrada con éxito.");
      setFollowUpDrawerOpen(false);
      setFollowUpForm({
        contactChannel: "PHONE_CALL",
        interactionDate: new Date().toISOString().split("T")[0],
        contactPerson: "",
        contactRole: "",
        summaryNotes: "",
        nextContactDate: "",
        status: "PENDING",
        lossReasonCategory: "COMPETITOR_PRICE",
        lossDetails: "",
      });
      loadData();
    } catch (err: any) {
      showError(err?.message || "Error al registrar la interacción.");
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleConfirmWon = async () => {
    if (!wonTargetProposal) return;
    if (!wonContractForm.contractNumber.trim()) {
      showError("Debe ingresar el número de contrato asignado.");
      return;
    }
    try {
      setTransitioningWon(true);
      // 1. Transition proposal to WON
      await commercialProposalsApi.updateStatus(wonTargetProposal.id, "WON");

      // 2. Convert prospect to client
      await convertProspect({
        contractNumber: wonContractForm.contractNumber,
        contractDate: wonContractForm.contractDate,
        lastContractDate: wonContractForm.lastContractDate,
      });

      showSuccess("¡Propuesta ganada y contrato formalizado exitosamente!");
      setWonTargetProposal(null);
      router.push("/administrative/clients");
    } catch (err: any) {
      showError(err?.message || "Error al formalizar la propuesta ganada.");
    } finally {
      setTransitioningWon(false);
    }
  };

  // Recaptation Calculation
  let recaptationDays: number | null = null;
  if (prospect?.recaptationTargetDate) {
    const target = new Date(prospect.recaptationTargetDate);
    recaptationDays = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 6 }}>
      {/* Page Title & Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Gestión Comercial y CRM
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trazabilidad de cotizaciones, negociaciones y bitácora de seguimiento comercial.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TimelineIcon />}
            onClick={() => setFollowUpDrawerOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Registrar Interacción
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => router.push(`/commercial/proposals/new?clientId=${prospectId}`)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Nueva Cotización
          </Button>
        </Box>
      </Box>

      {/* Recaptation Target Date Banner */}
      {prospect?.recaptationTargetDate && (
        <Alert
          severity={recaptationDays !== null && recaptationDays <= 0 ? "warning" : "info"}
          icon={<RecaptationIcon sx={{ fontSize: 24 }} />}
          sx={{
            borderRadius: 3,
            border: "1px solid",
            borderColor: recaptationDays !== null && recaptationDays <= 0 ? "warning.main" : "info.main",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Campaña de Recaptación Programada: {prospect.recaptationTargetDate}
              </Typography>
              <Typography variant="body2">
                {recaptationDays !== null && recaptationDays > 0
                  ? `Faltan ${recaptationDays} día(s) para la fecha objetivo de reconexión comercial.`
                  : "¡La fecha objetivo de recaptación ha llegado! Se recomienda contactar inmediatamente al prospecto."}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              color={recaptationDays !== null && recaptationDays <= 0 ? "warning" : "primary"}
              onClick={() => setFollowUpDrawerOpen(true)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Contactar Ahora
            </Button>
          </Box>
        </Alert>
      )}

      {/* Tabs Switcher */}
      <Paper elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ px: 2 }}
        >
          <Tab
            icon={<TimelineIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Bitácora de Seguimiento (${followUps.length})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Cotizaciones y Propuestas (${proposals.length})`}
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {/* Tab 0: Bitácora de Seguimiento */}
      {activeTab === 0 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : followUps.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <TimelineIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                No hay interacciones comerciales registradas
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                Lleve una bitácora detallada de llamadas, visitas técnicas y reuniones con el prospecto.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setFollowUpDrawerOpen(true)}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Registrar Primera Interacción
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {followUps.map((fu) => (
                <Paper
                  key={fu.id}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    borderLeft: `4px solid ${
                      fu.statusAfterFollowUp === "WON"
                        ? "#16A34A"
                        : fu.statusAfterFollowUp === "LOST"
                        ? "#DC2626"
                        : "#0284C7"
                    }`,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: "action.hover", display: "flex" }}>
                        {CHANNEL_ICONS[fu.contactChannel] || <PhoneIcon fontSize="small" />}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {CHANNEL_NAMES[fu.contactChannel] || fu.contactChannel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(fu.interactionDate).toLocaleDateString("es-CO", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {fu.contactPersonName ? ` • Con: ${fu.contactPersonName} (${fu.contactPersonRole || "Contacto"})` : ""}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      size="small"
                      label={
                        fu.statusAfterFollowUp === "WON"
                          ? "Ganado"
                          : fu.statusAfterFollowUp === "LOST"
                          ? "Perdido"
                          : "En Seguimiento"
                      }
                      color={
                        fu.statusAfterFollowUp === "WON"
                          ? "success"
                          : fu.statusAfterFollowUp === "LOST"
                          ? "error"
                          : "info"
                      }
                      sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: "text.primary", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                    {fu.managementSummary}
                  </Typography>

                  {fu.nextContactDate && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <Chip
                        size="small"
                        icon={<RecaptationIcon sx={{ fontSize: "14px !important" }} />}
                        label={`Próximo contacto previsto: ${fu.nextContactDate}`}
                        variant="outlined"
                        sx={{ fontSize: "0.72rem", height: 22 }}
                      />
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Tab 1: Cotizaciones y Propuestas */}
      {activeTab === 1 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : proposals.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <ReceiptLongIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                No hay propuestas registradas para este prospecto
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                Genere propuestas comerciales formales con análisis de costos y margen P&L.
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => router.push(`/commercial/proposals/new?clientId=${prospectId}`)}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Crear Primera Cotización
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary" } }}>
                    <TableCell>Folio</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Modalidad / Puestos</TableCell>
                    <TableCell align="right">Margen P&L</TableCell>
                    <TableCell align="right">Total Mensual</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proposals.map((prop) => {
                    const statusCfg = PROPOSAL_STATUS_CONFIG[prop.status] || {
                      label: prop.status,
                      color: "default",
                    };
                    return (
                      <TableRow key={prop.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>
                          {prop.proposalFolioCode}
                        </TableCell>
                        <TableCell>
                          {new Date(prop.createdAt).toLocaleDateString("es-CO")}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                            {prop.items && prop.items.length > 0
                              ? `${prop.items.length} puesto(s) configurado(s)`
                              : "Sin puestos"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
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
                            sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          $ {Number(prop.totalMonthlyWithTax || 0).toLocaleString("es-CO")}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={statusCfg.label}
                            color={statusCfg.color}
                            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8 }}>
                            <Tooltip title="Ver / Editar Propuesta">
                              <IconButton
                                size="small"
                                onClick={() => router.push(`/commercial/proposals/${prop.id}`)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Vista Previa PDF">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => setPreviewProposal(prop)}
                              >
                                <PdfIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {prop.status !== "WON" && (
                              <Tooltip title="Marcar como Ganada y Formalizar">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    setWonTargetProposal(prop);
                                    setWonContractForm({
                                      contractNumber: "",
                                      contractDate: new Date().toISOString().split("T")[0],
                                      lastContractDate: new Date().toISOString().split("T")[0],
                                    });
                                  }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Drawer: Nueva Interacción Comercial */}
      <ResponsiveFormDrawer
        open={followUpDrawerOpen}
        onClose={() => !savingFollowUp && setFollowUpDrawerOpen(false)}
        title="Registrar Gestión Comercial"
        subtitle="Agregue una novedad a la bitácora comercial del prospecto."
        isSubmitting={savingFollowUp}
        submitButtonText="Guardar Interacción"
        formId="followup-form"
        width={{ xs: "100%", sm: 500 }}
      >
        <Box
          component="form"
          id="followup-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveFollowUp();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            fullWidth
            select
            label="Canal de Contacto"
            value={followUpForm.contactChannel}
            onChange={(e) =>
              setFollowUpForm({ ...followUpForm, contactChannel: e.target.value as any })
            }
            size="small"
          >
            {Object.entries(CHANNEL_NAMES).map(([key, name]) => (
              <MenuItem key={key} value={key}>
                {name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            type="date"
            label="Fecha de la Interacción"
            value={followUpForm.interactionDate}
            onChange={(e) =>
              setFollowUpForm({ ...followUpForm, interactionDate: e.target.value })
            }
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Persona Contactada"
                value={followUpForm.contactPerson}
                onChange={(e) =>
                  setFollowUpForm({ ...followUpForm, contactPerson: e.target.value })
                }
                placeholder="Ej. Juan Pérez"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Cargo / Rol"
                value={followUpForm.contactRole}
                onChange={(e) =>
                  setFollowUpForm({ ...followUpForm, contactRole: e.target.value })
                }
                placeholder="Ej. Administrador"
                size="small"
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Resumen de la Negociación o Novedad"
            value={followUpForm.summaryNotes}
            onChange={(e) =>
              setFollowUpForm({ ...followUpForm, summaryNotes: e.target.value })
            }
            required
            size="small"
          />

          <TextField
            fullWidth
            type="date"
            label="Próximo Contacto Previsto (Opcional)"
            value={followUpForm.nextContactDate}
            onChange={(e) =>
              setFollowUpForm({ ...followUpForm, nextContactDate: e.target.value })
            }
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
          />

          <TextField
            fullWidth
            select
            label="Estado del Hito Comercial"
            value={followUpForm.status}
            onChange={(e) =>
              setFollowUpForm({ ...followUpForm, status: e.target.value as any })
            }
            size="small"
          >
            <MenuItem value="PENDING">En Seguimiento</MenuItem>
            <MenuItem value="WON">Cerrado Ganado</MenuItem>
            <MenuItem value="LOST">Perdido / Cancelado</MenuItem>
          </TextField>

          {followUpForm.status === "LOST" && (
            <>
              <TextField
                fullWidth
                select
                label="Causa de Pérdida"
                value={followUpForm.lossReasonCategory}
                onChange={(e) =>
                  setFollowUpForm({ ...followUpForm, lossReasonCategory: e.target.value as any })
                }
                size="small"
              >
                {Object.entries(LOSS_REASON_LABELS).map(([k, label]) => (
                  <MenuItem key={k} value={k}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Detalles de la Pérdida"
                value={followUpForm.lossDetails}
                onChange={(e) =>
                  setFollowUpForm({ ...followUpForm, lossDetails: e.target.value })
                }
                size="small"
              />
            </>
          )}
        </Box>
      </ResponsiveFormDrawer>

      {/* Drawer: Marcar Propuesta como Ganada y Formalizar */}
      <ResponsiveFormDrawer
        open={Boolean(wonTargetProposal)}
        onClose={() => !transitioningWon && setWonTargetProposal(null)}
        title={`Marcar Ganada: ${wonTargetProposal?.proposalFolioCode || ""}`}
        subtitle="Al aceptar la propuesta, se formalizará el contrato y el prospecto pasará a ser Cliente Activo."
        isSubmitting={transitioningWon}
        submitButtonText="Confirmar y Formalizar Contrato"
        formId="won-proposal-form"
        width={{ xs: "100%", sm: 500 }}
      >
        <Box
          component="form"
          id="won-proposal-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirmWon();
          }}
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Alert severity="success" icon={<BoltIcon />}>
            Esta acción transiciona la propuesta a estado <strong>GANADA</strong> y convierte el prospecto en Cliente Activo.
          </Alert>

          <TextField
            fullWidth
            label="Número de Contrato"
            value={wonContractForm.contractNumber}
            onChange={(e) =>
              setWonContractForm({ ...wonContractForm, contractNumber: e.target.value })
            }
            required
            placeholder="Ej. CTR-2026-0045"
            size="small"
          />

          <TextField
            fullWidth
            type="date"
            label="Fecha de Firma del Contrato"
            value={wonContractForm.contractDate}
            onChange={(e) =>
              setWonContractForm({ ...wonContractForm, contractDate: e.target.value })
            }
            slotProps={{ inputLabel: { shrink: true } }}
            required
            size="small"
          />

          <TextField
            fullWidth
            type="date"
            label="Fecha de Inicio de Operación"
            value={wonContractForm.lastContractDate}
            onChange={(e) =>
              setWonContractForm({ ...wonContractForm, lastContractDate: e.target.value })
            }
            slotProps={{ inputLabel: { shrink: true } }}
            required
            size="small"
          />
        </Box>
      </ResponsiveFormDrawer>

      {/* Modal / Dialog: Vista Previa PDF Chameleon */}
      <Dialog
        open={Boolean(previewProposal)}
        onClose={() => setPreviewProposal(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PdfIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Vista Previa: {previewProposal?.proposalFolioCode}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setPreviewProposal(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: "#F1F5F9" }}>
          {previewProposal && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <ChameleonPdfPreview
                proposalNumber={previewProposal.proposalFolioCode}
                date={new Date(previewProposal.createdAt).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                clientName={previewProposal.client?.name || prospect?.name || "Prospecto"}
                clientNit={previewProposal.client?.nit || prospect?.nit || ""}
                clientCity={previewProposal.draftSnapshotJson?.clientCity || prospect?.city || "Bogotá D.C."}
                skin={
                  previewProposal.draftSnapshotJson?.skin || {
                    primaryColor: "#0F172A",
                    secondaryColor: "#4338CA",
                  }
                }
                bodyHtml={
                  previewProposal.draftSnapshotJson?.clauseBlocks
                    ? previewProposal.draftSnapshotJson.clauseBlocks
                        .map((b: any) => `<h3>${b.title || ""}</h3>${b.content}`)
                        .join("<br/>")
                    : undefined
                }
                serviceItems={previewProposal.items?.map((it: any) => ({
                  name: it.positionTitle,
                  modality: it.weaponModality,
                  hours: String(it.shiftHours || it.hours || "24H"),
                  postsCount: Number(it.quantity || 1),
                  monthlyTotal: Number(it.unitMonthlyBilledPrice || it.totalMonthlyCop || 0),
                }))}
                valueAddedItems={previewProposal.valueAddedItems?.map((v: any) => ({
                  itemName: v.itemName,
                  quantity: Number(v.quantity || 1),
                  periodicity: String(v.periodicity || "MONTHLY_RECURRING"),
                  itemInternalCost: Number(v.itemInternalCost || 0),
                  notes: v.notes || v.description,
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
