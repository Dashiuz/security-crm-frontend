"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Avatar,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  SwapHoriz as TransitionIcon,
  AssignmentInd as AssignIcon,
  Refresh as RefreshIcon,
  Domain as DomainIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Lock as LockIcon,
  Chat as ChatIcon,
  FactCheck as ProgressIcon,
  VolumeUpRounded,
  VolumeOffRounded,
} from "@mui/icons-material";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useNotification } from "@/providers/NotificationProvider";
import { useNotificationSound } from "@/utils/notification-sound";
import { formatDateTime } from "@/lib/formatters";
import {
  PqrsApi,
  PqrsMessage,
  PqrsPriority,
  PqrsStatus,
  PqrsTicket,
  PqrsType,
} from "@/lib/api/pqrs";
import { StorageApi, MediaTypeCategory } from "@/lib/api/storage";
import PqrsStatusChip, { STATUS_CONFIG } from "@/components/pqrs/PqrsStatusChip";
import PqrsTypeChip from "@/components/pqrs/PqrsTypeChip";
import PqrsPriorityChip from "@/components/pqrs/PqrsPriorityChip";
import AssignPqrsDialog from "@/components/pqrs/AssignPqrsDialog";
import UpdatePqrsStatusDialog from "@/components/pqrs/UpdatePqrsStatusDialog";

const WORKFLOW_STEPS: PqrsStatus[] = [
  PqrsStatus.OPEN,
  PqrsStatus.ASSIGNED,
  PqrsStatus.IN_PROGRESS,
  PqrsStatus.RESOLVED,
  PqrsStatus.CLOSED,
];

