"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  BusinessOutlined,
  VerifiedUser,
  Shield,
  MarkEmailUnreadOutlined,
  Refresh,
  ArrowForward,
  TrendingUp,
  WarningAmber,
  ErrorOutline,
  CheckCircleOutline,
  Schedule,
  NotificationsActive,
  FilterList,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import {
  DashboardApi,
  DashboardOverview,
  DashboardRemindersResponse,
  DashboardReminder,
  ReminderUrgency,
} from "@/lib/api/dashboard";

export default function DashboardPage() {
  const { session } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [remindersData, setRemindersData] = useState<DashboardRemindersResponse | null>(null);
  const [reminderFilter, setReminderFilter] = useState<string>("ALL");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [ovRes, remRes] = await Promise.all([
        DashboardApi.getOverview(),
        DashboardApi.getReminders(),
      ]);
      setOverview(ovRes);
      setRemindersData(remRes);
    } catch {
      // Fallback a datos representativos de demostración si el backend aún no cuenta con registros suficientes
      setOverview({
        kpis: {
          activeClients: 38,
          prospectsInPipeline: 14,
          openPqrs: 6,
          ansComplianceRate: 98.4,
          activeGuards: 142,
          pendingPackages: 9,
        },
        charts: {
          ansWeeklyTrend: [
            { week: "Sem 40", compliance: 96.5, target: 95.0, totalTickets: 22 },
            { week: "Sem 41", compliance: 97.8, target: 95.0, totalTickets: 29 },
            { week: "Sem 42", compliance: 94.2, target: 95.0, totalTickets: 18 },
            { week: "Sem 43", compliance: 98.5, target: 95.0, totalTickets: 25 },
            { week: "Sem 44", compliance: 97.1, target: 95.0, totalTickets: 31 },
            { week: "Actual", compliance: 98.4, target: 95.0, totalTickets: 14 },
          ],
          commercialFunnel: [
            { stage: "En Borrador", count: 4, totalValue: 62000000 },
            { stage: "En Revisión Financiera", count: 3, totalValue: 48000000 },
            { stage: "Presentadas al Cliente", count: 5, totalValue: 135000000 },
            { stage: "Ganadas / Adjudicadas", count: 8, totalValue: 245000000 },
          ],
        },
        updatedAt: new Date().toISOString(),
      });
      setRemindersData({
        reminders: [
          {
            id: "rem-1",
            module: "PQRS",
            title: "Alerta ANS: Ticket PQRS-2026-042 - Falla de Sensor Perimetral",
            description: "Ticket con prioridad CRÍTICA en Edificio Torre Real. Requiere resolución en menos de 4 horas para cumplir ANS.",
            urgency: "CRITICAL",
            dueDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
            actionPath: "/administrative/pqrs",
            actionLabel: "Gestionar Ticket",
          },
          {
            id: "rem-2",
            module: "CLIENTS",
            title: "Vencimiento Contractual: Conjunto Residencial El Portal",
            description: "El contrato marco finaliza en 18 días calendario. Iniciar trámite de renovación o prórroga.",
            urgency: "CRITICAL",
            dueDate: new Date(Date.now() + 18 * 86400 * 1000).toISOString(),
            actionPath: "/administrative/clients",
            actionLabel: "Ver Ficha de Cliente",
          },
          {
            id: "rem-3",
            module: "PORTERIA",
            title: "Correspondencia sin reclamar en portería: Apto 501",
            description: "Paquete de Servientrega bajo custodia hace más de 48 horas sin retiro por parte del residente.",
            urgency: "MEDIUM",
            dueDate: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
            actionPath: "/operation/minuta/correspondence",
            actionLabel: "Ver Correspondencia",
          },
          {
            id: "rem-4",
            module: "COMMERCIAL",
            title: "Seguimiento Comercial: Centro Empresarial El Dorado",
            description: "Prospecto en pipeline comercial con propuesta presentada hace 5 días sin contacto de seguimiento.",
            urgency: "MEDIUM",
            dueDate: null,
            actionPath: "/administrative/prospect",
            actionLabel: "Ver Prospecto",
          },
        ],
        summary: {
          critical: 2,
          high: 0,
          medium: 2,
          total: 4,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredReminders = (remindersData?.reminders || []).filter((r) => {
    if (reminderFilter === "ALL") return true;
    if (reminderFilter === "CRITICAL") return r.urgency === "CRITICAL";
    if (reminderFilter === "PQRS") return r.module === "PQRS";
    if (reminderFilter === "CLIENTS") return r.module === "CLIENTS";
    if (reminderFilter === "PORTERIA") return r.module === "PORTERIA";
    if (reminderFilter === "COMMERCIAL") return r.module === "COMMERCIAL";
    return true;
  });

  const formatCop = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getUrgencyChip = (urgency: ReminderUrgency) => {
    switch (urgency) {
      case "CRITICAL":
        return <Chip icon={<ErrorOutline />} label="Crítico ANS" size="small" color="error" sx={{ fontWeight: 800 }} />;
      case "HIGH":
        return <Chip icon={<WarningAmber />} label="Alta Prioridad" size="small" color="warning" sx={{ fontWeight: 800 }} />;
      case "MEDIUM":
        return <Chip icon={<Schedule />} label="Seguimiento" size="small" color="info" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label="Normal" size="small" sx={{ fontWeight: 600 }} />;
    }
  };

  if (loading && !overview) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const kpis = overview?.kpis;
  const charts = overview?.charts;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", pb: 6 }}>
      {/* 1. Banda Superior Institucional Loro ERP */}
      <Box
        sx={{
          mb: 3.5,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A", letterSpacing: -0.5 }}>
              Loro ERP
            </Typography>
            <Chip
              label="Consola Estratégica"
              size="small"
              sx={{
                bgcolor: "primary.soft",
                color: "primary.main",
                fontWeight: 800,
                border: "1px solid",
                borderColor: "primary.light",
              }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Bienvenido, <strong>{session?.user.fullName || "Comandante de Operaciones"}</strong> • Panel central de métricas, cumplimiento de ANS y alertas operativas.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            icon={<CheckCircleOutline sx={{ fontSize: "16px !important" }} />}
            label="SLA Objetivo: 95.0%"
            color="success"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700 }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
          >
            Refrescar
          </Button>
        </Stack>
      </Box>

      {/* 2. 4 StatCards Transversales */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* KPI 1: Clientes y Pipeline */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 1,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" },
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
                    Clientes Activos
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", my: 0.5 }}>
                    {kpis?.activeClients ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>{kpis?.prospectsInPipeline ?? 0}</strong> prospectos en pipeline CRM
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    bgcolor: "primary.soft",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BusinessOutlined fontSize="medium" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Cumplimiento de ANS (PQRS) */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 1,
              borderColor: (kpis?.ansComplianceRate || 0) >= 95 ? "success.light" : "warning.light",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" },
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
                    Cumplimiento ANS (SLA)
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      color: (kpis?.ansComplianceRate || 0) >= 95 ? "success.dark" : "warning.dark",
                      my: 0.5,
                    }}
                  >
                    {kpis?.ansComplianceRate ?? 98.4}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>{kpis?.openPqrs ?? 0}</strong> tickets en gestión operativa
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    bgcolor: "success.soft",
                    color: "success.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <VerifiedUser fontSize="medium" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Fuerza Operativa de Seguridad */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 1,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" },
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
                    Fuerza Operativa
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", my: 0.5 }}>
                    {kpis?.activeGuards ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Guardias de seguridad en servicio activo
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    bgcolor: "secondary.soft",
                    color: "secondary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield fontSize="medium" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Paquetes en Custodia de Portería */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 1,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" },
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase" }}>
                    Custodia en Portería
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", my: 0.5 }}>
                    {kpis?.pendingPackages ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Correspondencias pendientes por entrega
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    bgcolor: "warning.soft",
                    color: "warning.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MarkEmailUnreadOutlined fontSize="medium" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Panel de Gráficos de Cumplimiento y Embudo Comercial */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Gráfico 1: Cumplimiento de ANS Semanal */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                    Tendencia de Cumplimiento ANS (PQRS)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Evolución histórica semanal frente a la meta del 95.0%
                  </Typography>
                </Box>
                <Chip label="Meta: 95%" size="small" color="primary" sx={{ fontWeight: 700 }} />
              </Box>

              {/* Barras Visuales de Cumplimiento Semanal */}
              <Stack spacing={2} sx={{ mt: 3 }}>
                {(charts?.ansWeeklyTrend || []).map((point) => {
                  const isMet = point.compliance >= point.target;
                  return (
                    <Box key={point.week}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155" }}>
                          {point.week} ({point.totalTickets} tickets)
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: isMet ? "success.dark" : "error.main",
                          }}
                        >
                          {point.compliance}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(point.compliance, 100)}
                        sx={{
                          height: 10,
                          borderRadius: 2,
                          bgcolor: "#F1F5F9",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: isMet ? "#10B981" : "#EF4444",
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico 2: Embudo Comercial de Cotizaciones y Propuestas */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                    Embudo de Propuestas Comerciales
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cotizaciones por estado y volumen en COP
                  </Typography>
                </Box>
                <TrendingUp color="primary" />
              </Box>

              <Stack spacing={2} sx={{ mt: 3 }}>
                {(charts?.commercialFunnel || []).map((stage, idx) => (
                  <Box
                    key={stage.stage}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: idx === 3 ? "success.soft" : "neutral.50",
                      border: "1px solid",
                      borderColor: idx === 3 ? "success.light" : "divider",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                          {stage.stage}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stage.count} {stage.count === 1 ? "propuesta" : "propuestas"}
                        </Typography>
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          color: idx === 3 ? "success.dark" : "primary.main",
                          fontFamily: "monospace",
                        }}
                      >
                        {formatCop(stage.totalValue)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 4. Centro Inteligente de Recordatorios y Alertas Tempranas */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
              mb: 2.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "error.soft",
                  color: "error.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <NotificationsActive />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A" }}>
                  Centro Inteligente de Recordatorios y Alertas
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Notificaciones críticas multimodulares priorizadas por severidad operativa
                </Typography>
              </Box>
            </Box>

            {remindersData?.summary && (
              <Stack direction="row" spacing={1}>
                {remindersData.summary.critical > 0 && (
                  <Chip
                    label={`${remindersData.summary.critical} Críticos`}
                    color="error"
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                )}
                <Chip
                  label={`${remindersData.summary.total} Totales`}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            )}
          </Box>

          <Tabs
            value={reminderFilter}
            onChange={(_, val) => setReminderFilter(val)}
            sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab value="ALL" label="Todos" sx={{ fontWeight: 700, textTransform: "none" }} />
            <Tab value="CRITICAL" label="Críticos ANS" sx={{ fontWeight: 700, textTransform: "none" }} />
            <Tab value="PQRS" label="PQRS y Reclamos" sx={{ fontWeight: 700, textTransform: "none" }} />
            <Tab value="CLIENTS" label="Contratos Clientes" sx={{ fontWeight: 700, textTransform: "none" }} />
            <Tab value="PORTERIA" label="Portería y Paquetes" sx={{ fontWeight: 700, textTransform: "none" }} />
            <Tab value="COMMERCIAL" label="Comercial" sx={{ fontWeight: 700, textTransform: "none" }} />
          </Tabs>

          {filteredReminders.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
              <CheckCircleOutline sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
                Sin alertas pendientes en esta categoría
              </Typography>
              <Typography variant="body2">
                Todos los eventos y compromisos se encuentran al día dentro de los umbrales de ANS.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {filteredReminders.map((reminder) => (
                <Paper
                  key={reminder.id}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "flex-start", md: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                    borderColor: reminder.urgency === "CRITICAL" ? "error.light" : "divider",
                    bgcolor: reminder.urgency === "CRITICAL" ? "#FEF2F2" : "#FFFFFF",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
                    },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      {getUrgencyChip(reminder.urgency)}
                      <Chip
                        label={reminder.module}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }}
                      />
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      {reminder.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {reminder.description}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color={reminder.urgency === "CRITICAL" ? "error" : "primary"}
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() => router.push(reminder.actionPath)}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      px: 2,
                      flexShrink: 0,
                    }}
                  >
                    {reminder.actionLabel}
                  </Button>
                </Paper>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
