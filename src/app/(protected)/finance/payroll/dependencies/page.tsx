"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Card,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  MenuItem,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  WorkspacesOutlined,
  AddOutlined,
  ElectricBoltOutlined,
  SearchOutlined,
  CalculateOutlined,
  ShieldOutlined,
  BusinessOutlined,
  MonetizationOnOutlined,
  ApartmentOutlined,
  EditOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  PayrollApi,
  PayrollDependency,
  PayrollBranch,
  PayrollShiftModality,
  DependenciesKpis,
  BreakdownSimulationResult,
  DependencySettlementType,
  ArlRiskClass,
} from "@/lib/api/payroll";
import ResponsiveFormDrawer from "@/components/common/ResponsiveFormDrawer";
import { noxiaPalette } from "@/theme/noxiaTheme";

export default function PayrollDependenciesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Data states
  const [dependencies, setDependencies] = useState<PayrollDependency[]>([]);
  const [kpis, setKpis] = useState<DependenciesKpis | null>(null);
  const [branches, setBranches] = useState<PayrollBranch[]>([]);
  const [modalities, setModalities] = useState<PayrollShiftModality[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedType, setSelectedType] = useState<"ALL" | "OPERATIVE" | "INTERNAL">("ALL");

  // Drawer states
  const [dependencyDrawerOpen, setDependencyDrawerOpen] = useState(false);
  const [editingDependency, setEditingDependency] = useState<Partial<PayrollDependency> | null>(null);

  // Simulation Drawer state
  const [simulationDrawerOpen, setSimulationDrawerOpen] = useState(false);
  const [simulatingDep, setSimulatingDep] = useState<PayrollDependency | null>(null);
  const [simulationResult, setSimulationResult] = useState<BreakdownSimulationResult | null>(null);
  const [simDays, setSimDays] = useState<number>(30);

  // Sync drawer state
  const [syncDrawerOpen, setSyncDrawerOpen] = useState(false);
  const [syncDefaultBranchId, setSyncDefaultBranchId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depRes, kpisRes, brRes, modRes] = await Promise.all([
        PayrollApi.listDependencies(),
        PayrollApi.getDependenciesKpis(),
        PayrollApi.listBranches(),
        PayrollApi.listModalities(),
      ]);

      if (depRes) setDependencies(depRes);
      if (kpisRes) setKpis(kpisRes);
      if (brRes) {
        setBranches(brRes);
        if (brRes.length > 0) setSyncDefaultBranchId(brRes[0].id);
      }
      if (modRes) setModalities(modRes);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al cargar puestos y dependencias" });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateBreakdown = async (dep: PayrollDependency, days = 30) => {
    if (!dep.modalityId) {
      setFeedback({ type: "error", message: "Este puesto no tiene una modalidad de turno asignada para desglosar." });
      return;
    }

    try {
      setSimulatingDep(dep);
      setSimDays(days);
      const res = await PayrollApi.simulateBreakdown({
        monthlyPaidValue: Number(dep.monthlyPaidValue),
        modalityId: dep.modalityId,
        daysWorked: days,
      });

      if (res) {
        setSimulationResult(res);
        setSimulationDrawerOpen(true);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al simular desglose" });
    }
  };

  const handleSyncFromServiceOrders = async () => {
    if (!syncDefaultBranchId) {
      setFeedback({ type: "error", message: "Seleccione una sucursal para sincronizar los puestos nuevos." });
      return;
    }

    try {
      setSaving(true);
      const res = await PayrollApi.syncFromServiceOrders({
        defaultBranchId: syncDefaultBranchId,
      });

      if (res) {
        setFeedback({
          type: "success",
          message: `Sincronización 1-clic exitosa: ${res.syncedCount} puestos procesados (${res.createdCount} creados, ${res.updatedCount} actualizados).`,
        });
        setSyncDrawerOpen(false);
        loadData();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error al sincronizar desde órdenes de servicio" });
    } finally {
      setSaving(false);
    }
  };

  const filteredDependencies = dependencies.filter((d) => {
    const matchesSearch =
      searchTerm === "" ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(d.code).includes(searchTerm) ||
      (d.omegaCode && d.omegaCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.client && d.client.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBranch = selectedBranch === "" || d.branchId === selectedBranch;

    const matchesType =
      selectedType === "ALL" ||
      (selectedType === "INTERNAL" && d.isInternal) ||
      (selectedType === "OPERATIVE" && !d.isInternal);

    return matchesSearch && matchesBranch && matchesType;
  });

  if (loading) {
    return (
      <Box sx={{ p: 6, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: noxiaPalette.primary.main }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Breadcrumb y Encabezado */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1, fontSize: "0.85rem" }}>
            <Link underline="hover" color="inherit" href="/dashboard">
              Inicio
            </Link>
            <Typography color="inherit">Dirección Financiera</Typography>
            <Typography color="text.primary" sx={{ fontWeight: 600 }}>
              Puestos y Dependencias
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: `${noxiaPalette.primary.main}15`,
                color: noxiaPalette.primary.main,
                display: "flex",
              }}
            >
              <WorkspacesOutlined />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, letterSpacing: -0.5 }}>
                Puestos y Dependencias de Nómina
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Fichas salariales de puestos, código OMEGA comercial, modalidades de turno y desglose al centavo
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Tooltip title="Actualizar lista">
            <IconButton
              onClick={loadData}
              disabled={loading}
              sx={{
                bgcolor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
              }}
            >
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<ElectricBoltOutlined />}
            onClick={() => setSyncDrawerOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Sincronizar desde Órdenes de Servicio
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddOutlined />}
            onClick={() => {
              setEditingDependency({
                code: (dependencies.length || 0) + 1,
                settlementType: DependencySettlementType.BY_AVERAGE_GUARANTEED,
                arlRiskClass: ArlRiskClass.RISK_IV,
                monthlyPaidValue: 1750905.0,
                isInternal: false,
                isVariable: true,
              });
              setDependencyDrawerOpen(true);
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2.5 }}
          >
            Nuevo Puesto
          </Button>
        </Box>
      </Box>

      {/* Alerta de Feedback */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          sx={{ borderRadius: 2 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, p: 2.5, bgcolor: "#FFFFFF", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#EFF6FF", color: "#3B82F6", display: "flex" }}>
                <ApartmentOutlined fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, fontSize: "0.72rem" }}>
                  Total Puestos Registrados
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", mt: 0.2 }}>
                  {kpis?.totalPosts || 0}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, p: 2.5, bgcolor: "#FFFFFF", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#ECFDF5", color: "#059669", display: "flex" }}>
                <ShieldOutlined fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, fontSize: "0.72rem" }}>
                  Puestos Operativos (Clientes)
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#059669", mt: 0.2 }}>
                  {kpis?.operativePosts || 0}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, p: 2.5, bgcolor: "#FFFFFF", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: "#FFFBEB", color: "#D97706", display: "flex" }}>
                <BusinessOutlined fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, fontSize: "0.72rem" }}>
                  Dependencias Internas
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#D97706", mt: 0.2 }}>
                  {kpis?.internalPosts || 0}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, p: 2.5, bgcolor: "#FFFFFF", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${noxiaPalette.primary.main}15`, color: noxiaPalette.primary.main, display: "flex" }}>
                <MonetizationOnOutlined fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, fontSize: "0.72rem" }}>
                  Nómina Garantizada / Mes
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", fontFamily: "monospace", mt: 0.2 }}>
                  ${(kpis?.totalGuaranteedMonthlyPayroll || 0).toLocaleString("es-CO")}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de Filtros */}
      <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2.5, p: 2, bgcolor: "#FFFFFF" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por código, nombre, cliente o código OMEGA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Sucursal"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <MenuItem value="">Todas las Sucursales</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tipo de Puesto"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as "ALL" | "OPERATIVE" | "INTERNAL")}
            >
              <MenuItem value="ALL">Todos los Puestos</MenuItem>
              <MenuItem value="OPERATIVE">Operativos (Vinculados a Clientes)</MenuItem>
              <MenuItem value="INTERNAL">Internos / Administrativos</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de Puestos y Dependencias */}
      <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 3, bgcolor: "#FFFFFF", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>CÓD.</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>NOMBRE DEL PUESTO / DEPENDENCIA</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>CENTRO DE COSTO (CLIENTE)</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>CÓD. OMEGA</TableCell>
                <TableCell sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>MODALIDAD</TableCell>
                <TableCell align="right" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>VALOR MENSUAL</TableCell>
                <TableCell align="right" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>VALOR DIARIO</TableCell>
                <TableCell align="center" sx={{ bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, fontSize: "0.75rem" }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDependencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No se encontraron puestos o dependencias que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDependencies.map((dep) => (
                  <TableRow
                    key={dep.id}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "rgba(124, 58, 237, 0.035)" },
                      borderBottom: "1px solid #E2E8F0",
                    }}
                  >
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: noxiaPalette.primary.main }}>
                      {String(dep.code).padStart(3, "0")}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                        {dep.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {dep.branch?.name || "Sin sucursal"} • ARL {dep.arlRiskClass}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {dep.client ? (
                        <Box>
                          <Typography variant="body2" sx={{ color: noxiaPalette.secondary.main, fontWeight: 700 }}>
                            {dep.client.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                            NIT {dep.client.nit}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip
                          label="Operativo Interno"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 22,
                            bgcolor: "#FFFBEB",
                            color: "#D97706",
                            border: "1px solid #FDE68A",
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {dep.omegaCode ? (
                        <Chip
                          label={dep.omegaCode}
                          size="small"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            height: 22,
                            bgcolor: "#ECFDF5",
                            color: "#059669",
                            border: "1px solid #A7F3D0",
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: "text.disabled" }}>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {dep.modality ? (
                        <Chip
                          label={dep.modality.name}
                          size="small"
                          sx={{
                            fontSize: "0.72rem",
                            height: 22,
                            bgcolor: "#F8FAFC",
                            color: "text.primary",
                            border: "1px solid #E2E8F0",
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          Fijo Básico
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "text.primary" }}>
                      ${Number(dep.monthlyPaidValue).toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                      ${Number(dep.dailyValue).toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        <Tooltip title="Simular Desglose al centavo por Modalidad">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleSimulateBreakdown(dep, 30)}
                              disabled={!dep.modalityId}
                              sx={{
                                color: noxiaPalette.primary.main,
                                "&:hover": { bgcolor: `${noxiaPalette.primary.main}15` },
                              }}
                            >
                              <CalculateOutlined fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Editar Ficha de Puesto">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingDependency(dep);
                              setDependencyDrawerOpen(true);
                            }}
                            sx={{
                              color: "text.secondary",
                              "&:hover": { color: noxiaPalette.primary.main },
                            }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ResponsiveFormDrawer: Sincronización desde Órdenes de Servicio */}
      <ResponsiveFormDrawer
        open={syncDrawerOpen}
        onClose={() => setSyncDrawerOpen(false)}
        title="Sincronizar Puestos desde Órdenes de Servicio"
        subtitle="Importa en 1-clic los puestos comerciales activos vinculados al Código OMEGA"
        headerIcon={<ElectricBoltOutlined sx={{ color: noxiaPalette.primary.main }} />}
        submitButtonText="Iniciar Sincronización"
        isSubmitting={saving}
        width={{ xs: "100%", md: 480 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Esta acción buscará todas las Órdenes de Servicio en estado activo/operativo que tengan puestos definidos y los registrará automáticamente como Dependencias de Nómina.
          </Typography>

          <TextField
            select
            fullWidth
            label="Sucursal por Defecto para Puestos Nuevos"
            value={syncDefaultBranchId}
            onChange={(e) => setSyncDefaultBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSyncFromServiceOrders}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 700, mt: 2, borderRadius: 2 }}
          >
            {saving ? "Sincronizando..." : "Ejecutar Sincronización 1-Clic"}
          </Button>
        </Box>
      </ResponsiveFormDrawer>

      {/* ResponsiveFormDrawer: Simulación de Desglose en Tiempo Real */}
      <ResponsiveFormDrawer
        open={simulationDrawerOpen}
        onClose={() => setSimulationDrawerOpen(false)}
        title="Simulación de Desglose de Nómina"
        subtitle={simulatingDep?.name || "Desglose por modalidad de turno"}
        headerIcon={<CalculateOutlined sx={{ color: noxiaPalette.primary.main }} />}
        width={{ xs: "100%", md: 540 }}
      >
        {simulationResult && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <TextField
                select
                size="small"
                label="Días a Liquidar"
                value={simDays}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setSimDays(d);
                  if (simulatingDep) handleSimulateBreakdown(simulatingDep, d);
                }}
                sx={{ width: 180 }}
              >
                <MenuItem value={30}>30 Días (Mensual)</MenuItem>
                <MenuItem value={15}>15 Días (Quincenal)</MenuItem>
                <MenuItem value={20}>20 Días</MenuItem>
                <MenuItem value={10}>10 Días</MenuItem>
              </TextField>
            </Box>

            <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", p: 2, borderRadius: 2, bgcolor: "#FAFAFA" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Sueldo Total a Pagar ({simDays} días):
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: "text.primary", fontFamily: "monospace" }}>
                  ${simulationResult.totalGrossPay.toLocaleString("es-CO")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Sueldo Básico (SMMLV proporcional):
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: "#059669", fontFamily: "monospace" }}>
                  ${simulationResult.baseSalary.toLocaleString("es-CO")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Excedente Distribuido por Modalidad:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: noxiaPalette.primary.main, fontFamily: "monospace" }}>
                  ${simulationResult.excessDistributed.toLocaleString("es-CO")}
                </Typography>
              </Box>
            </Paper>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: noxiaPalette.secondary.main, textTransform: "uppercase" }}>
              Desglose Exacto al Centavo:
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", p: 1.5, bgcolor: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 1.5 }}>
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700 }}>
                  001 - SUELDO BASICO
                </Typography>
                <Typography variant="body2" sx={{ color: "#059669", fontWeight: 700, fontFamily: "monospace" }}>
                  ${simulationResult.baseSalary.toLocaleString("es-CO")}
                </Typography>
              </Box>

              {simulationResult.breakdownItems.map((item) => (
                <Box
                  key={item.conceptId}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1.5,
                    bgcolor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>
                      {String(item.conceptCode).padStart(3, "0")} - {item.conceptName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Factor Modalidad: {item.percentage}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: noxiaPalette.primary.main, fontWeight: 700, fontFamily: "monospace" }}>
                    ${item.calculatedValue.toLocaleString("es-CO")}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </ResponsiveFormDrawer>

      {/* ResponsiveFormDrawer: Crear/Editar Dependencia */}
      <ResponsiveFormDrawer
        open={dependencyDrawerOpen}
        onClose={() => setDependencyDrawerOpen(false)}
        title={editingDependency?.id ? "Editar Puesto / Dependencia" : "Nuevo Puesto / Dependencia"}
        subtitle="Ficha de nómina de puesto operativo o dependencia administrativa"
        headerIcon={<WorkspacesOutlined sx={{ color: noxiaPalette.primary.main }} />}
        submitButtonText="Guardar Puesto"
        isSubmitting={saving}
        width={{ xs: "100%", md: 540 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <TextField
            label="Código de Puesto"
            type="number"
            value={editingDependency?.code || ""}
            onChange={(e) => setEditingDependency({ ...editingDependency, code: Number(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Nombre del Puesto / Dependencia"
            value={editingDependency?.name || ""}
            onChange={(e) => setEditingDependency({ ...editingDependency, name: e.target.value })}
            fullWidth
          />

          <TextField
            select
            label="Sucursal"
            value={editingDependency?.branchId || ""}
            onChange={(e) => setEditingDependency({ ...editingDependency, branchId: e.target.value })}
            fullWidth
          >
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Modalidad de Turno"
            value={editingDependency?.modalityId || ""}
            onChange={(e) => setEditingDependency({ ...editingDependency, modalityId: e.target.value })}
            fullWidth
          >
            <MenuItem value="">Sin modalidad asignada (Básico)</MenuItem>
            {modalities.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                Cód. {m.code} - {m.name} ({m.hoursPerShift}h)
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Valor Mensual Garantizado a Pagar (COP)"
            type="number"
            value={editingDependency?.monthlyPaidValue || ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setEditingDependency({
                ...editingDependency,
                monthlyPaidValue: val,
                dailyValue: val / 30,
                prestacionalAmount: val,
              });
            }}
            fullWidth
            helperText="Ejemplo: $2.449.095 para turno 2x2x2"
          />

          <TextField
            select
            label="Clase de Riesgo ARL"
            value={editingDependency?.arlRiskClass || ArlRiskClass.RISK_IV}
            onChange={(e) => setEditingDependency({ ...editingDependency, arlRiskClass: e.target.value as ArlRiskClass })}
            fullWidth
          >
            <MenuItem value={ArlRiskClass.RISK_I}>Riesgo I (Administrativo)</MenuItem>
            <MenuItem value={ArlRiskClass.RISK_II}>Riesgo II</MenuItem>
            <MenuItem value={ArlRiskClass.RISK_III}>Riesgo III</MenuItem>
            <MenuItem value={ArlRiskClass.RISK_IV}>Riesgo IV (Vigilancia Estándar)</MenuItem>
            <MenuItem value={ArlRiskClass.RISK_V}>Riesgo V (Alto Riesgo)</MenuItem>
          </TextField>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={async () => {
              if (!editingDependency?.name || !editingDependency?.code) {
                setFeedback({ type: "error", message: "Ingrese el código y nombre del puesto." });
                return;
              }
              try {
                setSaving(true);
                if (editingDependency.id) {
                  await PayrollApi.updateDependency(editingDependency.id, editingDependency);
                } else {
                  await PayrollApi.createDependency(editingDependency);
                }
                setDependencyDrawerOpen(false);
                loadData();
                setFeedback({ type: "success", message: "Puesto guardado exitosamente." });
              } catch (err: any) {
                setFeedback({ type: "error", message: err?.message || "Error al guardar puesto" });
              } finally {
                setSaving(false);
              }
            }}
            sx={{ textTransform: "none", fontWeight: 700, mt: 2, borderRadius: 2 }}
          >
            Guardar Puesto
          </Button>
        </Box>
      </ResponsiveFormDrawer>
    </Box>
  );
}