export default function PqrsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { isMuted, toggleMute } = useNotificationSound();

  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<PqrsTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [mobileTab, setMobileTab] = useState(0);

  // Dialogs state
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Reply state
  const [replyContent, setReplyContent] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sendingReply, setSendingReply] = useState(false);

  // Compact description & Auto-scroll refs
  const [descExpanded, setDescExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Permissions & Roles
  const userType = session?.user?.userType;
  const isResidenceManager = userType === "RESIDENCE_MANAGER";
  const permissions = session?.permissions || [];
  const canManagePqrs =
    permissions.includes("pqrs:manage") ||
    permissions.includes("godlike:manage");
  const canUpdateStatus =
    permissions.includes("pqrs:update") ||
    permissions.includes("godlike:manage");

  // Priority Reclassification state & handlers
  const [priorityAnchorEl, setPriorityAnchorEl] = useState<null | HTMLElement>(null);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const isTerminal =
    ticket?.status === PqrsStatus.CLOSED || ticket?.status === PqrsStatus.REJECTED;

  const canChangePriority =
    (canManagePqrs || canUpdateStatus) && !isResidenceManager && !isTerminal;

  const handlePriorityClick = (event: React.MouseEvent<HTMLElement>) => {
    if (canChangePriority && !updatingPriority) {
      setPriorityAnchorEl(event.currentTarget);
    }
  };

  const handlePriorityClose = () => {
    setPriorityAnchorEl(null);
  };

  const handlePrioritySelect = async (newPriority: PqrsPriority) => {
    handlePriorityClose();
    if (!ticket || ticket.priority === newPriority || updatingPriority) return;

    setUpdatingPriority(true);
    try {
      await PqrsApi.updatePriority(ticket.id, newPriority);
      setTicket((prev) => (prev ? { ...prev, priority: newPriority } : prev));
      const labels: Record<PqrsPriority, string> = {
        [PqrsPriority.LOW]: "Baja",
        [PqrsPriority.MEDIUM]: "Media",
        [PqrsPriority.HIGH]: "Alta",
        [PqrsPriority.CRITICAL]: "Crítica",
      };
      showSuccess(`Prioridad actualizada a: ${labels[newPriority]}`);
    } catch (err: any) {
      showError(err.message || "Error al actualizar la prioridad");
    } finally {
      setUpdatingPriority(false);
    }
  };

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      const data = await PqrsApi.getById(ticketId);
      setTicket(data);
    } catch (err: any) {
      showError(err.message || "Error al cargar la información del ticket");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ticketId, showError]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Auto-scroll al cargar el ticket por primera vez
  useEffect(() => {
    if (ticket?.messages && ticket.messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [ticket?.id, scrollToBottom]);

  // Auto-scroll suave cuando se agregan nuevos mensajes
  useEffect(() => {
    if (ticket?.messages && ticket.messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [ticket?.messages?.length, scrollToBottom]);

  // Escuchar eventos en tiempo real para refrescar el ticket ante cambios de estado o asignación
  useEffect(() => {
    const handlePqrsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail?.ticketId && customEvent.detail.ticketId === ticketId) {
        fetchTicket();
      }
    };

    window.addEventListener("app:pqrs_updated", handlePqrsUpdate);
    return () => {
      window.removeEventListener("app:pqrs_updated", handlePqrsUpdate);
    };
  }, [ticketId, fetchTicket]);

  // Escuchar nuevos mensajes del hilo en tiempo real e insertarlos suavemente sin parpadeos
  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail?.ticketId === ticketId && customEvent.detail?.message) {
        const newMsg = customEvent.detail.message;
        setTicket((prev) => {
          if (!prev) return prev;
          const exists = (prev.messages || []).some((m) => m.id === newMsg.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMsg],
            _count: {
              ...prev._count,
              messages: (prev._count?.messages || 0) + 1,
              attachments: prev._count?.attachments || 0,
            },
          };
        });
      }
    };

    window.addEventListener("app:pqrs_message_added", handleNewMessage);
    return () => {
      window.removeEventListener("app:pqrs_message_added", handleNewMessage);
    };
  }, [ticketId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTicket();
  };

  const handleCopyCode = () => {
    if (!ticket?.code) return;
    navigator.clipboard.writeText(ticket.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setReplyFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveReplyFile = (index: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      showError("Debe escribir un mensaje para responder");
      return;
    }
    if (!ticket) return;

    setSendingReply(true);
    try {
      const message = await PqrsApi.addMessage(ticket.id, {
        content: replyContent.trim(),
      });

      // Si seleccionó archivos adjuntos para la respuesta, subirlos a S3
      if (replyFiles.length > 0) {
        for (const file of replyFiles) {
          try {
            await StorageApi.uploadMedia({
              file,
              entityType: MediaTypeCategory.PQRS,
              entityId: message.id,
              subType: "message",
              clientId: ticket.clientId,
            });
          } catch {
            // Continúa con los demás archivos
          }
        }
      }

      showSuccess("Respuesta enviada exitosamente");
      setReplyContent("");
      setReplyFiles([]);
      await fetchTicket();
      scrollToBottom("smooth");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      showError(err.message || "Error al enviar la respuesta");
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Alert severity="error" sx={{ maxWidth: 500, mx: "auto", mb: 2 }}>
          No fue posible encontrar la solicitud PQRS solicitada o no tiene permisos de acceso.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/administrative/pqrs")}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }

  // isTerminal ya está declarado arriba en el scope del componente
  const canTransition =
    canUpdateStatus ||
    canManagePqrs ||
    ticket.assignedToId === session?.user?.id;

  // Compute active step in linear workflow
  const activeStep =
    ticket.status === PqrsStatus.REJECTED
      ? -1
      : WORKFLOW_STEPS.indexOf(ticket.status);

  return (
    <Box
      sx={{
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
        height: { xs: "auto", md: "calc(100vh - 130px)" },
        mt: { md: -1 },
        mb: { md: -3 },
        display: "flex",
        flexDirection: "column",
        overflowY: { xs: "visible", md: "hidden" },
        gap: 1.5,
      }}
    >
      {/* Desktop Top Navigation & Breadcrumbs (md en adelante) */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1.5}
        sx={{ display: { xs: "none", md: "flex" }, flexShrink: 0 }}
      >
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 0.5, fontSize: "0.8rem" }}>
            <MuiLink component={Link} underline="hover" color="inherit" href="/dashboard">
              Dashboard
            </MuiLink>
            <MuiLink component={Link} underline="hover" color="inherit" href="/administrative/pqrs">
              {isResidenceManager ? "Solicitudes PQRS" : "Gestión de PQRS"}
            </MuiLink>
            <Typography color="text.primary" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
              {ticket.code}
            </Typography>
          </Breadcrumbs>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push("/administrative/pqrs")}
              sx={{ textTransform: "none", mr: 0.5, py: 0.25 }}
            >
              Volver
            </Button>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
              {ticket.code}
            </Typography>
            <Tooltip title={copiedCode ? "¡Copiado!" : "Copiar código"}>
              <IconButton size="small" onClick={handleCopyCode} color={copiedCode ? "success" : "default"}>
                {copiedCode ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <PqrsStatusChip status={ticket.status} />
            <PqrsTypeChip type={ticket.type} />
            <Box
              onClick={canChangePriority ? handlePriorityClick : undefined}
              sx={{
                cursor: canChangePriority ? "pointer" : "default",
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "16px",
                transition: "all 0.15s ease",
                "&:hover": canChangePriority
                  ? {
                      transform: "scale(1.05)",
                      filter: "brightness(0.95)",
                    }
                  : undefined,
              }}
            >
              <Tooltip
                title={
                  canChangePriority
                    ? "Clic para reclasificar prioridad"
                    : ""
                }
              >
                <span>
                  <PqrsPriorityChip priority={ticket.priority} />
                </span>
              </Tooltip>
            </Box>
          </Stack>
        </Box>

        {/* Action Buttons in Desktop Header */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={handleRefresh} disabled={refreshing} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {canManagePqrs && !isResidenceManager && !isTerminal && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AssignIcon />}
              onClick={() => setAssignOpen(true)}
              sx={{ textTransform: "none" }}
            >
              {ticket.assignedTo ? "Reasignar" : "Asignar"}
            </Button>
          )}

          {canTransition && !isTerminal && (
            <Button
              variant="contained"
              size="small"
              color="secondary"
              startIcon={<TransitionIcon />}
              onClick={() => setStatusOpen(true)}
              sx={{ textTransform: "none" }}
            >
              Cambiar Estado
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Mobile Header (xs, sm) */}
      <Stack
        direction="column"
        spacing={1}
        sx={{
          display: { xs: "flex", md: "none" },
          flexShrink: 0,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Fila Superior: Volver IconButton + Código + Copiar (izq) y Refrescar (der) */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => router.push("/administrative/pqrs")}
              sx={{ p: 0.5 }}
              aria-label="Volver"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              {ticket.code}
            </Typography>
            <Tooltip title={copiedCode ? "¡Copiado!" : "Copiar código"}>
              <IconButton size="small" onClick={handleCopyCode} color={copiedCode ? "success" : "default"} sx={{ p: 0.5 }}>
                {copiedCode ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Tooltip title="Actualizar datos">
            <IconButton onClick={handleRefresh} disabled={refreshing} size="small" sx={{ p: 0.5 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Fila Media: Chips de Estado, Tipo y Prioridad */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
          <PqrsStatusChip status={ticket.status} />
          <PqrsTypeChip type={ticket.type} />
          <Box
            onClick={canChangePriority ? handlePriorityClick : undefined}
            sx={{
              cursor: canChangePriority ? "pointer" : "default",
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "16px",
              transition: "all 0.15s ease",
              "&:hover": canChangePriority
                ? {
                    transform: "scale(1.05)",
                    filter: "brightness(0.95)",
                  }
                : undefined,
            }}
          >
            <Tooltip
              title={
                canChangePriority
                  ? "Clic para reclasificar prioridad"
                  : ""
              }
            >
              <span>
                <PqrsPriorityChip priority={ticket.priority} />
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Fila de Acciones Primarias: Reasignar y Cambiar Estado (50% y 50%) */}
        {((canManagePqrs && !isResidenceManager && !isTerminal) || (canTransition && !isTerminal)) && (
          <Box sx={{ width: "100%", display: "flex", gap: 1 }}>
            {canManagePqrs && !isResidenceManager && !isTerminal && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AssignIcon />}
                onClick={() => setAssignOpen(true)}
                sx={{ flex: 1, textTransform: "none", py: 0.75, fontSize: "0.8rem" }}
              >
                {ticket.assignedTo ? "Reasignar" : "Asignar"}
              </Button>
            )}

            {canTransition && !isTerminal && (
              <Button
                variant="contained"
                size="small"
                color="secondary"
                startIcon={<TransitionIcon />}
                onClick={() => setStatusOpen(true)}
                sx={{ flex: 1, textTransform: "none", py: 0.75, fontSize: "0.8rem" }}
              >
                Cambiar Estado
              </Button>
            )}
          </Box>
        )}
      </Stack>

      {/* Mobile Tabs (xs, sm) */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          width: "100%",
          maxWidth: "100%",
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Tabs
          value={mobileTab}
          onChange={(_, val) => setMobileTab(val)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              py: 0.75,
              fontWeight: 600,
              fontSize: "0.825rem",
              textTransform: "none",
            },
          }}
        >
          <Tab icon={<ChatIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Conversación" />
          <Tab icon={<ProgressIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Detalles y Progreso" />
        </Tabs>
      </Box>

      {/* Main Grid: Split-Pane Workspace */}
      <Grid
        container
        spacing={2}
        sx={{
          flex: 1,
          minHeight: 0,
          height: { xs: "auto", md: "100%" },
          overflow: { xs: "visible", md: "hidden" },
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Left Column: Original Ticket (compact) + Unified Chat Card */}
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{
            height: { xs: "calc(100vh - 220px)", md: "100%" },
            display: { xs: mobileTab === 0 ? "flex" : "none", md: "flex" },
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            gap: 1.5,
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Original Ticket Description Card (Compact & Collapsible) */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              flexShrink: 0,
              maxWidth: "100%",
              boxSizing: "border-box",
              overflowX: "hidden",
            }}
          >
            <Box sx={{ p: 1.5, pb: descExpanded ? 1.5 : 1, maxWidth: "100%", overflowX: "hidden" }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5, maxWidth: "100%" }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 28, height: 28, flexShrink: 0 }}>
                  <DomainIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0, maxWidth: "100%" }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                    {ticket.subject}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ wordBreak: "break-word", whiteSpace: "normal" }}
                  >
                    Radicado por <strong>{ticket.createdBy?.fullName || "Administrador"}</strong>
                    {ticket.client ? ` • ${ticket.client.name}` : ""} • {formatDateTime(ticket.createdAt)}
                  </Typography>
                </Box>
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  fontSize: "0.85rem",
                  ...(!descExpanded && {
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }),
                }}
              >
                {ticket.description}
              </Typography>

              {ticket.description && ticket.description.length > 150 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setDescExpanded(!descExpanded)}
                  sx={{
                    p: 0,
                    minWidth: "auto",
                    textTransform: "none",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    mt: 0.25,
                  }}
                >
                  {descExpanded ? "Ver menos" : "Ver más"}
                </Button>
              )}

              {/* Initial Ticket Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 0.75 }}>
                  {ticket.attachments.map((att: any) => {
                    const isImage =
                      att.mimeType?.startsWith("image/") ||
                      /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileName || "");
                    const isPdf =
                      att.mimeType?.includes("pdf") ||
                      /\.pdf$/i.test(att.fileName || "");

                    return (
                      <Chip
                        key={att.id}
                        icon={
                          isImage ? (
                            <ImageIcon sx={{ fontSize: 14 }} />
                          ) : isPdf ? (
                            <PdfIcon sx={{ fontSize: 14 }} />
                          ) : (
                            <FileIcon sx={{ fontSize: 14 }} />
                          )
                        }
                        label={`${att.fileName} (${(att.sizeBytes / 1024).toFixed(0)} KB)`}
                        component="a"
                        href={att.presignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ height: 24, fontSize: "0.75rem" }}
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Card>

          {/* Unified Conversation Thread & Composer Card */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "background.paper",
                flexShrink: 0,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Historial de Conversación
                </Typography>
                <Chip
                  size="small"
                  label={`${ticket.messages?.length || 0} respuestas`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600, height: 22, fontSize: "0.75rem" }}
                />
              </Stack>
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
                    bgcolor: isMuted ? "action.hover" : "primary.50",
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
            </Box>

            {/* Scrollable Messages Area */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                p: { xs: 1.5, sm: 2 },
                bgcolor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0,0,0,0.15)",
                  borderRadius: 3,
                },
              }}
            >
              {(!ticket.messages || ticket.messages.length === 0) ? (
                <Box sx={{ py: 6, textAlign: "center", m: "auto" }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay respuestas ni comentarios adicionales en este ticket aún.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {ticket.messages.map((msg: PqrsMessage, index: number) => {
                    const isClient = msg.isFromClient;
                    const isMySide = isResidenceManager ? isClient : !isClient;
                    const isMe = Boolean(
                      session?.user?.id &&
                        msg.createdBy?.id &&
                        msg.createdBy.id === session.user.id,
                    );

                    const prevMsg = index > 0 ? ticket.messages![index - 1] : null;
                    const isSameSenderAsPrev = Boolean(
                      prevMsg &&
                        ((msg.createdBy?.id &&
                          prevMsg.createdBy?.id &&
                          msg.createdBy.id === prevMsg.createdBy.id) ||
                          (msg.isFromClient === prevMsg.isFromClient &&
                            (!msg.createdBy?.id || !prevMsg.createdBy?.id))),
                    );

                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMySide ? "flex-end" : "flex-start",
                          mt: isSameSenderAsPrev ? "4px" : index === 0 ? 0 : 2,
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            maxWidth: { xs: "92%", sm: "84%", md: "75%" },
                            px: 2,
                            py: isSameSenderAsPrev ? 1.25 : 1.75,
                            borderRadius: isMySide
                              ? isSameSenderAsPrev
                                ? "14px 4px 4px 14px"
                                : "16px 16px 4px 16px"
                              : isSameSenderAsPrev
                                ? "4px 14px 14px 4px"
                                : "16px 16px 16px 4px",
                            bgcolor: isMySide ? "#ecfdf5" : "#ffffff",
                            border: "1px solid",
                            borderColor: isMySide ? "#a7f3d0" : "#e2e8f0",
                            boxShadow: isMySide
                              ? "0 1px 3px rgba(16, 185, 129, 0.08)"
                              : "0 1px 3px rgba(0, 0, 0, 0.04)",
                            position: "relative",
                          }}
                        >
                          {!isSameSenderAsPrev ? (
                            /* Encabezado completo cuando cambia de autor */
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                              <Avatar
                                sx={{
                                  bgcolor: isMySide
                                    ? "#10b981"
                                    : isClient
                                      ? "#3b82f6"
                                      : "#64748b",
                                  width: 30,
                                  height: 30,
                                  color: "#ffffff",
                                }}
                              >
                                {isClient ? (
                                  <DomainIcon sx={{ fontSize: 16 }} />
                                ) : (
                                  <SecurityIcon sx={{ fontSize: 16 }} />
                                )}
                              </Avatar>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ mb: 0.5 }}
                                >
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.75}
                                    sx={{ flexWrap: "wrap", gap: 0.5 }}
                                  >
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight={700}
                                      sx={{
                                        color: isMySide ? "#065f46" : "#0f172a",
                                        fontSize: "0.825rem",
                                      }}
                                    >
                                      {msg.createdBy?.fullName ||
                                        (isClient
                                          ? "Administrador del Conjunto"
                                          : "Empresa de Seguridad")}
                                    </Typography>

                                    {isMe && (
                                      <Chip
                                        size="small"
                                        label="Tú"
                                        sx={{
                                          height: 18,
                                          fontSize: "0.65rem",
                                          fontWeight: 700,
                                          bgcolor: isMySide ? "#10b981" : "#64748b",
                                          color: "#ffffff",
                                        }}
                                      />
                                    )}

                                    <Chip
                                      size="small"
                                      label={
                                        isClient
                                          ? "Conjunto Residencial"
                                          : "Empresa de Seguridad"
                                      }
                                      sx={{
                                        height: 18,
                                        fontSize: "0.65rem",
                                        fontWeight: 600,
                                        bgcolor: isMySide
                                          ? "#d1fae5"
                                          : isClient
                                            ? "#eff6ff"
                                            : "#f1f5f9",
                                        color: isMySide
                                          ? "#065f46"
                                          : isClient
                                            ? "#1d4ed8"
                                            : "#475569",
                                        border: "1px solid",
                                        borderColor: isMySide
                                          ? "#a7f3d0"
                                          : isClient
                                            ? "#bfdbfe"
                                            : "#e2e8f0",
                                      }}
                                    />
                                  </Stack>

                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                    sx={{ ml: 1 }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: isMySide
                                          ? "#059669"
                                          : "text.secondary",
                                        fontSize: "0.72rem",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {formatDateTime(msg.createdAt)}
                                    </Typography>
                                    {isMySide && (
                                      <CheckIcon
                                        sx={{ fontSize: 13, color: "#10b981" }}
                                      />
                                    )}
                                  </Stack>
                                </Stack>

                                <Typography
                                  variant="body2"
                                  sx={{
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.55,
                                    color: isMySide ? "#0f172a" : "#334155",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {msg.content}
                                </Typography>

                                {/* Message Attachments */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ mt: 1, flexWrap: "wrap", gap: 0.75 }}
                                  >
                                    {msg.attachments.map((att: any) => {
                                      const isImage =
                                        att.mimeType?.startsWith("image/") ||
                                        /\.(jpg|jpeg|png|webp|gif)$/i.test(
                                          att.fileName || "",
                                        );
                                      const isPdf =
                                        att.mimeType?.includes("pdf") ||
                                        /\.pdf$/i.test(att.fileName || "");

                                      return (
                                        <Chip
                                          key={att.id}
                                          icon={
                                            isImage ? (
                                              <ImageIcon sx={{ fontSize: 15 }} />
                                            ) : isPdf ? (
                                              <PdfIcon sx={{ fontSize: 15 }} />
                                            ) : (
                                              <FileIcon sx={{ fontSize: 15 }} />
                                            )
                                          }
                                          label={`${att.fileName} (${(att.sizeBytes / 1024).toFixed(0)} KB)`}
                                          component="a"
                                          href={att.presignedUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          clickable
                                          size="small"
                                          sx={{
                                            bgcolor: isMySide ? "#ffffff" : "#f8fafc",
                                            border: "1px solid",
                                            borderColor: isMySide ? "#86efac" : "#cbd5e1",
                                            color: isMySide ? "#065f46" : "#334155",
                                            fontWeight: 500,
                                            fontSize: "0.75rem",
                                            "&:hover": {
                                              bgcolor: isMySide ? "#f0fdf4" : "#f1f5f9",
                                            },
                                          }}
                                        />
                                      );
                                    })}
                                  </Stack>
                                )}
                              </Box>
                            </Stack>
                          ) : (
                            /* Mensaje consecutivo sin cabecera repetida */
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  whiteSpace: "pre-wrap",
                                  lineHeight: 1.55,
                                  color: isMySide ? "#0f172a" : "#334155",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {msg.content}
                              </Typography>

                              {/* Message Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{ mt: 1, flexWrap: "wrap", gap: 0.75 }}
                                >
                                  {msg.attachments.map((att: any) => {
                                    const isImage =
                                      att.mimeType?.startsWith("image/") ||
                                      /\.(jpg|jpeg|png|webp|gif)$/i.test(
                                        att.fileName || "",
                                      );
                                    const isPdf =
                                      att.mimeType?.includes("pdf") ||
                                      /\.pdf$/i.test(att.fileName || "");

                                    return (
                                      <Chip
                                        key={att.id}
                                        icon={
                                          isImage ? (
                                            <ImageIcon sx={{ fontSize: 15 }} />
                                          ) : isPdf ? (
                                            <PdfIcon sx={{ fontSize: 15 }} />
                                          ) : (
                                            <FileIcon sx={{ fontSize: 15 }} />
                                          )
                                        }
                                        label={`${att.fileName} (${(att.sizeBytes / 1024).toFixed(0)} KB)`}
                                        component="a"
                                        href={att.presignedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        clickable
                                        size="small"
                                        sx={{
                                          bgcolor: isMySide ? "#ffffff" : "#f8fafc",
                                          border: "1px solid",
                                          borderColor: isMySide ? "#86efac" : "#cbd5e1",
                                          color: isMySide ? "#065f46" : "#334155",
                                          fontWeight: 500,
                                          fontSize: "0.75rem",
                                          "&:hover": {
                                            bgcolor: isMySide ? "#f0fdf4" : "#f1f5f9",
                                          },
                                        }}
                                      />
                                    );
                                  })}
                                </Stack>
                              )}

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  alignItems: "center",
                                  mt: 0.25,
                                  gap: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: isMySide
                                      ? "#059669"
                                      : "text.secondary",
                                    fontSize: "0.7rem",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {formatDateTime(msg.createdAt)}
                                </Typography>
                                {isMySide && (
                                  <CheckIcon
                                    sx={{ fontSize: 13, color: "#10b981" }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                        </Paper>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>
              )}
            </Box>

            {/* Composer Anclado al Fondo */}
            <Box
              sx={{
                p: 1.5,
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                flexShrink: 0,
              }}
            >
              {isTerminal ? (
                <Alert severity="warning" icon={<LockIcon />} sx={{ py: 0.5, fontSize: "0.85rem" }}>
                  Esta solicitud fue marcada como{" "}
                  <strong>{STATUS_CONFIG[ticket.status].label}</strong> y no admite nuevas respuestas.
                </Alert>
              ) : (
                <Box>
                  {/* Previsualización de chips de archivos adjuntos */}
                  {replyFiles.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ mb: 1, flexWrap: "wrap", gap: 0.75 }}
                    >
                      {replyFiles.map((file, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          icon={<FileIcon sx={{ fontSize: 14 }} />}
                          label={`${file.name} (${(file.size / 1024).toFixed(0)} KB)`}
                          onDelete={() => handleRemoveReplyFile(idx)}
                          variant="outlined"
                          color="primary"
                          sx={{ height: 24, fontSize: "0.75rem" }}
                        />
                      ))}
                    </Stack>
                  )}

                  <TextField
                    inputRef={inputRef}
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={4}
                    size="small"
                    placeholder="Escribe aquí tu respuesta, informe de avance o solución para el cliente... (Ctrl + Enter para enviar)"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (!sendingReply && replyContent.trim()) {
                          handleSendReply();
                        }
                      }
                    }}
                    disabled={sendingReply}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.875rem",
                        borderRadius: 1.5,
                        bgcolor: "background.paper",
                      },
                    }}
                  />

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                    sx={{ mt: 1 }}
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      size="small"
                      startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                      sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.5 }}
                    >
                      Adjuntar Archivos
                      <input type="file" multiple hidden onChange={handleFileChange} />
                    </Button>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: { xs: "none", sm: "block" },
                        fontSize: "0.72rem",
                      }}
                    >
                      Ctrl + Enter para enviar • Notifica por correo
                    </Typography>

                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyContent.trim()}
                      startIcon={
                        sendingReply ? (
                          <CircularProgress size={15} color="inherit" />
                        ) : (
                          <SendIcon sx={{ fontSize: 16 }} />
                        )
                      }
                      sx={{ textTransform: "none", px: 2.5, fontWeight: 600, py: 0.5 }}
                    >
                      {sendingReply ? "Enviando..." : "Enviar Respuesta"}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Metadata Sidebar (Workflow Progress + Ticket Details) */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            height: { xs: "auto", md: "100%" },
            overflowY: { xs: "visible", md: "auto" },
            pr: { md: 0.5 },
            display: { xs: mobileTab === 1 ? "flex" : "none", md: "flex" },
            flexDirection: "column",
            gap: 1.5,
            maxWidth: "100%",
            boxSizing: "border-box",
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.15)",
              borderRadius: 3,
            },
          }}
        >
          {/* Sequential Workflow Progress Card */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              flexShrink: 0,
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <CardHeader
              title={
                <Typography variant="subtitle2" fontWeight={700}>
                  Progreso de la Solicitud
                </Typography>
              }
              sx={{ py: 1.25, px: 2 }}
            />
            <Divider />
            <CardContent sx={{ py: 1.25, px: 2, "&:last-child": { pb: 1.5 } }}>
              {ticket.status === PqrsStatus.REJECTED ? (
                <Alert severity="error" sx={{ my: 0.5, py: 0.5, fontSize: "0.85rem" }}>
                  Esta solicitud fue <strong>RECHAZADA</strong>.
                </Alert>
              ) : (
                <Stepper
                  activeStep={activeStep}
                  orientation="vertical"
                  sx={{
                    "& .MuiStepConnector-root": { ml: "13px" },
                    "& .MuiStepConnector-line": { minHeight: 12, borderLeftWidth: 2 },
                    "& .MuiStepLabel-root": { py: 0.25 },
                    "& .MuiStepLabel-iconContainer": { pr: 1.25 },
                    "& .MuiStepIcon-root": { width: 26, height: 26 },
                  }}
                >
                  {WORKFLOW_STEPS.map((stepStatus) => {
                    const config = STATUS_CONFIG[stepStatus];
                    return (
                      <Step key={stepStatus}>
                        <StepLabel
                          StepIconProps={{
                            sx: {
                              "&.Mui-active": { color: `${config.color}.main` },
                              "&.Mui-completed": { color: "success.main" },
                            },
                          }}
                        >
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.825rem" }}>
                            {config.label}
                          </Typography>
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              )}
            </CardContent>
          </Card>

          {/* General Metadata Details Card */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              flexShrink: 0,
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <CardHeader
              title={
                <Typography variant="subtitle2" fontWeight={700}>
                  Detalles del Ticket
                </Typography>
              }
              sx={{ py: 1.25, px: 2 }}
            />
            <Divider />
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Stack spacing={1.75}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                    CLIENTE / CONJUNTO RESIDENCIAL
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25 }}>
                    {ticket.client?.name || "No especificado"}
                  </Typography>
                  {ticket.client?.nit && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      NIT: {ticket.client.nit}
                    </Typography>
                  )}
                  {ticket.client?.administratorEmail && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Email: {ticket.client.administratorEmail}
                    </Typography>
                  )}
                  {ticket.client?.administratorPhone && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Tel: {ticket.client.administratorPhone}
                    </Typography>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                    FUNCIONARIO ASIGNADO
                  </Typography>
                  {ticket.assignedTo ? (
                    <Box sx={{ mt: 0.25 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {ticket.assignedTo.fullName}
                      </Typography>
                      {ticket.assignedTo.position && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {ticket.assignedTo.position}
                        </Typography>
                      )}
                      {ticket.assignedTo.department && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {ticket.assignedTo.department}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ mt: 0.25 }}>
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Sin asignar
                      </Typography>
                      {canManagePqrs && !isResidenceManager && !isTerminal && (
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<AssignIcon />}
                          onClick={() => setAssignOpen(true)}
                          sx={{ mt: 0.25, p: 0, textTransform: "none", fontSize: "0.75rem" }}
                        >
                          Asignar funcionario ahora
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                    TIPO & PRIORIDAD
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <PqrsTypeChip type={ticket.type} />
                    <PqrsPriorityChip priority={ticket.priority} />
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                    FECHAS CLAVE
                  </Typography>
                  <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                    <Typography variant="caption" color="text.secondary">
                      Radicado: <strong>{formatDateTime(ticket.createdAt)}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Actualizado: <strong>{formatDateTime(ticket.updatedAt)}</strong>
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Priority Reclassification Menu */}
      <Menu
        anchorEl={priorityAnchorEl}
        open={Boolean(priorityAnchorEl)}
        onClose={handlePriorityClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minWidth: 160,
              boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
              py: 0.5,
            },
          },
        }}
      >
        <MenuItem
          selected={ticket.priority === PqrsPriority.LOW}
          onClick={() => handlePrioritySelect(PqrsPriority.LOW)}
          sx={{ fontSize: "0.85rem", gap: 1 }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
          Baja
        </MenuItem>
        <MenuItem
          selected={ticket.priority === PqrsPriority.MEDIUM}
          onClick={() => handlePrioritySelect(PqrsPriority.MEDIUM)}
          sx={{ fontSize: "0.85rem", gap: 1 }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#3b82f6" }} />
          Media
        </MenuItem>
        <MenuItem
          selected={ticket.priority === PqrsPriority.HIGH}
          onClick={() => handlePrioritySelect(PqrsPriority.HIGH)}
          sx={{ fontSize: "0.85rem", gap: 1 }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#f59e0b" }} />
          Alta
        </MenuItem>
        <MenuItem
          selected={ticket.priority === PqrsPriority.CRITICAL}
          onClick={() => handlePrioritySelect(PqrsPriority.CRITICAL)}
          sx={{ fontSize: "0.85rem", gap: 1 }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />
          Crítica
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <AssignPqrsDialog
        open={assignOpen}
        ticket={ticket}
        onClose={() => setAssignOpen(false)}
        onSuccess={fetchTicket}
      />

      <UpdatePqrsStatusDialog
        open={statusOpen}
        ticket={ticket}
        onClose={() => setStatusOpen(false)}
        onSuccess={fetchTicket}
      />
    </Box>
  );
}
